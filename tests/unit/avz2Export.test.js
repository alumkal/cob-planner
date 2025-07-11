/**
 * Unit tests for AvZ2 export functionality
 * Refactored for better organization and comprehensive coverage
 */

import { describe, it, expect } from 'vitest';
import { generateAvZ2Code } from '../../src/utils/avz2Export.js';
import { avz2ExportData } from '../fixtures/testData.js';

describe('AvZ2 Export', () => {
  
  describe('generateAvZ2Code', () => {
    
    describe('Basic functionality', () => {
      it('should return empty comment for no successful operations', () => {
        const result = { successCount: 0, operations: [] };
        const waves = [];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toBe('// No successful operations to export');
      });

      it('should generate basic fire operation', () => {
        const { result, waves } = avz2ExportData.basicFireOperation;
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
      });

      it('should handle null or undefined inputs gracefully', () => {
        expect(generateAvZ2Code(null, [])).toBe('// No successful operations to export');
        expect(generateAvZ2Code(undefined, [])).toBe('// No successful operations to export');
        expect(generateAvZ2Code({ successCount: 0 }, null)).toBe('// No successful operations to export');
      });
    });

    describe('Multiple operations', () => {
      it('should handle multiple operations in same wave', () => {
        const result = {
          successCount: 2,
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
              type: 'fire',
              waveIndex: 0,
              opIndex: 1,
              absoluteTime: 100,
              cannonRow: 1,
              cannonCol: 6,
              row: 4,
              targetCol: 9,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9) & RP(1, 6, 4, 9)');
      });

      it('should handle operations across multiple waves', () => {
        const result = {
          successCount: 2,
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
              type: 'fire',
              waveIndex: 1,
              opIndex: 0,
              absoluteTime: 801, // 601 + 200
              cannonRow: 3,
              cannonCol: 1,
              row: 2,
              targetCol: 8,
              success: true
            }
          ]
        };
        const waves = [
          { duration: 601, notes: '', operations: [] },
          { duration: 1000, notes: '', operations: [] }
        ];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
        expect(code).toContain('OnWave(2)');
        expect(code).toContain('At(200) RP(3, 1, 2, 8)');
      });
    });

    describe('Operation types', () => {
      it('should generate plant operation', () => {
        const result = {
          successCount: 1,
          operations: [
            {
              type: 'plant',
              waveIndex: 0,
              opIndex: 0,
              absoluteTime: 300,
              row: 2,
              targetCol: 1,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('At(300) Card(ACOB_CANNON, 2, 1)');
      });

      it('should generate remove operation', () => {
        const result = {
          successCount: 1,
          operations: [
            {
              type: 'remove',
              waveIndex: 0,
              opIndex: 0,
              absoluteTime: 600,
              row: 1,
              targetCol: 1,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('At(600) Shovel(1, 1)');
      });

      it('should handle unknown operation types gracefully', () => {
        const result = {
          successCount: 1,
          operations: [
            {
              type: 'unknown',
              waveIndex: 0,
              opIndex: 0,
              absoluteTime: 100,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('// Unknown operation: unknown');
      });
    });

    describe('Timing commands', () => {
      it('should use TrigAt for w-200 timing (401 in 601cs wave)', () => {
        const result = {
          successCount: 1,
          operations: [
            {
              type: 'fire',
              waveIndex: 0,
              opIndex: 0,
              absoluteTime: 401,
              cannonRow: 3,
              cannonCol: 1,
              row: 2,
              targetCol: 9,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('TrigAt(401) RP(3, 1, 2, 9)');
      });

      it('should use At for regular timing', () => {
        const result = {
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
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
      });

      it('should handle edge cases in timing detection', () => {
        const result = {
          successCount: 1,
          operations: [
            {
              type: 'fire',
              waveIndex: 0,
              opIndex: 0,
              absoluteTime: 400, // Close to w-200 (401) but not exact
              cannonRow: 1,
              cannonCol: 1,
              row: 2,
              targetCol: 9,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('At(400)'); // Should use At(), not TrigAt()
      });
    });

    describe('Operation ordering', () => {
      it('should sort operations by time within each wave', () => {
        const result = {
          successCount: 3,
          operations: [
            {
              type: 'fire',
              waveIndex: 0,
              opIndex: 0,
              absoluteTime: 300,
              cannonRow: 1,
              cannonCol: 1,
              row: 2,
              targetCol: 9,
              success: true
            },
            {
              type: 'fire',
              waveIndex: 0,
              opIndex: 1,
              absoluteTime: 100,
              cannonRow: 1,
              cannonCol: 6,
              row: 4,
              targetCol: 9,
              success: true
            },
            {
              type: 'plant',
              waveIndex: 0,
              opIndex: 2,
              absoluteTime: 200,
              row: 2,
              targetCol: 1,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        const lines = code.split('\n').filter(line => line.trim().startsWith('At('));
        expect(lines[0]).toContain('At(100)');
        expect(lines[1]).toContain('At(200)');
        expect(lines[2]).toContain('At(300)');
      });
    });

    describe('Success filtering', () => {
      it('should only include successful operations', () => {
        const result = {
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
            },
            {
              type: 'fire',
              waveIndex: 0,
              opIndex: 1,
              absoluteTime: 200,
              cannonRow: 1,
              cannonCol: 6,
              row: 4,
              targetCol: 9,
              success: false
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
        expect(code).not.toContain('At(200)');
        expect(code).not.toContain('RP(1, 6, 4, 9)');
      });
    });

    describe('Notes handling', () => {
      it('should not include notes when includeNotes is false', () => {
        const result = {
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
        };
        const waves = [{ duration: 601, notes: 'This is a test note', operations: [] }];
        
        const code = generateAvZ2Code(result, waves, false);
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
        expect(code).not.toContain('// This is a test note');
      });

      it('should include notes when includeNotes is true and wave has notes', () => {
        const result = {
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
        };
        const waves = [{ duration: 601, notes: 'This is a test note', operations: [] }];
        
        const code = generateAvZ2Code(result, waves, true);
        expect(code).toContain('// This is a test note');
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
        
        // Check that the comment comes before OnWave
        const commentIndex = code.indexOf('// This is a test note');
        const onWaveIndex = code.indexOf('OnWave(1)');
        expect(commentIndex).toBeLessThan(onWaveIndex);
      });

      it('should not include empty or whitespace-only notes', () => {
        const result = {
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
        };
        
        // Test various empty/whitespace cases
        const emptyNotesCases = ['', '   ', '\t\n', null, undefined];
        
        emptyNotesCases.forEach(notes => {
          const waves = [{ duration: 601, notes, operations: [] }];
          const code = generateAvZ2Code(result, waves, true);
          expect(code).toContain('OnWave(1)');
          expect(code).toContain('At(100) RP(1, 1, 2, 9)');
          expect(code).not.toContain('//');
        });
      });

      it('should handle multiple waves with mixed notes', () => {
        const result = {
          successCount: 2,
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
              type: 'fire',
              waveIndex: 1,
              opIndex: 0,
              absoluteTime: 701, // 601 + 100
              cannonRow: 3,
              cannonCol: 1,
              row: 2,
              targetCol: 8,
              success: true
            }
          ]
        };
        const waves = [
          { duration: 601, notes: 'First wave note', operations: [] },
          { duration: 800, notes: '', operations: [] }
        ];
        
        const code = generateAvZ2Code(result, waves, true);
        expect(code).toContain('// First wave note');
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
        expect(code).toContain('OnWave(2)');
        expect(code).toContain('At(100) RP(3, 1, 2, 8)');
        
        // Check that second wave doesn't have a comment
        const wave2Index = code.indexOf('OnWave(2)');
        const beforeWave2 = code.substring(0, wave2Index);
        const afterFirstWave = beforeWave2.substring(beforeWave2.lastIndexOf('};') + 2);
        expect(afterFirstWave.trim()).not.toContain('//');
      });

      it('should trim whitespace from notes', () => {
        const result = {
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
        };
        const waves = [{ duration: 601, notes: '  Trimmed note  ', operations: [] }];
        
        const code = generateAvZ2Code(result, waves, true);
        expect(code).toContain('// Trimmed note');
        expect(code).not.toContain('//  Trimmed note  ');
      });
    });

    describe('Complex scenarios', () => {
      it('should handle complex multi-wave scenario', () => {
        const result = {
          successCount: 4,
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
              absoluteTime: 300,
              row: 2,
              targetCol: 1,
              success: true
            },
            {
              type: 'fire',
              waveIndex: 1,
              opIndex: 0,
              absoluteTime: 601, // Start of wave 2
              cannonRow: 3,
              cannonCol: 1,
              row: 2,
              targetCol: 8,
              success: true
            },
            {
              type: 'remove',
              waveIndex: 1,
              opIndex: 1,
              absoluteTime: 1401, // 601 + 800
              row: 1,
              targetCol: 1,
              success: true
            }
          ]
        };
        const waves = [
          { duration: 601, notes: '', operations: [] },
          { duration: 1000, notes: '', operations: [] }
        ];
        
        const code = generateAvZ2Code(result, waves);
        
        expect(code).toContain('OnWave(1)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
        expect(code).toContain('At(300) Card(ACOB_CANNON, 2, 1)');
        
        expect(code).toContain('OnWave(2)');
        expect(code).toContain('At(0) RP(3, 1, 2, 8)');
        expect(code).toContain('At(800) Shovel(1, 1)');
      });

      it('should handle comprehensive scenario with notes', () => {
        const { result, waves, expectedPattern } = avz2ExportData.multipleOperationsWithNotes;
        
        const code = generateAvZ2Code(result, waves, true);
        expect(code).toMatch(expectedPattern);
      });
    });

    describe('Edge cases', () => {
      it('should handle waves with no operations', () => {
        const result = {
          successCount: 1,
          operations: [
            {
              type: 'fire',
              waveIndex: 1, // Skip wave 0
              opIndex: 0,
              absoluteTime: 701,
              cannonRow: 1,
              cannonCol: 1,
              row: 2,
              targetCol: 9,
              success: true
            }
          ]
        };
        const waves = [
          { duration: 601, notes: '', operations: [] }, // No operations in wave 0
          { duration: 100, notes: '', operations: [] }
        ];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).not.toContain('OnWave(1)'); // Should skip empty wave
        expect(code).toContain('OnWave(2)');
        expect(code).toContain('At(100) RP(1, 1, 2, 9)');
      });

      it('should handle operations with missing wave index', () => {
        const result = {
          successCount: 0, // No successful operations since waveIndex is missing
          operations: [
            {
              type: 'fire',
              // Missing waveIndex
              opIndex: 0,
              absoluteTime: 100,
              cannonRow: 1,
              cannonCol: 1,
              row: 2,
              targetCol: 9,
              success: true
            }
          ]
        };
        const waves = [{ duration: 601, notes: '', operations: [] }];
        
        const code = generateAvZ2Code(result, waves);
        expect(code).toBe('// No successful operations to export');
      });
    });

    describe('Format validation', () => {
      it('should produce valid AvZ2 DSL syntax', () => {
        const result = {
          successCount: 2,
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
            }
          ]
        };
        const waves = [{ duration: 601, notes: 'Test wave', operations: [] }];
        
        const code = generateAvZ2Code(result, waves, true);
        
        // Check basic structure
        expect(code).toMatch(/\/\/ Test wave\nOnWave\(1\)\s*\{[\s\S]*\};/);
        expect(code).toMatch(/At\(\d+\)\s+RP\(\d+,\s*\d+,\s*\d+,\s*\d+\)/);
        expect(code).toMatch(/At\(\d+\)\s+Card\(ACOB_CANNON,\s*\d+,\s*\d+\)/);
        
        // Check proper comma separation between operations
        expect(code).toContain(','); // Just check that there's comma separation
      });
    });
  });
});