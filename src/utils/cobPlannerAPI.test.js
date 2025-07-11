/**
 * Test suite for CobPlanner API
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CobPlannerAPI, createCobPlannerAPI, CobPlannerHelpers } from './cobPlannerAPI.js';

describe('CobPlannerAPI', () => {
  let api;

  beforeEach(() => {
    api = new CobPlannerAPI();
  });

  describe('Constructor and Configuration', () => {
    it('should create API with default configuration', () => {
      expect(api).toBeInstanceOf(CobPlannerAPI);
      expect(api.config).toBeDefined();
      expect(api.config.validateInput).toBe(true);
    });

    it('should create API with custom configuration', () => {
      const customApi = new CobPlannerAPI({ maxCannons: 10 });
      expect(customApi.config.maxCannons).toBe(10);
    });
  });

  describe('Sanity Check', () => {
    it('should validate correct cannon configuration', () => {
      const cannons = [
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 2, col: 2 }
      ];
      const waves = [
        { duration: 1000, operations: [] }
      ];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalCannons).toBe(3);
    });

    it('should detect invalid cannon positions', () => {
      const cannons = [
        { row: 0, col: 1 }, // Invalid row
        { row: 1, col: 10 }, // Invalid column
        { row: 1, col: 2 }, // This should overlap with col 1
        { row: 1, col: 1 }  // This should overlap with col 2
      ];
      const waves = [{ duration: 1000, operations: [] }];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect overlapping cannons', () => {
      const cannons = [
        { row: 1, col: 1 },
        { row: 1, col: 2 } // Too close to col 1 (cobs are 1x2)
      ];
      const waves = [{ duration: 1000, operations: [] }];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('overlap'))).toBe(true);
    });

    it('should validate wave operations', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 100, row: 1, targetCol: 5.0 },
            { type: 'plant', time: 200, row: 2, targetCol: 3 },
            { type: 'remove', time: 300, row: 2, targetCol: 3 }
          ]
        }
      ];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(true);
      expect(result.summary.fireOperations).toBe(1);
      expect(result.summary.plantOperations).toBe(1);
      expect(result.summary.removeOperations).toBe(1);
    });

    it('should validate target column precision for fire operations', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 100, row: 1, targetCol: 5.01 } // Invalid precision
          ]
        }
      ];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('multiple of 1/80'))).toBe(true);
    });

    it('should validate time expressions', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 'w-200', row: 1, targetCol: 5.0 },
            { type: 'fire', time: 'invalid', row: 1, targetCol: 6.0 }
          ]
        }
      ];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid time expression'))).toBe(true);
    });
  });

  describe('Solve', () => {
    it('should solve simple cannon reuse scenario', () => {
      const cannons = [
        { row: 1, col: 1 },
        { row: 2, col: 2 }
      ];
      const waves = [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 100, row: 1, targetCol: 5.0, columns: '1-2' }
          ]
        }
      ];

      const result = api.solve(cannons, waves);
      expect(result.success).toBe(true);
      expect(result.sanityCheck.success).toBe(true);
      expect(result.solveResult).toBeDefined();
      expect(result.performance.duration).toBeGreaterThan(0);
    });

    it('should handle solve failure gracefully', () => {
      const cannons = []; // No cannons
      const waves = [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 100, row: 1, targetCol: 5.0 }
          ]
        }
      ];

      const result = api.solve(cannons, waves);
      expect(result.success).toBe(true); // Solve can succeed even with 0 fire successes
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail solve when sanity check fails', () => {
      const cannons = [{ row: 0, col: 1 }]; // Invalid cannon
      const waves = [{ duration: 1000, operations: [] }];

      const result = api.solve(cannons, waves);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Sanity check failed'))).toBe(true);
    });
  });

  describe('Export', () => {
    it('should export solve results to AvZ2 format', () => {
      const mockSolveResult = {
        solveResult: {
          operations: [
            {
              type: 'fire',
              success: true,
              cannonRow: 1,
              cannonCol: 1,
              row: 1,
              targetCol: 5.0,
              waveIndex: 0,
              absoluteTime: 100
            }
          ]
        }
      };
      const waves = [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 100, row: 1, targetCol: 5.0 }
          ]
        }
      ];

      const result = api.export(mockSolveResult, waves, 'avz2');
      expect(result.success).toBe(true);
      expect(result.code).toContain('OnWave');
      expect(result.code).toContain('RP');
      expect(result.metadata.exportedOperations).toBe(1);
    });

    it('should handle invalid export format', () => {
      const mockSolveResult = { solveResult: { operations: [] } };
      const waves = [];

      const result = api.export(mockSolveResult, waves, 'invalid');
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported export format'))).toBe(true);
    });

    it('should handle invalid solve result', () => {
      const result = api.export(null, [], 'avz2');
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid solve result'))).toBe(true);
    });
  });

  describe('JSON Operations', () => {
    it('should load configuration from JSON', () => {
      const jsonData = {
        cannons: [{ row: 1, col: 1 }],
        waves: [{ duration: 1000, operations: [] }]
      };

      const result = api.loadFromJSON(jsonData);
      expect(result.success).toBe(true);
      expect(result.cannons).toHaveLength(1);
      expect(result.waves).toHaveLength(1);
    });

    it('should load configuration from JSON string', () => {
      const jsonString = JSON.stringify({
        cannons: [{ row: 1, col: 1 }],
        waves: [{ duration: 1000, operations: [] }]
      });

      const result = api.loadFromJSON(jsonString);
      expect(result.success).toBe(true);
      expect(result.cannons).toHaveLength(1);
    });

    it('should handle invalid JSON', () => {
      const result = api.loadFromJSON('invalid json');
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Failed to load JSON'))).toBe(true);
    });

    it('should save configuration to JSON', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [{ duration: 1000, operations: [] }];

      const result = api.saveToJSON(cannons, waves);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      
      // Verify JSON is valid
      const parsed = JSON.parse(result.json);
      expect(parsed.cannons).toHaveLength(1);
      expect(parsed.waves).toHaveLength(1);
      expect(parsed.metadata).toBeDefined();
    });
  });

  describe('Helper Functions', () => {
    it('should create API instance through factory', () => {
      const api = createCobPlannerAPI();
      expect(api).toBeInstanceOf(CobPlannerAPI);
    });

    it('should provide quick sanity check', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [{ duration: 1000, operations: [] }];

      const result = CobPlannerHelpers.quickSanityCheck(cannons, waves);
      expect(result.success).toBe(true);
    });

    it('should provide quick solve', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [{ duration: 1000, operations: [] }];

      const result = CobPlannerHelpers.quickSolve(cannons, waves);
      expect(result.success).toBe(true);
    });

    it('should provide quick export', () => {
      const mockSolveResult = {
        solveResult: {
          operations: []
        }
      };
      const waves = [];

      const result = CobPlannerHelpers.quickExport(mockSolveResult, waves);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inputs', () => {
      const result = api.sanityCheck([], []);
      expect(result.success).toBe(true);
      expect(result.summary.totalCannons).toBe(0);
      expect(result.summary.totalWaves).toBe(0);
    });

    it('should handle maximum configurations', () => {
      const maxCannons = Array.from({ length: 45 }, (_, i) => ({
        row: Math.floor(i / 9) + 1,
        col: (i % 9) + 1
      }));
      const waves = [{ duration: 1000, operations: [] }];

      const result = api.sanityCheck(maxCannons, waves);
      expect(result.success).toBe(false); // Should fail due to overlaps
    });

    it('should handle complex time expressions', () => {
      const cannons = [{ row: 1, col: 1 }];
      const waves = [
        {
          duration: 2000,
          operations: [
            { type: 'fire', time: 'w-200', row: 1, targetCol: 5.0 },
            { type: 'fire', time: 'w/2', row: 1, targetCol: 6.0 },
            { type: 'fire', time: 'w*0.8', row: 1, targetCol: 7.0 }
          ]
        }
      ];

      const result = api.sanityCheck(cannons, waves);
      expect(result.success).toBe(true);
      expect(result.summary.fireOperations).toBe(3);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete workflow', () => {
    const api = new CobPlannerAPI();
    
    // Test data
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

    // 1. Sanity check
    const sanityResult = api.sanityCheck(cannons, waves);
    expect(sanityResult.success).toBe(true);

    // 2. Solve
    const solveResult = api.solve(cannons, waves);
    expect(solveResult.success).toBe(true);

    // 3. Export
    const exportResult = api.export(solveResult, waves, 'avz2');
    expect(exportResult.success).toBe(true);

    // 4. Save to JSON
    const jsonResult = api.saveToJSON(cannons, waves);
    expect(jsonResult.success).toBe(true);

    // 5. Load from JSON
    const loadResult = api.loadFromJSON(jsonResult.json);
    expect(loadResult.success).toBe(true);
    expect(loadResult.cannons).toEqual(cannons);
    expect(loadResult.waves).toEqual(waves);
  });

  it('should handle saved data format', () => {
    // Simulate loading from cobplanner-data.json
    const savedData = {
      cannons: [
        { row: 1, col: 1 },
        { row: 1, col: 3 },
        { row: 2, col: 2 }
      ],
      waves: [
        {
          duration: 1000,
          operations: [
            { type: 'fire', time: 100, row: 1, targetCol: 5.0, columns: '1-3' },
            { type: 'plant', time: 200, row: 3, targetCol: 4 },
            { type: 'fire', time: 300, row: 1, targetCol: 6.0, columns: '1-4' }
          ]
        },
        {
          duration: 1500,
          operations: [
            { type: 'fire', time: 'w-200', row: 2, targetCol: 7.0, columns: '2-4' },
            { type: 'remove', time: 'w-100', row: 3, targetCol: 4 }
          ]
        }
      ]
    };

    const api = new CobPlannerAPI();
    const loadResult = api.loadFromJSON(savedData);
    expect(loadResult.success).toBe(true);

    const solveResult = api.solve(loadResult.cannons, loadResult.waves);
    expect(solveResult.success).toBe(true);

    const exportResult = api.export(solveResult, loadResult.waves);
    expect(exportResult.success).toBe(true);
    expect(exportResult.code).toContain('OnWave');
  });
});