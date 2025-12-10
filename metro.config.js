const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add 'db' to the list of asset extensions
config.resolver.assetExts.push('db');

// 1. Add 'wasm' to sourceExts so imports like "import ... from './file.wasm'" work
config.resolver.sourceExts.push('wasm');

// 2. Add 'wasm' to assetExts so the file is included in the bundle
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './global.css' });
