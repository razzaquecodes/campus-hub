const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force Metro to resolve CommonJS versions of packages that use import.meta in their ESM builds
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'zustand' ||
    moduleName.startsWith('zustand/') ||
    moduleName === '@tanstack/react-query-devtools' ||
    moduleName.startsWith('@tanstack/react-query-devtools/')
  ) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;