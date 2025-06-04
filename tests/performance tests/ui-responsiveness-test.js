const UI_INTERACTIONS = [
  { 
    name: 'Deal Damage To All', 
    selector: 'button:contains("All Others")', 
    action: 'click',
    description: 'Dealing damage to all opponents at once'
  },
  { 
    name: 'Pass Turn', 
    selector: 'button:contains("Pass Turn")', 
    action: 'click',
    description: 'Passing the turn to the next player'
  },
  { 
    name: 'Commander Damage', 
    selector: 'button:contains("CMD")', 
    action: 'click',
    description: 'Applying commander damage to a player'
  },
  { 
    name: 'Toggle Counter Display', 
    selector: 'button:contains("Manage Counters")', 
    action: 'click',
    description: 'Opening/closing the counter management overlay'
  },
  { 
    name: 'Increase Poison Counter', 
    selector: 'button:has(.poison-counter-add), button:contains("+")', 
    action: 'click',
    description: 'Adding poison counters to a player'
  },
  { 
    name: 'Toggle Lifelink', 
    selector: 'div:contains("Lifelink")', 
    action: 'click',
    description: 'Toggling the lifelink ability on/off'
  }
];

// Number of times to test each interaction
const TEST_ITERATIONS = 20;

// Track frame rates during interactions
const frameRates = [];
let measuring = false;
let frameCount = 0;
let lastFrameTimestamp = 0;

// Performance Observer to measure Long Tasks
let longTaskObserver;
try {
  longTaskObserver = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      console.warn(`Long task detected: ${entry.duration}ms`, entry);
    }
  });
  longTaskObserver.observe({ entryTypes: ['longtask'] });
} catch (e) {
  console.warn('Long Task API not supported in this browser.');
}

// Helper function to find element with multiple possible selectors
function findElement(selectors) {
  const selectorList = selectors.split(', ');
  for (const selector of selectorList) {
    // Special case for :contains() pseudo-selector (not standard CSS)
    if (selector.includes(':contains(')) {
      const match = selector.match(/:contains\("([^"]+)"\)/);
      if (match) {
        const text = match[1];
        const baseSelector = selector.replace(/:contains\([^)]+\)/, '');
        const elements = Array.from(document.querySelectorAll(baseSelector || '*'));
        const element = elements.find(el => el.textContent.includes(text));
        if (element) return element;
      }
    } else if (selector.includes(':has(')) {
      // Handle :has() selector if not supported in the browser
      const match = selector.match(/:has\(([^)]+)\)/);
      if (match) {
        const subSelector = match[1];
        const baseSelector = selector.replace(/:has\([^)]+\)/, '');
        const elements = Array.from(document.querySelectorAll(baseSelector || '*'));
        const element = elements.find(el => el.querySelector(subSelector));
        if (element) return element;
      }
    } else if (selector.includes('[onClick*=')) {
      // Handle attribute selector with partial match
      const match = selector.match(/\[onClick\*="([^"]+)"\]/);
      if (match) {
        const partialValue = match[1];
        const baseSelector = selector.replace(/\[onClick\*="[^"]+"\]/, '');
        const elements = Array.from(document.querySelectorAll(baseSelector || '*'));
        const element = elements.find(el => {
          const onClickValue = el.getAttribute('onClick');
          return onClickValue && onClickValue.includes(partialValue);
        });
        if (element) return element;
      }
    } else {
      // Standard selector
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (e) {
        console.warn(`Invalid selector: ${selector}`);
      }
    }
  }
  return null;
}

// Function to measure frame rate
function measureFrameRate(timestamp) {
  if (!measuring) return;
  
  frameCount++;
  
  // Calculate FPS every second
  if (timestamp - lastFrameTimestamp >= 1000) {
    const fps = Math.round((frameCount * 1000) / (timestamp - lastFrameTimestamp));
    frameRates.push(fps);
    console.log(`Current FPS: ${fps}`);
    frameCount = 0;
    lastFrameTimestamp = timestamp;
  }
  
  requestAnimationFrame(measureFrameRate);
}

// Start measuring frame rate
function startMeasuringFrameRate() {
  console.log('Starting frame rate measurement...');
  measuring = true;
  frameCount = 0;
  lastFrameTimestamp = performance.now();
  requestAnimationFrame(measureFrameRate);
}

// Stop measuring frame rate
function stopMeasuringFrameRate() {
  measuring = false;
  
  // Calculate average FPS
  if (frameRates.length > 0) {
    const avgFPS = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
    console.log(`Average FPS: ${avgFPS.toFixed(2)}`);
  }
  
  // Clear frame rates array
  frameRates.length = 0;
}

