# CobPlanner API Usage Guide

The CobPlanner API provides a high-level interface for testing and analyzing cob cannon reuse calculations. This interface makes it easy to validate configurations, solve reuse problems, and export results.

## Quick Start

```javascript
import { CobPlannerAPI, CobPlannerHelpers } from './src/utils/cobPlannerAPI.js';

// Create API instance
const api = new CobPlannerAPI();

// Define your configuration
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

// 1. Sanity Check
const sanityResult = api.sanityCheck(cannons, waves);
if (sanityResult.success) {
  console.log('✓ Configuration is valid');
} else {
  console.log('✗ Configuration has errors:', sanityResult.errors);
}

// 2. Solve
const solveResult = api.solve(cannons, waves);
if (solveResult.success) {
  console.log(`✓ Solve successful: ${solveResult.analysis.successRate * 100}% success rate`);
} else {
  console.log('✗ Solve failed:', solveResult.errors);
}

// 3. Export
const exportResult = api.export(solveResult, waves, 'avz2');
if (exportResult.success) {
  console.log('Generated AvZ2 code:');
  console.log(exportResult.code);
}
```

## API Reference

### Core Methods

#### `sanityCheck(cannons, waves)`
Validates cannon positions and wave operations.

**Parameters:**
- `cannons`: Array of cannon objects with `row` and `col` properties
- `waves`: Array of wave objects with `duration` and `operations`

**Returns:**
```javascript
{
  success: boolean,
  errors: string[],
  warnings: string[],
  summary: {
    totalCannons: number,
    totalWaves: number,
    totalOperations: number,
    fireOperations: number,
    plantOperations: number,
    removeOperations: number
  }
}
```

#### `solve(cannons, waves)`
Solves the cob cannon reuse problem using SAT solving.

**Returns:**
```javascript
{
  success: boolean,
  sanityCheck: object,
  solveResult: object,
  analysis: {
    successRate: number,
    successfulOperations: number,
    totalFireOperations: number,
    unusedCannons: number
  },
  performance: {
    duration: number
  },
  errors: string[],
  warnings: string[]
}
```

#### `export(solveResult, waves, format, options)`
Exports solve results to specified format.

**Parameters:**
- `solveResult`: Result from `solve()` method
- `waves`: Original wave configuration
- `format`: Export format ('avz2' supported)
- `options`: Export options (e.g., `{ includeNotes: true }`)

**Returns:**
```javascript
{
  success: boolean,
  format: string,
  code: string,
  metadata: {
    exportedOperations: number,
    totalOperations: number,
    timestamp: string
  },
  errors: string[]
}
```

### JSON Operations

#### `loadFromJSON(jsonData)`
Load configuration from JSON string or object.

#### `saveToJSON(cannons, waves)`
Save configuration to JSON format.

### Helper Functions

For quick one-off operations, use the helper functions:

```javascript
import { CobPlannerHelpers } from './src/utils/cobPlannerAPI.js';

// Quick operations without creating API instance
const sanityResult = CobPlannerHelpers.quickSanityCheck(cannons, waves);
const solveResult = CobPlannerHelpers.quickSolve(cannons, waves);
const exportResult = CobPlannerHelpers.quickExport(solveResult, waves);
```

## Working with Saved Data

To analyze saved data from `cobplanner-data.json`:

```javascript
import fs from 'fs';
import { CobPlannerAPI } from './src/utils/cobPlannerAPI.js';

// Load saved data
const rawData = fs.readFileSync('cobplanner-data.json', 'utf8');
const savedData = JSON.parse(rawData);

// Create API instance
const api = new CobPlannerAPI();

// Load and validate
const loadResult = api.loadFromJSON(savedData);
if (loadResult.success) {
  // Analyze the configuration
  const sanityResult = api.sanityCheck(loadResult.cannons, loadResult.waves);
  const solveResult = api.solve(loadResult.cannons, loadResult.waves);
  const exportResult = api.export(solveResult, loadResult.waves, 'avz2');
}
```

## Configuration Options

```javascript
const api = new CobPlannerAPI({
  validateInput: true,           // Enable input validation
  includeDetailedErrors: true,   // Include detailed error messages
  maxOperations: 100,           // Maximum operations per configuration
  maxWaves: 20,                 // Maximum waves per configuration
  maxCannons: 45                // Maximum cannons per configuration
});
```

## Error Handling

The API provides comprehensive error handling:

```javascript
const result = api.solve(cannons, waves);

if (!result.success) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
  
  // Check specific error types
  if (result.errors.some(e => e.includes('Sanity check failed'))) {
    console.log('Configuration validation failed');
  }
}
```

## Running Tests

```bash
npm test -- cobPlannerAPI.test.js
```

## Demo Script

Run the demo script to see the API in action with your saved data:

```bash
node src/utils/apiDemo.js --demo
```

This will:
1. Load and validate your saved configuration
2. Solve the reuse problem
3. Export to AvZ2 format
4. Show performance metrics

## Common Use Cases

### 1. Batch Analysis
```javascript
const configs = [/* multiple configurations */];
const results = configs.map(config => api.solve(config.cannons, config.waves));
```

### 2. Configuration Validation
```javascript
const isValid = api.sanityCheck(cannons, waves).success;
```

### 3. Performance Testing
```javascript
const start = Date.now();
const result = api.solve(cannons, waves);
console.log(`Solve time: ${Date.now() - start}ms`);
```

### 4. Export Generation
```javascript
const exportResult = api.export(solveResult, waves, 'avz2', { includeNotes: true });
console.log(exportResult.code);
```