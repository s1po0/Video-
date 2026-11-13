package com.videoupscaler.app;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.content.res.ColorStateList;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;

/**
 * Small styling toolkit so the whole UI stays consistent without any
 * external library: colours, rounded cards, pills, chips and switches.
 */
final class Ui {

    // ---- palette (deep indigo night with an aurora accent) ----
    static final int BG = 0xFF080B14;
    static final int BG_GLOW = 0xFF13203C;
    static final int SURFACE = 0xFF121828;
    static final int SURFACE_HI = 0xFF1A2338;
    static final int STROKE = 0xFF25304A;
    static final int TEXT = 0xFFF1F5FE;
    static final int TEXT_DIM = 0xFF9AA9C7;
    static final int TEXT_FAINT = 0xFF64749A;
    static final int ACCENT = 0xFF4CC4FF;
    static final int ACCENT_2 = 0xFF9B7BFF;
    static final int ACCENT_3 = 0xFF3BE8B0;
    static final int DANGER = 0xFFFF6B81;

    private Ui() { }

    // ------------------------------------------------------------ helpers ----

    static int dp(Context c, float v) {
        return Math.round(v * c.getResources().getDisplayMetrics().density);
    }

    static GradientDrawable rounded(Context c, int color, float radiusDp) {
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.RECTANGLE);
        g.setColor(color);
        g.setCornerRadius(dp(c, radiusDp));
        return g;
    }

    static GradientDrawable gradient(Context c, int from, int to, float radiusDp) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                new int[]{from, to});
        g.setCornerRadius(dp(c, radiusDp));
        return g;
    }

    static GradientDrawable card(Context c) {
        GradientDrawable g = rounded(c, SURFACE, 22);
        g.setStroke(Math.max(1, dp(c, 1)), STROKE);
        return g;
    }

    static RippleDrawable ripple(Context c, GradientDrawable base) {
        return new RippleDrawable(ColorStateList.valueOf(0x33FFFFFF), base, null);
    }

    static TextView text(Context c, CharSequence s, float sp, int color, boolean bold) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        t.setLineSpacing(0f, 1.15f);
        return t;
    }

    static TextView label(Context c, CharSequence s) {
        TextView t = text(c, s, 11.5f, TEXT_FAINT, true);
        t.setAllCaps(true);
        t.setLetterSpacing(0.12f);
        t.setPadding(dp(c, 2), 0, 0, dp(c, 8));
        return t;
    }

    static LinearLayout column(Context c) {
        LinearLayout l = new LinearLayout(c);
        l.setOrientation(LinearLayout.VERTICAL);
        return l;
    }

    static LinearLayout row(Context c) {
        LinearLayout l = new LinearLayout(c);
        l.setOrientation(LinearLayout.HORIZONTAL);
        l.setGravity(Gravity.CENTER_VERTICAL);
        return l;
    }

    static LinearLayout.LayoutParams lp(int w, int h) {
        return new LinearLayout.LayoutParams(w, h);
    }

    static LinearLayout.LayoutParams lpMatch(int w, int h, int topMarginPx) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(w, h);
        p.topMargin = topMarginPx;
        return p;
    }

    // ------------------------------------------------------------- widgets ---

    /** Big gradient call-to-action button. */
    static TextView primaryButton(Context c, CharSequence label) {
        TextView b = text(c, label, 16.5f, 0xFF06131F, true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(0, dp(c, 17), 0, dp(c, 17));
        b.setBackground(ripple(c, gradient(c, ACCENT, ACCENT_2, 18)));
        b.setClickable(true);
        b.setFocusable(true);
        return b;
    }

    /** Quiet outlined button. */
    static TextView secondaryButton(Context c, CharSequence label) {
        TextView b = text(c, label, 15f, TEXT, true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(0, dp(c, 14), 0, dp(c, 14));
        GradientDrawable bg = rounded(c, SURFACE_HI, 16);
        bg.setStroke(Math.max(1, dp(c, 1)), STROKE);
        b.setBackground(ripple(c, bg));
        b.setClickable(true);
        b.setFocusable(true);
        return b;
    }

    /** Selectable pill used for the scale / quality choices. */
    static final class Chip extends TextView {
        Chip(Context c, CharSequence label) {
            super(c);
            setText(label);
            setTextSize(14f);
            setGravity(Gravity.CENTER);
            setPadding(dp(c, 14), dp(c, 12), dp(c, 14), dp(c, 12));
            setClickable(true);
            setFocusable(true);
            style(c, false);
        }

        void style(Context c, boolean selected) {
            if (selected) {
                setTextColor(0xFF06131F);
                setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
                setBackground(ripple(c, gradient(c, ACCENT, ACCENT_3, 14)));
            } else {
                setTextColor(TEXT_DIM);
                setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
                GradientDrawable bg = rounded(c, SURFACE_HI, 14);
                bg.setStroke(Math.max(1, dp(c, 1)), STROKE);
                setBackground(ripple(c, bg));
            }
        }
    }

    /** A tidy switch row: title, optional caption, and the switch on the end. */
    static final class SwitchRow extends LinearLayout {
        final Switch toggle;

        SwitchRow(Context c, CharSequence title, CharSequence caption, boolean checked) {
            super(c);
            setOrientation(HORIZONTAL);
            setGravity(Gravity.CENTER_VERTICAL);
            setPadding(0, dp(c, 10), 0, dp(c, 10));
            setClickable(true);

            LinearLayout col = column(c);
            col.addView(text(c, title, 14.5f, TEXT, false));
            if (caption != null && caption.length() > 0) {
                TextView cap = text(c, caption, 11.5f, TEXT_FAINT, false);
                cap.setPadding(0, dp(c, 2), 0, 0);
                col.addView(cap);
            }
            LayoutParams colLp = new LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            addView(col, colLp);

            toggle = new Switch(c);
            toggle.setChecked(checked);
            toggle.setShowText(false);
            toggle.setThumbTintList(ColorStateList.valueOf(0xFFFFFFFF));
            toggle.setTrackTintList(new ColorStateList(
                    new int[][]{
                            new int[]{android.R.attr.state_checked},
                            new int[]{}
                    },
                    new int[]{ACCENT, 0xFF2B3654}));
            addView(toggle);

            setOnClickListener(v -> toggle.setChecked(!toggle.isChecked()));
        }

        boolean isChecked() {
            return toggle.isChecked();
        }
    }

    /** Label + gradient value pair used by the sliders. */
    static LinearLayout sliderHeader(Context c, CharSequence title, TextView valueView) {
        LinearLayout r = row(c);
        TextView t = text(c, title, 14.5f, TEXT, false);
        r.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        r.addView(valueView);
        return r;
    }

    /** Flat, quiet progress bar styling applied in code (keeps the SDK-only build). */
    static void tintProgress(android.widget.ProgressBar bar, int color) {
        bar.setProgressTintList(ColorStateList.valueOf(color));
        bar.setProgressBackgroundTintList(ColorStateList.valueOf(0xFF202B44));
    }

    static void disable(View v, boolean disabled) {
        v.setEnabled(!disabled);
        v.setAlpha(disabled ? 0.45f : 1f);
    }

    static void bindSwitchTo(CompoundButton b, Runnable r) {
        b.setOnCheckedChangeListener((v, checked) -> r.run());
    }
}
