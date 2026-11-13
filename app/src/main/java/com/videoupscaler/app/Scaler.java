package com.videoupscaler.app;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * High quality, separable plane upscaler.
 *
 * <p>Three kernels are available:
 * <ul>
 *   <li>{@link #METHOD_BILINEAR} – tent filter, fastest, softest.</li>
 *   <li>{@link #METHOD_BICUBIC} – Catmull-Rom, good detail / speed balance.</li>
 *   <li>{@link #METHOD_LANCZOS} – Lanczos-3, sharpest, some ringing at edges.</li>
 * </ul>
 *
 * <p>Only integer zoom factors are produced (2x, 3x, 4x), which lets the weights
 * be pre-computed once per phase: output pixel {@code x} always uses the tap
 * pattern of phase {@code x % scale}. Everything is done in 16.16 fixed point,
 * multi-threaded across row bands.
 */
final class Scaler {

    static final int METHOD_BILINEAR = 0;
    static final int METHOD_BICUBIC = 1;
    static final int METHOD_LANCZOS = 2;

    private static final int FIXED = 1 << 16;

    private final int method;
    private final int radius;
    private final int[][] weights;   // [phase][tap]
    private final int[] baseOffsets; // [phase] first source index offset
    private final ExecutorService pool;

    Scaler(int method, int threads) {
        this.method = method;
        switch (method) {
            case METHOD_BILINEAR: radius = 1; break;
            case METHOD_BICUBIC: radius = 2; break;
            default: radius = 3; break;
        }
        weights = new int[4][];      // up to 4x zoom
        baseOffsets = new int[4];
        int n = Math.max(1, threads);
        pool = Executors.newFixedThreadPool(n, r -> {
            Thread t = new Thread(r, "scaler");
            t.setPriority(Thread.NORM_PRIORITY + 1);
            return t;
        });
    }

    void shutdown() {
        pool.shutdownNow();
    }

    // ------------------------------------------------------------- kernels --

    private static double kernel(int method, double x) {
        switch (method) {
            case METHOD_BILINEAR:
                x = Math.abs(x);
                return x < 1.0 ? 1.0 - x : 0.0;
            case METHOD_BICUBIC: {
                double a = -0.5;
                double ax = Math.abs(x);
                if (ax <= 1.0) return (a + 2) * ax * ax * ax - (a + 3) * ax * ax + 1;
                if (ax < 2.0) return a * ax * ax * ax - 5 * a * ax * ax + 8 * a * ax - 4 * a;
                return 0.0;
            }
            default: { // Lanczos-3
                double ax = Math.abs(x);
                if (ax < 1e-9) return 1.0;
                if (ax >= 3.0) return 0.0;
                return (Math.sin(Math.PI * ax) / (Math.PI * ax))
                        * (Math.sin(Math.PI * ax / 3.0) / (Math.PI * ax / 3.0));
            }
        }
    }

    /** Builds the normalised tap table for every phase of a given zoom. */
    private void ensureTable(int scale) {
        int idx = scale - 1;
        if (idx < 0 || idx >= weights.length || weights[idx] != null) return;

        int taps = radius * 2;
        int[] table = new int[scale * taps];
        int[] bases = new int[scale];

        for (int phase = 0; phase < scale; phase++) {
            double center = (phase + 0.5) / scale - 0.5;
            int first = (int) Math.floor(center - radius + 1);
            bases[phase] = first;
            double sum = 0;
            double[] w = new double[taps];
            for (int i = 0; i < taps; i++) {
                w[i] = kernel(method, (first + i) - center);
                sum += w[i];
            }
            if (sum == 0) { // degenerate guard
                w[taps / 2 - 1] = 1.0;
                sum = 1.0;
            }
            for (int i = 0; i < taps; i++) {
                table[phase * taps + i] = (int) Math.round(w[i] / sum * FIXED);
            }
        }
        weights[idx] = table;
        baseOffsets[idx] = -1; // marker: bases stored separately
        basesByIdx[idx] = bases;
    }

    private final int[][] basesByIdx = new int[4][];

    private int taps() {
        return radius * 2;
    }

    // -------------------------------------------------------------- planes --

    /**
     * Upscales one 8-bit plane.
     *
     * @param src source plane (width*height bytes)
     * @param tmp scratch buffer of at least {@code dstW * srcH} bytes
     */
    void upscalePlane(byte[] src, int srcW, int srcH,
                      byte[] dst, int dstW, int dstH,
                      int scale, byte[] tmp) throws InterruptedException, java.util.concurrent.ExecutionException {
        ensureTable(scale);
        final int[] w = weights[scale - 1];
        final int[] bases = basesByIdx[scale - 1];
        final int taps = taps();
        final int phases = scale;

        // ---- horizontal pass: src (srcW x srcH) -> tmp (dstW x srcH) ----
        runBands(srcH, (start, end) -> {
            for (int y = start; y < end; y++) {
                int srcRow = y * srcW;
                int dstRow = y * dstW;
                for (int x = 0; x < dstW; x++) {
                    int phase = x % phases;
                    int base = bases[phase] + (x / phases);
                    int acc = 0;
                    int wp = phase * taps;
                    for (int t = 0; t < taps; t++) {
                        int sx = base + t;
                        if (sx < 0) sx = 0;
                        else if (sx >= srcW) sx = srcW - 1;
                        acc += w[wp + t] * (src[srcRow + sx] & 0xFF);
                    }
                    int v = acc >> 16;
                    tmp[dstRow + x] = (byte) (v < 0 ? 0 : Math.min(255, v));
                }
            }
        });

        // ---- vertical pass: tmp (dstW x srcH) -> dst (dstW x dstH) ----
        runBands(dstH, (start, end) -> {
            for (int y = start; y < end; y++) {
                int phase = y % phases;
                int base = bases[phase] + (y / phases);
                int wp = phase * taps;
                int dstRow = y * dstW;
                for (int x = 0; x < dstW; x++) {
                    int acc = 0;
                    for (int t = 0; t < taps; t++) {
                        int sy = base + t;
                        if (sy < 0) sy = 0;
                        else if (sy >= srcH) sy = srcH - 1;
                        acc += w[wp + t] * (tmp[sy * dstW + x] & 0xFF);
                    }
                    int v = acc >> 16;
                    dst[dstRow + x] = (byte) (v < 0 ? 0 : Math.min(255, v));
                }
            }
        });
    }

    // ------------------------------------------------------------- filters --

    /**
     * Unsharp mask on the luma plane: {@code out = clamp(y + amount*(y - blur(y)))}.
     *
     * @param amount 0..1 strength
     */
    void sharpenPlane(byte[] plane, int w, int h, float amount, byte[] scratch) {
        if (amount <= 0.001f) return;
        final float k = amount * 1.15f;
        try {
            // 3x3 gaussian blur (separable), then recombine.
            runBands(1, (start, end) -> {
                // horizontal blur into scratch
                for (int y = 0; y < h; y++) {
                    int row = y * w;
                    for (int x = 0; x < w; x++) {
                        int xm = x == 0 ? 0 : x - 1;
                        int xp = x == w - 1 ? w - 1 : x + 1;
                        int v = (plane[row + xm] & 0xFF)
                                + 2 * (plane[row + x] & 0xFF)
                                + (plane[row + xp] & 0xFF);
                        scratch[row + x] = (byte) (v >> 2);
                    }
                }
                // vertical blur + recombine
                for (int y = 0; y < h; y++) {
                    int row = y * w;
                    int rowUp = (y == 0 ? 0 : y - 1) * w;
                    int rowDn = (y == h - 1 ? h - 1 : y + 1) * w;
                    for (int x = 0; x < w; x++) {
                        int blur = ((scratch[rowUp + x] & 0xFF)
                                + 2 * (scratch[row + x] & 0xFF)
                                + (scratch[rowDn + x] & 0xFF)) >> 2;
                        int y0 = plane[row + x] & 0xFF;
                        int out = Math.round(y0 + k * (y0 - blur));
                        plane[row + x] = (byte) (out < 0 ? 0 : Math.min(255, out));
                    }
                }
            });
        } catch (Exception ignored) {
            // Sharpening is cosmetic – never fail the whole job for it.
        }
    }

    // ------------------------------------------------------------- threads --

    private interface Band {
        void run(int start, int end) throws Exception;
    }

    private void runBands(int lines, Band band) throws InterruptedException, java.util.concurrent.ExecutionException {
        int cores = Math.max(1, Runtime.getRuntime().availableProcessors() - 1);
        int bandsCount = Math.max(1, Math.min(cores * 2, lines));
        if (bandsCount == 1) {
            try {
                band.run(0, lines);
            } catch (RuntimeException re) {
                throw re;
            } catch (Exception e) {
                throw new java.util.concurrent.ExecutionException(e);
            }
            return;
        }
        List<Callable<Void>> tasks = new ArrayList<>(bandsCount);
        int chunk = (lines + bandsCount - 1) / bandsCount;
        for (int i = 0; i < bandsCount; i++) {
            final int start = i * chunk;
            final int end = Math.min(lines, start + chunk);
            if (start >= end) break;
            tasks.add(() -> {
                band.run(start, end);
                return null;
            });
        }
        List<Future<Void>> futures = pool.invokeAll(tasks);
        for (Future<Void> f : futures) f.get();
    }
}
