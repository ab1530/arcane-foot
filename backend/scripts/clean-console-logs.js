#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to replace console.log with Logger
const replacements = [
  {
    // console.log -> this.logger.log
    pattern: /console\.log\(/g,
    replacement: 'this.logger.log(',
    type: 'service'
  },
  {
    // console.error -> this.logger.error
    pattern: /console\.error\(/g,
    replacement: 'this.logger.error(',
    type: 'service'
  },
  {
    // console.warn -> this.logger.warn
    pattern: /console\.warn\(/g,
    replacement: 'this.logger.warn(',
    type: 'service'
  }
];

// Find all TypeScript files in src directory
const files = glob.sync(path.join(__dirname, '../src/**/*.ts'), {
  ignore: ['**/node_modules/**', '**/*.spec.ts', '**/*.test.ts']
});

let totalReplacements = 0;
const modifiedFiles = [];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let fileModified = false;
  let fileReplacements = 0;

  // Check if file has console.log/error/warn
  if (content.match(/console\.(log|error|warn)\(/)) {
    // Check if Logger is imported
    const hasLoggerImport = content.includes('import { Logger }') ||
                           content.includes('from "@nestjs/common"') ||
                           content.includes('private readonly logger = new Logger');

    // Add Logger import if needed
    if (!hasLoggerImport && content.includes('console.')) {
      // Check if file already has @nestjs/common imports
      const nestCommonMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]@nestjs\/common['"]/);

      if (nestCommonMatch) {
        // Add Logger to existing import
        const imports = nestCommonMatch[1];
        if (!imports.includes('Logger')) {
          const newImports = imports.trim() + ', Logger';
          content = content.replace(nestCommonMatch[0], `import { ${newImports} } from '@nestjs/common'`);
        }
      } else {
        // Add new import at the top
        const firstImportIndex = content.indexOf('import ');
        if (firstImportIndex !== -1) {
          content = content.slice(0, firstImportIndex) +
                   `import { Logger } from '@nestjs/common';\n` +
                   content.slice(firstImportIndex);
        }
      }
    }

    // Check if logger is declared
    const hasLoggerDeclaration = content.includes('private readonly logger') ||
                                 content.includes('private logger') ||
                                 content.includes('protected logger');

    // Add logger declaration if needed (for services/controllers)
    if (!hasLoggerDeclaration && content.includes('console.')) {
      // Find class declaration
      const classMatch = content.match(/export\s+class\s+(\w+)/);

      if (classMatch) {
        const className = classMatch[1];
        const classDeclarationIndex = content.indexOf(classMatch[0]);
        const classBodyStart = content.indexOf('{', classDeclarationIndex);

        // Add logger as first property
        const loggerDeclaration = `\n  private readonly logger = new Logger(${className}.name);\n`;
        content = content.slice(0, classBodyStart + 1) +
                 loggerDeclaration +
                 content.slice(classBodyStart + 1);
      }
    }

    // Replace console.* with logger.*
    replacements.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        fileReplacements += matches.length;
        content = content.replace(pattern, replacement);
        fileModified = true;
      }
    });

    if (fileModified) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles.push({
        file: path.relative(path.dirname(__dirname), filePath),
        replacements: fileReplacements
      });
      totalReplacements += fileReplacements;
    }
  }
});

// Report results
console.log('\n🧹 Console.log Cleanup Report\n');
console.log('=' . repeat(50));

if (modifiedFiles.length > 0) {
  console.log(`✅ Cleaned ${totalReplacements} console statements in ${modifiedFiles.length} files:\n`);
  modifiedFiles.forEach(({ file, replacements }) => {
    console.log(`  📝 ${file} (${replacements} replacements)`);
  });
} else {
  console.log('✨ No console.log statements found to clean!');
}

console.log('\n' + '=' . repeat(50));
console.log(`\n✅ Cleanup complete! Total replacements: ${totalReplacements}\n`);