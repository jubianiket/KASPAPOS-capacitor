
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.kaspapos',
  appName: 'Kaspa POS',
  webDir: 'out',
  plugins: {
    Share: {
      // Share plugin configuration
    },
    CapacitorMusicControls: {
        // Music controls configuration (optional)
    }
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    // iOS specific configuration
  }
};

export default config;
