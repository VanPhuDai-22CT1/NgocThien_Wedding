#!/usr/bin/env node
/**
 * API Endpoint Test Script
 * Tests all /api/legacy and /api/homepage-config endpoints
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:4000/api';
const RESULTS_FILE = path.join(__dirname, 'api-test-results.json');

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

// Helper: Make HTTP request
function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            rawBody: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test runner
async function runTest(name, method, url, body = null, headers = {}) {
  console.log(`\n▶ Testing: ${name}`);
  console.log(`  ${method} ${url}`);
  
  try {
    const response = await makeRequest(method, url, body, headers);
    const passed = response.status >= 200 && response.status < 300;
    
    const result = {
      name,
      method,
      url,
      status: response.status,
      passed,
      body: response.body,
      timestamp: new Date().toISOString()
    };
    
    results.tests.push(result);
    results.summary.total++;
    
    if (passed) {
      results.summary.passed++;
      console.log(`  ✓ Status: ${response.status} - OK`);
    } else {
      results.summary.failed++;
      console.log(`  ✗ Status: ${response.status} - FAILED`);
    }
    
    if (response.body) {
      console.log(`  Response: ${JSON.stringify(response.body).substring(0, 200)}...`);
    }
    
    return passed;
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    results.tests.push({
      name,
      method,
      url,
      error: error.message,
      passed: false,
      timestamp: new Date().toISOString()
    });
    results.summary.total++;
    results.summary.failed++;
    return false;
  }
}

// Main test suite
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         API Endpoint Test Suite                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const legacyBase = `${API_BASE}/legacy`;

  // Products
  await runTest('GET Products', 'GET', `${legacyBase}?action=getProducts`);

  // Consultations
  await runTest('GET Consultations', 'GET', `${legacyBase}?action=getConsultations`);
  
  // Prepare admin token if possible
  let adminToken = null;
  try {
    if (process.env.JWT_SECRET) {
      adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    }
  } catch (e) {
    // ignore
  }

  await runTest('POST Add Consultation', 'POST', `${legacyBase}?action=addConsultation`, {
    name: 'Test User',
    email: 'test@example.com',
    phone: '0123456789',
    service: 'wedding',
    user_id: null
  });

  // Live Chat
  await runTest('GET Live Chat Sessions', 'GET', `${legacyBase}?action=getLiveChatSessions`);

  // Orders
  await runTest('GET Orders', 'GET', `${legacyBase}?action=getOrders`, null, adminToken ? { Authorization: `Bearer ${adminToken}` } : {});

  // Users
  await runTest('GET Users', 'GET', `${legacyBase}?action=getUsers`, null, adminToken ? { Authorization: `Bearer ${adminToken}` } : {});

  // Dashboard Stats
  await runTest('GET Dashboard Stats', 'GET', `${legacyBase}?action=getDashboardStats`);

  // Activity Logs
  await runTest('GET Activity Logs', 'GET', `${legacyBase}?action=getActivityLogs`, null, adminToken ? { Authorization: `Bearer ${adminToken}` } : {});

  // Shopping Cart
  await runTest('GET Cart', 'GET', `${legacyBase}?action=getCart`);

  // Homepage Config
  console.log('\n════════════════════════════════════════════════════════');
  console.log('Homepage Config Endpoints');
  console.log('════════════════════════════════════════════════════════');
  
  await runTest('GET Homepage Config', 'GET', `${API_BASE}/homepage-config`);

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n  Total Tests:  ${results.summary.total}`);
  console.log(`  ✓ Passed:     ${results.summary.passed}`);
  console.log(`  ✗ Failed:     ${results.summary.failed}`);
  console.log(`  Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%\n`);

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`  Results saved to: ${RESULTS_FILE}\n`);
}

// Run tests
runTests().catch(console.error);
