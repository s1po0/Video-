package com.videoupscaler.app;

import android.content.res.AssetFileDescriptor;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.os.Build;
import android.util.Log;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * The whole video pipeline: decode → upscale → sharpen → encode → mux.
 *
 * <p>Runs on a background thread. Progress is reported through {@link Callback}.
 * The loop is written so that the encoder is always drained before we block on
 * an input buffer, which is what keeps long jobs from deadlocking.
 */
final class VideoEngine {

    private static final String TAG = "VideoEngine";

    interface Callback {
        void onProgress(float fraction, String detail);

        void onLog(String line);
    }

    static final class Config {
        int scale = 2;
        /** 0 = draft, 1 = balanced, 2 = best */
        int quality = 1;
        /** 0..100 */
        int sharpen = 45;
        /** 0 = auto, 1 = AVC, 2 = HEVC */
        int codec = 0;
        boolean copyAudio = true;
        int rotationDegrees = 0;
    }

    static final class Result {
        int outputWidth, outputHeight, frames, bitrate;
        String mime;
        long elapsedMs;
    }

    static final class CancelledException extends Exception {
        CancelledException() {
            super("cancelled");
        }
    }

    private final Callback callback;
    private volatile boolean cancelRequested = false;

    VideoEngine(Callback callback) {
        this.callback = callback;
    }

    void requestCancel() {
        cancelRequested = true;
    }

    private void checkCancel() throws CancelledException {
        if (cancelRequested || Thread.currentThread().isInterrupted()) throw new CancelledException();
    }

    // ------------------------------------------------------------------ run --

