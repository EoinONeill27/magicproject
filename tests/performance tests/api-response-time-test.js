// This script tests the response time of critical API endpoints

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const NUM_REQUESTS = 10; // Reduced number for initial testing

// Authentication setup
const AUTH = {
  username: 'testuser',
  password: 'password1'
};

// Endpoints to test
const ENDPOINTS = [
  { name: 'Get Decks', url: '/decks', method: 'get', requiresAuth: true },
  { name: 'Get Game History', url: '/games/history', method: 'get', requiresAuth: true },
  { name: 'Get Playgroups', url: '/playgroups', method: 'get', requiresAuth: true },
  { name: 'Login', url: '/auth/login', method: 'post', data: { username: AUTH.username, password: AUTH.password }, requiresAuth: false }
];

// Set up Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

// Function to authenticate and get token
async function authenticate() {
  try {
    console.log('Authenticating...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: AUTH.username,
      password: AUTH.password
    });
    
    if (response.data && response.data.token) {
      console.log('Authentication successful');
      return response.data.token;
    } else {
      console.error('Authentication failed: No token in response');
      return null;
    }
  } catch (error) {
    console.error(`Authentication failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    }
    return null;
  }
}

// Function to measure response time for a single request
async function measureResponseTime(endpoint, token) {
  const startTime = Date.now();
  
  try {
    const config = endpoint.requiresAuth && token ? 
      { headers: { 'Authorization': `Bearer ${token}` } } : 
      {};
    
    if (endpoint.method === 'get') {
      await api.get(endpoint.url, config);
    } else if (endpoint.method === 'post') {
      await api.post(endpoint.url, endpoint.data, config);
    }
    
    const endTime = Date.now();
    return endTime - startTime;
  } catch (error) {
    console.error(`Error testing ${endpoint.name}: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
    return null;
  }
}

// Function to test an endpoint multiple times
async function testEndpoint(endpoint, token) {
  console.log(`Testing ${endpoint.name} endpoint...`);
  
  const responseTimes = [];
  
  for (let i = 0; i < NUM_REQUESTS; i++) {
    // Add a small delay between requests to avoid overwhelming the server
    if (i > 0) await new Promise(resolve => setTimeout(resolve, 200));
    
    const time = await measureResponseTime(endpoint, token);
    if (time !== null) {
      responseTimes.push(time);
    }
    
    // Log progress for long-running tests
    if (i % 5 === 0) {
      console.log(`  Completed ${i}/${NUM_REQUESTS} requests`);
    }
  }
  
  // Calculate statistics
  if (responseTimes.length === 0) {
    console.error(`All requests to ${endpoint.name} failed. Check authentication or if endpoint exists.`);
    return {
      endpoint: endpoint.name,
      min: null,
      max: null,
      avg: null,
      median: null,
      p95: null,
      success: 0
    };
  }
  
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const min = sortedTimes[0];
  const max = sortedTimes[sortedTimes.length - 1];
  const avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
  const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  
  return {
    endpoint: endpoint.name,
    min,
    max,
    avg,
    median,
    p95,
    success: responseTimes.length,
    successRate: (responseTimes.length / NUM_REQUESTS * 100).toFixed(2)
  };
}

// Main function to run all tests
async function runTests() {
  console.log('Starting API response time tests...');
  console.log(`Testing ${ENDPOINTS.length} endpoints with ${NUM_REQUESTS} requests each\n`);
  console.log(`API Base URL: ${BASE_URL}\n`);
  
  // Authenticate if any endpoint requires it
  let token = null;
  if (ENDPOINTS.some(endpoint => endpoint.requiresAuth)) {
    token = await authenticate();
    if (!token) {
      console.error('Authentication failed. Cannot test protected endpoints.');
      // Continue with unprotected endpoints only
      console.log('Will only test endpoints that do not require authentication.');
    }
  }
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    // Skip protected endpoints if authentication failed
    if (endpoint.requiresAuth && !token) {
      console.log(`Skipping ${endpoint.name} as it requires authentication.`);
      continue;
    }
    
    const result = await testEndpoint(endpoint, token);
    results.push(result);
    
    if (result.avg !== null) {
      console.log(`${endpoint.name} Results:`);
      console.log(`  Min: ${result.min}ms`);
      console.log(`  Max: ${result.max}ms`);
      console.log(`  Avg: ${result.avg.toFixed(2)}ms`);
      console.log(`  Median: ${result.median}ms`);
      console.log(`  95th percentile: ${result.p95}ms`);
      console.log(`  Success Rate: ${result.successRate}%\n`);
    } else {
      console.log(`${endpoint.name} Results: All requests failed\n`);
    }
  }
  
  // Calculate overall average for successful tests
  const successfulResults = results.filter(result => result.avg !== null);
  if (successfulResults.length > 0) {
    const overallAvg = successfulResults.reduce((sum, result) => sum + result.avg, 0) / successfulResults.length;
    console.log(`Overall average response time across all endpoints: ${overallAvg.toFixed(2)}ms`);
    console.log(`Successfully tested ${successfulResults.length}/${ENDPOINTS.length} endpoints`);
  } else {
    console.log('No successful API requests. Please check if your API server is running and credentials are correct.');
  }
  
  // Export results to JSON file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  fs.writeFileSync(`api-performance-results-${timestamp}.json`, JSON.stringify(results, null, 2));
  console.log(`Results saved to api-performance-results-${timestamp}.json`);
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:');
  console.error(error);
});
