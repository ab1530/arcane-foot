const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '..')];
config.resolver = {
  ...(config.resolver || {}),
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    design: path.resolve(__dirname, '../design'),
    '@shared': path.resolve(__dirname, '../shared'),
  },
};

module.exports = config;
