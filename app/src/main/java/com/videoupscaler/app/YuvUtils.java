package com.videoupscaler.app;

import android.graphics.ImageFormat;
import android.graphics.Rect;
import android.media.Image;

import java.nio.ByteBuffer;

/**
 * Conversion helpers between Android's {@link Image} (YUV_420_888, the format
 * every modern codec exposes through {@code getOutputImage}/{@code getInputImage})
 * and tightly packed I420 planes.
 *
 * <p>Hardware decoders often return frames whose coded size is padded (1080 →
 * 1088) or whose origin is offset (crop rect). {@link #read} clips/replicates
 * while copying so callers always get exactly the video's display resolution.
 */
final class YuvUtils {

    private YuvUtils() { }

    /** One tightly packed I420 frame. */
    static final class Frame {
        final int width, height;
        final byte[] y, u, v;

        Frame(int width, int height) {
            this.width = width;
            this.height = height;
            int cw = (width + 1) / 2;
            int ch = (height + 1) / 2;
            y = new byte[width * height];
            u = new byte[cw * ch];
            v = new byte[cw * ch];
        }

        int chromaWidth() { return (width + 1) / 2; }

        int chromaHeight() { return (height + 1) / 2; }
    }

    static Frame allocate(int width, int height) {
        return new Frame(width, height);
    }

    /**
     * Copies a decoder image into packed planes of exactly the frame's size.
     * Rows/columns outside the image are replicated from the nearest edge.
     */
    static boolean read(Image image, Frame out) {
        if (image == null || image.getFormat() != ImageFormat.YUV_420_888) return false;

        Image.Plane[] planes = image.getPlanes();
        if (planes.length < 3) return false;

        Rect crop;
        try {
            crop = image.getCropRect();
        } catch (Exception e) {
            crop = null;
        }
        int cropL = 0, cropT = 0, cropW = image.getWidth(), cropH = image.getHeight();
        if (crop != null && crop.width() > 0 && crop.height() > 0
                && crop.right <= image.getWidth() && crop.bottom <= image.getHeight()) {
            cropL = crop.left;
            cropT = crop.top;
            cropW = crop.width();
            cropH = crop.height();
        }

        copyPlane(planes[0], out.y, out.width, out.height, cropL, cropT, cropW, cropH);
        int cw = out.chromaWidth();
        int ch = out.chromaHeight();
        copyPlane(planes[1], out.u, cw, ch, cropL / 2, cropT / 2,
                Math.max(1, cropW / 2), Math.max(1, cropH / 2));
        copyPlane(planes[2], out.v, cw, ch, cropL / 2, cropT / 2,
                Math.max(1, cropW / 2), Math.max(1, cropH / 2));
        return true;
    }

    /**
     * Copies a source window of one plane into a packed destination, replicating
     * the edge when the destination is larger than the source window.
     */
    private static void copyPlane(Image.Plane plane, byte[] dst, int dstW, int dstH,
                                  int srcLeft, int srcTop, int srcW, int srcH) {
        ByteBuffer buf = plane.getBuffer();
        int rowStride = plane.getRowStride();
        int pixelStride = plane.getPixelStride();
        int base = buf.position();
        int limit = buf.limit();

        for (int row = 0; row < dstH; row++) {
            int sy = srcTop + Math.min(row, srcH - 1);
            int rowStart = base + sy * rowStride;
            if (rowStart >= limit) {
                // past the end of the buffer: repeat the previous row
                System.arraycopy(dst, (row - 1) * dstW, dst, row * dstW, dstW);
                continue;
            }
            int dstRow = row * dstW;
            if (pixelStride == 1) {
                int usable = Math.min(srcW, dstW);
                int available = Math.min(usable, limit - rowStart - srcLeft);
                if (available > 0) {
                    buf.position(rowStart + srcLeft);
                    buf.get(dst, dstRow, available);
                }
                if (available < dstW) {
                    byte last = available > 0 ? dst[dstRow + available - 1] : (byte) 0;
                    for (int c = Math.max(0, available); c < dstW; c++) dst[dstRow + c] = last;
                }
            } else {
                byte last = 0;
                for (int col = 0; col < dstW; col++) {
                    int sx = srcLeft + Math.min(col, srcW - 1);
                    int idx = rowStart + sx * pixelStride;
                    if (idx < limit) {
                        last = buf.get(idx);
                    }
                    dst[dstRow + col] = last;
                }
            }
        }
    }

