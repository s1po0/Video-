package com.videoupscaler.app;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import com.videoupscaler.app.FileProvider;
import android.database.Cursor;
import android.content.res.AssetFileDescriptor;
import android.media.MediaExtractor;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;

/**
 * Video Upscaler — upscale any video 2×/3×/4× on-device.
 *
 * Flow: pick a video → copy it to the cache (MediaExtractor needs a real file)
 * → transcode through {@link VideoEngine} → publish into Movies/VideoUpscaler
 * → offer "Open" / "Share".
 */
public class MainActivity extends Activity {

    private static final int REQ_PICK = 1001;

    // views
    private TextView tvFileName, tvFileInfo, tvStatus, tvPercent, tvSharpenVal, tvEstimate;
    private Spinner spScale, spQuality, spCodec;
    private SeekBar sbSharpen;
    private CheckBox cbAudio;
    private Button btnPick, btnStart, btnCancel, btnOpen, btnShare;
    private ProgressBar progress;
    private View cardActions;

    // state
    private Uri sourceUri;
    private String sourceName = "";
    private long sourceSize = 0;
    private int srcWidth = 0, srcHeight = 0;
    private long durationMs = 0;
    private int rotation = 0;

    private volatile VideoEngine engine;
    private Thread worker;
    private boolean running = false;
    private PowerManager.WakeLock wakeLock;
    private final Handler ui = new Handler(Looper.getMainLooper());

    private File lastOutput;
    private Uri lastPublished;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VideoUpscaler:job");

