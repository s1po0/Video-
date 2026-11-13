package com.videoupscaler.app;

import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.FileDescriptor;
import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * The video pipeline: decode → upscale → sharpen → encode → mux.
 *
 * <p>Built for long movies as well as short clips:
 * <ul>
 *   <li>the finished file is written <b>directly</b> to its destination descriptor,
 *       so a 2-hour job never needs double the disk space (no temp copy);</li>
 *   <li>timestamps are forced to be strictly increasing, which keeps the muxer
 *       happy with B-frame reordered streams;</li>
 *   <li>the requested upscale is clamped to what the device's encoder can handle
 *       instead of failing on large frame sizes;</li>
 *   <li>progress reports percentage, processed time and an ETA.</li>
 * </ul>
 */
final class VideoEngine {

    private static final String TAG = "VideoEngine";

    interface Callback {
        /**
         * @param fraction 0..1 of the movie already processed
         * @param detail   human readable line (frame count, output size)
         * @param etaMs    estimated milliseconds remaining, or -1 when unknown
         */
        void onProgress(float fraction, String detail, long etaMs);
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
        /** true when the requested scale did not fit the encoder and was reduced. */
        boolean scaleReduced;
        int effectiveScale;
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

    /**
     * @param videoPath local, seekable path of the video to process
     * @param outputFd  destination descriptor (nullable, API 26+); when null the
     *                  {@code outputPath} is used instead
     */
    Result transcode(String videoPath, String outputPath, ParcelFileDescriptor outputFd, Config cfg)
            throws Exception {
        long startedAt = System.currentTimeMillis();

        MediaExtractor video = new MediaExtractor();
        MediaExtractor audio = null;
        MediaCodec decoder = null;
        MediaCodec encoder = null;
        MediaMuxer muxer = null;
        Scaler scaler = null;

        try {
            video.setDataSource(videoPath);

            int videoTrack = findTrack(video, "video/");
            if (videoTrack < 0) throw new IOException("no video track found");
            MediaFormat inFormat = video.getTrackFormat(videoTrack);
            video.selectTrack(videoTrack);

            int srcW = inFormat.getInteger(MediaFormat.KEY_WIDTH);
            int srcH = inFormat.getInteger(MediaFormat.KEY_HEIGHT);
            if (srcW < 32 || srcH < 32) throw new IOException("source resolution too small");

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

            // ---- clamp the scale so a big movie cannot ask for 8K ----
            int scale = cfg.scale;
            while (scale > 1 && !sizeFits(encCaps, even(srcW * scale), even(srcH * scale))) {
                scale--;
            }
            int outW = even(srcW * scale);
            int outH = even(srcH * scale);
            if (!sizeFits(encCaps, outW, outH)) {
                // Still too big at 1x: shrink to the encoder's own maximum.
                int maxW = maxWidth(encCaps);
                int maxH = maxHeight(encCaps);
                float shrink = Math.min(maxW / (float) srcW, maxH / (float) srcH);
                outW = even(Math.max(64, (int) (srcW * shrink)));
                outH = even(Math.max(64, (int) (srcH * shrink)));
            }
            boolean scaleReduced = scale < cfg.scale;

            int bitrate = bitrateFor(outW, outH, (int) fps, cfg.quality);
            int colorFormat = pickColorFormat(encCaps);
            int keyInterval = (int) Math.max(1, Math.round(fps * 2)); // 2s GOP keeps seeking snappy

            MediaFormat outFormat = buildOutputFormat(outMime, outW, outH, colorFormat,
                    bitrate, fps, keyInterval);

            decoder = MediaCodec.createDecoderByType(inMime);
            decoder.configure(inFormat, null, null, 0);
            decoder.start();

            encoder = startEncoder(outMime, outFormat);

            muxer = openMuxer(outputPath, outputFd, cfg.rotationDegrees);

            // ---- optional audio passthrough ----
            MediaFormat audioFormat = null;
            int audioTrack = findTrack(video, "audio/");
            if (cfg.copyAudio && audioTrack >= 0) {
                audioFormat = video.getTrackFormat(audioTrack);
                try {
                    audio = new MediaExtractor();
                    audio.setDataSource(videoPath);
                } catch (Exception e) {
                    Log.w(TAG, "audio track unavailable: " + e.getMessage());
                    audio = null;
                    audioTrack = -1;
                    audioFormat = null;
                }
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

            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            YuvUtils.Frame srcFrame = YuvUtils.allocate(srcW, srcH);
            YuvUtils.Frame dstFrame = YuvUtils.allocate(outW, outH);
            byte[] hScratch = new byte[outW * srcH];
            byte[] chromaScratch = new byte[Math.max(
                    dstFrame.chromaWidth() * srcFrame.chromaHeight() + 64, outW * srcH / 4 + 64)];
            byte[] sharpScratch = new byte[outW * outH];

            boolean decoderInputDone = false;
            boolean encoderEosSent = false;
            boolean encoderDone = false;
            int frames = 0;
            long totalUs = durationUs > 0 ? durationUs : 1;
            long lastPts = -1;
            long frameStep = (long) (1_000_000d / fps);
            long lastReport = 0;

            while (!encoderDone) {
                checkCancel();

                encoderDone = drainEncoder(encoder, mux, info);
                if (encoderDone) break;

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

                int outIdx = decoder.dequeueOutputBuffer(info, 10_000);
                if (outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) continue;
                if (outIdx < 0) continue;

                boolean decoderEos = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                android.media.Image image = null;
                if (!decoderEos) {
                    try { image = decoder.getOutputImage(outIdx); } catch (Exception e) { image = null; }
                }

                if (image != null) {
                    if (YuvUtils.read(image, srcFrame)) {
                        upscale(scaler, srcFrame, dstFrame, srcW, outW, outH,
                                hScratch, chromaScratch);
                        if (sharpenAmount > 0.01f) {
                            scaler.sharpenPlane(dstFrame.y, outW, outH, sharpenAmount, sharpScratch);
                        }
                        // Keep timestamps strictly increasing: reordered streams
                        // and rounded frame rates otherwise trip the muxer.
                        long pts = info.presentationTimeUs;
                        if (pts <= lastPts) pts = lastPts + frameStep;
                        lastPts = pts;

                        feedEncoderDraining(encoder, mux, dstFrame, pts, info, outFormat);
                        frames++;

                        long now = System.currentTimeMillis();
                        if (now - lastReport > 400) {
                            lastReport = now;
                            float f = Math.min(0.995f, pts / (float) totalUs);
                            long elapsed = now - startedAt;
                            long eta = f > 0.01f ? (long) (elapsed / f - elapsed) : -1;
                            callback.onProgress(f,
                                    frames + " frames · " + outW + "×" + outH, eta);
                        }
                    }
                    image.close();
                }
                decoder.releaseOutputBuffer(outIdx, false);

                if (decoderEos && !encoderEosSent) {
                    signalEos(encoder, mux, info);
                    encoderEosSent = true;
                }
            }

            if (frames == 0) throw new IOException("no frames were decoded from this video");

            drainEncoder(encoder, mux, info);
            if (mux.started) muxer.stop();

            Result r = new Result();
            r.outputWidth = outW;
            r.outputHeight = outH;
            r.frames = frames;
            r.bitrate = bitrate;
            r.mime = outMime;
            r.elapsedMs = System.currentTimeMillis() - startedAt;
            r.scaleReduced = scaleReduced;
            r.effectiveScale = scale;
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

    // ------------------------------------------------------------- codecs ----

    private static MediaFormat buildOutputFormat(String mime, int w, int h, int colorFormat,
                                                 int bitrate, float fps, int keyInterval) {
        MediaFormat f = MediaFormat.createVideoFormat(mime, w, h);
        f.setInteger(MediaFormat.KEY_COLOR_FORMAT, colorFormat);
        f.setInteger(MediaFormat.KEY_BIT_RATE, bitrate);
        f.setInteger(MediaFormat.KEY_FRAME_RATE, Math.round(fps));
        f.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, Math.max(1, keyInterval / Math.max(1, Math.round(fps))));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                f.setInteger(MediaFormat.KEY_BITRATE_MODE,
                        MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_VBR);
            } catch (Exception ignored) { }
        }
        // A generous input buffer avoids "insufficient buffer" errors on some
        // encoders when the frame is large.
        try {
            f.setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, w * h * 3 / 2 + 4096);
        } catch (Exception ignored) { }
        return f;
    }

