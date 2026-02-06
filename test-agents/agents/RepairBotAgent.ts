import { Bug, BugFix } from '../base/types';
import { Logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class RepairBotAgent {
  private logger: Logger;
  private bugs: Bug[];
  private fixes: BugFix[] = [];

  constructor(bugs: Bug[]) {
    this.logger = new Logger('RepairBot');
    this.bugs = bugs;
  }

  async run(): Promise<BugFix[]> {
    this.logger.header('🔧 REPAIR BOT AGENT - Starting Auto-Fix');

    if (this.bugs.length === 0) {
      this.logger.success('No bugs to fix!');
      return [];
    }

    this.logger.info(`Found ${this.bugs.length} bugs to analyze`);

    for (const bug of this.bugs) {
      try {
        const fix = await this.analyzeBug(bug);
        if (fix) {
          this.fixes.push(fix);
          bug.fix = fix;
        }
      } catch (error: any) {
        this.logger.error(`Failed to analyze bug ${bug.id}: ${error.message}`);
      }
    }

    this.logger.success(`Generated ${this.fixes.length} automated fixes`);
    return this.fixes;
  }

  private async analyzeBug(bug: Bug): Promise<BugFix | null> {
    this.logger.info(`Analyzing bug: ${bug.id} - ${bug.title}`);

    // Analyze bug pattern and generate fix
    const fix = this.generateFix(bug);

    if (fix) {
      this.logger.success(`Fix generated for ${bug.id}`);
      return fix;
    }

    this.logger.warn(`No automated fix available for ${bug.id}`);
    return null;
  }

  private generateFix(bug: Bug): BugFix | null {
    // Common bug patterns and their fixes
    const description = bug.description.toLowerCase();

    // Pattern 1: Missing endpoint (404 errors)
    if (description.includes('404') || description.includes('not found')) {
      return {
        filePath: 'backend/src/modules/*',
        description: `Implement missing endpoint for ${bug.title}`,
        patch: `// TODO: Implement endpoint\n// This feature is not yet implemented`,
        applied: false,
        verified: false,
      };
    }

    // Pattern 2: Unauthorized/Forbidden (401/403 errors)
    if (description.includes('401') || description.includes('403') || description.includes('unauthorized')) {
      return {
        filePath: 'backend/src/guards/*',
        description: `Fix authorization for ${bug.title}`,
        patch: `// TODO: Review RBAC guards and permissions`,
        applied: false,
        verified: false,
      };
    }

    // Pattern 3: Internal Server Error (500 errors)
    if (description.includes('500') || description.includes('internal server')) {
      return {
        filePath: 'backend/src/modules/*',
        description: `Add error handling for ${bug.title}`,
        patch: `// TODO: Add try-catch and proper error handling`,
        applied: false,
        verified: false,
      };
    }

    // Pattern 4: Undefined property errors
    if (description.includes('undefined') || description.includes('cannot read property')) {
      return {
        filePath: 'backend/src/modules/*',
        description: `Add null checks for ${bug.title}`,
        patch: `// TODO: Add null/undefined checks and fallback values`,
        applied: false,
        verified: false,
      };
    }

    // Pattern 5: Timeout errors
    if (description.includes('timeout') || description.includes('timed out')) {
      return {
        filePath: 'backend/src/modules/*',
        description: `Optimize performance for ${bug.title}`,
        patch: `// TODO: Optimize query or add pagination`,
        applied: false,
        verified: false,
      };
    }

    return null;
  }

  savePatchLog(filename: string = 'PATCH_LOG.md'): void {
    let log = `# 🔧 AUTOMATED PATCH LOG\n\n`;
    log += `**Date**: ${new Date().toISOString()}\n`;
    log += `**Total Fixes**: ${this.fixes.length}\n\n`;

    log += `---\n\n`;

    for (const fix of this.fixes) {
      log += `## ${fix.description}\n\n`;
      log += `- **File**: ${fix.filePath}\n`;
      log += `- **Applied**: ${fix.applied ? '✅ Yes' : '❌ No'}\n`;
      log += `- **Verified**: ${fix.verified ? '✅ Yes' : '❌ No'}\n\n`;
      log += `**Patch**:\n\`\`\`\n${fix.patch}\n\`\`\`\n\n`;
      log += `---\n\n`;
    }

    const logPath = path.join(__dirname, '../../', filename);
    fs.writeFileSync(logPath, log);
    this.logger.success(`Patch log saved to: ${logPath}`);
  }
}
