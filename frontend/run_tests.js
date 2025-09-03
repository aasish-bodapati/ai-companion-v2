#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const testTypes = {
  unit: 'npm run test:unit',
  integration: 'npm run test:integration', 
  e2e: 'npm run test:e2e',
  e2e_smoke: 'npm run test:e2e:smoke',
  e2e_regression: 'npm run test:e2e:regression',
  all: 'npm run test:all',
  coverage: 'npm run test:coverage',
  watch: 'npm run test:watch',
  ci: 'npm run test:ci'
};

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    console.log('─'.repeat(60));
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  const testType = process.argv[2];
  
  if (!testType || !testTypes[testType]) {
    console.log('AI Companion Frontend Test Runner');
    console.log('==================================');
    console.log('');
    console.log('Usage: node run_tests.js <test-type>');
    console.log('');
    console.log('Available test types:');
    console.log('  unit           Run unit tests only');
    console.log('  integration    Run integration tests only');
    console.log('  e2e            Run end-to-end tests');
    console.log('  e2e_smoke      Run smoke tests only');
    console.log('  e2e_regression Run regression tests only');
    console.log('  all            Run all tests (unit + integration + e2e)');
    console.log('  coverage       Run tests with coverage report');
    console.log('  watch          Run tests in watch mode');
    console.log('  ci             Run tests in CI mode');
    console.log('');
    console.log('Examples:');
    console.log('  node run_tests.js unit');
    console.log('  node run_tests.js e2e');
    console.log('  node run_tests.js coverage');
    console.log('  node run_tests.js all');
    process.exit(1);
  }
  
  try {
    const command = testTypes[testType];
    const [cmd, ...args] = command.split(' ');
    
    await runCommand(cmd, args);
    
    console.log('');
    console.log('✅ Tests completed successfully!');
    
  } catch (error) {
    console.error('');
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Tests interrupted by user');
  process.exit(1);
});

// Run the tests
runTests();
