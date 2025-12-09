import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vanta.party',
  appName: 'Vanta Party',
  webDir: 'dist',
  server: {
    // For development, you can uncomment this to use your local dev server
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
