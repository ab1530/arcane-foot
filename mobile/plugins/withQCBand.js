const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'withQCBand';
const FRAMEWORK_RELATIVE_PATH = 'vendor/qcband/QCBandSDK.framework';
const SOURCE_FILES = [
  { path: 'native/ios/QCBandModule.m', dest: 'mobile/QCBandModule.m', addToProject: true },
  { path: 'native/ios/QCBandModule.h', dest: 'mobile/QCBandModule.h', addToProject: false },
];

const quoteIfNeeded = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed;
  }
  return `"${trimmed}"`;
};

function ensureFrameworkExists(projectRoot) {
  const frameworkPath = path.join(projectRoot, FRAMEWORK_RELATIVE_PATH);
  if (!fs.existsSync(frameworkPath)) {
    throw new Error(
      `[${PLUGIN_NAME}] QCBandSDK.framework not found at ${frameworkPath}. Please place the vendor framework under mobile/vendor/qcband/QCBandSDK.framework.`,
    );
  }
  return frameworkPath;
}

function withQCBand(config) {
  config.ios = config.ios || {};
  config.ios.infoPlist = config.ios.infoPlist || {};
  config.ios.infoPlist.NSBluetoothAlwaysUsageDescription =
    config.ios.infoPlist.NSBluetoothAlwaysUsageDescription ||
    'Arcane utilise le Bluetooth pour se connecter à votre bague/bracelet QC.';
  config.ios.infoPlist.NSBluetoothPeripheralUsageDescription =
    config.ios.infoPlist.NSBluetoothPeripheralUsageDescription ||
    'Arcane utilise le Bluetooth pour synchroniser vos données QC.';

  config = withXcodeProject(config, (cfg) => {
    const projectRoot = cfg.modRequest.projectRoot;
    ensureFrameworkExists(projectRoot);
    const project = cfg.modResults;
    const iosRoot = path.join(projectRoot, 'ios');
    const frameworkPath = path.relative(iosRoot, path.join(projectRoot, FRAMEWORK_RELATIVE_PATH));
    // Add framework (embed & sign)
    if (!project.hasFile(frameworkPath)) {
      project.addFramework(frameworkPath, { customFramework: true, link: true, embed: true, sign: true });
    }

    // OTHER_LDFLAGS add -ObjC
    const configurations = project.pbxXCBuildConfigurationSection();
    Object.keys(configurations || {})
      .filter((key) => typeof configurations[key] === 'object')
      .forEach((key) => {
        const buildSettings = configurations[key].buildSettings;
        if (!buildSettings) return;
        // Linker flag
        const desiredFlags = ['$(inherited)', '-ObjC', '-lc++'];
        buildSettings.OTHER_LDFLAGS = desiredFlags.map(quoteIfNeeded);
        // Framework search path (force clean list to avoid malformed entries)
        const desiredFrameworkPaths = ['$(inherited)', '$(PROJECT_DIR)/../vendor/qcband'];
        buildSettings.FRAMEWORK_SEARCH_PATHS = desiredFrameworkPaths.map(quoteIfNeeded);
        // Header search paths so __has_include finds QCBandSDK headers
        const desiredHeaderPaths = ['$(inherited)', '$(PROJECT_DIR)/../vendor/qcband/**'];
        buildSettings.HEADER_SEARCH_PATHS = desiredHeaderPaths.map(quoteIfNeeded);
      });

    // Add native module source files to the Xcode project
    const target = project.getFirstTarget();
    if (!target || !target.uuid) {
      throw new Error(`[${PLUGIN_NAME}] Unable to locate iOS target in Xcode project`);
    }

    const sourcesGroup =
      project.findPBXGroupKey({ name: 'mobile' }) ||
      project.findPBXGroupKey({ name: 'Sources' }) ||
      project.pbxGroupByName('mobile') ||
      project.getFirstProject().firstProject.mainGroup;

    SOURCE_FILES.forEach((file) => {
      const srcPath = path.join(projectRoot, file.path);
      if (!fs.existsSync(srcPath)) {
        throw new Error(`[${PLUGIN_NAME}] Source file missing: ${srcPath}`);
      }
      const destPath = path.join(iosRoot, file.dest);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      const projRelative = path.relative(iosRoot, destPath);
      if (project.hasFile(projRelative)) return;
      if (!file.addToProject) return;
      if (projRelative.endsWith('.m')) {
        project.addSourceFile(projRelative, { target: target.uuid }, sourcesGroup || undefined);
      }
      // Header is copied for includes; not added to project to avoid path null errors.
    });

    return cfg;
  });

  // Ensure framework exists (fail early during config phase)
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      ensureFrameworkExists(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);

  return config;
}

module.exports = withQCBand;
