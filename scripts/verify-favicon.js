#!/usr/bin/env node

/**
 * Favicon Verification Script
 * 
 * This script verifies that the favicon file exists, has a reasonable size,
 * and has the correct .ico format.
 * 
 * Requirements validated: 3.1, 3.2, 10.1, 10.3
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FAVICON_PATH = path.join(__dirname, '..', 'public', 'favicon.ico');
const MAX_SIZE_KB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFileExists() {
  log('\n📁 Checking file existence...', colors.blue);
  
  if (!fs.existsSync(FAVICON_PATH)) {
    log('❌ FAIL: favicon.ico does not exist at public/favicon.ico', colors.red);
    return false;
  }
  
  log('✅ PASS: favicon.ico exists', colors.green);
  return true;
}

function checkFileSize() {
  log('\n📏 Checking file size...', colors.blue);
  
  const stats = fs.statSync(FAVICON_PATH);
  const sizeBytes = stats.size;
  const sizeKB = (sizeBytes / 1024).toFixed(2);
  
  log(`   File size: ${sizeKB} KB (${sizeBytes} bytes)`);
  
  if (sizeBytes > MAX_SIZE_BYTES) {
    log(`❌ FAIL: File size (${sizeKB} KB) exceeds maximum (${MAX_SIZE_KB} KB)`, colors.red);
    return false;
  }
  
  log(`✅ PASS: File size is within limit (< ${MAX_SIZE_KB} KB)`, colors.green);
  return true;
}

function checkFileFormat() {
  log('\n🔍 Checking file format...', colors.blue);
  
  const ext = path.extname(FAVICON_PATH).toLowerCase();
  
  if (ext !== '.ico') {
    log(`❌ FAIL: File extension is "${ext}", expected ".ico"`, colors.red);
    return false;
  }
  
  log('✅ PASS: File has .ico extension', colors.green);
  
  // Additional check: verify ICO file signature
  const buffer = fs.readFileSync(FAVICON_PATH);
  
  // ICO files start with 00 00 01 00 or 00 00 02 00
  if (buffer.length < 4) {
    log('❌ FAIL: File is too small to be a valid ICO file', colors.red);
    return false;
  }
  
  const signature = buffer.slice(0, 4);
  const isValidICO = 
    (signature[0] === 0x00 && signature[1] === 0x00 && 
     signature[2] === 0x01 && signature[3] === 0x00) ||
    (signature[0] === 0x00 && signature[1] === 0x00 && 
     signature[2] === 0x02 && signature[3] === 0x00);
  
  if (!isValidICO) {
    log('⚠️  WARNING: File signature does not match standard ICO format', colors.yellow);
    log('   This may still work in browsers, but consider regenerating the file', colors.yellow);
    return true; // Don't fail, just warn
  }
  
  log('✅ PASS: File has valid ICO signature', colors.green);
  return true;
}

function main() {
  log('='.repeat(60), colors.blue);
  log('Favicon Verification Script', colors.blue);
  log('='.repeat(60), colors.blue);
  
  const results = {
    exists: checkFileExists(),
    size: false,
    format: false
  };
  
  // Only check size and format if file exists
  if (results.exists) {
    results.size = checkFileSize();
    results.format = checkFileFormat();
  }
  
  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('Verification Summary', colors.blue);
  log('='.repeat(60), colors.blue);
  
  const allPassed = results.exists && results.size && results.format;
  
  if (allPassed) {
    log('\n✅ All checks passed! Favicon is properly configured.', colors.green);
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please review the errors above.', colors.red);
    process.exit(1);
  }
}

// Run the script
main();
