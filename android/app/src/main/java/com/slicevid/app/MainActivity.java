package com.slicevid.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeDownloads.class);
        registerPlugin(DeviceDownloader.class);
        super.onCreate(savedInstanceState);
    }
}
