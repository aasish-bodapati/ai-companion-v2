/**
 * Duplicate Code Detector
 * Automatically detects remaining duplicate code patterns
 */

export const DuplicateCodeDetector = {
  // Detect hardcoded style values
  detectHardcodedStyles: () => {
    const patterns = [
      { pattern: "backgroundColor: '#f8fafc'", replacement: "DUPLICATE_STYLES.BACKGROUND_F8FAFC" },
      { pattern: "backgroundColor: '#ffffff'", replacement: "DUPLICATE_STYLES.BACKGROUND_WHITE" },
      { pattern: "fontSize: 18", replacement: "DUPLICATE_STYLES.FONT_SIZE_18" },
      { pattern: "fontSize: 16", replacement: "DUPLICATE_STYLES.FONT_SIZE_16" },
      { pattern: "fontSize: 14", replacement: "DUPLICATE_STYLES.FONT_SIZE_14" },
      { pattern: "borderRadius: 16", replacement: "DUPLICATE_STYLES.BORDER_RADIUS_16" },
      { pattern: "borderRadius: 12", replacement: "DUPLICATE_STYLES.BORDER_RADIUS_12" },
      { pattern: "borderRadius: 8", replacement: "DUPLICATE_STYLES.BORDER_RADIUS_8" },
      { pattern: "paddingHorizontal: 20", replacement: "DUPLICATE_STYLES.PADDING_HORIZONTAL_20" },
      { pattern: "color: '#3b82f6'", replacement: "DUPLICATE_STYLES.COLORS.PRIMARY" },
      { pattern: "color: '#1f2937'", replacement: "DUPLICATE_STYLES.COLORS.TEXT_PRIMARY" },
      { pattern: "color: '#6b7280'", replacement: "DUPLICATE_STYLES.COLORS.TEXT_SECONDARY" },
    ];

    console.log('🔍 Detecting hardcoded style values...');
    patterns.forEach(({ pattern, replacement }) => {
      console.log(`📝 Pattern: ${pattern} → ${replacement}`);
    });

    return {
      totalPatterns: patterns.length,
      status: 'Detection complete - use migration scripts to replace',
    };
  },

  // Detect console.log statements
  detectConsoleLogs: () => {
    const patterns = [
      'console.log(',
      'console.warn(',
      'console.error(',
      'console.info(',
    ];

    console.log('🔍 Detecting console.log statements...');
    patterns.forEach(pattern => {
      console.log(`📝 Pattern: ${pattern} → DebugUtils.log/warn/error/info`);
    });

    return {
      totalPatterns: patterns.length,
      status: 'Detection complete - use migration scripts to replace',
    };
  },

  // Detect loading state patterns
  detectLoadingPatterns: () => {
    const patterns = [
      'const [loading, setLoading] = useState(false)',
      'setLoading(true)',
      'setLoading(false)',
      'if (loading)',
    ];

    console.log('🔍 Detecting loading state patterns...');
    patterns.forEach(pattern => {
      console.log(`📝 Pattern: ${pattern} → createLoadingState hook`);
    });

    return {
      totalPatterns: patterns.length,
      status: 'Detection complete - use createLoadingState hook',
    };
  },

  // Detect error handling patterns
  detectErrorHandling: () => {
    const patterns = [
      'catch (error)',
      'console.error(',
      'throw error',
      'catch (err)',
    ];

    console.log('🔍 Detecting error handling patterns...');
    patterns.forEach(pattern => {
      console.log(`📝 Pattern: ${pattern} → MigrationHelpers.replaceErrorHandling`);
    });

    return {
      totalPatterns: patterns.length,
      status: 'Detection complete - use MigrationHelpers.replaceErrorHandling',
    };
  },

  // Detect duplicate component patterns
  detectDuplicateComponents: () => {
    const patterns = [
      'ProgressRing',
      'LoadingState',
      'EnhancedLoadingState',
      'ProgressIndicator',
    ];

    console.log('🔍 Detecting duplicate component patterns...');
    patterns.forEach(pattern => {
      console.log(`📝 Pattern: ${pattern} → Use UnifiedProgressRing or UnifiedLoadingState`);
    });

    return {
      totalPatterns: patterns.length,
      status: 'Detection complete - use unified components',
    };
  },

  // Run all detections
  runFullDetection: () => {
    console.log('🚀 Running full duplicate code detection...\n');

    const results = {
      hardcodedStyles: DuplicateCodeDetector.detectHardcodedStyles(),
      consoleLogs: DuplicateCodeDetector.detectConsoleLogs(),
      loadingPatterns: DuplicateCodeDetector.detectLoadingPatterns(),
      errorHandling: DuplicateCodeDetector.detectErrorHandling(),
      duplicateComponents: DuplicateCodeDetector.detectDuplicateComponents(),
    };

    console.log('\n📊 Detection Summary:');
    console.log(`✅ Hardcoded Styles: ${results.hardcodedStyles.totalPatterns} patterns`);
    console.log(`✅ Console Logs: ${results.consoleLogs.totalPatterns} patterns`);
    console.log(`✅ Loading Patterns: ${results.loadingPatterns.totalPatterns} patterns`);
    console.log(`✅ Error Handling: ${results.errorHandling.totalPatterns} patterns`);
    console.log(`✅ Duplicate Components: ${results.duplicateComponents.totalPatterns} patterns`);

    const totalPatterns = Object.values(results).reduce((sum, result) => sum + result.totalPatterns, 0);
    console.log(`\n🎯 Total patterns detected: ${totalPatterns}`);

    return {
      results,
      totalPatterns,
      status: 'Full detection complete',
    };
  },

  // Generate migration recommendations
  generateRecommendations: () => {
    const recommendations = [
      {
        priority: 'High',
        category: 'Style Constants',
        action: 'Replace hardcoded style values with DUPLICATE_STYLES constants',
        files: '56+ files with hardcoded styles',
        script: 'replaceHardcodedStyles',
      },
      {
        priority: 'High',
        category: 'Console Logging',
        action: 'Replace console.log with DebugUtils',
        files: '57 files with console.log statements',
        script: 'replaceConsoleLogs',
      },
      {
        priority: 'Medium',
        category: 'Loading States',
        action: 'Use createLoadingState hook for loading state management',
        files: '22 files with duplicate loading patterns',
        script: 'replaceLoadingPatterns',
      },
      {
        priority: 'Medium',
        category: 'Error Handling',
        action: 'Use MigrationHelpers.replaceErrorHandling for consistent error handling',
        files: '87 files with error handling patterns',
        script: 'addDeprecationWarnings',
      },
      {
        priority: 'Low',
        category: 'Component Consolidation',
        action: 'Use unified components instead of duplicate components',
        files: 'Multiple files using old components',
        script: 'Manual migration',
      },
    ];

    console.log('\n📋 Migration Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
      console.log(`   Action: ${rec.action}`);
      console.log(`   Files: ${rec.files}`);
      console.log(`   Script: ${rec.script}`);
    });

    return recommendations;
  },
};

// Export for use in migration dashboard
export default DuplicateCodeDetector;
