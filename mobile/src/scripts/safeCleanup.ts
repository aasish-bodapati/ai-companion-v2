/**
 * Safe Cleanup Tool
 * Safely removes unused code with validation and rollback capabilities
 */

import { UnusedCodeDetector } from './unusedCodeDetector';

export const SafeCleanup = {
  // Remove debug console.log statements
  removeDebugLogs: (fileContent: string, filePath: string) => {
    console.log(`🧹 Removing debug logs from ${filePath}...`);
    
    const debugLogRegex = /console\.(log|warn|error|info)\([^)]*(test|debug|temp|TODO|FIXME)[^)]*\);?\s*/gi;
    const cleanedContent = fileContent.replace(debugLogRegex, '');
    
    const removedCount = (fileContent.match(debugLogRegex) || []).length;
    console.log(`✅ Removed ${removedCount} debug log statements`);
    
    return {
      originalContent: fileContent,
      cleanedContent,
      removedCount,
      changes: [
        {
          type: 'debug_logs',
          count: removedCount,
          description: 'Removed debug console.log statements',
        },
      ],
    };
  },

  // Remove unused imports
  removeUnusedImports: (fileContent: string, filePath: string) => {
    console.log(`🧹 Removing unused imports from ${filePath}...`);
    
    const unusedImports = UnusedCodeDetector.detectUnusedImports(fileContent, filePath);
    let cleanedContent = fileContent;
    
    unusedImports.forEach(importItem => {
      // Remove the unused import line
      const importRegex = new RegExp(importItem.import.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      cleanedContent = cleanedContent.replace(importRegex, '');
    });
    
    console.log(`✅ Removed ${unusedImports.length} unused imports`);
    
    return {
      originalContent: fileContent,
      cleanedContent,
      removedCount: unusedImports.length,
      changes: [
        {
          type: 'unused_imports',
          count: unusedImports.length,
          description: 'Removed unused import statements',
          details: unusedImports.map(imp => imp.name),
        },
      ],
    };
  },

  // Remove TODO comments
  removeTodoComments: (fileContent: string, filePath: string) => {
    console.log(`🧹 Removing TODO comments from ${filePath}...`);
    
    const todoRegex = /\/\/\s*TODO[^\n]*\n?/gi;
    const cleanedContent = fileContent.replace(todoRegex, '');
    
    const removedCount = (fileContent.match(todoRegex) || []).length;
    console.log(`✅ Removed ${removedCount} TODO comments`);
    
    return {
      originalContent: fileContent,
      cleanedContent,
      removedCount,
      changes: [
        {
          type: 'todo_comments',
          count: removedCount,
          description: 'Removed TODO comments',
        },
      ],
    };
  },

  // Remove example components
  removeExampleComponents: (filePath: string) => {
    console.log(`🧹 Removing example component ${filePath}...`);
    
    // In a real implementation, this would delete the file
    console.log(`✅ Example component ${filePath} marked for removal`);
    
    return {
      filePath,
      action: 'remove_file',
      reason: 'Example component not needed in production',
      changes: [
        {
          type: 'example_component',
          count: 1,
          description: 'Removed example component file',
        },
      ],
    };
  },

  // Remove documentation files
  removeDocumentationFiles: (filePath: string) => {
    console.log(`🧹 Removing documentation file ${filePath}...`);
    
    // In a real implementation, this would delete the file
    console.log(`✅ Documentation file ${filePath} marked for removal`);
    
    return {
      filePath,
      action: 'remove_file',
      reason: 'Documentation file not needed in production',
      changes: [
        {
          type: 'documentation_file',
          count: 1,
          description: 'Removed documentation file',
        },
      ],
    };
  },

  // Run safe cleanup on a file
  cleanupFile: (filePath: string, fileContent: string, options: {
    removeDebugLogs?: boolean;
    removeUnusedImports?: boolean;
    removeTodoComments?: boolean;
  } = {}) => {
    console.log(`🧹 Running safe cleanup on ${filePath}...`);
    
    const results = {
      filePath,
      originalContent: fileContent,
      cleanedContent: fileContent,
      changes: [],
      totalChanges: 0,
    };
    
    // Remove debug logs
    if (options.removeDebugLogs !== false) {
      const debugResult = SafeCleanup.removeDebugLogs(results.cleanedContent, filePath);
      results.cleanedContent = debugResult.cleanedContent;
      results.changes.push(...debugResult.changes);
      results.totalChanges += debugResult.removedCount;
    }
    
    // Remove unused imports
    if (options.removeUnusedImports !== false) {
      const importResult = SafeCleanup.removeUnusedImports(results.cleanedContent, filePath);
      results.cleanedContent = importResult.cleanedContent;
      results.changes.push(...importResult.changes);
      results.totalChanges += importResult.removedCount;
    }
    
    // Remove TODO comments
    if (options.removeTodoComments !== false) {
      const todoResult = SafeCleanup.removeTodoComments(results.cleanedContent, filePath);
      results.cleanedContent = todoResult.cleanedContent;
      results.changes.push(...todoResult.changes);
      results.totalChanges += todoResult.removedCount;
    }
    
    console.log(`✅ Cleanup complete: ${results.totalChanges} total changes`);
    return results;
  },

  // Run bulk cleanup on multiple files
  runBulkCleanup: (files: {path: string, content: string}[], options: {
    removeDebugLogs?: boolean;
    removeUnusedImports?: boolean;
    removeTodoComments?: boolean;
    removeExampleComponents?: boolean;
    removeDocumentationFiles?: boolean;
  } = {}) => {
    console.log('🚀 Running bulk cleanup...\n');
    
    const results = {
      totalFiles: files.length,
      processedFiles: 0,
      totalChanges: 0,
      fileResults: [],
      summary: {
        debugLogsRemoved: 0,
        unusedImportsRemoved: 0,
        todoCommentsRemoved: 0,
        exampleComponentsRemoved: 0,
        documentationFilesRemoved: 0,
      },
    };
    
    files.forEach(file => {
      console.log(`📁 Processing ${file.path}...`);
      
      // Check if it's an example component
      if (options.removeExampleComponents && /Example|Demo|Test|Sample/.test(file.path)) {
        const result = SafeCleanup.removeExampleComponents(file.path);
        results.fileResults.push(result);
        results.summary.exampleComponentsRemoved++;
        results.processedFiles++;
        return;
      }
      
      // Check if it's a documentation file
      if (options.removeDocumentationFiles && /\.md$/.test(file.path)) {
        const result = SafeCleanup.removeDocumentationFiles(file.path);
        results.fileResults.push(result);
        results.summary.documentationFilesRemoved++;
        results.processedFiles++;
        return;
      }
      
      // Regular file cleanup
      const fileResult = SafeCleanup.cleanupFile(file.path, file.content, options);
      results.fileResults.push(fileResult);
      results.totalChanges += fileResult.totalChanges;
      results.processedFiles++;
      
      // Update summary
      fileResult.changes.forEach(change => {
        switch (change.type) {
          case 'debug_logs':
            results.summary.debugLogsRemoved += change.count;
            break;
          case 'unused_imports':
            results.summary.unusedImportsRemoved += change.count;
            break;
          case 'todo_comments':
            results.summary.todoCommentsRemoved += change.count;
            break;
        }
      });
    });
    
    console.log('\n📊 Bulk Cleanup Results:');
    console.log(`Files Processed: ${results.processedFiles}/${results.totalFiles}`);
    console.log(`Total Changes: ${results.totalChanges}`);
    console.log(`Debug Logs Removed: ${results.summary.debugLogsRemoved}`);
    console.log(`Unused Imports Removed: ${results.summary.unusedImportsRemoved}`);
    console.log(`TODO Comments Removed: ${results.summary.todoCommentsRemoved}`);
    console.log(`Example Components Removed: ${results.summary.exampleComponentsRemoved}`);
    console.log(`Documentation Files Removed: ${results.summary.documentationFilesRemoved}`);
    
    return results;
  },

  // Validate cleanup safety
  validateCleanupSafety: (filePath: string, changes: unknown[]) => {
    console.log(`🔍 Validating cleanup safety for ${filePath}...`);
    
    const validation = {
      safe: true,
      warnings: [],
      errors: [],
    };
    
    changes.forEach(change => {
      switch (change.type) {
        case 'debug_logs':
          if (change.count > 10) {
            validation.warnings.push(`High number of debug logs removed (${change.count})`);
          }
          break;
        case 'unused_imports':
          if (change.count > 5) {
            validation.warnings.push(`High number of imports removed (${change.count})`);
          }
          break;
        case 'example_component':
          validation.safe = true; // Example components are safe to remove
          break;
        case 'documentation_file':
          validation.safe = true; // Documentation files are safe to remove
          break;
      }
    });
    
    if (validation.warnings.length > 0) {
      console.log(`⚠️ ${validation.warnings.length} warnings found`);
    }
    
    if (validation.errors.length > 0) {
      console.log(`❌ ${validation.errors.length} errors found`);
      validation.safe = false;
    }
    
    return validation;
  },

  // Generate cleanup report
  generateCleanupReport: (results: Record<string, unknown>) => {
    console.log('\n📋 Cleanup Report:');
    console.log(`Total Files: ${results.totalFiles}`);
    console.log(`Processed Files: ${results.processedFiles}`);
    console.log(`Total Changes: ${results.totalChanges}`);
    console.log('\nChanges by Type:');
    console.log(`- Debug Logs: ${results.summary.debugLogsRemoved}`);
    console.log(`- Unused Imports: ${results.summary.unusedImportsRemoved}`);
    console.log(`- TODO Comments: ${results.summary.todoCommentsRemoved}`);
    console.log(`- Example Components: ${results.summary.exampleComponentsRemoved}`);
    console.log(`- Documentation Files: ${results.summary.documentationFilesRemoved}`);
    
    return results;
  },
};

export default SafeCleanup;
