import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const gameSessionDuration = new Trend('game_session_duration');
const loginSuccessRate = new Rate('login_success');

// Test configuration
export const options = {
  // Ramp up to 150 virtual users to meet our target
  scenarios: {
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },   // Ramp up to 25 users in 30 seconds
        { duration: '1m', target: 50 },    // Ramp up to 50 users in 1 minute
        { duration: '1m', target: 100 },   // Ramp up to 100 users in 1 minute
        { duration: '1m', target: 150 },   // Ramp up to 150 users in 1 minute
        { duration: '3m', target: 150 },   // Stay at 150 users for 3 minutes
        { duration: '30s', target: 0 },    // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.05'],            // Error rate should be less than 5%
    'api_response_time': ['avg<200'],   // Average API response time below 200ms
    'login_success': ['rate>0.95'],     // Login success rate above 95%
  },
};

// Test users for authentication
const users = new SharedArray('users', function() {
  return [
    { username: 'testuser1', password: 'password123' },
    { username: 'testuser2', password: 'password123' },
    { username: 'testuser3', password: 'password123' },
    { username: 'testuser4', password: 'password123' },
    { username: 'testuser5', password: 'password123' },
    { username: 'testuser6', password: 'password123' },
    { username: 'testuser7', password: 'password123' },
    { username: 'testuser8', password: 'password123' },
    { username: 'testuser9', password: 'password123' },
    { username: 'testuser10', password: 'password123' },
  ];
});

