/**
 * Shared test fixtures and data for CobPlanner tests
 */

// Basic cannon configurations
export const basicCannons = [
  { row: 1, col: 1 },
  { row: 2, col: 3 },
  { row: 3, col: 7 }
];

export const singleCannon = [
  { row: 1, col: 3 }
];

export const multipleCannons = [
  { row: 1, col: 2 },
  { row: 2, col: 4 },
  { row: 3, col: 6 }
];

// Overlapping cannons for testing validation
export const overlappingCannons = [
  { row: 1, col: 1 },
  { row: 1, col: 2 } // Too close to col 1
];

// Basic wave configurations
export const basicWave = {
  duration: 601,
  operations: [
    { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 },
    { type: 'plant', time: '0', columns: '', row: 2, targetCol: 2 },
    { type: 'remove', time: '500', columns: '', row: 1, targetCol: 1 }
  ],
  notes: 'Basic test wave'
};

export const multipleWaves = [
  {
    duration: 601,
    operations: [
      { type: 'fire', time: '300', columns: '1-5', row: 1, targetCol: 9 },
      { type: 'fire', time: 'w-200', columns: '1-5', row: 2, targetCol: 8 }
    ],
    notes: 'Wave 1'
  },
  {
    duration: 1000,
    operations: [
      { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 7 },
      { type: 'plant', time: '500', columns: '', row: 3, targetCol: 5 }
    ],
    notes: 'Wave 2'
  }
];

// Complex scenarios
export const complexScenario = {
  cannons: [
    { row: 1, col: 2 },
    { row: 2, col: 4 },
    { row: 3, col: 6 }
  ],
  waves: [
    {
      duration: 1000,
      operations: [
        { type: 'fire', time: '100', columns: '1-4', row: 1, targetCol: 9 },
        { type: 'fire', time: '200', columns: '1-4', row: 2, targetCol: 8 },
        { type: 'fire', time: '300', columns: '4-8', row: 3, targetCol: 7 },
        { type: 'plant', time: '400', columns: '', row: 4, targetCol: 8 },
        { type: 'fire', time: '6000', columns: '1-4', row: 1, targetCol: 9 } // Reuse scenario
      ],
      notes: 'Complex reuse scenario'
    }
  ]
};

// Invalid data for testing validation
export const invalidData = {
  invalidCannons: [
    { row: 0, col: 1 }, // Invalid row
    { row: 1, col: 10 }, // Invalid column
    null, // Invalid cannon object
    { row: 1.5, col: 3 } // Non-integer row
  ],
  invalidWaves: [
    {
      duration: -1, // Invalid duration
      operations: [
        { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 },
        { type: 'plant', time: '0', columns: '', row: 10, targetCol: 4 },
        { type: 'fire', time: '100', columns: '1-8', row: 1, targetCol: 5.01 } // Invalid precision
      ]
    }
  ]
};

// Specific test cases for edge scenarios
export const edgeCases = {
  // Maximum configuration
  maxCannons: Array.from({ length: 25 }, (_, i) => ({
    row: Math.floor(i / 5) + 1,
    col: (i % 5) * 2 + 1 // Spaced to avoid overlaps
  })),
  
  // Minimum cooldown scenario
  minCooldownTest: {
    cannons: [{ row: 1, col: 3 }],
    waves: [
      {
        duration: 10000,
        operations: [
          { type: 'fire', time: '1000', columns: '1-5', row: 1, targetCol: 9 },
          { type: 'fire', time: '2000', columns: '1-5', row: 1, targetCol: 9 }, // Too soon
          { type: 'fire', time: '6000', columns: '1-5', row: 1, targetCol: 9 }  // OK
        ]
      }
    ]
  },
  
  // Cross-wave operations
  crossWaveOps: {
    cannons: [{ row: 2, col: 6 }],
    waves: [
      {
        duration: 601,
        operations: [
          { type: 'plant', time: '0', columns: '', row: 3, targetCol: 5 },
          { type: 'plant', time: '2', columns: '', row: 3, targetCol: 5 } // Duplicate
        ]
      },
      {
        duration: 601,
        operations: [
          { type: 'remove', time: '-599', columns: '', row: 3, targetCol: 5 },
          { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 9 }
        ]
      }
    ]
  }
};

// Expected solver results for validation
export const expectedResults = {
  singleCannonSingleFire: {
    cannons: [{ row: 1, col: 3 }],
    operations: [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 }
    ],
    expectedSuccessCount: 1
  },
  
  multipleCannonsMultipleFires: {
    cannons: [
      { row: 1, col: 3 },
      { row: 2, col: 5 }
    ],
    operations: [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 },
      { type: 'fire', absoluteTime: 2000, targetCol: 8, columns: '1-5', originalIndex: 1 }
    ],
    expectedSuccessCount: 2
  }
};

