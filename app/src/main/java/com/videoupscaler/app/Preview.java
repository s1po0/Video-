package com.videoupscaler.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;

/**
 * Grabs one frame out of a video and produces a real before/after comparison:
 * the same frame, upscaled and sharpened with exactly the settings the user
 * picked. That makes the quality chips honest instead of guesswork.
 */
final class Preview {

    static final int THUMB_WIDTH = 480;

    static final class Shot {
        Bitmap before;
        Bitmap after;
    }

    /**
     * Grabs a frame straight from a content uri (no copy of the movie) and
     * returns the before/after pair.
     */
    static Shot build(android.content.Context ctx, android.net.Uri uri,
                      int scale, int quality, int sharpen) {
        Bitmap frame = grabFrame(ctx, uri);
        if (frame == null) return null;
        return fromFrame(frame, scale, quality, sharpen);
    }

    private static Bitmap grabFrame(android.content.Context ctx, android.net.Uri uri) {
        MediaMetadataRetriever r = new MediaMetadataRetriever();
        try {
            try {
                r.setDataSource(ctx, uri);
            } catch (Exception e) {
                return null;
            }
            long duration = 0;
            try {
                duration = Long.parseLong(r.extractMetadata(
                        MediaMetadataRetriever.METADATA_KEY_DURATION));
            } catch (Exception ignored) { }
            long atUs = duration > 4000 ? duration * 1000L / 3 : 0;
            Bitmap b = r.getFrameAtTime(atUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            if (b == null) b = r.getFrameAtTime(0);
            return b;
        } catch (Throwable t) {
            return null;
        } finally {
            try { r.release(); } catch (Exception ignored) { }
        }
    }

    static Shot build(String path, int scale, int quality, int sharpen, int outWidth) {
        MediaMetadataRetriever r = new MediaMetadataRetriever();
        Bitmap frame = null;
        try {
            r.setDataSource(path);
            long duration = 0;
            try {
                duration = Long.parseLong(r.extractMetadata(
                        MediaMetadataRetriever.METADATA_KEY_DURATION));
            } catch (Exception ignored) { }
            // A bit into the clip, so we do not always compare a black fade-in.
            long atUs = duration > 4000 ? duration * 1000L / 3 : 0;
            frame = r.getFrameAtTime(atUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            if (frame == null) frame = r.getFrameAtTime(0);
        } catch (Exception e) {
            return null;
        } finally {
            try { r.release(); } catch (Exception ignored) { }
        }
        if (frame == null) return null;
        return fromFrame(frame, scale, quality, sharpen);
    }

    private static Shot fromFrame(Bitmap frame, int scale, int quality, int sharpen) {
        int w = frame.getWidth();
        int h = frame.getHeight();
        float factor = THUMB_WIDTH / (float) w;
        int tw = THUMB_WIDTH;
        int th = Math.max(2, Math.round(h * factor));
        Bitmap small = Bitmap.createScaledBitmap(frame, tw, th, true);

        Shot shot = new Shot();
        shot.before = small;
        shot.after = upscale(small, scale, quality, sharpen);
        if (frame != small) frame.recycle();
        if (shot.after == null) shot.after = small;
        return shot;
    }

    /** Runs the real scaler over one bitmap so the preview matches the export. */
    private static Bitmap upscale(Bitmap src, int scale, int quality, int sharpen) {
        try {
            int sw = src.getWidth() & ~1;
            int sh = src.getHeight() & ~1;
            int dw = sw * scale;
            int dh = sh * scale;

            YuvUtils.Frame in = YuvUtils.allocate(sw, sh);
            YuvUtils.Frame out = YuvUtils.allocate(dw, dh);
            rgbToYuv(src, in);

            int method = quality == 2 ? Scaler.METHOD_LANCZOS
                    : quality == 0 ? Scaler.METHOD_BILINEAR : Scaler.METHOD_BICUBIC;
            Scaler scaler = new Scaler(method, Device.scaleThreads());
            try {
                scaler.upscalePlane(in.y, sw, sh, out.y, dw, dh, scale, new byte[dw * sh]);
                scaler.upscalePlane(in.u, in.chromaWidth(), in.chromaHeight(),
                        out.u, out.chromaWidth(), out.chromaHeight(), scale,
                        new byte[out.chromaWidth() * in.chromaHeight()]);
                scaler.upscalePlane(in.v, in.chromaWidth(), in.chromaHeight(),
                        out.v, out.chromaWidth(), out.chromaHeight(), scale,
                        new byte[out.chromaWidth() * in.chromaHeight()]);
                float amount = Math.max(0, Math.min(100, sharpen)) / 100f;
                if (amount > 0.01f) {
                    scaler.sharpenPlane(out.y, dw, dh, amount, new byte[dw * dh]);
                }
            } finally {
                scaler.shutdown();
            }

            return yuvToRgb(out, Math.min(dw, THUMB_WIDTH * 2),
                    Math.max(2, Math.min(dh, THUMB_WIDTH * 2)));
        } catch (Throwable t) {
            return null;
        }
    }

    private static void rgbToYuv(Bitmap bmp, YuvUtils.Frame f) {
        int[] px = new int[f.width * f.height];
        bmp.getPixels(px, 0, f.width, 0, 0, f.width, f.height);
        int cw = f.chromaWidth();
        for (int y = 0; y < f.height; y++) {
            for (int x = 0; x < f.width; x++) {
                int c = px[y * f.width + x];
                int r = (c >> 16) & 0xFF, g = (c >> 8) & 0xFF, b = c & 0xFF;
                f.y[y * f.width + x] = clamp(16 + (65.481f * r + 128.553f * g + 24.966f * b) / 255f);
                if ((y & 1) == 0 && (x & 1) == 0) {
                    int ci = (y / 2) * cw + (x / 2);
                    f.u[ci] = clamp(128 + (-37.797f * r - 74.203f * g + 112f * b) / 255f);
                    f.v[ci] = clamp(128 + (112f * r - 93.786f * g - 18.214f * b) / 255f);
                }
            }
        }
    }

    private static byte clamp(float v) {
        int i = Math.round(v);
        return (byte) (i < 0 ? 0 : Math.min(255, i));
    }

    private static Bitmap yuvToRgb(YuvUtils.Frame f, int outW, int outH) {
        int[] px = new int[outW * outH];
        int cw = f.chromaWidth();
        float sx = f.width / (float) outW;
        float sy = f.height / (float) outH;
        for (int y = 0; y < outH; y++) {
            int srcY = Math.min(f.height - 1, (int) (y * sy));
            for (int x = 0; x < outW; x++) {
                int srcX = Math.min(f.width - 1, (int) (x * sx));
                int Y = (f.y[srcY * f.width + srcX] & 0xFF) - 16;
                int ci = (srcY / 2) * cw + (srcX / 2);
                int U = (f.u[ci] & 0xFF) - 128;
                int V = (f.v[ci] & 0xFF) - 128;
                int r = Math.round(1.164f * Y + 1.596f * V);
                int g = Math.round(1.164f * Y - 0.813f * V - 0.392f * U);
                int b = Math.round(1.164f * Y + 2.017f * U);
                px[y * outW + x] = 0xFF000000
                        | (Math.max(0, Math.min(255, r)) << 16)
                        | (Math.max(0, Math.min(255, g)) << 8)
                        | Math.max(0, Math.min(255, b));
            }
        }
        return Bitmap.createBitmap(px, outW, outH, Bitmap.Config.ARGB_8888);
    }

    private Preview() { }
}
