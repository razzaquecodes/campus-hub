import type { ConfigContext, ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID = '784cbc6f-57a3-4b12-b890-f4f7556f5cf5';
const SCHEME = 'campushub';
const BUNDLE_IDENTIFIER = 'in.edu.bbit.campushub';
const ANDROID_PACKAGE = 'in.edu.bbit.campushub';

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  return {
    ...config,
    name: 'Campus Hub',
    slug: 'campus-hub',
    version: '1.0.3',
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
      buildNumber: '3',
      supportsTablet: false,
      icon: './assets/images/icon.png',
      infoPlist: {
        ...config.ios?.infoPlist,
        CFBundleDisplayName: 'Campus Hub',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          ...(Array.isArray(config.ios?.infoPlist?.CFBundleURLTypes)
            ? config.ios?.infoPlist?.CFBundleURLTypes
            : []),
          {
            CFBundleURLSchemes: [SCHEME],
          },
        ],
      },
    },
    android: {
      ...config.android,
      package: ANDROID_PACKAGE,
      versionCode: 4,
      adaptiveIcon: {
        backgroundColor: '#020617',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
              scheme: SCHEME,
              host: '*',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      predictiveBackGestureEnabled: false,
    },
    web: {
      ...config.web,
      name: 'Campus Hub',
      shortName: 'Campus Hub',
      display: 'standalone',
      backgroundColor: '#0A0A0B',
      themeColor: '#0A0A0B',
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
        'expo-camera',
        {
          cameraPermission: 'Campus Hub needs camera access for live attendance verification.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Campus Hub uses your location to verify classroom attendance.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#6366F1',
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
    extra: (() => {
      const env = (globalThis as any).process?.env ?? {};
      return {
        ...config.extra,
        router: {
          root: './src/app',
        },
        eas: {
          projectId: EAS_PROJECT_ID,
        },
        EXPO_PUBLIC_SUPABASE_URL: env.EXPO_PUBLIC_SUPABASE_URL,
        EXPO_PUBLIC_SUPABASE_ANON_KEY: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        EXPO_PUBLIC_MAKAUT_API_URL: env.EXPO_PUBLIC_MAKAUT_API_URL,
        EXPO_PUBLIC_API_URL: env.EXPO_PUBLIC_API_URL,
        oauthScheme: SCHEME,
      };
    })(),
  };
}
