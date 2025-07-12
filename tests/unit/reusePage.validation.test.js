/**
 * Unit tests for ReusePage validation functionality
 * Refactored for better organization and comprehensive coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ReusePage from '../../src/components/ReusePage.vue';
import { createTestStore, mountWithStore } from '../helpers/testUtils.js';
import { testStoreConfigs, basicWave, edgeCases } from '../fixtures/testData.js';
import {
  validateTime,
  validateRow,
  validateTargetCol,
  validateColumns,
  validateCannonPosition,
  validateWaveDuration,
  validateOperation,
  validateWave
} from '../../src/utils/validation.js';

describe('ReusePage Validation', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = createTestStore('basic');
    wrapper = mountWithStore(ReusePage, { store });
  });

  describe('validateTime', () => {
    describe('Valid time formats', () => {
      it('should accept valid integer times', () => {
        expect(validateTime('300')).toBeNull();
        expect(validateTime('0')).toBeNull();
        expect(validateTime('1000')).toBeNull();
        expect(validateTime('-100')).toBeNull();
      });

      it('should accept valid variable expressions', () => {
        expect(validateTime('w')).toBeNull();
        expect(validateTime('w-200')).toBeNull();
        expect(validateTime('w+100')).toBeNull();
      });

      it('should accept complex mathematical expressions', () => {
        // Test expressions that are now supported by the new validator
        const expressions = ['w + 100', 'w * 2', 'w - 200 + 50', '(w + 100) / 2', 'w/2', 'w*2+100'];
        expressions.forEach(expr => {
          const result = validateTime(expr);
          expect(result).toBeNull();
        });
      });
    });

    describe('Invalid time formats', () => {
      it('should reject empty or invalid times', () => {
        expect(validateTime('')).toContain('时间不能为空');
        expect(validateTime('   ')).toContain('时间不能为空');
        expect(validateTime('abc')).toContain('时间表达式语法错误');
        // Note: 300.5 and 1.5 are now valid as they return finite numbers
        expect(validateTime('300.5')).toBeNull();
        expect(validateTime('1.5')).toBeNull();
      });

      it('should reject invalid variable expressions', () => {
        expect(validateTime('w-')).toContain('时间表达式语法错误');
        expect(validateTime('w-abc')).toContain('时间表达式语法错误');
        expect(validateTime('x-200')).toContain('时间表达式语法错误');
        expect(validateTime('w..200')).toContain('时间表达式语法错误');
      });

      it('should reject dangerous expressions', () => {
        // These expressions may either cause syntax errors or return non-finite values
        expect(validateTime('eval(alert())')).not.toBeNull();
        expect(validateTime('function()')).not.toBeNull();
        expect(validateTime('while(true){}')).not.toBeNull();
      });

      it('should reject expressions that return non-finite values', () => {
        expect(validateTime('w/0')).toContain('时间表达式必须返回有限数值');
        expect(validateTime('Infinity')).toContain('时间表达式必须返回有限数值');
        expect(validateTime('NaN')).toContain('时间表达式必须返回有限数值');
        expect(validateTime('undefined')).toContain('时间表达式必须返回有限数值');
      });
    });

    describe('Absolute time constraints', () => {
      const testWaves = [{ duration: 601, operations: [] }];
      
      it('should allow negative times if absolute time >= -600', () => {
        // Wave 0 starts at absolute time 0, so -100 gives absolute time -100 (valid)
        expect(validateTime('-100', 0, testWaves)).toBeNull();
        expect(validateTime('-500', 0, testWaves)).toBeNull();
        expect(validateTime('-600', 0, testWaves)).toBeNull();
      });

      it('should reject times that result in absolute time < -600', () => {
        // Wave 0 starts at absolute time 0, so -700 gives absolute time -700 (invalid)
        expect(validateTime('-700', 0, testWaves)).toContain('绝对时间不能小于-600');
        expect(validateTime('-1000', 0, testWaves)).toContain('绝对时间不能小于-600');
      });

      it('should validate variable expressions with absolute time constraint', () => {
        // w-200 in wave 0 (duration 601) gives absolute time 0 + (601-200) = 401 (valid)
        expect(validateTime('w-200', 0, testWaves)).toBeNull();
        
        // w-1300 in wave 0 (duration 601) gives absolute time 0 + (601-1300) = -699 (invalid)
        expect(validateTime('w-1300', 0, testWaves)).toContain('绝对时间不能小于-600');
      });

      it('should handle multi-wave absolute time calculations', () => {
        const multiWaveTestWaves = [
          { duration: 1000, operations: [] },
          { duration: 1000, operations: [] }
        ];
        
        // Wave 1 starts at absolute time 1000 (after wave 0's duration)
        // So w-1500 in wave 1 gives absolute time 1000 + (1000-1500) = 500 (valid)
        expect(validateTime('w-1500', 1, multiWaveTestWaves)).toBeNull();
        
        // But w-2000 in wave 1 gives absolute time 1000 + (1000-2000) = 0 (valid)
        expect(validateTime('w-2000', 1, multiWaveTestWaves)).toBeNull();
      });
    });
  });

  describe('validateRow', () => {
    describe('Valid rows', () => {
      it('should accept valid rows for all operation types', () => {
        const operationTypes = ['fire', 'plant', 'remove'];
        
        operationTypes.forEach(type => {
          for (let row = 1; row <= 5; row++) {
            expect(validateRow(row, type, 5)).toBeNull();
          }
        });
      });
    });

    describe('Invalid rows', () => {
      it('should reject invalid row values', () => {
        const invalidRows = [null, '', undefined, 0, 6, -1, 1.5, 'abc', NaN, Infinity];
        
        invalidRows.forEach(row => {
          const result = validateRow(row, 'fire', 5);
          expect(result).toBeTruthy();
          expect(result).toContain('行数');
        });
      });

      it('should provide specific error messages for different invalid types', () => {
        expect(validateRow(null, 'fire', 5)).toContain('行数不能为空');
        expect(validateRow('', 'fire', 5)).toContain('行数不能为空');
        expect(validateRow(1.5, 'fire', 5)).toContain('行数必须是整数');
        expect(validateRow(0, 'fire', 5)).toContain('行数必须在 1-5 范围内');
        expect(validateRow(6, 'fire', 5)).toContain('行数必须在 1-5 范围内');
      });
    });
  });

  describe('validateTargetCol', () => {
    describe('Fire operations', () => {
      it('should accept valid target columns with 1/80 precision', () => {
        const validValues = [
          0, 0.0125, 0.025, 1.0, 5.5, 8.0125, 9.0, 9.9875
        ];
        
        validValues.forEach(value => {
          expect(validateTargetCol(value, 'fire')).toBeNull();
        });
      });

      it('should reject invalid target columns for fire operations', () => {
        expect(validateTargetCol(null, 'fire')).toContain('列数不能为空');
        expect(validateTargetCol(-1, 'fire')).toContain('目标列必须在 0-9.9875 范围内');
        expect(validateTargetCol(10, 'fire')).toContain('目标列必须在 0-9.9875 范围内');
        
        // Test 1/80 multiple validation
        expect(validateTargetCol(0.01, 'fire')).toContain('目标列必须是 1/80 的整数倍');
        expect(validateTargetCol(0.013, 'fire')).toContain('目标列必须是 1/80 的整数倍');
        expect(validateTargetCol(5.51, 'fire')).toContain('目标列必须是 1/80 的整数倍');
        expect(validateTargetCol(1.01, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      });

      it('should handle edge cases in precision validation', () => {
        // Test very small precision differences
        expect(validateTargetCol(0.0124, 'fire')).toContain('目标列必须是 1/80 的整数倍');
        expect(validateTargetCol(0.0126, 'fire')).toContain('目标列必须是 1/80 的整数倍');
        
        // Test boundary values
        expect(validateTargetCol(0, 'fire')).toBeNull(); // Exactly 0
        expect(validateTargetCol(9.9875, 'fire')).toBeNull(); // Exactly 9.9875
      });
    });

    describe('Plant/Remove operations', () => {
      it('should accept valid columns for plant/remove operations', () => {
        const validValues = [1, 2, 3, 4, 5, 6, 7, 8];
        
        validValues.forEach(value => {
          expect(validateTargetCol(value, 'plant')).toBeNull();
          expect(validateTargetCol(value, 'remove')).toBeNull();
        });
      });

      it('should reject invalid columns for plant/remove operations', () => {
        expect(validateTargetCol(null, 'plant')).toContain('列数不能为空');
        expect(validateTargetCol(1.5, 'plant')).toContain('列数必须是整数');
        expect(validateTargetCol(0, 'plant')).toContain('列数必须在 1-8 范围内');
        expect(validateTargetCol(9, 'remove')).toContain('列数必须在 1-8 范围内');
        expect(validateTargetCol(-1, 'remove')).toContain('列数必须在 1-8 范围内');
      });
    });
  });

  describe('validateColumns', () => {
    describe('Valid column specifications', () => {
      it('should accept valid column specifications', () => {
        const validSpecs = [
          '1-8', '1 3 5', '1-3 5-7', '2', '1-2', '7-8', '1-8', '1 2 3 4 5 6 7 8'
        ];
        
        validSpecs.forEach(spec => {
          expect(validateColumns(spec)).toBeNull();
        });
      });

      it('should accept single columns', () => {
        for (let i = 1; i <= 8; i++) {
          expect(validateColumns(i.toString())).toBeNull();
        }
      });

      it('should accept ranges', () => {
        expect(validateColumns('1-5')).toBeNull();
        expect(validateColumns('3-7')).toBeNull();
        expect(validateColumns('1-8')).toBeNull();
      });

      it('should accept complex combinations', () => {
        expect(validateColumns('1-3 5 7-8')).toBeNull();
        expect(validateColumns('1 3 5 7')).toBeNull();
        expect(validateColumns('2-4 6-8')).toBeNull();
      });
    });

    describe('Invalid column specifications', () => {
      it('should reject empty or invalid specifications', () => {
        expect(validateColumns('')).toContain('发射列不能为空');
        expect(validateColumns('   ')).toContain('发射列不能为空');
        expect(validateColumns(null)).toContain('发射列不能为空');
      });

      it('should reject out-of-range columns', () => {
        expect(validateColumns('0-8')).toContain('列范围必须在 1-8 范围内');
        expect(validateColumns('1-9')).toContain('列范围必须在 1-8 范围内');
        expect(validateColumns('0')).toContain('列数必须在 1-8 范围内');
        expect(validateColumns('9')).toContain('列数必须在 1-8 范围内');
      });

      it('should reject invalid range formats', () => {
        expect(validateColumns('5-3')).toContain('列范围起始列不能大于结束列');
        expect(validateColumns('8-1')).toContain('列范围起始列不能大于结束列');
        expect(validateColumns('abc')).toContain('列数必须是整数');
        expect(validateColumns('1.5-3')).toContain('列范围必须是整数');
        expect(validateColumns('1-')).toContain('列范围必须是整数');
        expect(validateColumns('-3')).toContain('列范围必须是整数');
      });
    });
  });

  describe('validateCannonPosition', () => {
    const testCannons = [
      { row: 1, col: 1 },
      { row: 2, col: 3 },
      { row: 3, col: 7 }
    ];
    const testWaves = [{ duration: 601, operations: [] }];
    
    describe('Remove operations', () => {
      it('should accept valid cannon removal', () => {
        // Based on basicCannons fixture: cannons at (1,1), (2,3), (3,7)
        expect(validateCannonPosition(1, 1, 'remove', 0, 0, testCannons, testWaves)).toBeNull();
        expect(validateCannonPosition(2, 3, 'remove', 0, 0, testCannons, testWaves)).toBeNull();
        expect(validateCannonPosition(3, 7, 'remove', 0, 0, testCannons, testWaves)).toBeNull();
      });

      it('should reject invalid cannon removal', () => {
        // No cannons at these positions
        expect(validateCannonPosition(1, 2, 'remove', 0, 0, testCannons, testWaves)).toContain('该位置没有炮可以铲除');
        expect(validateCannonPosition(5, 8, 'remove', 0, 0, testCannons, testWaves)).toContain('该位置没有炮可以铲除');
        expect(validateCannonPosition(4, 4, 'remove', 0, 0, testCannons, testWaves)).toContain('该位置没有炮可以铲除');
      });
    });

    describe('Plant operations', () => {
      it('should accept valid cannon planting', () => {
        // Positions that don't overlap with existing cannons
        expect(validateCannonPosition(1, 4, 'plant', 0, 0, testCannons, testWaves)).toBeNull(); // Far from (1,1)
        expect(validateCannonPosition(4, 5, 'plant', 0, 0, testCannons, testWaves)).toBeNull(); // Different row
        expect(validateCannonPosition(5, 1, 'plant', 0, 0, testCannons, testWaves)).toBeNull(); // Different row
        expect(validateCannonPosition(2, 6, 'plant', 0, 0, testCannons, testWaves)).toBeNull(); // Far from (2,3)
      });

      it('should reject invalid cannon planting', () => {
        // Exact overlaps
        expect(validateCannonPosition(1, 1, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
        expect(validateCannonPosition(2, 3, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
        expect(validateCannonPosition(3, 7, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
        
        // Adjacent overlaps (cobs are 1x2, so adjacent columns in same row overlap)
        expect(validateCannonPosition(1, 2, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
        expect(validateCannonPosition(2, 4, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
        expect(validateCannonPosition(3, 8, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
      });
    });

    describe('Fire operations', () => {
      it('should return null for fire operations', () => {
        expect(validateCannonPosition(1, 1, 'fire', 0, 0, testCannons, testWaves)).toBeNull();
        expect(validateCannonPosition(5, 8, 'fire', 0, 0, testCannons, testWaves)).toBeNull();
        expect(validateCannonPosition(999, 999, 'fire', 0, 0, testCannons, testWaves)).toBeNull();
      });
    });

    describe('Sequential operations', () => {
      it('should handle sequential plant/remove operations correctly', () => {
        const sequentialWaves = [
          {
            duration: 601,
            operations: [
              { type: 'plant', time: '0', columns: '1-8', row: 4, targetCol: 6 },
              { type: 'remove', time: '1', columns: '1-8', row: 4, targetCol: 6 },
              { type: 'plant', time: '2', columns: '1-8', row: 4, targetCol: 6 }
            ]
          }
        ];
        
        // First plant operation (index 0) - should pass
        expect(validateCannonPosition(4, 6, 'plant', 0, 0, testCannons, sequentialWaves)).toBeNull();
        
        // Remove operation (index 1) - should pass (cannon was planted)
        expect(validateCannonPosition(4, 6, 'remove', 0, 1, testCannons, sequentialWaves)).toBeNull();
        
        // Second plant operation (index 2) - should pass (cannon was removed)
        expect(validateCannonPosition(4, 6, 'plant', 0, 2, testCannons, sequentialWaves)).toBeNull();
      });

      it('should handle cross-wave operations with negative time correctly', () => {
        const crossWaveTestWaves = [
          {
            duration: 601,
            operations: [
              { type: 'plant', time: '0', columns: '1-8', row: 4, targetCol: 6 },
              { type: 'plant', time: '2', columns: '1-8', row: 4, targetCol: 6 }
            ]
          },
          {
            duration: 601,
            operations: [
              { type: 'remove', time: '-599', columns: '1-8', row: 4, targetCol: 6 },
              { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 9 }
            ]
          }
        ];
        
        // First plant operation (wave 0, index 0) - should pass
        expect(validateCannonPosition(4, 6, 'plant', 0, 0, testCannons, crossWaveTestWaves)).toBeNull();
        
        // Remove operation (wave 1, index 0) - should pass (cannon was planted)
        expect(validateCannonPosition(4, 6, 'remove', 1, 0, testCannons, crossWaveTestWaves)).toBeNull();
        
        // Second plant operation (wave 0, index 1) - should pass (cannon was removed at same time)
        expect(validateCannonPosition(4, 6, 'plant', 0, 1, testCannons, crossWaveTestWaves)).toBeNull();
      });
    });
  });

  describe('validateWaveDuration', () => {
    describe('Valid durations', () => {
      it('should accept valid wave durations', () => {
        const validDurations = [1, 100, 601, 1000, 5000, 10000];
        
        validDurations.forEach(duration => {
          expect(validateWaveDuration(duration)).toBeNull();
        });
      });
    });

    describe('Invalid durations', () => {
      it('should reject invalid wave durations', () => {
        expect(validateWaveDuration(null)).toContain('波长不能为空');
        expect(validateWaveDuration('')).toContain('波长不能为空');
        expect(validateWaveDuration(undefined)).toContain('波长不能为空');
      });

      it('should reject non-integer durations', () => {
        expect(validateWaveDuration(1.5)).toContain('波长必须是整数');
        expect(validateWaveDuration(100.1)).toContain('波长必须是整数');
        expect(validateWaveDuration(NaN)).toContain('波长必须是整数');
      });

      it('should reject non-positive durations', () => {
        expect(validateWaveDuration(0)).toContain('波长必须大于 0');
        expect(validateWaveDuration(-100)).toContain('波长必须大于 0');
        expect(validateWaveDuration(-1)).toContain('波长必须大于 0');
      });
    });
  });

  describe('validateAllInputs', () => {
    describe('Valid configurations', () => {
      it('should validate all inputs and return true for valid data', () => {
        // Set up valid data
        store.state.waves.waves = [
          {
            duration: 601,
            operations: [
              { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 },
              { type: 'plant', time: '0', columns: '', row: 4, targetCol: 4 }
            ]
          }
        ];
        
        const result = wrapper.vm.validateAllInputs();
        expect(result).toBe(true);
        expect(wrapper.vm.validationErrors.size).toBe(0);
      });

      it('should handle empty waves', () => {
        store.state.waves.waves = [];
        
        const result = wrapper.vm.validateAllInputs();
        expect(result).toBe(true);
        expect(wrapper.vm.validationErrors.size).toBe(0);
      });

      it('should handle waves with no operations', () => {
        store.state.waves.waves = [
          { duration: 601, operations: [] }
        ];
        
        const result = wrapper.vm.validateAllInputs();
        expect(result).toBe(true);
        expect(wrapper.vm.validationErrors.size).toBe(0);
      });
    });

    describe('Invalid configurations', () => {
      it('should validate all inputs and return false for invalid data', () => {
        // Set up invalid data
        store.state.waves.waves = [
          {
            duration: -1, // Invalid duration
            operations: [
              { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }, // Invalid time
              { type: 'plant', time: '0', columns: '', row: 10, targetCol: 4 } // Invalid row
            ]
          }
        ];
        
        const result = wrapper.vm.validateAllInputs();
        expect(result).toBe(false);
        expect(wrapper.vm.validationErrors.size).toBeGreaterThan(0);
      });

      it('should collect multiple validation errors', () => {
        store.state.waves.waves = [
          {
            duration: 0, // Invalid
            operations: [
              { 
                type: 'fire', 
                time: '', // Invalid
                columns: '0-9', // Invalid
                row: 0, // Invalid
                targetCol: 10 // Invalid
              }
            ]
          }
        ];
        
        const result = wrapper.vm.validateAllInputs();
        expect(result).toBe(false);
        
        // Should have multiple errors
        expect(wrapper.vm.validationErrors.size).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration with UI', () => {
    beforeEach(() => {
      // Mock alert to avoid actual alerts in tests
      global.alert = vi.fn();
    });

    it('should show validation errors in the UI', () => {
      // Set invalid data
      store.state.waves.waves = [
        {
          duration: 601,
          operations: [
            { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }
          ]
        }
      ];
      
      wrapper.vm.validateAllInputs();
      
      // Check that validation error is set
      const errorKey = '0-0-time';
      expect(wrapper.vm.validationErrors.has(errorKey)).toBe(true);
      expect(wrapper.vm.validationErrors.get(errorKey)).toContain('时间表达式语法错误');
    });

    it('should prevent calculation with invalid inputs', () => {
      // Set invalid data
      store.state.waves.waves = [
        {
          duration: 601,
          operations: [
            { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }
          ]
        }
      ];
      
      // Trigger validation
      wrapper.vm.validateAllInputs();
      
      // Try to calculate
      wrapper.vm.calculate();
      
      // Should show alert and not proceed with calculation
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('输入数据存在错误'));
      expect(wrapper.vm.calculationResult).toBeNull();
    });

    it('should clear validation errors when inputs become valid', () => {
      // Set invalid data first
      store.state.waves.waves = [
        {
          duration: 601,
          operations: [
            { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }
          ]
        }
      ];
      
      wrapper.vm.validateAllInputs();
      expect(wrapper.vm.validationErrors.size).toBeGreaterThan(0);
      
      // Fix the data
      store.state.waves.waves[0].operations[0].time = '100';
      
      wrapper.vm.validateAllInputs();
      expect(wrapper.vm.validationErrors.size).toBe(0);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeWaves = Array.from({ length: 20 }, (_, i) => ({
        duration: 601 + i,
        operations: Array.from({ length: 50 }, (_, j) => ({
          type: 'fire',
          time: `${j * 10}`,
          columns: '1-8',
          row: (j % 5) + 1,
          targetCol: 5 + (j % 5)
        }))
      }));
      
      store.state.waves.waves = largeWaves;
      
      const start = performance.now();
      const result = wrapper.vm.validateAllInputs();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBe(true);
    });

    it('should handle malformed data gracefully', () => {
      // Use a safer approach that won't break Vue rendering
      store.state.waves.waves = [
        {
          duration: 601,
          operations: [
            { type: 'fire', time: '', columns: '1-8', row: 1, targetCol: 9 }, // Invalid time
            { type: 'invalid_type', time: '100', columns: '1-8', row: 1, targetCol: 9 } // Invalid type
          ]
        }
      ];
      
      expect(() => wrapper.vm.validateAllInputs()).not.toThrow();
      expect(wrapper.vm.validateAllInputs()).toBe(false);
    });
  });
});