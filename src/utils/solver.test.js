import { describe, test, expect } from 'vitest';
import { getRoofFlyTime, preprocessOperations, isColumnInSet, solveCobReuse, solveReuse } from './solver.js';

describe('getRoofFlyTime', () => {
  test('should calculate fly time correctly for various columns', () => {
    // Test cases based on the C++ implementation
    expect(getRoofFlyTime(1, 6.4375)).toBe(359); // dropX = 515, exactly at minDropX
    expect(getRoofFlyTime(1, 5.0)).toBe(363); // dropX = 400, below minDropX
    expect(getRoofFlyTime(2, 6.0)).toBe(363); // dropX = 480, below minDropX
    expect(getRoofFlyTime(8, 9.0)).toBe(373); // dropX = 720, above minDropX
  });

  test('should handle edge cases', () => {
    expect(getRoofFlyTime(1, 0)).toBe(376); // Very low dropX
    expect(getRoofFlyTime(1, 9.9875)).toBe(359); // Maximum dropX
  });
});

describe('preprocessOperations', () => {
  test('should convert relative times to absolute times', () => {
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

    // Should be sorted by absolute time
    expect(result.operations[0].absoluteTime).toBeLessThanOrEqual(result.operations[1].absoluteTime);
    expect(result.operations[1].absoluteTime).toBeLessThanOrEqual(result.operations[2].absoluteTime);
  });

  test('should handle negative relative times', () => {
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

  test('should handle complex expressions', () => {
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

describe('isColumnInSet', () => {
  test('should match single columns', () => {
    expect(isColumnInSet(3, '3')).toBe(true);
    expect(isColumnInSet(3, '2')).toBe(false);
  });

  test('should match ranges', () => {
    expect(isColumnInSet(3, '1-5')).toBe(true);
    expect(isColumnInSet(1, '1-5')).toBe(true);
    expect(isColumnInSet(5, '1-5')).toBe(true);
    expect(isColumnInSet(6, '1-5')).toBe(false);
  });

  test('should match complex sets', () => {
    expect(isColumnInSet(3, '1-3 5 7-8')).toBe(true);
    expect(isColumnInSet(5, '1-3 5 7-8')).toBe(true);
    expect(isColumnInSet(7, '1-3 5 7-8')).toBe(true);
    expect(isColumnInSet(4, '1-3 5 7-8')).toBe(false);
    expect(isColumnInSet(6, '1-3 5 7-8')).toBe(false);
  });

  test('should handle empty or undefined column sets', () => {
    expect(isColumnInSet(3, '')).toBe(true);
    expect(isColumnInSet(3, undefined)).toBe(true);
    expect(isColumnInSet(3, null)).toBe(true);
  });
});

describe('solveCobReuse', () => {
  test('should solve simple single cannon single fire', () => {
    const cannons = [{ row: 1, col: 3 }];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 }
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(1);
    expect(result.fireResults).toHaveLength(1);
    expect(result.fireResults[0].cannonRow).toBe(1);
    expect(result.fireResults[0].cannonCol).toBe(3);
  });

  test('should handle multiple cannons', () => {
    const cannons = [
      { row: 1, col: 3 },
      { row: 2, col: 5 }
    ];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 },
      { type: 'fire', absoluteTime: 2000, targetCol: 8, columns: '1-5', originalIndex: 1 }
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(2);
    expect(result.fireResults).toHaveLength(2);
  });

  test('should respect cooldown constraints', () => {
    const cannons = [{ row: 1, col: 3 }];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 },
      { type: 'fire', absoluteTime: 2000, targetCol: 9, columns: '1-5', originalIndex: 1 } // Too soon, should fail
    ];

    const result = solveCobReuse(cannons, operations);

    // Should only succeed first operation due to cooldown
    expect(result.successCount).toBe(1);
  });

  test('should handle column restrictions', () => {
    const cannons = [
      { row: 1, col: 3 },
      { row: 2, col: 6 }
    ];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-4', originalIndex: 0 } // Only cannon 1 can fire
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(1);
    expect(result.fireResults[0].cannonCol).toBe(3); // Should use cannon in column 3
  });

  test('should handle plant operations', () => {
    const cannons = [];
    const operations = [
      { type: 'plant', absoluteTime: 0, row: 1, targetCol: 3, originalIndex: 0 },
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 1 }
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(1);
    expect(result.fireResults[0].cannonRow).toBe(1);
    expect(result.fireResults[0].cannonCol).toBe(3);
  });

  test('should handle remove operations', () => {
    const cannons = [{ row: 1, col: 3 }];
    const operations = [
      { type: 'remove', absoluteTime: 500, row: 1, targetCol: 3, originalIndex: 0 },
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 1 }
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(0); // Cannon removed before fire
  });

  test('should prevent shooting after cannon is removed using targetCol format', () => {
    // Bug reproduction: "time 0: shovel 1-1; time 200: shoot to 1-9"
    const cannons = [{ row: 1, col: 1 }];
    const operations = [
      { type: 'remove', absoluteTime: 0, row: 1, targetCol: 1, originalIndex: 0 }, // Remove cannon at 1-1
      { type: 'fire', absoluteTime: 200, targetCol: 9, columns: '1-8', originalIndex: 1 } // Try to shoot
    ];

    const result = solveCobReuse(cannons, operations);

    // Should fail because cannon at 1-1 was removed at time 0
    expect(result.successCount).toBe(0);
  });

  test('should prevent shooting with exact scenario from user report', () => {
    // Exact user scenario: "time 0: shovel 1-1; time 200: shoot to 1-9"
    // Test using the solveReuse function which mimics real usage
    const cannons = [{ row: 1, col: 1 }];
    const waves = [
      {
        duration: 601,
        operations: [
          { type: 'remove', time: '0', row: 1, targetCol: 1 },  // shovel 1-1 at time 0
          { type: 'fire', time: '200', row: 1, targetCol: 9, columns: '1-8' } // shoot to 1-9 at time 200
        ]
      }
    ];

    const result = solveReuse(cannons, waves);

    // Should fail - no successful operations since cannon was removed
    expect(result.successCount).toBe(0);
    expect(result.operations[1].success).toBe(false);
  });

  test('should calculate next available times correctly', () => {
    const cannons = [{ row: 1, col: 3 }];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 }
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.nextAvailableTimes).toHaveLength(1);
    expect(result.nextAvailableTimes[0].row).toBe(1);
    expect(result.nextAvailableTimes[0].col).toBe(3);
    // Should be fire time + cooldown + fly time to column 9
    const expectedTime = (1000 - getRoofFlyTime(3, 9)) + 3475 + getRoofFlyTime(3, 9);
    expect(result.nextAvailableTimes[0].nextAvailable).toBe(expectedTime);
  });

  test('should handle complex scenarios with multiple operations and constraints', () => {
    const cannons = [
      { row: 1, col: 2 },
      { row: 2, col: 4 },
      { row: 3, col: 6 }
    ];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-4', originalIndex: 0 },
      { type: 'fire', absoluteTime: 2000, targetCol: 8, columns: '1-4', originalIndex: 1 },
      { type: 'fire', absoluteTime: 3000, targetCol: 7, columns: '4-8', originalIndex: 2 },
      { type: 'fire', absoluteTime: 6000, targetCol: 9, columns: '1-4', originalIndex: 3 } // Should reuse first cannon
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(4);
    expect(result.fireResults).toHaveLength(4);

    // First three operations should use different cannons
    const usedCannons = new Set();
    for (let i = 0; i < 3; i++) {
      const key = `${result.fireResults[i].cannonRow}-${result.fireResults[i].cannonCol}`;
      usedCannons.add(key);
    }
    expect(usedCannons.size).toBe(3);
  });

  test('should handle insufficient cannons scenario', () => {
    const cannons = [{ row: 1, col: 3 }];
    const operations = [
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 0 },
      { type: 'fire', absoluteTime: 2000, targetCol: 8, columns: '1-5', originalIndex: 1 } // Too soon for same cannon
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(1); // Only first operation should succeed
    expect(result.fireResults).toHaveLength(1);
  });

  test('should handle plant and remove operations correctly', () => {
    const cannons = [];
    const operations = [
      { type: 'plant', absoluteTime: 0, row: 1, targetCol: 3, originalIndex: 0 },
      { type: 'fire', absoluteTime: 1000, targetCol: 9, columns: '1-5', originalIndex: 1 },
      { type: 'remove', absoluteTime: 2000, row: 1, targetCol: 3, originalIndex: 2 },
      { type: 'fire', absoluteTime: 3000, targetCol: 8, columns: '1-5', originalIndex: 3 } // Should fail, cannon removed
    ];

    const result = solveCobReuse(cannons, operations);

    expect(result.successCount).toBe(1); // Only first fire should succeed
    expect(result.fireResults).toHaveLength(1);
    expect(result.fireResults[0].cannonRow).toBe(1);
    expect(result.fireResults[0].cannonCol).toBe(3);
  });
});

