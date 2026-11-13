package com.videoupscaler.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;

/**
 * Video Upscaler — upscale 2×/3×/4× on-device, built for long movies too.
 */
public class MainActivity extends Activity {

    private static final int REQ_PICK = 1001;
    private static final int MAX_FREE_RATIO = 95; // percent of free space we allow

    // ---- views ----
    private TextView tvFileName, tvFileMeta, tvStatus, tvPercent, tvEta, tvEstimate, tvSharpenVal;
    private TextView btnPick, btnStart, btnCancel, btnOpen, btnShare;
    private ProgressBar progress;
    private SeekBar sbSharpen;
    private Spinner spCodec;
    private Ui.SwitchRow swAudio, swTrim;
    private LinearLayout chipRowScale, chipRowQuality, actionRow, pickRow, heroCard;
    private ImageView thumb;
    private View progressCard;

    private final Ui.Chip[] scaleChips = new Ui.Chip[3];
    private final Ui.Chip[] qualityChips = new Ui.Chip[3];
    private int scaleIndex = 0;
    private int qualityIndex = 1;

    // ---- state ----
    private Uri sourceUri;
    private String sourceName = "";
    private long sourceSize = 0;
    private int srcWidth = 0, srcHeight = 0;
    private long durationMs = 0;
    private int rotation = 0;
    private long fileSizeOnDisk = 0;

    private volatile VideoEngine engine;
    private Thread worker;
    private boolean running = false;
    private PowerManager.WakeLock wakeLock;
    private final Handler ui = new Handler(Looper.getMainLooper());

    private File lastOutput;
    private Uri lastPublished;