    Result transcode(AssetFileDescriptor videoFd, AssetFileDescriptor audioFd,
                     String outputPath, Config cfg) throws Exception {
        long startedAt = System.currentTimeMillis();

        MediaExtractor video = new MediaExtractor();
        MediaExtractor audio = null;
        MediaCodec decoder = null;
        MediaCodec encoder = null;
        MediaMuxer muxer = null;
        Scaler scaler = null;

        try {
            video.setDataSource(videoFd.getFileDescriptor(), videoFd.getStartOffset(),
                    videoFd.getDeclaredLength());

            int videoTrack = findTrack(video, "video/");
            if (videoTrack < 0) throw new IOException("no video track found");
            MediaFormat inFormat = video.getTrackFormat(videoTrack);
            video.selectTrack(videoTrack);

            int srcW = inFormat.getInteger(MediaFormat.KEY_WIDTH);
            int srcH = inFormat.getInteger(MediaFormat.KEY_HEIGHT);
            int outW = even(srcW * cfg.scale);
            int outH = even(srcH * cfg.scale);
            if (outW < 32 || outH < 32) throw new IOException("source resolution too small");

            float fps = 30f;
            if (inFormat.containsKey(MediaFormat.KEY_FRAME_RATE)) {
                try { fps = inFormat.getInteger(MediaFormat.KEY_FRAME_RATE); } catch (Exception ignored) { }
            }
            if (fps < 5 || fps > 120) fps = 30f;

            long durationUs = 0;
            if (inFormat.containsKey(MediaFormat.KEY_DURATION)) {
                durationUs = inFormat.getLong(MediaFormat.KEY_DURATION);
            }

            String inMime = inFormat.getString(MediaFormat.KEY_MIME);
            String outMime = pickEncoderMime(cfg.codec);
            MediaCodecInfo.CodecCapabilities encCaps = capabilitiesOf(outMime, true);
            if (encCaps == null) {
                outMime = MediaFormat.MIMETYPE_VIDEO_AVC;
                encCaps = capabilitiesOf(outMime, true);
            }
            if (encCaps == null) throw new IOException("no supported video encoder on this device");
            verifyEncoderSize(encCaps, outW, outH);

            int bitrate = bitrateFor(outW, outH, (int) fps, cfg.quality);
            int colorFormat = pickColorFormat(encCaps);

            MediaFormat outFormat = MediaFormat.createVideoFormat(outMime, outW, outH);
            outFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, colorFormat);
            outFormat.setInteger(MediaFormat.KEY_BIT_RATE, bitrate);
            outFormat.setInteger(MediaFormat.KEY_FRAME_RATE, Math.round(fps));
            outFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, Math.max(1, Math.round(fps)));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    outFormat.setInteger(MediaFormat.KEY_BITRATE_MODE,
                            MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_VBR);
                } catch (Exception ignored) { }
            }

            decoder = MediaCodec.createDecoderByType(inMime);
            decoder.configure(inFormat, null, null, 0);
            decoder.start();

            try {
                encoder = MediaCodec.createEncoderByType(outMime);
                encoder.configure(outFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
                encoder.start();
            } catch (Exception e) {
                // Some phones advertise HEVC but fail to configure it; fall back.
                if (!MediaFormat.MIMETYPE_VIDEO_AVC.equals(outMime)) {
                    releaseQuietly(encoder);
                    encoder = null;
                    outMime = MediaFormat.MIMETYPE_VIDEO_AVC;
                    MediaCodecInfo.CodecCapabilities avcCaps = capabilitiesOf(outMime, true);
                    if (avcCaps == null) throw new IOException("no usable video encoder");
                    outFormat = MediaFormat.createVideoFormat(outMime, outW, outH);
                    outFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, pickColorFormat(avcCaps));
                    outFormat.setInteger(MediaFormat.KEY_BIT_RATE, bitrate);
                    outFormat.setInteger(MediaFormat.KEY_FRAME_RATE, Math.round(fps));
                    outFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, Math.max(1, Math.round(fps)));
                    encoder = MediaCodec.createEncoderByType(outMime);
                    encoder.configure(outFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
                    encoder.start();
                } else {
                    throw e;
                }
            }

            muxer = new MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            if (cfg.rotationDegrees != 0) {
                try { muxer.setOrientationHint(cfg.rotationDegrees); } catch (Exception ignored) { }
            }

            // Optional audio passthrough.
            MediaFormat audioFormat = null;
            int audioTrack = -1;
            if (cfg.copyAudio && audioFd != null) {
                audio = new MediaExtractor();
                audio.setDataSource(audioFd.getFileDescriptor(), audioFd.getStartOffset(),
                        audioFd.getDeclaredLength());
                audioTrack = findTrack(audio, "audio/");
                if (audioTrack >= 0) audioFormat = audio.getTrackFormat(audioTrack);
            }

            int method = cfg.quality == 2 ? Scaler.METHOD_LANCZOS : Scaler.METHOD_BICUBIC;
            int threads = Math.max(2, Runtime.getRuntime().availableProcessors() - 1);
            scaler = new Scaler(method, threads);
            float sharpenAmount = Math.max(0, Math.min(100, cfg.sharpen)) / 100f;

            MuxState mux = new MuxState();
            mux.muxer = muxer;
            mux.audioFormat = audioFormat;
            mux.audioExtractor = audio;
            mux.audioTrackIn = audioTrack;
            mux.videoTrackOut = -1;
            mux.audioTrackOut = -1;

            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            YuvUtils.Frame srcFrame = null;
            YuvUtils.Frame dstFrame = null;
            byte[] hScratch = null;
            byte[] sharpScratch = null;
            byte[] chromaScratch = null;
            int nullImages = 0;

            boolean decoderInputDone = false;
            boolean encoderEosSent = false;
            boolean encoderDone = false;
            int frames = 0;
            long totalUs = durationUs > 0 ? durationUs : 1;

            while (!encoderDone) {
                checkCancel();

                // 1. drain encoder first so it never blocks us
                encoderDone = drainEncoder(encoder, mux, info);
                if (encoderDone) break;

                // 2. feed the decoder
                if (!decoderInputDone) {
                    int inIdx = decoder.dequeueInputBuffer(10_000);
                    if (inIdx >= 0) {
                        ByteBuffer inBuf = decoder.getInputBuffer(inIdx);
                        int size = inBuf == null ? -1 : video.readSampleData(inBuf, 0);
                        if (size < 0) {
                            decoder.queueInputBuffer(inIdx, 0, 0, 0,
                                    MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            decoderInputDone = true;
                        } else {
                            long pts = video.getSampleTime();
                            decoder.queueInputBuffer(inIdx, 0, size, pts, 0);
                            video.advance();
                        }
                    }
                }

                // 3. pull a decoded frame
                int outIdx = decoder.dequeueOutputBuffer(info, 10_000);
                if (outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    continue;
                }
                if (outIdx < 0) {
                    if (decoderInputDone && (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                        // nothing else will come out of the decoder
                    }
                    continue;
                }

                boolean decoderEos = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                android.media.Image image = null;
                if (!decoderEos) {
                    try {
                        image = decoder.getOutputImage(outIdx);
                    } catch (Exception e) {
                        image = null;
                    }
                }

                if (image != null) {
                    if (srcFrame == null) {
                        // Always pull frames at the true display size: padded
                        // coded sizes and crop rects are handled inside YuvUtils.
                        srcFrame = YuvUtils.allocate(srcW, srcH);
                        dstFrame = YuvUtils.allocate(outW, outH);
                        hScratch = new byte[outW * srcH];
                        chromaScratch = new byte[Math.max(dstFrame.chromaWidth() * srcFrame.chromaHeight(),
                                outW * srcH / 4 + 16)];
                        sharpScratch = new byte[outW * outH];
                    }
                    if (YuvUtils.read(image, srcFrame)) {
                        upscale(scaler, srcFrame, dstFrame, cfg.scale, hScratch, chromaScratch);
                        if (sharpenAmount > 0.01f) {
                            scaler.sharpenPlane(dstFrame.y, outW, outH, sharpenAmount, sharpScratch);
                        }
                        long pts = info.presentationTimeUs;
                        feedEncoderDraining(encoder, mux, dstFrame, pts, info, outFormat);
                        frames++;
                        if (frames % 3 == 0) {
                            float f = Math.min(0.99f, pts / (float) totalUs);
                            callback.onProgress(f, frames + " frames · " + outW + "×" + outH);
                        }
                    }
                    image.close();
                } else if (!decoderEos) {
                    nullImages++;
                }
                decoder.releaseOutputBuffer(outIdx, false);

                if (decoderEos && !encoderEosSent) {
                    signalEos(encoder, mux, info);
                    encoderEosSent = true;
                }
            }

            if (frames == 0) throw new IOException("no frames were decoded from this video");

            // Make sure nothing of the encoder is still buffered.
            drainEncoder(encoder, mux, info);
            if (mux.started) muxer.stop();

            Result r = new Result();
            r.outputWidth = outW;
            r.outputHeight = outH;
            r.frames = frames;
            r.bitrate = bitrate;
            r.mime = outMime;
            r.elapsedMs = System.currentTimeMillis() - startedAt;
            return r;
        } finally {
            if (scaler != null) scaler.shutdown();
            releaseQuietly(decoder);
            releaseQuietly(encoder);
            if (muxer != null) {
                try { muxer.release(); } catch (Exception ignored) { }
            }
            try { video.release(); } catch (Exception ignored) { }
            if (audio != null) try { audio.release(); } catch (Exception ignored) { }
        }
    }

    // ------------------------------------------------------------- muxing ----

    private static final class MuxState {
        MediaMuxer muxer;
        MediaFormat audioFormat;
        MediaExtractor audioExtractor;
        int audioTrackIn = -1;
        boolean audioCopied = false;
        int videoTrackOut = -1;
        int audioTrackOut = -1;
        boolean started = false;
    }

    /** Drains everything the encoder has ready. Returns true on end of stream. */
    private boolean drainEncoder(MediaCodec encoder, MuxState mux, MediaCodec.BufferInfo info)
            throws CancelledException {
        while (true) {
            int idx = encoder.dequeueOutputBuffer(info, 0);
            if (idx == MediaCodec.INFO_TRY_AGAIN_LATER) return false;

            if (idx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                if (!mux.started) {
                    mux.videoTrackOut = mux.muxer.addTrack(encoder.getOutputFormat());
                    if (mux.audioFormat != null) mux.audioTrackOut = mux.muxer.addTrack(mux.audioFormat);
                    mux.muxer.start();
                    mux.started = true;
                    // Copy the untouched audio track right away so the file is
                    // written in track order and stays perfectly in sync.
                    if (mux.audioFormat != null && mux.audioExtractor != null
                            && mux.audioTrackIn >= 0 && !mux.audioCopied) {
                        mux.audioCopied = true;
                        try {
                            copyAudio(mux.audioExtractor, mux.audioTrackIn, mux);
                        } catch (CancelledException ce) {
                            throw ce;
                        } catch (Exception e) {
                            Log.w(TAG, "audio copy skipped: " + e.getMessage());
                        }
                    }
                }
                continue;
            }
            if (idx < 0) return false;

            if ((info.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0;

            if (info.size > 0 && mux.started) {
                ByteBuffer buf = encoder.getOutputBuffer(idx);
                if (buf != null) {
                    buf.position(info.offset);
                    buf.limit(info.offset + info.size);
                    mux.muxer.writeSampleData(mux.videoTrackOut, buf, info);
                }
            }
            boolean eos = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
            encoder.releaseOutputBuffer(idx, false);
            if (eos) return true;
        }
    }

    /** Blocks until the encoder accepts a frame, keeping its output drained. */
    private void feedEncoderDraining(MediaCodec encoder, MuxState mux, YuvUtils.Frame frame,
                                     long ptsUs, MediaCodec.BufferInfo info,
                                     MediaFormat outFormat) throws Exception {
        long deadline = System.currentTimeMillis() + 30_000;
        while (true) {
            checkCancel();
            int idx = encoder.dequeueInputBuffer(5_000);
            if (idx >= 0) {
                android.media.Image image = null;
                try {
                    image = encoder.getInputImage(idx);
                } catch (Exception ignored) {
                    image = null;
                }
                if (image != null) {
                    YuvUtils.clear(image);
                    YuvUtils.write(frame, image);
                    encoder.queueInputBuffer(idx, 0, 0, ptsUs, 0);
                } else {
                    // Older / closed-source encoders only accept raw ByteBuffers.
                    ByteBuffer buffer = encoder.getInputBuffer(idx);
                    if (buffer == null || !YuvUtils.writeToBuffer(frame, buffer, outFormat)) {
                        encoder.queueInputBuffer(idx, 0, 0, 0, 0);
                        throw new IOException("this device's encoder rejected the frame; "
                                + "try selecting H.264 in the settings");
                    }
                    int size = buffer.capacity();
                    encoder.queueInputBuffer(idx, 0, size, ptsUs, 0);
                }
                return;
            }
            drainEncoder(encoder, mux, info);
            if (System.currentTimeMillis() > deadline) {
                throw new IOException("the encoder stopped accepting frames");
            }
        }
    }

    private void signalEos(MediaCodec encoder, MuxState mux, MediaCodec.BufferInfo info) throws Exception {
        long deadline = System.currentTimeMillis() + 15_000;
        while (true) {
            checkCancel();
            int idx = encoder.dequeueInputBuffer(5_000);
            if (idx >= 0) {
                encoder.queueInputBuffer(idx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                return;
            }
            drainEncoder(encoder, mux, info);
            if (System.currentTimeMillis() > deadline) throw new IOException("encoder did not finish");
        }
    }

    private void copyAudio(MediaExtractor audio, int trackIdx, MuxState mux) throws Exception {
        audio.selectTrack(trackIdx);
        ByteBuffer buf = ByteBuffer.allocateDirect(1 << 16);
        MediaCodec.BufferInfo ai = new MediaCodec.BufferInfo();
        while (true) {
            checkCancel();
            int size = audio.readSampleData(buf, 0);
            if (size < 0) break;
            ai.offset = 0;
            ai.size = size;
            ai.presentationTimeUs = audio.getSampleTime();
            ai.flags = audio.getSampleFlags();
            buf.position(0);
            buf.limit(size);
            mux.muxer.writeSampleData(mux.audioTrackOut, buf, ai);
            audio.advance();
        }
    }

    // ------------------------------------------------------------ scaling ----

    /** Upscales all three planes using caller-owned scratch memory (no per-frame allocation). */
    private static void upscale(Scaler scaler, YuvUtils.Frame src, YuvUtils.Frame dst, int scale,
                                byte[] lumaScratch, byte[] chromaScratch) throws Exception {
        scaler.upscalePlane(src.y, src.width, src.height, dst.y, dst.width, dst.height, scale, lumaScratch);

        int cw = src.chromaWidth();
        int ch = src.chromaHeight();
        int dcw = dst.chromaWidth();
        int dch = dst.chromaHeight();
        scaler.upscalePlane(src.u, cw, ch, dst.u, dcw, dch, scale, chromaScratch);
        scaler.upscalePlane(src.v, cw, ch, dst.v, dcw, dch, scale, chromaScratch);
    }

    // ------------------------------------------------------------ helpers ----

    private static int findTrack(MediaExtractor ex, String prefix) {
        for (int i = 0; i < ex.getTrackCount(); i++) {
            String mime = ex.getTrackFormat(i).getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith(prefix)) return i;
        }
        return -1;
    }

    private static int even(int v) {
        return (v / 2) * 2;
    }

    static String pickEncoderMime(int choice) {
        if (choice == 2) return MediaFormat.MIMETYPE_VIDEO_HEVC;
        if (choice == 1) return MediaFormat.MIMETYPE_VIDEO_AVC;
        return capabilitiesOf(MediaFormat.MIMETYPE_VIDEO_HEVC, true) != null
                ? MediaFormat.MIMETYPE_VIDEO_HEVC : MediaFormat.MIMETYPE_VIDEO_AVC;
    }

    private static MediaCodecInfo.CodecCapabilities capabilitiesOf(String mime, boolean encoder) {
        MediaCodecList list = new MediaCodecList(MediaCodecList.REGULAR_CODECS);
        for (MediaCodecInfo ci : list.getCodecInfos()) {
            if (ci.isEncoder() != encoder) continue;
            for (String type : ci.getSupportedTypes()) {
                if (type.equalsIgnoreCase(mime)) {
                    try { return ci.getCapabilitiesForType(type); } catch (Exception ignored) { }
                }
            }
        }
        return null;
    }

    private static void verifyEncoderSize(MediaCodecInfo.CodecCapabilities caps, int w, int h)
            throws IOException {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return;
        MediaCodecInfo.VideoCapabilities vc = caps.getVideoCapabilities();
        if (vc == null) return;
        if (!vc.isSizeSupported(w, h)) {
            int maxW = vc.getSupportedWidths().getUpper();
            int maxH = vc.getSupportedHeights().getUpper();
            throw new IOException("this phone cannot encode " + w + "×" + h
                    + " (maximum ≈ " + maxW + "×" + maxH + "). Try a lower upscale factor.");
        }
    }

    static int bitrateFor(int w, int h, int fps, int quality) {
        double bpp = quality == 0 ? 0.09 : quality == 1 ? 0.13 : 0.19;
        double raw = (double) w * h * Math.max(24, Math.min(60, fps)) * bpp;
        int cap = quality == 0 ? 12_000_000 : quality == 1 ? 26_000_000 : 50_000_000;
        return (int) Math.max(1_800_000, Math.min(cap, raw));
    }

    private static int pickColorFormat(MediaCodecInfo.CodecCapabilities caps) {
        int[] preferred = {
                MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible,
                MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar,
        };
        for (int want : preferred) {
            for (int have : caps.colorFormats) {
                if (have == want) return want;
            }
        }
        return MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible;
    }

    private static void releaseQuietly(MediaCodec codec) {
        if (codec == null) return;
        try { codec.stop(); } catch (Exception ignored) { }
        try { codec.release(); } catch (Exception ignored) { }
        Log.d(TAG, "codec released");
    }
}
