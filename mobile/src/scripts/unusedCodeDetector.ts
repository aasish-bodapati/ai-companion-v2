/**
 * Unused Code Detector
 * Automatically detects unused imports, dead code, and redundant patterns
 */

export const UnusedCodeDetector = {
  // Detect unused imports in a file
  detectUnusedImports: (fileContent: string, filePath: string) => {
    console.log(`🔍 Analyzing imports in ${filePath}...`);
    
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"];?/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      imports.push({
        fullMatch: match[0],
        source: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    
    const unusedImports = [];
    
    imports.forEach(importItem => {
      const importName = importItem.source.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '');
      if (importName) {
        // Check if the import is used in the file
        const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
        const matches = fileContent.match(usageRegex) || [];
        
        // If only found in the import statement itself, it's unused
        if (matches.length <= 1) {
          unusedImports.push({
            import: importItem.fullMatch,
            source: importItem.source,
            name: importName,
            reason: 'Not used in file content',
          });
        }
      }
    });
    
    console.log(`📝 Found ${unusedImports.length} potentially unused imports`);
    return unusedImports;
  },

  // Detect dead code patterns
  detectDeadCode: (fileContent: string, filePath: string) => {
    console.log(`🔍 Analyzing dead code in ${filePath}...`);
    
    const deadCodePatterns = [
      {
        name: 'TODO Comments',
        regex: /\/\/\s*TODO[^\n]*/gi,
        severity: 'medium',
        description: 'TODO comments that may indicate incomplete work',
      },
      {
        name: 'FIXME Comments',
        regex: /\/\/\s*FIXME[^\n]*/gi,
        severity: 'high',
        description: 'FIXME comments that indicate broken code',
      },
      {
        name: 'Debug Console Logs',
        regex: /console\.(log|warn|error|info)\([^)]*\)/g,
        severity: 'high',
        description: 'Debug console statements that should be removed',
      },
      {
        name: 'Test Console Logs',
        regex: /console\.(log|warn|error|info)\([^)]*(test|debug|temp)[^)]*\)/gi,
        severity: 'high',
        description: 'Test/debug console statements',
      },
      {
        name: 'Unused Variables',
        regex: /const\s+(\w+)\s*=\s*[^;]+;\s*(?!.*\1)/g,
        severity: 'medium',
        description: 'Variables that may be unused',
      },
      {
        name: 'Empty Functions',
        regex: /(function|const\s+\w+\s*=\s*)\s*\(\s*\)\s*{\s*}/g,
        severity: 'low',
        description: 'Empty functions that may be placeholders',
      },
    ];
    
    const deadCode = [];
    
    deadCodePatterns.forEach(pattern => {
      const matches = fileContent.match(pattern.regex) || [];
      matches.forEach(match => {
        deadCode.push({
          type: pattern.name,
          match: match.trim(),
          severity: pattern.severity,
          description: pattern.description,
        });
      });
    });
    
    console.log(`📝 Found ${deadCode.length} dead code patterns`);
    return deadCode;
  },

  // Detect unused components
  detectUnusedComponents: (componentFiles: string[]) => {
    console.log(`🔍 Analyzing component usage...`);
    
    const unusedComponents = [];
    
    // Common patterns for unused components
    const unusedPatterns = [
      {
        name: 'Example Components',
        pattern: /Example|Demo|Test|Sample/,
        severity: 'high',
        description: 'Example/demo components that are likely unused',
      },
      {
        name: 'Migration Components',
        pattern: /Migration|Example|Guide/,
        severity: 'medium',
        description: 'Migration-related components that may be temporary',
      },
      {
        name: 'Documentation Files',
        pattern: /\.md$/,
        severity: 'low',
        description: 'Documentation files that may not be needed in production',
      },
    ];
    
    componentFiles.forEach(filePath => {
      unusedPatterns.forEach(pattern => {
        if (pattern.pattern.test(filePath)) {
          unusedComponents.push({
            filePath,
            type: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
            reason: 'Matches unused component pattern',
          });
        }
      });
    });
    
    console.log(`📝 Found ${unusedComponents.length} potentially unused components`);
    return unusedComponents;
  },

  // Detect redundant code patterns
  detectRedundantCode: (fileContent: string, filePath: string) => {
    console.log(`🔍 Analyzing redundant code in ${filePath}...`);
    
    const redundantPatterns = [
      {
        name: 'Duplicate Style Definitions',
        regex: /(backgroundColor|color|fontSize|padding|margin):\s*['"][^'"]+['"]/g,
        severity: 'medium',
        description: 'Hardcoded style values that could use constants',
      },
      {
        name: 'Repeated Error Handling',
        regex: /catch\s*\(\s*error\s*\)\s*{\s*console\.error[^}]+}/g,
        severity: 'medium',
        description: 'Repeated error handling patterns',
      },
      {
        name: 'Duplicate API Calls',
        regex: /apiClient\.(get|post|put|delete)\(/g,
        severity: 'low',
        description: 'API calls that could be consolidated',
      },
      {
        name: 'Repeated Validation',
        regex: /if\s*\(\s*!\w+\s*\)\s*{\s*return[^}]+}/g,
        severity: 'low',
        description: 'Repeated validation patterns',
      },
    ];
    
    const redundantCode = [];
    
    redundantPatterns.forEach(pattern => {
      const matches = fileContent.match(pattern.regex) || [];
      if (matches.length > 1) {
        redundantCode.push({
          type: pattern.name,
          count: matches.length,
          severity: pattern.severity,
          description: pattern.description,
          matches: matches.slice(0, 3), // Show first 3 matches
        });
      }
    });
    
    console.log(`📝 Found ${redundantCode.length} redundant code patterns`);
    return redundantCode;
  },

  // Run comprehensive analysis
  runComprehensiveAnalysis: (files: {path: string, content: string}[]) => {
    console.log('🚀 Running comprehensive unused code analysis...\n');
    
    const results = {
      totalFiles: files.length,
      unusedImports: [],
      deadCode: [],
      unusedComponents: [],
      redundantCode: [],
      summary: {
        totalUnusedImports: 0,
        totalDeadCode: 0,
        totalUnusedComponents: 0,
        totalRedundantPatterns: 0,
      },
    };
    
    files.forEach(file => {
      console.log(`📁 Analyzing ${file.path}...`);
      
      // Detect unused imports
      const unusedImports = UnusedCodeDetector.detectUnusedImports(file.content, file.path);
      results.unusedImports.push({
        filePath: file.path,
        imports: unusedImports,
      });
      results.summary.totalUnusedImports += unusedImports.length;
      
      // Detect dead code
      const deadCode = UnusedCodeDetector.detectDeadCode(file.content, file.path);
      results.deadCode.push({
        filePath: file.path,
        patterns: deadCode,
      });
      results.summary.totalDeadCode += deadCode.length;
      
      // Detect redundant code
      const redundantCode = UnusedCodeDetector.detectRedundantCode(file.content, file.path);
      results.redundantCode.push({
        filePath: file.path,
        patterns: redundantCode,
      });
      results.summary.totalRedundantPatterns += redundantCode.length;
    });
    
    // Detect unused components
    const componentFiles = files.map(f => f.path);
    const unusedComponents = UnusedCodeDetector.detectUnusedComponents(componentFiles);
    results.unusedComponents = unusedComponents;
    results.summary.totalUnusedComponents = unusedComponents.length;
    
    console.log('\n📊 Analysis Summary:');
    console.log(`Files Analyzed: ${results.totalFiles}`);
    console.log(`Unused Imports: ${results.summary.totalUnusedImports}`);
    console.log(`Dead Code Patterns: ${results.summary.totalDeadCode}`);
    console.log(`Unused Components: ${results.summary.totalUnusedComponents}`);
    console.log(`Redundant Patterns: ${results.summary.totalRedundantPatterns}`);
    
    return results;
  },

  // Generate cleanup recommendations
  generateCleanupRecommendations: (results: any) => {
    console.log('\n📋 Cleanup Recommendations:');
    
    const recommendations = [
      {
        priority: 'High',
        category: 'Dead Code',
        action: 'Remove debug console.log statements',
        count: results.summary.totalDeadCode,
        impact: 'Cleaner production code',
      },
      {
        priority: 'High',
        category: 'Unused Components',
        action: 'Remove example/demo components',
        count: results.summary.totalUnusedComponents,
        impact: 'Reduced bundle size',
      },
      {
        priority: 'Medium',
        category: 'Unused Imports',
        action: 'Remove unused import statements',
        count: results.summary.totalUnusedImports,
        impact: 'Faster build times',
      },
      {
        priority: 'Medium',
        category: 'Redundant Code',
        action: 'Consolidate duplicate patterns',
        count: results.summary.totalRedundantPatterns,
        impact: 'Better maintainability',
      },
    ];
    
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
      console.log(`   Action: ${rec.action}`);
      console.log(`   Count: ${rec.count} instances`);
      console.log(`   Impact: ${rec.impact}`);
    });
    
    return recommendations;
  },
};

export default UnusedCodeDetector;