    /** Writes packed planes into an encoder image, honouring its strides/crop. */
    static boolean write(Frame frame, Image image) {
        if (image == null || image.getFormat() != ImageFormat.YUV_420_888) return false;

        Image.Plane[] planes = image.getPlanes();
        writePlane(frame.y, frame.width, frame.height, planes[0], 0, 0);
        int cw = frame.chromaWidth();
        int ch = frame.chromaHeight();
        writePlane(frame.u, cw, ch, planes[1], (frame.width - cw) / 2, (frame.height - ch) / 2);
        writePlane(frame.v, cw, ch, planes[2], (frame.width - cw) / 2, (frame.height - ch) / 2);
        return true;
    }

    private static void writePlane(byte[] src, int w, int h, Image.Plane plane, int offsetX, int offsetY) {
        ByteBuffer buf = plane.getBuffer();
        int rowStride = plane.getRowStride();
        int pixelStride = plane.getPixelStride();
        int base = buf.position();
        int limit = buf.limit();

        for (int row = 0; row < h; row++) {
            int rowStart = base + (offsetY + row) * rowStride;
            if (rowStart >= limit) break;
            int srcRow = row * w;
            if (pixelStride == 1) {
                int n = Math.min(w, limit - rowStart - offsetX);
                if (n <= 0) break;
                buf.position(rowStart + offsetX);
                buf.put(src, srcRow, n);
            } else {
                for (int col = 0; col < w; col++) {
                    int idx = rowStart + (offsetX + col) * pixelStride;
                    if (idx >= limit) break;
                    buf.put(idx, src[srcRow + col]);
                }
            }
        }
    }

    /**
     * Fills the whole image with neutral values (16 for luma, 128 for chroma) so
     * that padding and unused columns never leak stale memory into the encoder.
     */
    static void clear(Image image) {
        Image.Plane[] planes = image.getPlanes();
        for (int i = 0; i < planes.length; i++) {
            ByteBuffer b = planes[i].getBuffer();
            byte value = (byte) (i == 0 ? 16 : 128);
            int n = b.limit();
            for (int p = 0; p < n; p++) b.put(p, value);
        }
    }

    // ---------------------------------------------------- ByteBuffer fallback --

    /**
     * Fallback for encoders that do not expose an {@link Image}: writes packed
     * planes into a raw input buffer using the format's stride/slice-height keys.
     */
    static boolean writeToBuffer(Frame frame, ByteBuffer buf, android.media.MediaFormat format) {
        int width = frame.width;
        int height = frame.height;
        int stride = width;
        int sliceHeight = height;
        int colorFormat = 0;
        try {
            if (format.containsKey("stride")) stride = format.getInteger("stride");
            if (format.containsKey("slice-height")) sliceHeight = format.getInteger("slice-height");
            if (format.containsKey(android.media.MediaFormat.KEY_COLOR_FORMAT)) {
                colorFormat = format.getInteger(android.media.MediaFormat.KEY_COLOR_FORMAT);
            }
        } catch (Exception ignored) { }
        if (stride < width) stride = width;
        if (sliceHeight < height) sliceHeight = height;

        int cw = frame.chromaWidth();
        int ch = frame.chromaHeight();
        boolean semiPlanar = colorFormat == android.media.MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar
                || colorFormat == android.media.MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420PackedSemiPlanar
                || colorFormat == android.media.MediaCodecInfo.CodecCapabilities.COLOR_TI_FormatYUV420PackedSemiPlanar;

        try {
            buf.clear();
            for (int row = 0; row < height; row++) {
                buf.position(row * stride);
                buf.put(frame.y, row * width, width);
            }
            int uvStart = stride * sliceHeight;
            if (semiPlanar) {
                int uvStride = stride;
                for (int row = 0; row < ch; row++) {
                    int p = uvStart + row * uvStride;
                    if (p + cw * 2 > buf.capacity()) break;
                    for (int col = 0; col < cw; col++) {
                        buf.put(p + col * 2, frame.u[row * cw + col]);
                        buf.put(p + col * 2 + 1, frame.v[row * cw + col]);
                    }
                }
            } else {
                int uvStride = stride / 2;
                int uStart = uvStart;
                int vStart = uStart + uvStride * ch;
                for (int row = 0; row < ch; row++) {
                    int p = uStart + row * uvStride;
                    if (p + cw > buf.capacity()) break;
                    buf.position(p);
                    buf.put(frame.u, row * cw, cw);
                }
                for (int row = 0; row < ch; row++) {
                    int p = vStart + row * uvStride;
                    if (p + cw > buf.capacity()) break;
                    buf.position(p);
                    buf.put(frame.v, row * cw, cw);
                }
            }
            buf.position(0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