    private static MediaCodec startEncoder(String mime, MediaFormat format) throws IOException {
        MediaCodec encoder = MediaCodec.createEncoderByType(mime);
        try {
            encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            encoder.start();
            return encoder;
        } catch (Exception first) {
            releaseQuietly(encoder);
            if (MediaFormat.MIMETYPE_VIDEO_AVC.equals(mime)) throw new IOException(first);
            // Some phones advertise HEVC but cannot configure it.
            String fallback = MediaFormat.MIMETYPE_VIDEO_AVC;
            MediaCodecInfo.CodecCapabilities caps = capabilitiesOf(fallback, true);
            if (caps == null) throw new IOException("no usable video encoder");
            int w = format.getInteger(MediaFormat.KEY_WIDTH);
            int h = format.getInteger(MediaFormat.KEY_HEIGHT);
            float fps = format.getInteger(MediaFormat.KEY_FRAME_RATE);
            MediaFormat f = buildOutputFormat(fallback, w, h, pickColorFormat(caps),
                    format.getInteger(MediaFormat.KEY_BIT_RATE), fps,
                    (int) Math.max(1, fps * 2));
            MediaCodec alt = MediaCodec.createEncoderByType(fallback);
            alt.configure(f, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            alt.start();
            return alt;
        }
    }

    private static MediaMuxer openMuxer(String path, ParcelFileDescriptor fd, int rotation)
            throws IOException {
        MediaMuxer muxer;
        if (fd != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            FileDescriptor raw = fd.getFileDescriptor();
            muxer = new MediaMuxer(raw, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
        } else {
            muxer = new MediaMuxer(path, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
        }
        if (rotation != 0) {
            try { muxer.setOrientationHint(rotation); } catch (Exception ignored) { }
        }
        return muxer;
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

    private void feedEncoderDraining(MediaCodec encoder, MuxState mux, YuvUtils.Frame frame,
                                     long ptsUs, MediaCodec.BufferInfo info, MediaFormat outFormat)
            throws Exception {
        long deadline = System.currentTimeMillis() + 30_000;
        while (true) {
            checkCancel();
            int idx = encoder.dequeueInputBuffer(5_000);
            if (idx >= 0) {
                android.media.Image image = null;
                try { image = encoder.getInputImage(idx); } catch (Exception ignored) { }
                if (image != null) {
                    YuvUtils.clear(image);
                    YuvUtils.write(frame, image);
                    encoder.queueInputBuffer(idx, 0, 0, ptsUs, 0);
                } else {
                    ByteBuffer buffer = encoder.getInputBuffer(idx);
                    if (buffer == null || !YuvUtils.writeToBuffer(frame, buffer, outFormat)) {
                        encoder.queueInputBuffer(idx, 0, 0, 0, 0);
                        throw new IOException("this device's encoder rejected the frame; "
                                + "try selecting H.264 in the settings");
                    }
                    encoder.queueInputBuffer(idx, 0, buffer.capacity(), ptsUs, 0);
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
        long deadline = System.currentTimeMillis() + 20_000;
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

    /** Copies the audio track unchanged, sample by sample (streaming, low memory). */
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

    private static void upscale(Scaler scaler, YuvUtils.Frame src, YuvUtils.Frame dst,
                                int srcW, int outW, int outH,
                                byte[] lumaScratch, byte[] chromaScratch) throws Exception {
        // Same integer zoom on every plane: chroma is half size in both axes.
        int scaleX = Math.max(1, Math.round(outW / (float) srcW));
        scaler.upscalePlane(src.y, src.width, src.height, dst.y, dst.width, dst.height, scaleX, lumaScratch);
        int cw = src.chromaWidth();
        int ch = src.chromaHeight();
        int dcw = dst.chromaWidth();
        int dch = dst.chromaHeight();
        scaler.upscalePlane(src.u, cw, ch, dst.u, dcw, dch, scaleX, chromaScratch);
        scaler.upscalePlane(src.v, cw, ch, dst.v, dcw, dch, scaleX, chromaScratch);
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

    private static boolean sizeFits(MediaCodecInfo.CodecCapabilities caps, int w, int h) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return w <= 1920 && h <= 1080;
        MediaCodecInfo.VideoCapabilities vc = caps.getVideoCapabilities();
        if (vc == null) return w <= 1920 && h <= 1080;
        try {
            return vc.isSizeSupported(w, h);
        } catch (Exception e) {
            return false;
        }
    }

    private static int maxWidth(MediaCodecInfo.CodecCapabilities caps) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return 1920;
        MediaCodecInfo.VideoCapabilities vc = caps.getVideoCapabilities();
        return vc == null ? 1920 : vc.getSupportedWidths().getUpper();
    }

    private static int maxHeight(MediaCodecInfo.CodecCapabilities caps) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return 1080;
        MediaCodecInfo.VideoCapabilities vc = caps.getVideoCapabilities();
        return vc == null ? 1080 : vc.getSupportedHeights().getUpper();
    }

    /** Highest frame size this device can encode, for the UI's estimate. */
    static int[] maxEncodeSize(int codecChoice) {
        String mime = pickEncoderMime(codecChoice);
        MediaCodecInfo.CodecCapabilities caps = capabilitiesOf(mime, true);
        if (caps == null) return new int[]{1920, 1080};
        return new int[]{maxWidth(caps), maxHeight(caps)};
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
    }
}
