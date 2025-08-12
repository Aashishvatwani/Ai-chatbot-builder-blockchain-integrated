#!/usr/bin/env node

/**
 * Quick setup script to enable backend purchase tracking
 * This script will help you set up the required database tables for live earnings tracking
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AI Chatbot Platform - Backend Purchase Tracking Setup\n');

console.log('📋 Setup Steps Required:\n');

console.log('1️⃣  Create Database Tables');
console.log('   Run this SQL script in your PostgreSQL database:');
console.log('   📄 database-purchase-tracking.sql\n');

console.log('2️⃣  Track Tables in Hasura');
console.log('   • Go to your Hasura Console');
console.log('   • Navigate to Data tab');
console.log('   • Track these tables:');
console.log('     - token_purchases');
console.log('     - platform_earnings\n');

console.log('3️⃣  Set Permissions in Hasura');
console.log('   • token_purchases: Read/Write for authenticated users');
console.log('   • platform_earnings: Read for admins, Write for backend\n');

console.log('4️⃣  Test with Sample Data (Optional)');
console.log('   Run this SQL script to add test data:');
console.log('   📄 test-purchase-data.sql\n');

console.log('5️⃣  Update Frontend Queries');
console.log('   After tables are created, update these variables in earnings page:');
console.log('   • Change skip_platform_earnings: true → false');
console.log('   • Change skip_token_purchases: true → false\n');

// Check if SQL files exist
const sqlFiles = [
  'database-purchase-tracking.sql',
  'test-purchase-data.sql'
];

console.log('📁 Checking required files...');
const missingFiles = [];

sqlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} - Found`);
  } else {
    console.log(`   ❌ ${file} - Missing`);
    missingFiles.push(file);
  }
});

if (missingFiles.length === 0) {
  console.log('\n🎉 All setup files are ready!');
  console.log('\n📖 For detailed instructions, see: BACKEND_PURCHASE_SETUP.md');
} else {
  console.log('\n⚠️  Some setup files are missing. Please ensure all files are present.');
}

console.log('\n🔧 After completing setup:');
console.log('   • Token purchases will be recorded in the database');
console.log('   • Admin earnings page will show live purchase data');
console.log('   • Platform revenue analytics will be available');
console.log('   • All values will display with 5 decimal precision');

console.log('\n💡 Need help? Check the setup guide or create an issue on GitHub.\n');