    // ------------------------------------------------------------ lifecycle --

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "VideoUpscaler:job");
        askNotificationPermission();
        handleIntent(getIntent());
        refreshEstimate();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) data = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (data != null) loadSource(data);
    }

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 42);
        }
    }

    // ----------------------------------------------------------------- UI ----

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setVerticalScrollBarEnabled(false);

        // glowing backdrop
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{Ui.BG_GLOW, Ui.BG, Ui.BG});
        scroll.setBackground(bg);

        LinearLayout root = Ui.column(this);
        root.setPadding(Ui.dp(this, 20), Ui.dp(this, 44), Ui.dp(this, 20), Ui.dp(this, 36));
        scroll.addView(root);

        root.addView(buildHeader());
        root.addView(buildHero(), Ui.lpMatch(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 22)));
        root.addView(buildSettings(), Ui.lpMatch(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 14)));
        root.addView(buildProgress(), Ui.lpMatch(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 14)));
        root.addView(buildFooter(), Ui.lpMatch(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 26)));
        return scroll;
    }

    private View buildHeader() {
        LinearLayout row = Ui.row(this);

        LinearLayout titles = Ui.column(this);
        TextView appName = Ui.text(this, getString(R.string.app_name), 25f, Ui.TEXT, true);
        titles.addView(appName);
        TextView tag = Ui.text(this, getString(R.string.tagline_short), 12.5f, Ui.TEXT_DIM, false);
        tag.setPadding(0, Ui.dp(this, 3), 0, 0);
        titles.addView(tag);
        row.addView(titles, new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        TextView badge = Ui.text(this, "v1.1", 11f, Ui.ACCENT, true);
        badge.setPadding(Ui.dp(this, 10), Ui.dp(this, 5), Ui.dp(this, 10), Ui.dp(this, 5));
        GradientDrawable pill = Ui.rounded(this, 0x1F4CC4FF, 30);
        pill.setStroke(Ui.dp(this, 1), 0x404CC4FF);
        badge.setBackground(pill);
        row.addView(badge);
        return row;
    }

    private View buildHero() {
        heroCard = Ui.column(this);
        heroCard.setBackground(Ui.card(this));
        heroCard.setPadding(Ui.dp(this, 18), Ui.dp(this, 18), Ui.dp(this, 18), Ui.dp(this, 18));

        LinearLayout top = Ui.row(this);

        // video thumbnail with a soft accent frame
        thumb = new ImageView(this);
        thumb.setScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable frame = Ui.rounded(this, Ui.SURFACE_HI, 14);
        thumb.setBackground(frame);
        thumb.setClipToOutline(true);
        LinearLayout.LayoutParams thumbLp = new LinearLayout.LayoutParams(Ui.dp(this, 82), Ui.dp(this, 82));
        thumbLp.rightMargin = Ui.dp(this, 14);
        top.addView(thumb, thumbLp);

        LinearLayout info = Ui.column(this);
        tvFileName = Ui.text(this, getString(R.string.no_video), 16f, Ui.TEXT, true);
        tvFileName.setSingleLine(true);
        tvFileName.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
        info.addView(tvFileName);

        tvFileMeta = Ui.text(this, getString(R.string.no_video_hint), 12f, Ui.TEXT_FAINT, false);
        tvFileMeta.setPadding(0, Ui.dp(this, 5), 0, 0);
        tvFileMeta.setLineSpacing(0f, 1.3f);
        info.addView(tvFileMeta);

        top.addView(info, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        heroCard.addView(top);

        pickRow = Ui.row(this);
        pickRow.setPadding(0, Ui.dp(this, 16), 0, 0);
        btnPick = Ui.secondaryButton(this, getString(R.string.pick_video));
        btnPick.setOnClickListener(v -> pickVideo());
        pickRow.addView(btnPick, new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        heroCard.addView(pickRow);

        return heroCard;
    }

    private View buildSettings() {
        LinearLayout card = Ui.column(this);
        card.setBackground(Ui.card(this));
        card.setPadding(Ui.dp(this, 18), Ui.dp(this, 18), Ui.dp(this, 18), Ui.dp(this, 8));

        // ---- scale ----
        card.addView(Ui.label(this, getString(R.string.scale)));
        chipRowScale = Ui.row(this);
        String[] scales = {getString(R.string.scale_2x), getString(R.string.scale_3x),
                getString(R.string.scale_4x)};
        for (int i = 0; i < scales.length; i++) {
            final int index = i;
            Ui.Chip chip = new Ui.Chip(this, scales[i]);
            chip.setOnClickListener(v -> {
                scaleIndex = index;
                syncChips();
                refreshEstimate();
            });
            scaleChips[i] = chip;
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0,
                    ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            if (i > 0) lp.leftMargin = Ui.dp(this, 8);
            chipRowScale.addView(chip, lp);
        }
        card.addView(chipRowScale);

        // ---- quality ----
        TextView qLabel = Ui.label(this, getString(R.string.quality));
        qLabel.setPadding(Ui.dp(this, 2), Ui.dp(this, 20), 0, Ui.dp(this, 8));
        card.addView(qLabel);

        chipRowQuality = Ui.row(this);
        String[] quality = {getString(R.string.q_draft), getString(R.string.q_balanced),
                getString(R.string.q_best)};
        for (int i = 0; i < quality.length; i++) {
            final int index = i;
            Ui.Chip chip = new Ui.Chip(this, quality[i]);
            chip.setOnClickListener(v -> {
                qualityIndex = index;
                syncChips();
                refreshEstimate();
            });
            qualityChips[i] = chip;
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0,
                    ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            if (i > 0) lp.leftMargin = Ui.dp(this, 8);
            chipRowQuality.addView(chip, lp);
        }
        card.addView(chipRowQuality);

        // ---- sharpening ----
        TextView shLabel = Ui.label(this, getString(R.string.sharpen_short));
        shLabel.setPadding(Ui.dp(this, 2), Ui.dp(this, 20), 0, Ui.dp(this, 10));
        card.addView(shLabel);

        tvSharpenVal = Ui.text(this, "45%", 13f, Ui.ACCENT, true);
        card.addView(tvSharpenVal);

        sbSharpen = new SeekBar(this);
        sbSharpen.setMax(100);
        sbSharpen.setProgress(45);
        sbSharpen.setPadding(0, Ui.dp(this, 6), 0, 0);
        sbSharpen.setProgressTintList(android.content.res.ColorStateList.valueOf(Ui.ACCENT));
        sbSharpen.setThumbTintList(android.content.res.ColorStateList.valueOf(Ui.ACCENT_3));
        sbSharpen.setProgressBackgroundTintList(
                android.content.res.ColorStateList.valueOf(0xFF25304A));
        sbSharpen.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int value, boolean fromUser) {
                tvSharpenVal.setText(value + "%");
            }
            @Override public void onStartTrackingTouch(SeekBar s) { }
            @Override public void onStopTrackingTouch(SeekBar s) { }
        });
        card.addView(sbSharpen);

        // ---- switches ----
        swAudio = new Ui.SwitchRow(this, getString(R.string.keep_audio_short),
                getString(R.string.keep_audio_hint), true);
        card.addView(swAudio);

        swTrim = new Ui.SwitchRow(this, getString(R.string.no_audio_output),
                getString(R.string.no_audio_output_hint), false);
        card.addView(swTrim);

        // ---- codec ----
        TextView cLabel = Ui.label(this, getString(R.string.codec));
        cLabel.setPadding(Ui.dp(this, 2), Ui.dp(this, 16), 0, Ui.dp(this, 6));
        card.addView(cLabel);

        spCodec = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_dropdown_item,
                new String[]{getString(R.string.codec_auto), "H.264 (AVC)", "H.265 (HEVC)"});
        spCodec.setAdapter(adapter);
        spCodec.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(android.widget.AdapterView<?> p, View v,
                                                 int position, long id) {
                refreshEstimate();
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> p) { }
        });
        card.addView(spCodec);

        // ---- estimate ----
        tvEstimate = Ui.text(this, "", 12.5f, Ui.ACCENT_3, false);
        tvEstimate.setPadding(0, Ui.dp(this, 14), 0, Ui.dp(this, 10));
        card.addView(tvEstimate);

        return card;
    }

    private View buildProgress() {
        LinearLayout card = Ui.column(this);
        card.setBackground(Ui.card(this));
        card.setPadding(Ui.dp(this, 18), Ui.dp(this, 18), Ui.dp(this, 18), Ui.dp(this, 18));
        progressCard = card;

        btnStart = Ui.primaryButton(this, getString(R.string.start));
        btnStart.setEnabled(false);
        Ui.disable(btnStart, true);
        btnStart.setOnClickListener(v -> startJob());
        card.addView(btnStart);

        // progress block (hidden until a job runs)
        LinearLayout runningBox = Ui.column(this);
        runningBox.setId(android.R.id.widget_frame);
        card.addView(runningBox);

        LinearLayout pctRow = Ui.row(this);
        pctRow.setPadding(0, Ui.dp(this, 18), 0, Ui.dp(this, 4));
        tvPercent = Ui.text(this, "0%", 22f, Ui.TEXT, true);
        pctRow.addView(tvPercent, new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        tvEta = Ui.text(this, "", 12f, Ui.TEXT_FAINT, false);
        pctRow.addView(tvEta);
        runningBox.addView(pctRow);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(1000);
        progress.setPadding(0, Ui.dp(this, 4), 0, 0);
        Ui.tintProgress(progress, Ui.ACCENT);
        runningBox.addView(progress);

        tvStatus = Ui.text(this, getString(R.string.status_idle), 12.5f, Ui.TEXT_DIM, false);
        tvStatus.setPadding(0, Ui.dp(this, 10), 0, 0);
        tvStatus.setLineSpacing(0f, 1.3f);
        runningBox.addView(tvStatus);

        btnCancel = Ui.secondaryButton(this, getString(R.string.cancel));
        btnCancel.setVisibility(View.GONE);
        btnCancel.setOnClickListener(v -> cancelJob());
        LinearLayout.LayoutParams cancelLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        cancelLp.topMargin = Ui.dp(this, 12);
        runningBox.addView(btnCancel, cancelLp);

        actionRow = Ui.row(this);
        actionRow.setVisibility(View.GONE);
        actionRow.setPadding(0, Ui.dp(this, 16), 0, 0);
        btnOpen = Ui.secondaryButton(this, getString(R.string.open));
        btnOpen.setOnClickListener(v -> openLast());
        LinearLayout.LayoutParams openLp = new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        openLp.rightMargin = Ui.dp(this, 8);
        actionRow.addView(btnOpen, openLp);
        btnShare = Ui.secondaryButton(this, getString(R.string.share));
        btnShare.setOnClickListener(v -> shareLast());
        actionRow.addView(btnShare, new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        card.addView(actionRow);

        return card;
    }

    private View buildFooter() {
        LinearLayout col = Ui.column(this);
        col.setGravity(Gravity.CENTER_HORIZONTAL);
        TextView line = Ui.text(this, getString(R.string.footer), 11f, Ui.TEXT_FAINT, false);
        line.setGravity(Gravity.CENTER);
        col.addView(line);
        return col;
    }

    private void syncChips() {
        for (int i = 0; i < scaleChips.length; i++) {
            if (scaleChips[i] != null) scaleChips[i].style(this, i == scaleIndex);
        }
        for (int i = 0; i < qualityChips.length; i++) {
            if (qualityChips[i] != null) qualityChips[i].style(this, i == qualityIndex);
        }
    }

    // ------------------------------------------------------------ picking ----

    private void pickVideo() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("video/*");
        // Extra MIME hints help some pickers show every video container.
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                "video/*", "application/mp4", "application/octet-stream"});
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivityForResult(i, REQ_PICK);
        } catch (Exception e) {
            // Fall back to the gallery style picker on very old devices.
            try {
                Intent alt = new Intent(Intent.ACTION_GET_CONTENT);
                alt.setType("video/*");
                startActivityForResult(alt, REQ_PICK);
            } catch (Exception e2) {
                toast(getString(R.string.err_no_picker));
            }
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
            getContentResolver().takePersistableUriPermission(uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) { }

        sourceUri = uri;
        sourceName = queryName(uri);
        sourceSize = querySize(uri);
        fileSizeOnDisk = 0;

        MediaMetadataRetriever r = new MediaMetadataRetriever();
        try {
            r.setDataSource(this, uri);
            srcWidth = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH));
            srcHeight = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT));
            durationMs = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));
            rotation = parseInt(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION));
            if (rotation == 90 || rotation == 270) {
                int t = srcWidth;
                srcWidth = srcHeight;
                srcHeight = t;
            }
            // Thumbnail from the middle of the clip looks better than frame 0.
            try {
                android.graphics.Bitmap bmp = r.getFrameAtTime(
                        Math.max(0, durationMs / 3) * 1000L,
                        MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
                if (bmp != null) thumb.setImageBitmap(bmp);
            } catch (Exception ignored) { }
        } catch (Exception e) {
            toast(getString(R.string.err_read, String.valueOf(e.getMessage())));
        } finally {
            try { r.release(); } catch (Exception ignored) { }
        }

        tvFileName.setText(sourceName.isEmpty() ? getString(R.string.untitled) : sourceName);
        tvFileMeta.setText(buildMetaLine());
        btnStart.setEnabled(true);
        Ui.disable(btnStart, false);
        actionRow.setVisibility(View.GONE);
        refreshEstimate();
        setStatus(getString(R.string.status_ready));
    }

    private String buildMetaLine() {
        StringBuilder sb = new StringBuilder();
        if (srcWidth > 0) sb.append(srcWidth).append(" × ").append(srcHeight);
        if (durationMs > 0) {
            if (sb.length() > 0) sb.append("   ·   ");
            sb.append(fmtDuration(durationMs));
        }
        if (sourceSize > 0) {
            if (sb.length() > 0) sb.append("\n");
            sb.append(fmtSize(sourceSize));
        }
        return sb.toString();
    }

    /** Live estimate of the output resolution, size and feasibility. */
    private void refreshEstimate() {
        syncChips();
        if (sourceUri == null || srcWidth <= 0) {
            tvEstimate.setText("");
            return;
        }
        int[] max = VideoEngine.maxEncodeSize(spCodec == null ? 0 : spCodec.getSelectedItemPosition());
        int scale = scaleIndex + 1; // 2x, 3x, 4x
        int w = even(srcWidth * scale);
        int h = even(srcHeight * scale);
        boolean fits = w <= max[0] && h <= max[1];

        while (!fits && scale > 1) {
            scale--;
            w = even(srcWidth * scale);
            h = even(srcHeight * scale);
            fits = w <= max[0] && h <= max[1];
        }

        String text = getString(R.string.output_size, w + " × " + h);
        if (sourceSize > 0 && durationMs > 0) {
            // Rough output-size estimate from the chosen bitrate profile.
            float fps = 30f;
            int bitrate = VideoEngine.bitrateFor(w, h, (int) fps, qualityIndex);
            long bytes = (long) bitrate / 8 * (durationMs / 1000);
            text += "   ·   ≈ " + fmtSize(bytes);
        }
        if (scale < scaleIndex + 1) {
            text += "\n" + getString(R.string.scale_limited, max[0] + "×" + max[1]);
        }
        long free = freeSpace();
        if (free > 0) {
            int bitrate = VideoEngine.bitrateFor(w, h, 30, qualityIndex);
            long needed = (long) bitrate / 8 * Math.max(1, durationMs / 1000) * 105 / 100;
            if (needed > free) {
                text += "\n" + getString(R.string.not_enough_space, fmtSize(needed), fmtSize(free));
            }
        }
        tvEstimate.setText(text);
    }

    // ------------------------------------------------------------- the job ---

    private void startJob() {
        if (running || sourceUri == null) return;

        final VideoEngine.Config cfg = new VideoEngine.Config();
        cfg.scale = scaleIndex + 1;
        cfg.quality = qualityIndex;
        cfg.sharpen = sbSharpen.getProgress();
        cfg.codec = spCodec.getSelectedItemPosition();
        cfg.copyAudio = swAudio.isChecked() && !swTrim.isChecked();
        cfg.rotationDegrees = rotation;
        final Uri src = sourceUri;

        purgeTempFiles();

        running = true;
        Ui.disable(btnStart, true);
        Ui.disable(btnPick, true);
        btnCancel.setVisibility(View.VISIBLE);
        Ui.disable(btnCancel, false);
        actionRow.setVisibility(View.GONE);
        progress.setProgress(0);
        tvPercent.setText("0%");
        tvEta.setText("");
        setStatus(getString(R.string.status_preparing));
        if (wakeLock != null) wakeLock.acquire(6 * 60 * 60 * 1000L);

        worker = new Thread(() -> runJob(src, cfg), "upscale-job");
        worker.start();
    }

    private void cancelJob() {
        VideoEngine e = engine;
        if (e != null) e.requestCancel();
        Ui.disable(btnCancel, true);
        setStatus(getString(R.string.status_cancelling));
    }

    private void runJob(Uri src, VideoEngine.Config cfg) {
        File local = null;
        try {
            setProgress(0.005f, getString(R.string.status_copying), -1);
            local = copyToCache(src);
            fileSizeOnDisk = local.length();
            setProgress(0.03f, getString(R.string.status_analysing), -1);
            transcodeAndPublish(local, cfg);
        } catch (VideoEngine.CancelledException ce) {
            setStatus(getString(R.string.status_cancelled));
            ui.post(() -> actionRow.setVisibility(View.GONE));
        } catch (Throwable t) {
            Log.e("MainActivity", "job failed", t);
            fail(t);
        } finally {
            if (local != null) //noinspection ResultOfMethodCallIgnored
                local.delete();
            engine = null;
            ui.post(this::resetButtons);
        }
    }

    private void fail(Throwable t) {
        final String msg = t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage();
        setStatus(getString(R.string.status_failed, msg));
        ui.post(() -> {
            if (isFinishing()) return;
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle(R.string.status_failed_title)
                    .setMessage(msg + "\n\n" + getString(R.string.failure_hint))
                    .setPositiveButton(android.R.string.ok, null)
                    .show();
        });
    }

    private void transcodeAndPublish(File input, VideoEngine.Config cfg) throws Exception {
        long t0 = System.currentTimeMillis();
        long durationUs = Math.max(1, durationMs * 1000L);

        // Create the destination first so we can stream straight into it: a
        // 2-hour movie never needs a second full-size temp file.
        Destination dest = openDestination();
        if (dest == null) throw new Exception(getString(R.string.err_no_space));
        File written = dest.file;
        try {
            VideoEngine eng = new VideoEngine(new VideoEngine.Callback() {
                @Override public void onProgress(float fraction, String detail, long etaMs) {
                    setProgress(0.03f + fraction * 0.94f, detail, etaMs);
                }
            });
            engine = eng;

            VideoEngine.Result result = eng.transcode(input.getAbsolutePath(),
                    written.getAbsolutePath(), dest.pfd, cfg);

            if (dest.pfd != null) {
                try { dest.pfd.close(); } catch (Exception ignored) { }
                dest.pfd = null;
            }
            setProgress(0.985f, getString(R.string.status_finalising), -1);
            Uri published = dest.publish(written, sourceName, result.outputWidth, result.outputHeight);
            lastOutput = written;
            lastPublished = published;

            final String done = getString(R.string.status_done,
                    result.outputWidth, result.outputHeight,
                    String.format(Locale.US, "%.0f", (System.currentTimeMillis() - t0) / 1000.0));
            final boolean reduced = result.scaleReduced;
            ui.post(() -> {
                tvStatus.setText(done);
                if (reduced) {
                    tvStatus.setText(done + "\n"
                            + getString(R.string.scale_limited, result.outputWidth + "×" + result.outputHeight));
                }
                progress.setProgress(1000);
                tvPercent.setText("100%");
                tvEta.setText("");
                actionRow.setVisibility(View.VISIBLE);
                btnOpen.setEnabled(lastPublished != null || lastOutput != null);
                btnShare.setEnabled(lastPublished != null || lastOutput != null);
            });
        } catch (Throwable e) {
            if (dest.pfd != null) {
                try { dest.pfd.close(); } catch (Exception ignored) { }
                dest.pfd = null;
            }
            dest.abort();
            throw e;
        }
    }

    private void resetButtons() {
        running = false;
        Ui.disable(btnStart, sourceUri == null);
        Ui.disable(btnPick, false);
        btnCancel.setVisibility(View.GONE);
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
    }

    // --------------------------------------------------------- destinations --

    /**
     * A place to write the result: either MediaStore (Android 10+, streamed
     * through a descriptor) or a real file in Movies for older versions.
     */
    private final class Destination {
        File file;
        ParcelFileDescriptor pfd;
        Uri pendingUri;

        Uri publish(File written, String originalName, int w, int h) {
            if (pendingUri == null) return Uri.fromFile(written);
            ContentValues done = new ContentValues();
            done.put(MediaStore.Video.Media.IS_PENDING, 0);
            getContentResolver().update(pendingUri, done, null, null);
            return pendingUri;
        }

        void abort() {
            if (pendingUri != null) {
                try { getContentResolver().delete(pendingUri, null, null); } catch (Exception ignored) { }
            } else if (file != null && file.exists()) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
        }
    }

    private Destination openDestination() throws Exception {
        String base = sourceName == null || sourceName.isEmpty() ? "video" : sourceName;
        int dot = base.lastIndexOf('.');
        if (dot > 0) base = base.substring(0, dot);
        String name = base + "_upscaled.mp4";

        Destination d = new Destination();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.Video.Media.DISPLAY_NAME, name);
            v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
            v.put(MediaStore.Video.Media.RELATIVE_PATH,
                    Environment.DIRECTORY_MOVIES + "/Video Upscaler");
            v.put(MediaStore.Video.Media.IS_PENDING, 1);
            Uri item = getContentResolver().insert(
                    MediaStore.Video.Media.EXTERNAL_CONTENT_URI, v);
            if (item == null) return null;
            d.pendingUri = item;
            d.pfd = getContentResolver().openFileDescriptor(item, "rw");
            // MediaMuxer streams into the descriptor on API 26+, so no temp file
            // is needed; on older devices we still fall back to one.
            d.file = new File(getCacheDir(), "stream_" + System.currentTimeMillis() + ".mp4");
            return d;
        }

        File dir = new File(Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_MOVIES), "Video Upscaler");
        if (!dir.exists() && !dir.mkdirs()) return null;
        d.file = uniqueFile(dir, name);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Streaming to a descriptor is only possible with a real file.
            d.pfd = ParcelFileDescriptor.open(d.file,
                    ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_READ_WRITE
                            | ParcelFileDescriptor.MODE_TRUNCATE);
        }
        return d;
    }

    private static File uniqueFile(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        int dot = name.lastIndexOf('.');
        String stem = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 2; i < 1000; i++) {
            f = new File(dir, stem + "_" + i + ext);
            if (!f.exists()) return f;
        }
        return new File(dir, System.currentTimeMillis() + ext);
    }

    // ------------------------------------------------------------- file i/o ---

    private File copyToCache(Uri uri) throws Exception {
        File target = new File(getCacheDir(), "input_" + System.currentTimeMillis() + ".mp4");
        InputStream in = getContentResolver().openInputStream(uri);
        if (in == null) throw new Exception(getString(R.string.err_open));
        long total = sourceSize > 0 ? sourceSize : 0;
        long copied = 0;
        long free = freeSpace();
        try (OutputStream out = new FileOutputStream(target)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                copied += n;
                if (!running) throw new VideoEngine.CancelledException();
                if (total > 0) {
                    setProgress(0.005f + Math.min(0.025f, copied / (float) total * 0.025f),
                            getString(R.string.status_copying), -1);
                }
                if (free > 0 && copied > free * MAX_FREE_RATIO / 100) {
                    throw new Exception(getString(R.string.err_no_space));
                }
            }
        } finally {
            try { in.close(); } catch (Exception ignored) { }
        }
        if (copied < 1024) throw new Exception(getString(R.string.err_empty_file));
        return target;
    }

    private long freeSpace() {
        try {
            return getCacheDir().getUsableSpace();
        } catch (Exception e) {
            return 0;
        }
    }

    private void purgeTempFiles() {
        File[] files = getCacheDir().listFiles();
        if (files == null) return;
        for (File f : files) {
            String n = f.getName();
            if (n.startsWith("out_") || n.startsWith("input_") || n.startsWith("stream_")) {
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }
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

    private Uri shareableUri() {
        if (lastPublished != null) return lastPublished;
        if (lastOutput == null || !lastOutput.exists()) return null;
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

    private static void copyFile(File from, File to) throws Exception {
        try (InputStream in = new FileInputStream(from);
             OutputStream out = new FileOutputStream(to)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
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

    private static int parseInt(String s) {
        if (s == null) return 0;
        try { return Integer.parseInt(s); } catch (Exception e) { return 0; }
    }

    private static int even(int v) {
        return (v / 2) * 2;
    }

    private static String fmtDuration(long ms) {
        long s = ms / 1000;
        long h = s / 3600;
        long m = (s % 3600) / 60;
        long sec = s % 60;
        return h > 0 ? String.format(Locale.US, "%d:%02d:%02d", h, m, sec)
                : String.format(Locale.US, "%d:%02d", m, sec);
    }

    private static String fmtSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.US, "%.0f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format(Locale.US, "%.1f MB", bytes / 1048576.0);
        return String.format(Locale.US, "%.2f GB", bytes / 1073741824.0);
    }

    // ------------------------------------------------------------------- ui ---

    private void setStatus(String s) {
        ui.post(() -> tvStatus.setText(s));
    }

    private void setProgress(float fraction, String detail, long etaMs) {
        ui.post(() -> {
            progress.setProgress(Math.round(fraction * 1000));
            tvPercent.setText(Math.round(fraction * 100) + "%");
            if (detail != null && !detail.isEmpty()) tvStatus.setText(detail);
            if (etaMs > 0) {
                tvEta.setText(getString(R.string.eta, fmtDuration(etaMs)));
            } else {
                tvEta.setText("");
            }
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
}
