import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* PWA & Apple iOS Metadata */}
        <meta name="application-name" content="Campus Hub" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Campus Hub" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />

        {/* Icons (Ensure you place your 512x512 logo named apple-touch-icon.png in the /public folder) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Open Graph SEO */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Campus Hub" />
        <meta property="og:description" content="One platform for students." />
        <meta property="og:site_name" content="Campus Hub" />

        <title>Campus Hub</title>
        
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}