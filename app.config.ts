import type { ConfigContext, ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID = '784cbc6f-57a3-4b12-b890-f4f7556f5cf5';
const SCHEME = 'campushub';
const BUNDLE_IDENTIFIER = 'in.edu.bbit.campushub';
const ANDROID_PACKAGE = 'in.edu.bbit.campushub';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  return {
    ...config,
    name: 'CampusHub',
    slug: 'campus-hub',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: SCHEME,
    userInterfaceStyle: 'dark',
    platforms: ['ios', 'android', 'web'],
    ios: {
      ...config.ios,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      buildNumber: '1',
      supportsTablet: false,
      icon: './assets/images/icon.png',
      infoPlist: {
        ...config.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      package: ANDROID_PACKAGE,
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#020617',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      ...config.web,
      output: 'static',
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-router',
        {
          root: './src/app',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0A0A0B',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
          dark: {
            backgroundColor: '#0A0A0B',
            image: './assets/images/splash-icon.png',
          },
          android: {
            image: './assets/images/splash-icon.png',
            imageWidth: 76,
          },
        },
      ],
      'expo-font',
      'expo-web-browser',
      'expo-secure-store',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      router: {
        root: './src/app',
      },
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_MAKAUT_API_URL: process.env.EXPO_PUBLIC_MAKAUT_API_URL,
      oauthScheme: SCHEME,
    },
  };
}