// Common HTTP parameters
const params = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Main test function - simulates a user's typical session
export default function() {
  const baseUrl = 'http://localhost:5000/api';
  let token;
  let userId;
  let playgroups = [];
  let decks = [];
  
  group('Authentication', function() {
    // Select a test user based on the virtual user ID
    const userIndex = __VU % users.length;
    const user = users[userIndex];
    
    // Step 1: Login
    const loginStart = Date.now();
    const loginRes = http.post(`${baseUrl}/auth/login`, JSON.stringify({
      username: user.username,
      password: user.password
    }), params);
    apiResponseTime.add(Date.now() - loginStart);
    
    const loginSuccess = check(loginRes, {
      'login successful': (r) => r.status === 200 && r.json('token') !== undefined,
    });
    
    loginSuccessRate.add(loginSuccess);
    
    if (!loginSuccess) {
      console.error(`Login failed for user ${user.username}:`, loginRes.status, loginRes.body);
      errorRate.add(1);
      return;
    }
    
    // Extract token and user ID
    token = loginRes.json('token');
    userId = loginRes.json('user.id');
  });
  
  // Only continue if authentication was successful
  if (!token) return;
  
  // Update headers with auth token
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };
  
  group('Data Loading', function() {
    // Step 2: Get user's playgroups
    const playgroupsStart = Date.now();
    const playgroupsRes = http.get(`${baseUrl}/playgroups`, authParams);
    apiResponseTime.add(Date.now() - playgroupsStart);
    
    check(playgroupsRes, {
      'get playgroups successful': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    if (playgroupsRes.status === 200) {
      playgroups = playgroupsRes.json();
    }
    
    // Step 3: Get user's decks
    const decksStart = Date.now();
    const decksRes = http.get(`${baseUrl}/decks`, authParams);
    apiResponseTime.add(Date.now() - decksStart);
    
    check(decksRes, {
      'get decks successful': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    if (decksRes.status === 200) {
      decks = decksRes.json();
    }
    
    // Step 4: Get game history
    const historyStart = Date.now();
    const historyRes = http.get(`${baseUrl}/games/history`, authParams);
    apiResponseTime.add(Date.now() - historyStart);
    
    check(historyRes, {
      'get game history successful': (r) => r.status === 200,
    }) || errorRate.add(1);
  });
  
  group('Game Session', function() {
    // Step 5: Simulate a game session with multiple API calls
    const gameSessionStart = Date.now();
    
    // These API calls represent a typical game session
    
    // 5.1: Create a mock game data
    const gameData = {
      date: new Date().toISOString(),
      winner: users[__VU % users.length].username,
      players: ["Player 1", "Player 2", "Player 3", "Player 4"],
      playerCount: 4,
      turnCount: 12,
      duration: 900, // 15 minutes in seconds
      activeDuration: 800, // Active play time
      avgTurnTime: 20,
      playerStats: [
        {
          damageDealt: 25,
          commanderDamageDealt: 15,
          eliminations: 2,
          totalTurnTime: 300,
          saltinessRating: 'notSalty',
          damageInteractions: [
            { targetPlayer: "Player 2", amount: 10 },
            { targetPlayer: "Player 3", amount: 10 },
            { targetPlayer: "Player 4", amount: 5 }
          ],
          commanderDamageInteractions: [
            { targetPlayer: "Player 2", amount: 5 },
            { targetPlayer: "Player 3", amount: 5 },
            { targetPlayer: "Player 4", amount: 5 }
          ],
          eliminationInteractions: [
            { eliminatedPlayer: "Player 3" },
            { eliminatedPlayer: "Player 4" }
          ]
        },
        {
          damageDealt: 15,
          commanderDamageDealt: 10,
          eliminations: 1,
          totalTurnTime: 250,
          saltinessRating: 'somewhatSalty',
          damageInteractions: [
            { targetPlayer: "Player 1", amount: 5 },
            { targetPlayer: "Player 3", amount: 5 },
            { targetPlayer: "Player 4", amount: 5 }
          ],
          commanderDamageInteractions: [
            { targetPlayer: "Player 1", amount: 5 },
            { targetPlayer: "Player 3", amount: 5 }
          ],
          eliminationInteractions: [
            { eliminatedPlayer: "Player 3" }
          ]
        },
        {
          damageDealt: 10,
          commanderDamageDealt: 5,
          eliminations: 0,
          totalTurnTime: 200,
          saltinessRating: 'extremelySalty',
          damageInteractions: [
            { targetPlayer: "Player 1", amount: 5 },
            { targetPlayer: "Player 2", amount: 5 }
          ],
          commanderDamageInteractions: [
            { targetPlayer: "Player 1", amount: 5 }
          ],
          eliminationInteractions: []
        },
        {
          damageDealt: 5,
          commanderDamageDealt: 0,
          eliminations: 0,
          totalTurnTime: 150,
          saltinessRating: 'notSalty',
          damageInteractions: [
            { targetPlayer: "Player 1", amount: 3 },
            { targetPlayer: "Player 2", amount: 2 }
          ],
          commanderDamageInteractions: [],
          eliminationInteractions: []
        }
      ],
      playerDecks: [
        { playerId: 1, playerName: "Player 1", deckId: "deck-id-1", deckName: "Test Deck 1" },
        { playerId: 2, playerName: "Player 2", deckId: "deck-id-2", deckName: "Test Deck 2" },
        { playerId: 3, playerName: "Player 3", deckId: "deck-id-3", deckName: "Test Deck 3" },
        { playerId: 4, playerName: "Player 4", deckId: "deck-id-4", deckName: "Test Deck 4" }
      ]
    };
    
    // 5.2: Save game result
    const saveGameStart = Date.now();
    const saveGameRes = http.post(`${baseUrl}/games`, JSON.stringify(gameData), authParams);
    apiResponseTime.add(Date.now() - saveGameStart);
    
    check(saveGameRes, {
      'save game successful': (r) => r.status === 201 || r.status === 200,
    }) || errorRate.add(1);
    
    // Record the total game session duration
    gameSessionDuration.add(Date.now() - gameSessionStart);
  });
  
  // Simulate a delay between user sessions
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Define a setup function that will run once before the test
export function setup() {
  console.log('Load test setup complete. Ready to run with up to 150 concurrent users.');
  return { setupComplete: true };
}

// Define a teardown function that will run once after the test
export function teardown(data) {
  console.log('Load test complete.');
}