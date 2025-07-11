/**
 * Demonstration of CobPlanner API usage
 * This script shows how to use the API for testing and analysis of saved data
 */

import { CobPlannerAPI, CobPlannerHelpers } from './cobPlannerAPI.js';
import fs from 'fs';
import path from 'path';

/**
 * Load and analyze saved data from cobplanner-data.json
 */
async function analyzeSavedData() {
  console.log('=== CobPlanner API Demonstration ===\n');

  try {
    // Load saved data
    const dataPath = path.join(process.cwd(), 'cobplanner-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const savedData = JSON.parse(rawData);

    console.log('1. Loading saved data...');
    const api = new CobPlannerAPI();
    const loadResult = api.loadFromJSON(savedData);
    
    if (!loadResult.success) {
      console.error('Failed to load data:', loadResult.errors);
      return;
    }

    console.log(`   ✓ Loaded ${loadResult.cannons.length} cannons and ${loadResult.waves.length} waves\n`);

    // Perform sanity check
    console.log('2. Performing sanity check...');
    const sanityResult = api.sanityCheck(loadResult.cannons, loadResult.waves);
    
    console.log(`   Status: ${sanityResult.success ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`   Cannons: ${sanityResult.summary.totalCannons}`);
    console.log(`   Waves: ${sanityResult.summary.totalWaves}`);
    console.log(`   Total Operations: ${sanityResult.summary.totalOperations}`);
    console.log(`   Fire Operations: ${sanityResult.summary.fireOperations}`);
    console.log(`   Plant Operations: ${sanityResult.summary.plantOperations}`);
    console.log(`   Remove Operations: ${sanityResult.summary.removeOperations}`);

    if (sanityResult.errors.length > 0) {
      console.log('\n   Errors:');
      sanityResult.errors.forEach(error => console.log(`     - ${error}`));
    }

    if (sanityResult.warnings.length > 0) {
      console.log('\n   Warnings:');
      sanityResult.warnings.forEach(warning => console.log(`     - ${warning}`));
    }

    console.log('');

    // Solve the problem
    console.log('3. Solving reuse problem...');
    const solveResult = api.solve(loadResult.cannons, loadResult.waves);
    
    if (solveResult.success) {
      console.log(`   ✓ Solve completed in ${solveResult.performance.duration}ms`);
      console.log(`   Success rate: ${Math.round(solveResult.analysis.successRate * 100)}%`);
      console.log(`   Successful operations: ${solveResult.analysis.successfulOperations}/${solveResult.analysis.totalFireOperations}`);
      
      if (solveResult.warnings.length > 0) {
        console.log('\n   Warnings:');
        solveResult.warnings.forEach(warning => console.log(`     - ${warning}`));
      }
    } else {
      console.log('   ✗ Solve failed');
      solveResult.errors.forEach(error => console.log(`     - ${error}`));
    }

    console.log('');

    // Export results
    if (solveResult.success) {
      console.log('4. Exporting to AvZ2 format...');
      const exportResult = api.export(solveResult, loadResult.waves, 'avz2', { includeNotes: true });
      
      if (exportResult.success) {
        console.log(`   ✓ Export completed`);
        console.log(`   Exported ${exportResult.metadata.exportedOperations}/${exportResult.metadata.totalOperations} operations`);
        console.log('\n   Generated code:');
        console.log('   ' + '='.repeat(50));
        console.log(exportResult.code.split('\n').map(line => `   ${line}`).join('\n'));
        console.log('   ' + '='.repeat(50));
      } else {
        console.log('   ✗ Export failed');
        exportResult.errors.forEach(error => console.log(`     - ${error}`));
      }
    }

    console.log('');

    // Save updated data
    console.log('5. Saving configuration...');
    const saveResult = api.saveToJSON(loadResult.cannons, loadResult.waves);
    
    if (saveResult.success) {
      console.log('   ✓ Configuration saved to JSON format');
      
      // Optionally write to file
      // fs.writeFileSync('output.json', saveResult.json);
      // console.log('   ✓ Written to output.json');
    } else {
      console.log('   ✗ Save failed');
      saveResult.errors.forEach(error => console.log(`     - ${error}`));
    }

  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

/**
 * Demonstrate helper functions
 */
function demonstrateHelpers() {
  console.log('\n=== Helper Functions Demo ===\n');

  // Sample data
  const cannons = [
    { row: 1, col: 1 },
    { row: 2, col: 3 }
  ];
  const waves = [
    {
      duration: 1000,
      operations: [
        { type: 'fire', time: 100, row: 1, targetCol: 5.0, columns: '1-3' },
        { type: 'fire', time: 200, row: 2, targetCol: 6.0, columns: '1-3' }
      ]
    }
  ];

  console.log('1. Quick sanity check...');
  const sanityResult = CobPlannerHelpers.quickSanityCheck(cannons, waves);
  console.log(`   Status: ${sanityResult.success ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n2. Quick solve...');
  const solveResult = CobPlannerHelpers.quickSolve(cannons, waves);
  console.log(`   Status: ${solveResult.success ? '✓ PASS' : '✗ FAIL'}`);

  if (solveResult.success) {
    console.log('\n3. Quick export...');
    const exportResult = CobPlannerHelpers.quickExport(solveResult, waves);
    console.log(`   Status: ${exportResult.success ? '✓ PASS' : '✗ FAIL'}`);
    
    if (exportResult.success && exportResult.code) {
      console.log('\n   Generated code:');
      console.log('   ' + '='.repeat(30));
      console.log(exportResult.code.split('\n').map(line => `   ${line}`).join('\n'));
      console.log('   ' + '='.repeat(30));
    }
  }
}

/**
 * Performance testing
 */
function performanceTest() {
  console.log('\n=== Performance Test ===\n');

  const api = new CobPlannerAPI();

  // Generate larger test data
  const cannons = [];
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 9; col += 2) { // Avoid overlaps
      cannons.push({ row, col });
    }
  }

  const waves = [];
  for (let i = 0; i < 10; i++) {
    waves.push({
      duration: 1000 + i * 100,
      operations: [
        { type: 'fire', time: 50 + i * 10, row: 1, targetCol: 5.0 + i * 0.5, columns: '1-9' },
        { type: 'fire', time: 100 + i * 10, row: 2, targetCol: 6.0 + i * 0.5, columns: '1-9' }
      ]
    });
  }

  console.log(`Testing with ${cannons.length} cannons and ${waves.length} waves...`);
  
  const startTime = Date.now();
  const result = api.solve(cannons, waves);
  const endTime = Date.now();

  console.log(`Solve time: ${endTime - startTime}ms`);
  console.log(`Success: ${result.success}`);
  if (result.success) {
    console.log(`Success rate: ${Math.round(result.analysis.successRate * 100)}%`);
  }
}

// Run demonstrations
if (process.argv.includes('--demo')) {
  analyzeSavedData();
  demonstrateHelpers();
  performanceTest();
}

// Export for use in other modules
export { analyzeSavedData, demonstrateHelpers, performanceTest };