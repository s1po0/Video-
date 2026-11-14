package com.videoupscaler.app;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

/** Small device probe: how many worker threads and how much headroom we may use. */
final class Device {
    private static final String TAG = "Device";

    static boolean isLowRam = false;
    static int cores = 4;

    static void init(Context c) {
        try {
            ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                cores = Math.max(1, Runtime.getRuntime().availableProcessors());
                isLowRam = am.isLowRamDevice();
            }
        } catch (Exception e) {
            Log.w(TAG, "probe failed: " + e.getMessage());
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
                if (pm != null && pm.getCurrentThermalStatus() >= PowerManager.THERMAL_STATUS_MODERATE) {
                    Log.w(TAG, "device is warm, reducing threads");
                    isLowRam = true;
                }
            } catch (Exception ignored) { }
        }
    }

    /** Worker threads for the scaler: leave one core for the codecs and the UI. */
    static int scaleThreads() {
        int t = cores - 1;
        if (isLowRam) t = Math.min(t, 2);
        return Math.max(1, Math.min(8, t));
    }
}