        askNotificationPermission();
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    // ---------------------------------------------------------------- intent --

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) data = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (data != null) loadSource(data);
    }

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 42);
        }
    }

    private void pickVideo() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("video/*");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivityForResult(i, REQ_PICK);
        } catch (Exception e) {
            Toast.makeText(this, R.string.err_no_picker, Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_PICK && res == RESULT_OK && data != null && data.getData() != null) {
            loadSource(data.getData());
        }
    }

    private void loadSource(Uri uri) {
        try {
            getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) { }

        sourceUri = uri;
        sourceName = queryName(uri);
        sourceSize = querySize(uri);

        MediaMetadataRetriever r = new MediaMetadataRetriever();
        try {
            r.setDataSource(this, uri);
            srcWidth = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH));
            srcHeight = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT));
            durationMs = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));
            rotation = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION));
            if (rotation == 90 || rotation == 270) {
                int t = srcWidth; srcWidth = srcHeight; srcHeight = t;
            }
        } catch (Exception e) {
            toast(getString(R.string.err_read, String.valueOf(e.getMessage())));
        } finally {
            try { r.release(); } catch (Exception ignored) { }
        }

        tvFileName.setText(sourceName.isEmpty() ? getString(R.string.untitled) : sourceName);
        StringBuilder info = new StringBuilder();
        if (srcWidth > 0) info.append(srcWidth).append(" × ").append(srcHeight);
        if (durationMs > 0) {
            if (info.length() > 0) info.append("   ·   ");
            info.append(fmtDuration(durationMs));
        }
        if (sourceSize > 0) {
            if (info.length() > 0) info.append("   ·   ");
            info.append(fmtSize(sourceSize));
        }
        tvFileInfo.setText(info);
        btnStart.setEnabled(true);
        updateEstimate();
        setStatus(getString(R.string.status_ready));
    }

    // ------------------------------------------------------------------ run --

    private void startJob() {
        if (running || sourceUri == null) return;

        final VideoEngine.Config cfg = new VideoEngine.Config();
        cfg.scale = new int[]{2, 3, 4}[Math.max(0, spScale.getSelectedItemPosition())];
        cfg.quality = spQuality.getSelectedItemPosition();
        cfg.sharpen = sbSharpen.getProgress();
        cfg.codec = spCodec.getSelectedItemPosition();
        cfg.copyAudio = cbAudio.isChecked();
        cfg.rotationDegrees = rotation;
        final Uri src = sourceUri;

        purgeTempFiles();

        running = true;
        btnStart.setEnabled(false);
        btnPick.setEnabled(false);
        btnCancel.setVisibility(View.VISIBLE);
        btnCancel.setEnabled(true);
        cardActions.setVisibility(View.GONE);
        progress.setProgress(0);
        tvPercent.setText("0%");
        setStatus(getString(R.string.status_starting));
        if (wakeLock != null) wakeLock.acquire(60 * 60 * 1000L);

        worker = new Thread(() -> runJob(src, cfg), "upscale-job");
        worker.start();
    }

    private void runJob(Uri src, VideoEngine.Config cfg) {
        File local = null;
        try {
            // Always work on a local copy: content uris from cloud providers are
            // pipes without seeking, which makes the media extractor fail with
            // "Failed to instantiate extractor".
            setProgress(0.01f, getString(R.string.status_copying));
            local = copyToCache(src);
            setProgress(0.06f, getString(R.string.status_preparing));
            transcodeAndPublish(local, cfg);
        } catch (VideoEngine.CancelledException ce) {
            setStatus(getString(R.string.status_cancelled));
        } catch (Throwable t) {
            Log.e("MainActivity", "job failed", t);
            String msg = t.getMessage() == null ? t.getClass().getName() : t.getMessage();
            setStatus(getString(R.string.status_failed, msg));
            final String detail = msg;
            ui.post(() -> new android.app.AlertDialog.Builder(MainActivity.this)
                    .setTitle(R.string.status_failed_title)
                    .setMessage(detail + "\n\n" + getString(R.string.failure_hint))
                    .setPositiveButton(android.R.string.ok, null)
                    .show());
        } finally {
            if (local != null) //noinspection ResultOfMethodCallIgnored
                local.delete();
            engine = null;
            ui.post(this::resetButtons);
        }
    }

    /** Transcodes the local file and publishes the result to Movies. */
    private void transcodeAndPublish(File input, VideoEngine.Config cfg) throws Exception {
        File outFile = new File(getCacheDir(), "out_" + System.currentTimeMillis() + ".mp4");
        long t0 = System.currentTimeMillis();
        try {
            VideoEngine eng = new VideoEngine(new VideoEngine.Callback() {
                @Override public void onProgress(float fraction, String detail) {
                    setProgress(0.02f + fraction * 0.92f, detail);
                }

                @Override public void onLog(String line) { }
            });
            engine = eng;

            VideoEngine.Result result = eng.transcode(input.getAbsolutePath(), outFile.getAbsolutePath(), cfg);

            setProgress(0.96f, getString(R.string.status_saving));
            Uri published = publish(outFile, sourceName, result.outputWidth, result.outputHeight);
            lastOutput = outFile;
            lastPublished = published;

            final String done = getString(R.string.status_done, result.outputWidth, result.outputHeight,
                    String.format(Locale.US, "%.0f", (System.currentTimeMillis() - t0) / 1000.0));
            ui.post(() -> {
                tvStatus.setText(done);
                progress.setProgress(1000);
                tvPercent.setText("100%");
                cardActions.setVisibility(View.VISIBLE);
                btnOpen.setEnabled(lastPublished != null || lastOutput != null);
                btnShare.setEnabled(lastPublished != null || lastOutput != null);
            });
        } catch (Exception e) {
            //noinspection ResultOfMethodCallIgnored
            outFile.delete();
            throw e;
        }
    }

    /** Copies the chosen uri into the app cache and returns the local file. */
    private File copyToCache(Uri uri) throws Exception {
        File target = new File(getCacheDir(), "input_" + System.currentTimeMillis() + ".mp4");
        InputStream in = getContentResolver().openInputStream(uri);
        if (in == null) throw new Exception(getString(R.string.err_open));
        long total = sourceSize > 0 ? sourceSize : 0;
        long copied = 0;
        try (OutputStream out = new FileOutputStream(target)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                copied += n;
                if (!running) throw new VideoEngine.CancelledException();
                if (total > 0) {
                    float pct = Math.min(0.99f, copied / (float) total);
                    setProgress(pct * 0.05f, getString(R.string.status_copying)
                            + "  " + Math.round(pct * 100) + "%");
                }
            }
        } finally {
            try { in.close(); } catch (Exception ignored) { }
        }
        if (copied < 1024) throw new Exception(getString(R.string.err_empty_file));
        return target;
    }

    private static void closeQuietly(AssetFileDescriptor fd) {
        if (fd == null) return;
        try { fd.close(); } catch (Exception ignored) { }
    }

    /** Removes leftovers of previous runs so the cache never grows forever. */
    private void purgeTempFiles() {
        File[] files = getCacheDir().listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.getName().startsWith("out_") || f.getName().startsWith("input_")) {
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }
        }
    }

    private void cancelJob() {
        VideoEngine e = engine;
        if (e != null) e.requestCancel();
        btnCancel.setEnabled(false);
        setStatus(getString(R.string.status_cancelling));
    }

    private void resetButtons() {
        running = false;
        btnStart.setEnabled(sourceUri != null);
        btnPick.setEnabled(true);
        btnCancel.setVisibility(View.GONE);
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
    }

    // ------------------------------------------------------------- file i/o ---

    /** Moves the finished MP4 into the public Movies folder. */
    private Uri publish(File file, String originalName, int w, int h) {
        String base = originalName == null || originalName.isEmpty() ? "video" : originalName;
        int dot = base.lastIndexOf('.');
        if (dot > 0) base = base.substring(0, dot);
        String name = base + "_" + w + "x" + h + ".mp4";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.Video.Media.DISPLAY_NAME, name);
            v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
            v.put(MediaStore.Video.Media.RELATIVE_PATH,
                    Environment.DIRECTORY_MOVIES + "/Video Upscaler");
            v.put(MediaStore.Video.Media.IS_PENDING, 1);
            Uri collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
            Uri item = getContentResolver().insert(collection, v);
            if (item == null) return null;
            try (OutputStream out = getContentResolver().openOutputStream(item);
                 InputStream in = new FileInputStream(file)) {
                if (out == null) return null;
                byte[] buf = new byte[1 << 16];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            } catch (Exception e) {
                return null;
            }
            ContentValues done = new ContentValues();
            done.put(MediaStore.Video.Media.IS_PENDING, 0);
            getContentResolver().update(item, done, null, null);
            return item;
        } else {
            File dir = new File(Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_MOVIES), "Video Upscaler");
            if (!dir.exists()) //noinspection ResultOfMethodCallIgnored
                dir.mkdirs();
            File dest = new File(dir, name);
            try {
                copyFile(file, dest);
                return Uri.fromFile(dest);
            } catch (Exception e) {
                return null;
            }
        }
    }

    private static void copyFile(File from, File to) throws Exception {
        try (InputStream in = new FileInputStream(from); OutputStream out = new FileOutputStream(to)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
    }

    private void openLast() {
        Uri uri = shareableUri();
        if (uri == null) return;
        try {
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "video/mp4");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(i);
        } catch (Exception e) {
            toast(getString(R.string.err_play));
        }
    }

    /** Best uri for handing the result to other apps. */
    private Uri shareableUri() {
        if (lastPublished != null) return lastPublished;
        if (lastOutput == null || !lastOutput.exists()) return null;
        // Cache files cannot be shared directly on API 24+, so copy the result
        // into the provider-backed folder first.
        try {
            File shared = new File(FileProvider.dir(this), lastOutput.getName());
            if (!shared.exists()) copyFile(lastOutput, shared);
            return FileProvider.uriFor(shared);
        } catch (Exception e) {
            return null;
        }
    }

    private void shareLast() {
        Uri uri = shareableUri();
        if (uri == null) return;
        try {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("video/mp4");
            i.putExtra(Intent.EXTRA_STREAM, uri);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(i, getString(R.string.share)));
        } catch (Exception e) {
            toast(getString(R.string.err_share));
        }
    }

    // ------------------------------------------------------------- metadata ---

    private String queryName(Uri uri) {
        try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (i >= 0 && !c.isNull(i)) return c.getString(i);
            }
        } catch (Exception ignored) { }
        String seg = uri.getLastPathSegment();
        return seg == null ? "" : seg;
    }

    private long querySize(Uri uri) {
        try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int i = c.getColumnIndex(OpenableColumns.SIZE);
                if (i >= 0 && !c.isNull(i)) return c.getLong(i);
            }
        } catch (Exception ignored) { }
        return 0;
    }

    private void updateEstimate() {
        if (srcWidth <= 0) return;
        int scale = new int[]{2, 3, 4}[Math.max(0, spScale.getSelectedItemPosition())];
        int w = ((srcWidth * scale) / 2) * 2;
        int h = ((srcHeight * scale) / 2) * 2;
        tvEstimate.setText(getString(R.string.output_size, w + " × " + h));
    }

    private static int parseInt(String s) {
        if (s == null) return 0;
        try { return Integer.parseInt(s); } catch (Exception e) { return 0; }
    }

    private static String fmtDuration(long ms) {
        long s = ms / 1000;
        return String.format(Locale.US, "%d:%02d", s / 60, s % 60);
    }

    private static String fmtSize(long bytes) {
        if (bytes < 1024 * 1024) return String.format(Locale.US, "%.0f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format(Locale.US, "%.1f MB", bytes / 1048576.0);
        return String.format(Locale.US, "%.2f GB", bytes / 1073741824.0);
    }

    // ------------------------------------------------------------------- ui ---

    private void setStatus(String s) {
        ui.post(() -> tvStatus.setText(s));
    }

    private void setProgress(float fraction, String detail) {
        ui.post(() -> {
            progress.setProgress(Math.round(fraction * 1000));
            tvPercent.setText(Math.round(fraction * 100) + "%");
            if (detail != null && !detail.isEmpty()) tvStatus.setText(detail);
        });
    }

    private void toast(String s) {
        ui.post(() -> Toast.makeText(this, s, Toast.LENGTH_LONG).show());
    }

    @Override
    public void onBackPressed() {
        if (running) {
            toast(getString(R.string.still_working));
            return;
        }
        super.onBackPressed();
    }

    /** Small helper for layout building. */
    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(0xFF0B1020);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(30), dp(18), dp(30));
        scroll.addView(root);

        TextView title = text(getString(R.string.app_name), 27, 0xFFFFFFFF, true);
        root.addView(title);
        TextView sub = text(getString(R.string.tagline), 13, 0xFF8FA0C4, false);
        sub.setPadding(0, dp(6), 0, dp(18));
        root.addView(sub);

        // --- source card ---
        LinearLayout card1 = card();
        tvFileName = text(getString(R.string.no_video), 16, 0xFFFFFFFF, true);
        card1.addView(tvFileName);
        tvFileInfo = text("", 12, 0xFF8FA0C4, false);
        tvFileInfo.setPadding(0, dp(4), 0, dp(12));
        card1.addView(tvFileInfo);
        btnPick = button(getString(R.string.pick_video));
        btnPick.setOnClickListener(v -> pickVideo());
        card1.addView(btnPick);
        root.addView(card1, wrap(dp(14)));

        // --- settings card ---
        LinearLayout card2 = card();
        card2.addView(caption(getString(R.string.scale)));
        spScale = spinner(new String[]{
                getString(R.string.scale_2x), getString(R.string.scale_3x), getString(R.string.scale_4x)});
        spScale.setOnItemSelectedListener(new SimpleItemSelected() {
            @Override public void onItemSelected(android.widget.AdapterView<?> p, View v, int pos, long id) {
                updateEstimate();
            }
        });
        card2.addView(spScale);

        card2.addView(caption(getString(R.string.quality)));
        spQuality = spinner(new String[]{
                getString(R.string.q_draft), getString(R.string.q_balanced), getString(R.string.q_best)});
        spQuality.setSelection(1);
        card2.addView(spQuality);

        card2.addView(caption(getString(R.string.codec)));
        spCodec = spinner(new String[]{
                getString(R.string.codec_auto), "H.264", "H.265 / HEVC"});
        card2.addView(spCodec);

        tvSharpenVal = caption(getString(R.string.sharpen, 45));
        card2.addView(tvSharpenVal);
        sbSharpen = new SeekBar(this);
        sbSharpen.setMax(100);
        sbSharpen.setProgress(45);
        sbSharpen.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int value, boolean fromUser) {
                tvSharpenVal.setText(getString(R.string.sharpen, value));
            }
            @Override public void onStartTrackingTouch(SeekBar s) { }
            @Override public void onStopTrackingTouch(SeekBar s) { }
        });
        card2.addView(sbSharpen);

        cbAudio = new CheckBox(this);
        cbAudio.setText(R.string.keep_audio);
        cbAudio.setChecked(true);
        cbAudio.setTextColor(0xFFE6EDFA);
        cbAudio.setPadding(0, dp(10), 0, 0);
        card2.addView(cbAudio);

        tvEstimate = text("", 12, 0xFF7DD3FC, false);
        tvEstimate.setPadding(0, dp(10), 0, 0);
        card2.addView(tvEstimate);

        root.addView(card2, wrap(dp(14)));

        // --- action card ---
        LinearLayout card3 = card();
        btnStart = button(getString(R.string.start));
        btnStart.setEnabled(false);
        btnStart.setOnClickListener(v -> startJob());
        card3.addView(btnStart);

        btnCancel = button(getString(R.string.cancel));
        btnCancel.setVisibility(View.GONE);
        btnCancel.setOnClickListener(v -> cancelJob());
        card3.addView(btnCancel);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(1000);
        progress.setPadding(0, dp(16), 0, dp(4));
        card3.addView(progress);

        tvPercent = text("0%", 12, 0xFF8FA0C4, false);
        card3.addView(tvPercent);

        tvStatus = text(getString(R.string.status_idle), 13, 0xFFCBD5E1, false);
        tvStatus.setPadding(0, dp(10), 0, 0);
        card3.addView(tvStatus);

        cardActions = new LinearLayout(this);
        ((LinearLayout) cardActions).setOrientation(LinearLayout.HORIZONTAL);
        cardActions.setVisibility(View.GONE);
        ((LinearLayout) cardActions).setPadding(0, dp(14), 0, 0);

        btnOpen = button(getString(R.string.open));
        btnOpen.setOnClickListener(v -> openLast());
        ((LinearLayout) cardActions).addView(btnOpen, weight());

        btnShare = button(getString(R.string.share));
        btnShare.setOnClickListener(v -> shareLast());
        ((LinearLayout) cardActions).addView(btnShare, weight());

        card3.addView(cardActions);
        root.addView(card3, wrap(dp(14)));

        TextView footer = text(getString(R.string.footer), 11, 0xFF526080, false);
        footer.setPadding(0, dp(20), 0, 0);
        footer.setGravity(android.view.Gravity.CENTER);
        root.addView(footer);

        return scroll;
    }

    private LinearLayout card() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(16), dp(16), dp(16), dp(16));
        android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
        bg.setColor(0xFF151C31);
        bg.setCornerRadius(dp(18));
        bg.setStroke(Math.max(1, dp(1)), 0xFF243050);
        l.setBackground(bg);
        return l;
    }

    private LinearLayout.LayoutParams wrap(int top) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = top;
        return lp;
    }

    private LinearLayout.LayoutParams weight() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.rightMargin = dp(6);
        return lp;
    }

    private TextView text(String s, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(null, android.graphics.Typeface.BOLD);
        return t;
    }

    private TextView caption(String s) {
        TextView t = text(s, 12, 0xFF8FA0C4, false);
        t.setPadding(0, dp(12), 0, dp(2));
        return t;
    }

    private Button button(String s) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(15);
        return b;
    }

    private Spinner spinner(String[] items) {
        Spinner s = new Spinner(this);
        ArrayAdapter<String> a = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_dropdown_item, items);
        s.setAdapter(a);
        return s;
    }

    private abstract static class SimpleItemSelected implements android.widget.AdapterView.OnItemSelectedListener {
        @Override public void onNothingSelected(android.widget.AdapterView<?> parent) { }
    }
}
