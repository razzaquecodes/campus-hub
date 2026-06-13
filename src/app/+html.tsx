import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA Manifest Integration - Using /app prefix for sub-path deployment */}
        <link rel="manifest" href="/app/manifest.json" />
        <meta name="theme-color" content="#0A0A0B" />

        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Campus Hub" />
        <link rel="apple-touch-icon" href="/app/apple-touch-icon.png" />

        <ScrollViewStyleReset />
        
        {/* Service Worker Registration for PWA */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/app/sw.js')
                  .then(function(registration) {
                    console.log('[SW] Registered with scope:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('[SW] Registration failed:', error);
                  });
              });
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}