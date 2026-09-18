import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.webguruji.chatbase',
  appName: 'ChatBase',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
