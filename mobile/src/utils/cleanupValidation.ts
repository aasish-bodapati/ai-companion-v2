/**
 * Cleanup validation utilities
 * Ensures safe removal of code without breaking the application
 */

import { readFileSync, existsSync } from 'fs';
import { DebugUtils } from '../utils/debugUtils';


export const CleanupValidation = {
  // Validate that removing a file won't break anything
  validateFileRemoval: (filePath: string): { safe: boolean; reason?: string } => {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        return { safe: false, reason: 'File does not exist' };
      }

      // Read file content
      const fileContent = readFileSync(filePath, 'utf8');

      // Check for exports
      const hasExports = /export\s+(default\s+)?(function|const|class|interface|type)/.test(fileContent);

      if (hasExports) {
        // This file exports something, need to check if it's imported elsewhere
        return { safe: false, reason: 'File exports components/functions that might be used elsewhere' };
      }

      // Check for any imports in the file
      const hasImports = /import\s+.*from\s+['"]/.test(fileContent);

      if (hasImports) {
        return { safe: false, reason: 'File imports other modules, might be part of a larger system' };
      }

      return { safe: true };
    } catch (error) {
      return { safe: false, reason: `Error reading file: ${error}` };
    }
  },

  // Validate that consolidating components won't break anything
  validateComponentConsolidation: (
    oldComponent: string,
    newComponent: string
  ): { safe: boolean; reason?: string } => {
    try {
      // Check if both components exist
      if (!existsSync(oldComponent)) {
        return { safe: false, reason: 'Old component does not exist' };
      }

      if (!existsSync(newComponent)) {
        return { safe: false, reason: 'New component does not exist' };
      }

      // Read both components
      const oldContent = readFileSync(oldComponent, 'utf8');
      const newContent = readFileSync(newComponent, 'utf8');

      // Check if new component has all the props from old component
      const oldProps = CleanupValidation.extractProps(oldContent);
      const newProps = CleanupValidation.extractProps(newContent);

      const missingProps = oldProps.filter(prop => !newProps.includes(prop));

      if (missingProps.length > 0) {
        return {
          safe: false,
          reason: `New component missing props: ${missingProps.join(', ')}`
        };
      }

      return { safe: true };
    } catch (error) {
      return { safe: false, reason: `Error validating components: ${error}` };
    }
  },

  // Extract props from component content
  extractProps: (content: string): string[] => {
    const propsMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    if (!propsMatch) return [];

    const propsContent = propsMatch[1];
    const props = propsContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.split(':')[0].trim())
      .filter(prop => prop);

    return props;
  },

  // Validate that removing unused imports won't break anything
  validateImportRemoval: (filePath: string, importPath: string): { safe: boolean; reason?: string } => {
    try {
      const fileContent = readFileSync(filePath, 'utf8');

      // Check if the import is actually used in the file
      const importName = importPath.split('/').pop()?.replace('.tsx', '').replace('.ts', '');

      if (!importName) {
        return { safe: false, reason: 'Could not determine import name' };
      }

      // Check if the import is used in the file
      const isUsed = new RegExp(`\\b${importName}\\b`).test(fileContent);

      if (isUsed) {
        return { safe: false, reason: 'Import is still being used in the file' };
      }

      return { safe: true };
    } catch (error) {
      return { safe: false, reason: `Error validating import removal: ${error}` };
    }
  },

  // Validate that replacing hardcoded values won't break anything
  validateStyleReplacement: (
    oldValue: unknown,
    newValue: unknown,
    context: string
  ): { safe: boolean; reason?: string } => {
    // Basic validation - in a real implementation, this would be more sophisticated
    if (typeof oldValue !== typeof newValue) {
      return { safe: false, reason: 'Type mismatch between old and new values' };
    }

    if (typeof oldValue === 'string' && oldValue !== newValue) {
      return { safe: true, reason: 'String replacement is generally safe' };
    }

    if (typeof oldValue === 'number' && oldValue !== newValue) {
      return { safe: true, reason: 'Number replacement is generally safe' };
    }

    return { safe: true };
  },

  // Create a comprehensive validation report
  createValidationReport: (filePath: string) => {
    const report = {
      file: filePath,
      safeToRemove: false,
      issues: [] as string[],
      recommendations: [] as string[],
    };

    try {
      const fileContent = readFileSync(filePath, 'utf8');

      // Check for exports
      if (/export\s+(default\s+)?(function|const|class|interface|type)/.test(fileContent)) {
        report.issues.push('File exports components/functions');
        report.recommendations.push('Check if exports are imported elsewhere before removing');
      }

      // Check for imports
      if (/import\s+.*from\s+['"]/.test(fileContent)) {
        report.issues.push('File imports other modules');
        report.recommendations.push('Ensure imported modules are not broken by removal');
      }

      // Check for DebugUtils.log statements
      const consoleLogCount = (fileContent.match(/console\.log/g) || []).length;
      if (consoleLogCount > 0) {
        report.issues.push(`File contains ${consoleLogCount} DebugUtils.log statements`);
        report.recommendations.push('Consider replacing with DebugUtils.log');
      }

      // Check for TODO comments
      const todoCount = (fileContent.match(/TODO|FIXME|XXX|HACK/g) || []).length;
      if (todoCount > 0) {
        report.issues.push(`File contains ${todoCount} TODO/FIXME comments`);
        report.recommendations.push('Review TODO comments before removing file');
      }

      report.safeToRemove = report.issues.length === 0;

    } catch (error) {
      report.issues.push(`Error reading file: ${error}`);
    }

    return report;
  },
};

// Export individual functions for convenience
export const {
  validateFileRemoval,
  validateComponentConsolidation,
  extractProps,
  validateImportRemoval,
  validateStyleReplacement,
  createValidationReport,
} = CleanupValidation;
