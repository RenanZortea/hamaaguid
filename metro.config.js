const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add 'db' to the list of asset extensions
config.resolver.assetExts.push('db');

// 1. Add 'data' to assetExts so search-index.data is bundled as a raw asset
config.resolver.assetExts.push('data');

// 2. Add 'wasm' setup (keep existing)
config.resolver.sourceExts.push('wasm');
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './global.css' });
