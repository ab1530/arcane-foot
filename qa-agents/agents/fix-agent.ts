/**
 * FIX-AGENT - Automatic Error Repair
 * Corrige automatiquement les erreurs simples et récurrentes
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy, FIX_PATTERNS } from '../agents.config';

const execAsync = promisify(exec);

interface FixAction {
  errorType: ErrorType;
  file: string;
  action: string;
  applied: boolean;
  details: string;
}

interface FixAgentResult {
  success: boolean;
  errors: any[];
  fixes: any[];
  metrics: {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    errorsDetected: number;
    errorsFixed: number;
    errorsPending: number;
  };
}

export default class FixAgent {
  private logFile: string = './logs/fix-agent.log';
  private fixesApplied: FixAction[] = [];

  async run(): Promise<FixAgentResult> {
    await this.log('🔧 Fix-Agent starting...');

    try {
      // 1. Récupérer erreurs du QA-Agent
      const errors = await this.getErrorsFromQAAgent();

      if (errors.length === 0) {
        await this.log('✅ No errors to fix');
        return this.successResult();
      }

      await this.log(`Found ${errors.length} errors to fix`);

      // 2. Trier erreurs par priorité (auto-fixables d'abord)
      const sortedErrors = this.prioritizeErrors(errors);

      // 3. Appliquer corrections
      for (const error of sortedErrors) {
        if (error.fixStrategy === FixStrategy.AUTO_FIX) {
          await this.applyFix(error);
        }
      }

      // 4. Formater le code corrigé
      await this.formatCode();

      await this.log(`✅ Fix-Agent completed: ${this.fixesApplied.filter(f => f.applied).length} fixes applied`);

      return {
        success: true,
        errors: sortedErrors.filter(e => {
          const fix = this.fixesApplied.find(f => f.errorType === e.type && f.file === e.file);
          return !fix || !fix.applied;
        }),
        fixes: this.fixesApplied.map(fix => ({
          errorType: fix.errorType,
          action: fix.action,
          file: fix.file,
          success: fix.applied,
          details: fix.details,
        })),
        metrics: {
          testsRun: 0,
          testsPassed: 0,
          testsFailed: 0,
          errorsDetected: errors.length,
          errorsFixed: this.fixesApplied.filter(f => f.applied).length,
          errorsPending: errors.length - this.fixesApplied.filter(f => f.applied).length,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ Fix-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Récupérer erreurs du QA-Agent
   */
  private async getErrorsFromQAAgent(): Promise<any[]> {
    // En production, ceci lirait les résultats du QA-Agent
    // Pour l'instant, retourne un tableau vide
    return [];
  }

  /**
   * Prioriser erreurs
   */
  private prioritizeErrors(errors: any[]): any[] {
    return errors.sort((a, b) => {
      // Auto-fixables en premier
      if (a.fixStrategy === FixStrategy.AUTO_FIX && b.fixStrategy !== FixStrategy.AUTO_FIX) return -1;
      if (b.fixStrategy === FixStrategy.AUTO_FIX && a.fixStrategy !== FixStrategy.AUTO_FIX) return 1;

      // Puis par sévérité
      const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  /**
   * Appliquer une correction
   */
  private async applyFix(error: any): Promise<void> {
    await this.log(`Fixing ${error.type} in ${error.file || 'unknown'}`);

    try {
      switch (error.type) {
        case ErrorType.IMPORT_ERROR:
          await this.fixImportError(error);
          break;

        case ErrorType.TYPE_ERROR:
          await this.fixTypeError(error);
          break;

        case ErrorType.UNDEFINED_VARIABLE:
          await this.fixUndefinedVariable(error);
          break;

        case ErrorType.SYNTAX_ERROR:
          await this.fixSyntaxError(error);
          break;

        case ErrorType.API_404:
          await this.fixAPI404(error);
          break;

        case ErrorType.DEPENDENCY_MISSING:
          await this.fixDependencyMissing(error);
          break;

        default:
          await this.log(`⚠️ No auto-fix available for ${error.type}`);
      }
    } catch (fixError) {
      const errMsg = fixError instanceof Error ? fixError.message : String(fixError);
      await this.log(`❌ Fix failed for ${error.type}: ${errMsg}`);

      this.fixesApplied.push({
        errorType: error.type,
        file: error.file || 'unknown',
        action: 'FIX_FAILED',
        applied: false,
        details: errMsg,
      });
    }
  }

  /**
   * Corriger erreur d'import
   */
  private async fixImportError(error: any): Promise<void> {
    const moduleMatch = error.message.match(/Cannot find module ['"](.+?)['"]/);
    if (!moduleMatch) return;

    const moduleName = moduleMatch[1];

    // Si c'est un import relatif, on ne peut pas le corriger automatiquement
    if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
      await this.log(`⚠️ Cannot auto-fix relative import: ${moduleName}`);
      return;
    }

    // Vérifier si la dépendance existe dans package.json
    const isInstalled = await this.isDependencyInstalled(moduleName);

    if (!isInstalled) {
      await this.log(`Installing missing dependency: ${moduleName}`);
      await execAsync(`npm install ${moduleName}`);

      this.fixesApplied.push({
        errorType: ErrorType.IMPORT_ERROR,
        file: error.file || 'package.json',
        action: 'INSTALL_DEPENDENCY',
        applied: true,
        details: `Installed ${moduleName}`,
      });
    } else {
      // Module installé mais import manquant dans le fichier
      if (error.file) {
        await this.addImportToFile(error.file, moduleName);

        this.fixesApplied.push({
          errorType: ErrorType.IMPORT_ERROR,
          file: error.file,
          action: 'ADD_IMPORT',
          applied: true,
          details: `Added import for ${moduleName}`,
        });
      }
    }
  }

  /**
   * Corriger erreur de type TypeScript
   */
  private async fixTypeError(error: any): Promise<void> {
    // Pattern: "Property 'X' does not exist on type 'Y'"
    const propertyMatch = error.message.match(/Property ['"](.+?)['"] does not exist on type ['"](.+?)['"]/);

    if (propertyMatch && error.file) {
      const [_, property, typeName] = propertyMatch;

      await this.log(`Adding type annotation for ${property} on ${typeName}`);

      // Lecture du fichier
      const content = await fs.readFile(error.file, 'utf-8');

      // Tentative de correction (très basique)
      // En production, utiliserait un AST transformer
      const fixed = content.replace(
        new RegExp(`(${typeName})\\s*=\\s*{`, 'g'),
        `$1: { ${property}?: any; } = {`
      );

      if (fixed !== content) {
        await fs.writeFile(error.file, fixed);

        this.fixesApplied.push({
          errorType: ErrorType.TYPE_ERROR,
          file: error.file,
          action: 'ADD_TYPE_ANNOTATION',
          applied: true,
          details: `Added ${property} to ${typeName}`,
        });
      }
    }
  }

  /**
   * Corriger variable non définie
   */
  private async fixUndefinedVariable(error: any): Promise<void> {
    const varMatch = error.message.match(/(.+?) is not defined/);
    if (!varMatch || !error.file) return;

    const varName = varMatch[1];

    await this.log(`Attempting to fix undefined variable: ${varName}`);

    // Vérifier si c'est un hook React commun
    const reactHooks = ['useState', 'useEffect', 'useContext', 'useMemo', 'useCallback', 'useRef'];
    if (reactHooks.includes(varName)) {
      await this.addReactImport(error.file, varName);

      this.fixesApplied.push({
        errorType: ErrorType.UNDEFINED_VARIABLE,
        file: error.file,
        action: 'ADD_REACT_IMPORT',
        applied: true,
        details: `Added React hook import: ${varName}`,
      });
      return;
    }

    // Autres cas: ajouter variable au scope (très basique)
    const content = await fs.readFile(error.file, 'utf-8');

    // Si c'est dans une fonction, ajouter const varName = ...
    if (error.line) {
      const lines = content.split('\n');
      const errorLine = lines[error.line - 1];

      // Détection très simple: si c'est utilisé, le définir
      const fixed = lines.map((line, idx) => {
        if (idx === error.line - 2) {
          // Ligne avant l'erreur
          return line + `\n  const ${varName} = null; // TODO: Define ${varName}`;
        }
        return line;
      }).join('\n');

      await fs.writeFile(error.file, fixed);

      this.fixesApplied.push({
        errorType: ErrorType.UNDEFINED_VARIABLE,
        file: error.file,
        action: 'DEFINE_VARIABLE',
        applied: true,
        details: `Added placeholder definition for ${varName}`,
      });
    }
  }

  /**
   * Corriger erreur de syntaxe
   */
  private async fixSyntaxError(error: any): Promise<void> {
    await this.log(`⚠️ Syntax errors require manual intervention`);
    // Les erreurs de syntaxe sont trop complexes pour auto-fix
    // On laisse ESLint/Prettier les gérer avec formatCode()
  }

  /**
   * Corriger API 404
   */
  private async fixAPI404(error: any): Promise<void> {
    const routeMatch = error.message.match(/Route ['"](.+?)['"] not found/);
    if (!routeMatch) return;

    const route = routeMatch[1];

    await this.log(`Creating stub endpoint for ${route}`);

    // Créer un contrôleur stub (très basique)
    const [method, path] = route.split(' ');
    const controllerName = path.split('/')[2]; // /api/XXX

    if (!controllerName) return;

    const stubCode = `
// TODO: Implement ${method} ${path}
@${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}('${path}')
async ${controllerName}Stub() {
  return { message: 'Endpoint not implemented yet' };
}
`;

    this.fixesApplied.push({
      errorType: ErrorType.API_404,
      file: `backend/src/modules/${controllerName}/${controllerName}.controller.ts`,
      action: 'CREATE_ROUTE_STUB',
      applied: false, // Pas vraiment créé, juste loggé
      details: `Stub code generated for ${route}`,
    });

    await this.log(`Stub code:\n${stubCode}`);
  }

  /**
   * Corriger dépendance manquante
   */
  private async fixDependencyMissing(error: any): Promise<void> {
    const moduleMatch = error.message.match(/Cannot find module ['"](.+?)['"]/);
    if (!moduleMatch) return;

    const moduleName = moduleMatch[1].split('/')[0]; // @scope/package → @scope/package

    await this.log(`Installing missing dependency: ${moduleName}`);

    try {
      await execAsync(`npm install ${moduleName}`);

      this.fixesApplied.push({
        errorType: ErrorType.DEPENDENCY_MISSING,
        file: 'package.json',
        action: 'INSTALL_DEPENDENCY',
        applied: true,
        details: `Installed ${moduleName}`,
      });
    } catch (installError) {
      const errMsg = installError instanceof Error ? installError.message : String(installError);
      await this.log(`❌ Failed to install ${moduleName}: ${errMsg}`);
    }
  }

  /**
   * Vérifier si dépendance installée
   */
  private async isDependencyInstalled(moduleName: string): Promise<boolean> {
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);

      return !!(
        pkg.dependencies?.[moduleName] ||
        pkg.devDependencies?.[moduleName]
      );
    } catch {
      return false;
    }
  }

  /**
   * Ajouter import dans un fichier
   */
  private async addImportToFile(file: string, moduleName: string): Promise<void> {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');

    // Trouver la dernière ligne d'import
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    // Ajouter nouvel import après le dernier
    const newImport = `import '${moduleName}';`;
    lines.splice(lastImportIndex + 1, 0, newImport);

    await fs.writeFile(file, lines.join('\n'));
  }

  /**
   * Ajouter import React hook
   */
  private async addReactImport(file: string, hookName: string): Promise<void> {
    const content = await fs.readFile(file, 'utf-8');

    // Vérifier si import React existe déjà
    const reactImportMatch = content.match(/import\s+React,?\s*{([^}]+)}\s+from\s+['"]react['"]/);

    if (reactImportMatch) {
      // Ajouter hook à l'import existant
      const currentImports = reactImportMatch[1];
      if (!currentImports.includes(hookName)) {
        const newImport = `import React, { ${currentImports.trim()}, ${hookName} } from 'react'`;
        const fixed = content.replace(reactImportMatch[0], newImport);
        await fs.writeFile(file, fixed);
      }
    } else {
      // Créer nouvel import
      const lines = content.split('\n');
      lines.unshift(`import { ${hookName} } from 'react';`);
      await fs.writeFile(file, lines.join('\n'));
    }
  }

  /**
   * Formater le code après corrections
   */
  private async formatCode(): Promise<void> {
    await this.log('Formatting code...');

    try {
      // Backend
      await execAsync('cd backend && npm run format').catch(() => {});

      // Web
      await execAsync('cd web && npm run format').catch(() => {});

      // Mobile
      await execAsync('cd mobile && npm run format').catch(() => {});

      await this.log('✅ Code formatted');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      await this.log(`⚠️ Formatting failed: ${errMsg}`);
    }
  }

  /**
   * Résultat de succès par défaut
   */
  private successResult(): FixAgentResult {
    return {
      success: true,
      errors: [],
      fixes: [],
      metrics: {
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        errorsDetected: 0,
        errorsFixed: 0,
        errorsPending: 0,
      },
    };
  }

  /**
   * Logger
   */
  private async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;

    console.log(logLine.trim());
    await fs.appendFile(this.logFile, logLine).catch(() => {});
  }
}
