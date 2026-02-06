const fs = require('fs');
const path = require('path');
const Module = require('module');
const glob = require('glob');
const babel = require('@babel/core');
const expoPreset = require('babel-preset-expo');

const registerExtension = (ext) => {
  const defaultLoader = Module._extensions[ext] || Module._extensions['.js'];
  Module._extensions[ext] = (module, filename) => {
    if (filename.includes('node_modules')) {
      return defaultLoader(module, filename);
    }

    const source = fs.readFileSync(filename, 'utf8');
    const { code } = babel.transformSync(source, {
      filename,
      presets: [expoPreset],
      babelrc: false,
      configFile: false,
    });
    return module._compile(code, filename);
  };
};

['.ts', '.tsx'].forEach(registerExtension);

const projectRoot = path.resolve(__dirname, '..');
const files = glob.sync('src/**/*.{ts,tsx}', {
  cwd: projectRoot,
  absolute: true,
  nodir: true,
});

let hasFailure = false;

for (const file of files) {
  try {
    require(file);
  } catch (error) {
    hasFailure = true;
    console.error('\n❌ Error while requiring:', path.relative(projectRoot, file));
    console.error('   Message:', error.message);
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 10).join('\n');
      console.error('   Stack:\n', stackLines);
    }
  }
}

if (!hasFailure) {
  console.log('✅ No require errors detected across src files.');
}
