#!/usr/bin/env node

/**
 * Comprehensive test runner for AI Companion frontend.
 * 
 * This script provides a unified interface for running different types of tests
 * with various configurations and reporting options.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FrontendTestRunner {
  constructor() {
    this.projectRoot = process.cwd();
    this.resultsDir = path.join(this.projectRoot, 'test-results');
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async runTests(options = {}) {
    const {
      type = 'all',
      coverage = false,
      watch = false,
      verbose = false,
      ci = false
    } = options;

    console.log('🚀 Frontend Test Runner');
    console.log('=' .repeat(50));
    console.log(`Test type: ${type}`);
    console.log(`Coverage: ${coverage}`);
    console.log(`Watch mode: ${watch}`);
    console.log(`Verbose: ${verbose}`);
    console.log(`CI mode: ${ci}`);
    console.log('=' .repeat(50));

    const startTime = Date.now();

    try {
      let results;

      switch (type) {
        case 'unit':
          results = await this.runUnitTests({ coverage, watch, verbose, ci });
          break;
        case 'integration':
          results = await this.runIntegrationTests({ coverage, watch, verbose, ci });
          break;
        case 'e2e':
          results = await this.runE2ETests({ verbose, ci });
          break;
        case 'all':
          results = await this.runAllTests({ coverage, verbose, ci });
          break;
        default:
          throw new Error(`Unknown test type: ${type}`);
      }

      const executionTime = (Date.now() - startTime) / 1000;
      results.executionTime = executionTime;

      this.saveResults(results);
      this.printSummary(results);

      return results;

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      return {
        success: false,
        error: error.message,
        executionTime: (Date.now() - startTime) / 1000
      };
    }
  }

  async runUnitTests(options) {
    console.log('\n🧪 Running Unit Tests...');
    
    const cmd = this.buildJestCommand({
      testPathPattern: 'tests/unit',
      ...options
    });

    return this.executeCommand(cmd, 'Unit Tests');
  }

  async runIntegrationTests(options) {
    console.log('\n🔗 Running Integration Tests...');
    
    const cmd = this.buildJestCommand({
      testPathPattern: 'tests/integration',
      ...options
    });

    return this.executeCommand(cmd, 'Integration Tests');
  }

  async runE2ETests(options) {
    console.log('\n🌐 Running E2E Tests...');
    
    const cmd = this.buildPlaywrightCommand(options);
    return this.executeCommand(cmd, 'E2E Tests', 'playwright');
  }

  async runAllTests(options) {
    console.log('\n🎯 Running All Tests...');
    
    const results = {
      success: true,
      unit: null,
      integration: null,
      e2e: null,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0
    };

    // Run unit tests
    try {
      results.unit = await this.runUnitTests(options);
      results.totalPassed += results.unit.passed || 0;
      results.totalFailed += results.unit.failed || 0;
      results.totalSkipped += results.unit.skipped || 0;
    } catch (error) {
      results.unit = { success: false, error: error.message };
      results.success = false;
    }

    // Run integration tests
    try {
      results.integration = await this.runIntegrationTests(options);
      results.totalPassed += results.integration.passed || 0;
      results.totalFailed += results.integration.failed || 0;
      results.totalSkipped += results.integration.skipped || 0;
    } catch (error) {
      results.integration = { success: false, error: error.message };
      results.success = false;
    }

    // Run E2E tests
    try {
      results.e2e = await this.runE2ETests(options);
      results.totalPassed += results.e2e.passed || 0;
      results.totalFailed += results.e2e.failed || 0;
      results.totalSkipped += results.e2e.skipped || 0;
    } catch (error) {
      results.e2e = { success: false, error: error.message };
      results.success = false;
    }

    return results;
  }

  buildJestCommand(options) {
    const { testPathPattern, coverage, watch, verbose, ci } = options;
    
    let cmd = 'npx';
    let args = ['jest'];

    if (testPathPattern) {
      args.push('--testPathPattern', testPathPattern);
    }

    if (coverage) {
      args.push('--coverage');
    }

    if (watch && !ci) {
      args.push('--watch');
    }

    if (verbose) {
      args.push('--verbose');
    }

    if (ci) {
      args.push('--ci', '--coverage', '--watchAll=false');
    }

    return { cmd, args };
  }

  buildPlaywrightCommand(options) {
    const { verbose, ci } = options;
    
    let cmd = 'npx';
    let args = ['playwright', 'test'];



    if (verbose) {
      args.push('--reporter', 'verbose');
    } else {
      args.push('--reporter', 'line');
    }

    if (ci) {
      args.push('--reporter', 'junit');
    }

    args.push('--trace', 'on-first-retry');

    return { cmd, args };
  }

  async executeCommand(command, testType, runner = 'jest') {
    return new Promise((resolve, reject) => {
      const { cmd, args } = command;
      
      console.log(`Executing: ${cmd} ${args.join(' ')}`);
      
      const child = spawn(cmd, args, {
        stdio: 'pipe',
        shell: true,
        cwd: this.projectRoot
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      child.on('close', (code) => {
        const success = code === 0;
        
        // Parse output based on test runner
        let testCounts;
        if (runner === 'playwright') {
          testCounts = this.parsePlaywrightOutput(stdout);
        } else {
          testCounts = this.parseJestOutput(stdout);
        }
        
        const result = {
          success,
          exitCode: code,
          testType,
          stdout,
          stderr,
          ...testCounts
        };

        if (success) {
          resolve(result);
        } else {
          reject(new Error(`${testType} failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start ${testType}: ${error.message}`));
      });
    });
  }

  parseJestOutput(output) {
    // Look for Jest test summary
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let total = 0;

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed, (\d+) failed, (\d+) skipped/);
        if (match) {
          passed = parseInt(match[1]);
          failed = parseInt(match[2]);
          skipped = parseInt(match[3]);
          total = passed + failed + skipped;
        }
        break;
      }
    }

    return { passed, failed, skipped, total };
  }

  parsePlaywrightOutput(output) {
    // Look for Playwright test summary
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let total = 0;

    for (const line of lines) {
      if (line.includes('passed') && line.includes('failed')) {
        const match = line.match(/(\d+) passed, (\d+) failed/);
        if (match) {
          passed = parseInt(match[1]);
          failed = parseInt(match[2]);
          total = passed + failed;
        }
        break;
      }
    }

    return { passed, failed, skipped, total };
  }

  saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to: ${filepath}`);
    } catch (error) {
      console.error('Failed to save results:', error.message);
    }
  }

  printSummary(results) {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(50));

    if (results.success) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Some tests failed');
    }

    if (results.executionTime) {
      console.log(`⏱️  Execution time: ${results.executionTime.toFixed(2)}s`);
    }

    if (results.totalPassed !== undefined) {
      console.log(`✅ Passed: ${results.totalPassed}`);
      console.log(`❌ Failed: ${results.totalFailed}`);
      console.log(`⏭️  Skipped: ${results.totalSkipped}`);
      console.log(`📊 Total: ${results.total}`);
    }

    // Print detailed results for each test type
    if (results.unit) {
      console.log(`\n🧪 Unit Tests: ${results.unit.success ? '✅' : '❌'}`);
      if (results.unit.passed !== undefined) {
        console.log(`   Passed: ${results.unit.passed}, Failed: ${results.unit.failed}`);
      }
    }

    if (results.integration) {
      console.log(`\n🔗 Integration Tests: ${results.integration.success ? '✅' : '❌'}`);
      if (results.integration.passed !== undefined) {
        console.log(`   Passed: ${results.integration.passed}, Failed: ${results.integration.failed}`);
      }
    }

    if (results.e2e) {
      console.log(`\n🌐 E2E Tests: ${results.e2e.success ? '✅' : '❌'}`);
      if (results.e2e.passed !== undefined) {
        console.log(`   Passed: ${results.e2e.passed}, Failed: ${results.e2e.failed}`);
      }
    }

    console.log('=' .repeat(50));
  }

  listTestCategories() {
    console.log('Available test categories:');
    console.log('-'.repeat(30));
    
    const categories = [
      { name: 'unit', description: 'Fast unit tests for components and utilities' },
      { name: 'integration', description: 'Integration tests for component interactions' },
      { name: 'e2e', description: 'End-to-end tests with Playwright' },
      { name: 'all', description: 'Run all test categories' }
    ];

    categories.forEach(cat => {
      console.log(`  ${cat.name.padEnd(15)} - ${cat.description}`);
    });

    console.log('\nAvailable options:');
    console.log('-'.repeat(20));
    console.log('  --coverage    Generate coverage report');
    console.log('  --watch       Run tests in watch mode');
    console.log('  --verbose     Verbose output');
    console.log('  --ci          CI mode (no watch, with coverage)');
  }

  async generateCoverageReport() {
    console.log('📊 Generating coverage report...');
    
    try {
      execSync('npm run test:coverage', { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });
      console.log('✅ Coverage report generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate coverage report:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new FrontendTestRunner();

  // Parse command line arguments
  const options = {
    type: 'all',
    coverage: false,
    watch: false,
    verbose: false,
    ci: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
      case '-t':
        options.type = args[++i];
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--ci':
        options.ci = true;
        break;
      case '--list':
      case '-l':
        runner.listTestCategories();
        return;
      case '--coverage-report':
        await runner.generateCoverageReport();
        return;
      case '--help':
      case '-h':
        console.log(`
Frontend Test Runner

Usage: node run_tests.js [options]

Options:
  --type, -t <type>       Test type: unit, integration, e2e, all (default: all)
  --coverage, -c          Generate coverage report
  --watch, -w             Run tests in watch mode
  --verbose, -v           Verbose output
  --ci                    CI mode (no watch, with coverage)
  --list, -l              List available test categories
  --coverage-report       Generate coverage report only
  --help, -h              Show this help message

Examples:
  node run_tests.js --type unit
  node run_tests.js --type all --coverage
  node run_tests.js --type e2e --verbose
  node run_tests.js --ci
        `);
        return;
      default:
        console.error(`Unknown option: ${arg}`);
        console.error('Use --help for usage information');
        process.exit(1);
    }
  }

  try {
    const results = await runner.runTests(options);
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('Test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = FrontendTestRunner;
