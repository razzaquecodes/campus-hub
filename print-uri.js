const { makeRedirectUri } = require('expo-auth-session');
console.log('Web:', makeRedirectUri({ path: 'oauth-callback' }));
console.log('Native:', makeRedirectUri({ native: 'campushub://oauth-callback', scheme: 'campushub', path: 'oauth-callback' }));