// Function to measure interaction time
async function measureInteraction(interaction) {
  const element = findElement(interaction.selector);
  if (!element) {
    console.error(`Element not found for selector: ${interaction.selector}`);
    return null;
  }
  
  console.log(`Found element for "${interaction.name}":`, element);
  
  // Create a marker for measuring
  const markerName = `interaction-${interaction.name}-${Date.now()}`;
  
  // Start measuring
  performance.mark(`${markerName}-start`);
  
  // Perform the interaction
  if (interaction.action === 'click') {
    element.click();
  } else if (interaction.action === 'input') {
    element.value = interaction.value || 'test input';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Wait for next frame to ensure component has updated
  await new Promise(resolve => requestAnimationFrame(() => {
    // Wait for another frame to ensure rendering is complete
    requestAnimationFrame(() => {
      // End measuring
      performance.mark(`${markerName}-end`);
      performance.measure(markerName, `${markerName}-start`, `${markerName}-end`);
      resolve();
    });
  }));
  
  // Get the measurement
  const entries = performance.getEntriesByName(markerName);
  const duration = entries.length > 0 ? entries[0].duration : null;
  
  // Clean up performance entries
  performance.clearMarks(`${markerName}-start`);
  performance.clearMarks(`${markerName}-end`);
  performance.clearMeasures(markerName);
  
  return duration;
}

// Function to test a specific interaction multiple times
async function testInteraction(interaction) {
  console.log(`Testing "${interaction.name}" interaction (${interaction.description})...`);
  
  const durations = [];
  
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    // Add a small delay between tests
    if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));
    
    const duration = await measureInteraction(interaction);
    if (duration !== null) {
      durations.push(duration);
      console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
    }
  }
  
  // Calculate statistics
  if (durations.length === 0) {
    return {
      interaction: interaction.name,
      min: null,
      max: null,
      avg: null,
      median: null,
      p95: null,
      success: 0
    };
  }
  
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const min = sortedDurations[0];
  const max = sortedDurations[sortedDurations.length - 1];
  const avg = sortedDurations.reduce((sum, d) => sum + d, 0) / sortedDurations.length;
  const median = sortedDurations[Math.floor(sortedDurations.length / 2)];
  const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
  
  return {
    interaction: interaction.name,
    min,
    max,
    avg,
    median,
    p95,
    success: durations.length
  };
}

// Main function to run all UI responsiveness tests
async function runUITests() {
  console.log('Starting UI responsiveness tests...');
  console.log(`Testing ${UI_INTERACTIONS.length} interactions with ${TEST_ITERATIONS} iterations each\n`);
  
  // Start measuring frame rate
  startMeasuringFrameRate();
  
  const results = [];
  
  for (const interaction of UI_INTERACTIONS) {
    const result = await testInteraction(interaction);
    results.push(result);
    
    console.log(`${interaction.name} Results:`);
    console.log(`  Min: ${result.min ? result.min.toFixed(2) : 'N/A'}ms`);
    console.log(`  Max: ${result.max ? result.max.toFixed(2) : 'N/A'}ms`);
    console.log(`  Avg: ${result.avg ? result.avg.toFixed(2) : 'N/A'}ms`);
    console.log(`  Median: ${result.median ? result.median.toFixed(2) : 'N/A'}ms`);
    console.log(`  95th percentile: ${result.p95 ? result.p95.toFixed(2) : 'N/A'}ms`);
    console.log(`  Success Rate: ${(result.success / TEST_ITERATIONS * 100).toFixed(2)}%\n`);
  }
  
  // Stop measuring frame rate
  stopMeasuringFrameRate();
  
  // Calculate overall average
  const validResults = results.filter(r => r.avg !== null);
  if (validResults.length > 0) {
    const overallAvg = validResults.reduce((sum, result) => sum + result.avg, 0) / validResults.length;
    console.log(`Overall average UI response time: ${overallAvg.toFixed(2)}ms`);
    console.log(`Target: 100ms or less (${overallAvg <= 100 ? 'PASS' : 'FAIL'})`);
  }
  
  // Save results if running in a test environment with Node.js capabilities
  if (typeof window === 'undefined' || typeof require !== 'undefined') {
    try {
      const fs = require('fs');
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const outputFilePath = `ui-responsiveness-results-${timestamp}.json`;
      fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
      console.log(`Results saved to ${outputFilePath}`);
    } catch (e) {
      console.log('Could not save results to file. This is expected when running in a browser.');
    }
  }
  
  return results;
}

// Export for use with testing frameworks if environment supports it
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runUITests, UI_INTERACTIONS };
} else {
  // Otherwise make available globally
  window.runManalogUITests = runUITests;
}

// Automatically run tests if this script is run directly
// This can be disabled when integrating with testing frameworks
if (typeof window !== 'undefined' && !window.isTestingFramework) {
  console.log('Auto-running UI tests...');
  // Add a small delay to ensure the app is fully loaded
  setTimeout(() => {
    runUITests().catch(error => {
      console.error('UI test execution failed:', error);
    });
  }, 2000);
}