describe('solveReuse', () => {
  test('should integrate preprocessing and solving', () => {
    const cannons = [
      { row: 1, col: 3 },
      { row: 2, col: 5 }
    ];
    const waves = [
      {
        duration: 1000,
        operations: [
          { time: '500', type: 'fire', targetCol: 9, columns: '1-5' },
          { time: 'w-200', type: 'fire', targetCol: 8, columns: '1-5' }
        ]
      }
    ];

    const result = solveReuse(cannons, waves);

    expect(result.operations).toHaveLength(2);
    expect(result.successCount).toBe(2);
    expect(result.operations[0].success).toBe(true);
    expect(result.operations[1].success).toBe(true);
  });

  test('should map results back to original operations', () => {
    const cannons = [{ row: 1, col: 3 }];
    const waves = [
      {
        duration: 1000,
        operations: [
          { time: '500', type: 'fire', targetCol: 9, columns: '1-5' }
        ]
      }
    ];

    const result = solveReuse(cannons, waves);

    expect(result.operations[0].cannonRow).toBe(1);
    expect(result.operations[0].cannonCol).toBe(3);
    expect(result.operations[0].success).toBe(true);
  });

  test('should calculate next available cannons', () => {
    const cannons = [{ row: 1, col: 3 }];
    const waves = [
      {
        duration: 1000,
        operations: [
          { time: '500', type: 'fire', targetCol: 9, columns: '1-5' }
        ]
      }
    ];

    const result = solveReuse(cannons, waves);

    // Should duplicate the single cannon to reach 8 entries per spec
    expect(result.nextAvailable).toHaveLength(8);
    expect(result.nextAvailable[0].position).toBe('1-3');
    expect(typeof result.nextAvailable[0].time).toBe('number');

    // Check that times are increasing (sorted)
    for (let i = 1; i < result.nextAvailable.length; i++) {
      expect(result.nextAvailable[i].time).toBeGreaterThanOrEqual(result.nextAvailable[i-1].time);
    }
  });

  test('should correctly cycle through cannons when duplicating', () => {
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

    // Check that all 3 cannon positions appear in the list
    const positions = result.nextAvailable.map(c => c.position);
    expect(positions).toContain('1-3');
    expect(positions).toContain('2-5');
    expect(positions).toContain('3-7');

    // Count occurrences of each position (should cycle through cannons)
    const positionCounts = {};
    positions.forEach(pos => {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    // With 3 cannons filling 8 slots: 3*2 = 6, then 2 more
    // So distribution should be fairly even
    expect(positionCounts['1-3']).toBeGreaterThanOrEqual(2);
    expect(positionCounts['2-5']).toBeGreaterThanOrEqual(2);
    expect(positionCounts['3-7']).toBeGreaterThanOrEqual(2);
  });
});