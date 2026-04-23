import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lasafinancial.app',
  appName: 'LASA FINANCIAL',
  webDir: 'dist',
  server: {
    // This allows the app to load your local dev server for live changes
    url: 'http://10.209.18.1:8080',
    cleartext: true
  }
};

export default config;
