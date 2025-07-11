/**
 * Unit tests for solver utility functions
 * Refactored for better organization and maintainability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getRoofFlyTime, preprocessOperations, isColumnInSet, solveCobReuse, solveReuse } from '../../src/utils/solver.js';
import { 
  basicCannons, 
  singleCannon, 
  multipleCannons, 
  multipleWaves,
  edgeCases,
  expectedResults
} from '../fixtures/testData.js';

describe('Solver Utility Functions', () => {
  
  describe('getRoofFlyTime', () => {
    describe('Basic calculations', () => {
      it('should calculate fly time correctly for various columns', () => {
        // Test cases based on the C++ implementation
        expect(getRoofFlyTime(1, 6.4375)).toBe(359); // dropX = 515, exactly at minDropX
        expect(getRoofFlyTime(1, 5.0)).toBe(363); // dropX = 400, below minDropX
        expect(getRoofFlyTime(2, 6.0)).toBe(363); // dropX = 480, below minDropX
        expect(getRoofFlyTime(8, 9.0)).toBe(373); // dropX = 720, above minDropX
      });
    });

    describe('Edge cases', () => {
      it('should handle minimum and maximum dropX values', () => {
        expect(getRoofFlyTime(1, 0)).toBe(376); // Very low dropX
        expect(getRoofFlyTime(1, 9.9875)).toBe(359); // Maximum dropX
      });

      it('should handle all cannon columns', () => {
        for (let col = 1; col <= 8; col++) {
          const result = getRoofFlyTime(col, 9.0);
          expect(result).toBeGreaterThan(0);
          expect(result).toBeLessThan(400);
        }
      });
    });
  });

  describe('preprocessOperations', () => {
    describe('Time conversion', () => {
      it('should convert relative times to absolute times', () => {
        const waves = [
          {
            duration: 601,
            operations: [
              { time: '300', type: 'fire', targetCol: 9, columns: '1-5' },
              { time: 'w-100', type: 'fire', targetCol: 8, columns: '2-6' }
            ]
          },
          {
            duration: 1000,
            operations: [
              { time: '0', type: 'fire', targetCol: 7, columns: '3-7' }
            ]
          }
        ];

        const result = preprocessOperations(waves);

        expect(result.operations).toHaveLength(3);
        expect(result.operations[0].absoluteTime).toBe(300); // First wave, 300
        expect(result.operations[1].absoluteTime).toBe(501); // First wave, 601-100
        expect(result.operations[2].absoluteTime).toBe(601); // Second wave, 0
        expect(result.totalTime).toBe(1601); // 601 + 1000
      });

      it('should sort operations by absolute time', () => {
        const waves = [
          {
            duration: 1000,
            operations: [
              { time: '800', type: 'fire', targetCol: 9, columns: '1-5' },
              { time: '200', type: 'fire', targetCol: 8, columns: '2-6' }
            ]
          }
        ];

        const result = preprocessOperations(waves);
        expect(result.operations[0].absoluteTime).toBeLessThanOrEqual(result.operations[1].absoluteTime);
      });
    });

    describe('Complex expressions', () => {
      it('should handle negative relative times', () => {
        const waves = [
          {
            duration: 1000,
            operations: [
              { time: '-200', type: 'fire', targetCol: 9, columns: '1-5' }
            ]
          }
        ];

        const result = preprocessOperations(waves);
        expect(result.operations[0].absoluteTime).toBe(-200);
      });

      it('should handle complex expressions', () => {
        const waves = [
          {
            duration: 500,
            operations: [
              { time: 'w + 100', type: 'fire', targetCol: 9, columns: '1-5' },
              { time: 'w * 2', type: 'fire', targetCol: 8, columns: '2-6' }
            ]
          }
        ];

        const result = preprocessOperations(waves);
        expect(result.operations[0].absoluteTime).toBe(600); // 500 + 100
        expect(result.operations[1].absoluteTime).toBe(1000); // 500 * 2
      });
    });

    describe('Metadata preservation', () => {
      it('should preserve wave and operation indices', () => {
        const waves = multipleWaves;
        const result = preprocessOperations(waves);

        result.operations.forEach((op, index) => {
          expect(op.waveIndex).toBeDefined();
          expect(op.opIndex).toBeDefined();
          expect(op.originalIndex).toBe(index);
        });
      });
    });
  });

  describe('isColumnInSet', () => {
    describe('Single column matching', () => {
      it('should match single columns', () => {
        expect(isColumnInSet(3, '3')).toBe(true);
        expect(isColumnInSet(3, '2')).toBe(false);
        expect(isColumnInSet(1, '1')).toBe(true);
        expect(isColumnInSet(8, '8')).toBe(true);
      });
    });

    describe('Range matching', () => {
      it('should match ranges', () => {
        expect(isColumnInSet(3, '1-5')).toBe(true);
        expect(isColumnInSet(1, '1-5')).toBe(true);
        expect(isColumnInSet(5, '1-5')).toBe(true);
        expect(isColumnInSet(6, '1-5')).toBe(false);
        expect(isColumnInSet(0, '1-5')).toBe(false);
      });
    });

    describe('Complex sets', () => {
      it('should match complex sets', () => {
        expect(isColumnInSet(3, '1-3 5 7-8')).toBe(true);
        expect(isColumnInSet(5, '1-3 5 7-8')).toBe(true);
        expect(isColumnInSet(7, '1-3 5 7-8')).toBe(true);
        expect(isColumnInSet(8, '1-3 5 7-8')).toBe(true);
        expect(isColumnInSet(4, '1-3 5 7-8')).toBe(false);
        expect(isColumnInSet(6, '1-3 5 7-8')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty or undefined column sets', () => {
        expect(isColumnInSet(3, '')).toBe(true);
        expect(isColumnInSet(3, undefined)).toBe(true);
        expect(isColumnInSet(3, null)).toBe(true);
      });

      it('should handle whitespace in column sets', () => {
        expect(isColumnInSet(3, ' 1-5 ')).toBe(true);
        expect(isColumnInSet(3, '1 - 5')).toBe(false); // Invalid format
      });
    });
  });

  describe('solveCobReuse', () => {
    describe('Basic scenarios', () => {
      it('should solve simple single cannon single fire', () => {
        const result = solveCobReuse(singleCannon, [
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 }
        ]);

        expect(result.successCount).toBe(1);
        expect(result.fireResults).toHaveLength(1);
        expect(result.fireResults[0].cannonRow).toBe(1);
        expect(result.fireResults[0].cannonCol).toBe(3);
      });

      it('should handle multiple cannons', () => {
        const operations = [
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 },
          { type: 'fire', absoluteTime: 2000, targetCol: 8, columns: '1-5', originalIndex: 1 }
        ];

        const result = solveCobReuse(multipleCannons, operations);

        expect(result.successCount).toBe(2);
        expect(result.fireResults).toHaveLength(2);
        
        // Verify different cannons are used
        const usedCannons = result.fireResults.map(r => `${r.cannonRow}-${r.cannonCol}`);
        expect(new Set(usedCannons).size).toBe(2);
      });
    });

    describe('Constraint handling', () => {
      it('should respect cooldown constraints', () => {
        const operations = [
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 },
          { type: 'fire', absoluteTime: 2000, targetCol: 9, columns: '1-5', originalIndex: 1 } // Too soon
        ];

        const result = solveCobReuse(singleCannon, operations);
        expect(result.successCount).toBe(1); // Only first operation should succeed
      });

      it('should handle column restrictions', () => {
        const cannons = [
          { row: 1, col: 3 }, // Can fire
          { row: 2, col: 6 }  // Cannot fire due to column restriction
        ];
        const operations = [
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-4', originalIndex: 0 }
        ];

        const result = solveCobReuse(cannons, operations);

        expect(result.successCount).toBe(1);
        expect(result.fireResults[0].cannonCol).toBe(3); // Should use cannon in column 3
      });
    });

    describe('Plant and remove operations', () => {
      it('should handle plant operations', () => {
        const operations = [
          { type: 'plant', absoluteTime: 0, row: 1, targetCol: 3, originalIndex: 0 },
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 1 }
        ];

        const result = solveCobReuse([], operations);

        expect(result.successCount).toBe(1);
        expect(result.fireResults[0].cannonRow).toBe(1);
        expect(result.fireResults[0].cannonCol).toBe(3);
      });

      it('should handle remove operations', () => {
        const operations = [
          { type: 'remove', absoluteTime: 500, row: 1, targetCol: 3, originalIndex: 0 },
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 1 }
        ];

        const result = solveCobReuse(singleCannon, operations);
        expect(result.successCount).toBe(0); // Cannon removed before fire
      });

      it('should prevent shooting after cannon removal', () => {
        const operations = [
          { type: 'remove', absoluteTime: 0, row: 1, targetCol: 1, originalIndex: 0 },
          { type: 'fire', absoluteTime: 200, targetCol: 9, columns: '1-8', originalIndex: 1 }
        ];

        const result = solveCobReuse([{ row: 1, col: 1 }], operations);
        expect(result.successCount).toBe(0);
      });
    });

    describe('Complex scenarios', () => {
      it('should handle complex scenarios with multiple operations and constraints', () => {
        const { cannons, operations, expectedSuccessCount } = {
          cannons: [
            { row: 1, col: 2 },
            { row: 2, col: 4 },
            { row: 3, col: 6 }
          ],
          operations: [
            { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-4', originalIndex: 0 },
            { type: 'fire', absoluteTime: 2000, targetCol: 8, columns: '1-4', originalIndex: 1 },
            { type: 'fire', absoluteTime: 3000, targetCol: 7, columns: '4-8', originalIndex: 2 },
            { type: 'fire', absoluteTime: 6000, targetCol: 9, columns: '1-4', originalIndex: 3 }
          ],
          expectedSuccessCount: 4
        };

        const result = solveCobReuse(cannons, operations);

        expect(result.successCount).toBe(expectedSuccessCount);
        expect(result.fireResults).toHaveLength(expectedSuccessCount);

        // Verify different cannons are used for first three operations
        const usedCannons = new Set();
        for (let i = 0; i < 3; i++) {
          const key = `${result.fireResults[i].cannonRow}-${result.fireResults[i].cannonCol}`;
          usedCannons.add(key);
        }
        expect(usedCannons.size).toBe(3);
      });
    });

    describe('Next available times', () => {
      it('should calculate next available times correctly', () => {
        const operations = [
          { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 }
        ];

        const result = solveCobReuse(singleCannon, operations);

        expect(result.nextAvailableTimes).toHaveLength(1);
        expect(result.nextAvailableTimes[0].row).toBe(1);
        expect(result.nextAvailableTimes[0].col).toBe(3);
        
        // Should be fire time + cooldown + fly time to column 9
        const expectedTime = (1000 - getRoofFlyTime(3, 9)) + 3475 + getRoofFlyTime(3, 9);
        expect(result.nextAvailableTimes[0].nextAvailable).toBe(expectedTime);
      });
    });
  });

  describe('solveReuse', () => {
    describe('Integration', () => {
      it('should integrate preprocessing and solving', () => {
        const waves = [
          {
            duration: 1000,
            operations: [
              { time: '500', type: 'fire', targetCol: 9, columns: '1-5' },
              { time: 'w-200', type: 'fire', targetCol: 8, columns: '1-5' }
            ]
          }
        ];

        const result = solveReuse(multipleCannons, waves);

        expect(result.operations).toHaveLength(2);
        expect(result.successCount).toBe(2);
        expect(result.operations[0].success).toBe(true);
        expect(result.operations[1].success).toBe(true);
      });

      it('should map results back to original operations', () => {
        const waves = [
          {
            duration: 1000,
            operations: [
              { time: '500', type: 'fire', targetCol: 9, columns: '1-5' }
            ]
          }
        ];

        const result = solveReuse(singleCannon, waves);

        expect(result.operations[0].cannonRow).toBe(1);
        expect(result.operations[0].cannonCol).toBe(3);
        expect(result.operations[0].success).toBe(true);
      });
    });

    describe('Next available cannon calculation', () => {
      it('should calculate next available cannons', () => {
        const waves = [
          {
            duration: 1000,
            operations: [
              { time: '500', type: 'fire', targetCol: 9, columns: '1-5' }
            ]
          }
        ];

        const result = solveReuse(singleCannon, waves);

        // Should duplicate the single cannon to reach 8 entries
        expect(result.nextAvailable).toHaveLength(8);
        expect(result.nextAvailable[0].position).toBe('1-3');
        expect(typeof result.nextAvailable[0].time).toBe('number');

        // Check that times are sorted
        for (let i = 1; i < result.nextAvailable.length; i++) {
          expect(result.nextAvailable[i].time).toBeGreaterThanOrEqual(result.nextAvailable[i-1].time);
        }
      });

      it('should correctly cycle through cannons when duplicating', () => {
        const cannons = [
          { row: 1, col: 3 },
          { row: 2, col: 5 },
          { row: 3, col: 7 }
        ];
        const waves = [
          {
            duration: 1000,
            operations: [
              { time: '500', type: 'fire', targetCol: 9, columns: '1-5' },
              { time: '600', type: 'fire', targetCol: 8, columns: '1-5' },
              { time: '700', type: 'fire', targetCol: 7, columns: '1-8' }
            ]
          }
        ];

        const result = solveReuse(cannons, waves);

        // Should have 8 entries (3 original + 5 duplicated)
        expect(result.nextAvailable).toHaveLength(8);

        // Check that all 3 cannon positions appear
        const positions = result.nextAvailable.map(c => c.position);
        expect(positions).toContain('1-3');
        expect(positions).toContain('2-5');
        expect(positions).toContain('3-7');

        // Count occurrences - should be fairly distributed
        const positionCounts = {};
        positions.forEach(pos => {
          positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });

        expect(positionCounts['1-3']).toBeGreaterThanOrEqual(2);
        expect(positionCounts['2-5']).toBeGreaterThanOrEqual(2);
        expect(positionCounts['3-7']).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Edge cases', () => {
      it('should handle user-reported scenario correctly', () => {
        const waves = [
          {
            duration: 601,
            operations: [
              { type: 'remove', time: '0', row: 1, targetCol: 1 },
              { type: 'fire', time: '200', row: 1, targetCol: 9, columns: '1-8' }
            ]
          }
        ];

        const result = solveReuse([{ row: 1, col: 1 }], waves);

        // Should fail - no successful operations since cannon was removed
        expect(result.successCount).toBe(0);
        expect(result.operations[1].success).toBe(false);
      });

      it('should handle cross-wave operations', () => {
        const result = solveReuse(edgeCases.crossWaveOps.cannons, edgeCases.crossWaveOps.waves);
        
        // Should handle complex cross-wave timing
        expect(result.operations).toHaveLength(4);
        expect(result.operations.some(op => op.success)).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('should handle moderate configurations efficiently', () => {
      const start = performance.now();
      
      // Use a smaller configuration to avoid memory issues
      const result = solveReuse(multipleCannons, [
        {
          duration: 5000,
          operations: Array.from({ length: 10 }, (_, i) => ({
            type: 'fire',
            time: `${i * 500}`,
            targetCol: 5 + (i % 3) * 0.5,
            columns: '1-8'
          }))
        }
      ]);
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.operations).toHaveLength(10);
    });
  });
});