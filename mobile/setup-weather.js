#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🌤️  Weather Integration Setup');
console.log('=============================\n');

console.log('To enable weather features in your app, you need an OpenWeatherMap API key.');
console.log('1. Go to https://openweathermap.org/api');
console.log('2. Sign up for a free account');
console.log('3. Get your API key from the API keys section\n');

rl.question('Enter your OpenWeatherMap API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Weather features will be disabled.');
    rl.close();
    return;
  }

  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  // Read existing .env file
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add the API key
  if (envContent.includes('OPENWEATHER_API_KEY=')) {
    envContent = envContent.replace(
      /OPENWEATHER_API_KEY=.*/,
      `OPENWEATHER_API_KEY=${apiKey.trim()}`
    );
  } else {
    envContent += `\nOPENWEATHER_API_KEY=${apiKey.trim()}\n`;
  }

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('✅ API key saved to .env file');
  console.log('🔄 Please restart your Expo development server for changes to take effect');
  console.log('   Run: npx expo start --clear');
  
  rl.close();
});