// AvZ2 Export test data
export const avz2ExportData = {
  basicFireOperation: {
    result: {
      successCount: 1,
      operations: [
        {
          type: 'fire',
          waveIndex: 0,
          opIndex: 0,
          absoluteTime: 100,
          cannonRow: 1,
          cannonCol: 1,
          row: 2,
          targetCol: 9,
          success: true
        }
      ]
    },
    waves: [{ duration: 601, notes: '', operations: [] }],
    expectedCode: 'OnWave(1) {\n    At(100) RP(1, 1, 2, 9)\n};'
  },
  
  multipleOperationsWithNotes: {
    result: {
      successCount: 3,
      operations: [
        {
          type: 'fire',
          waveIndex: 0,
          opIndex: 0,
          absoluteTime: 100,
          cannonRow: 1,
          cannonCol: 1,
          row: 2,
          targetCol: 9,
          success: true
        },
        {
          type: 'plant',
          waveIndex: 0,
          opIndex: 1,
          absoluteTime: 200,
          row: 3,
          targetCol: 4,
          success: true
        },
        {
          type: 'remove',
          waveIndex: 0,
          opIndex: 2,
          absoluteTime: 300,
          row: 3,
          targetCol: 4,
          success: true
        }
      ]
    },
    waves: [{ duration: 601, notes: 'Test wave with all operations', operations: [] }],
    expectedPattern: /\/\/ Test wave with all operations\nOnWave\(1\)[\s\S]*RP\(1, 1, 2, 9\)[\s\S]*Card\(ACOB_CANNON, 3, 4\)[\s\S]*Shovel\(3, 4\)/
  }
};

// Test store configurations
export const testStoreConfigs = {
  basic: {
    theme: 'light',
    rows: 5,
    cannons: basicCannons,
    waves: [basicWave]
  },
  
  empty: {
    theme: 'light',
    rows: 5,
    cannons: [],
    waves: []
  },
  
  complex: {
    theme: 'dark',
    rows: 5,
    cannons: complexScenario.cannons,
    waves: complexScenario.waves
  }
};

// Performance test configurations
export const performanceTestData = {
  moderateCannons: Array.from({ length: 10 }, (_, i) => ({
    row: Math.floor(i / 2) + 1,
    col: (i % 2) * 4 + 1
  })),
  
  moderateWaves: Array.from({ length: 5 }, (_, i) => ({
    duration: 1000 + i * 100,
    operations: [
      { type: 'fire', time: `${50 + i * 10}`, columns: '1-8', row: 1, targetCol: 5.0 + i * 0.5 },
      { type: 'fire', time: `${100 + i * 10}`, columns: '1-8', row: 2, targetCol: 6.0 + i * 0.5 }
    ],
    notes: `Performance test wave ${i + 1}`
  }))
};

// API test configurations
export const apiTestData = {
  validConfig: {
    cannons: basicCannons,
    waves: multipleWaves
  },
  
  invalidConfig: {
    cannons: invalidData.invalidCannons,
    waves: invalidData.invalidWaves
  },
  
  emptyConfig: {
    cannons: [],
    waves: []
  }
};

// Helper functions for test data generation
export const generateTestCannons = (count, startRow = 1, startCol = 1) => {
  const cannons = [];
  for (let i = 0; i < count; i++) {
    cannons.push({
      row: startRow + Math.floor(i / 4),
      col: startCol + (i % 4) * 2
    });
  }
  return cannons;
};

export const generateTestWaves = (count, baseDuration = 601) => {
  const waves = [];
  for (let i = 0; i < count; i++) {
    waves.push({
      duration: baseDuration + i * 100,
      operations: [
        { type: 'fire', time: `${100 + i * 50}`, columns: '1-8', row: 1, targetCol: 5.0 + i * 0.5 }
      ],
      notes: `Generated wave ${i + 1}`
    });
  }
  return waves;
};

export const generatePrecisionTestValues = () => {
  const values = [];
  // Valid 1/80 multiples
  for (let i = 0; i <= 799; i++) {
    values.push({ value: i / 80, valid: true });
  }
  // Invalid non-multiples
  values.push(
    { value: 0.01, valid: false },
    { value: 0.013, valid: false },
    { value: 5.51, valid: false },
    { value: 1.01, valid: false }
  );
  return values;
};