import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ReusePage from './ReusePage.vue';
import ExportDialog from './ExportDialog.vue';
import WaveHeader from './WaveHeader.vue';
import OperationCard from './OperationCard.vue';
import {
  validateTime,
  validateRow,
  validateTargetCol,
  validateColumns,
  validateCannonPosition,
  validateWaveDuration
} from '../utils/validation.js';

// Import store modules for testing
import clipboardModule from '../store/modules/clipboard.js';
import selectionModule from '../store/modules/selection.js';

// Create a minimal store for testing
const createTestStore = () => {
  return createStore({
    modules: {
      ui: {
        namespaced: true,
        state: () => ({ theme: 'light' }),
        getters: { theme: (state) => state.theme }
      },
      field: {
        namespaced: true,
        state: () => ({
          rows: 5,
          cannons: [
            { row: 1, col: 1 },
            { row: 2, col: 3 },
            { row: 3, col: 7 }
          ]
        }),
        getters: {
          rows: (state) => state.rows,
          cannons: (state) => state.cannons
        }
      },
      waves: {
        namespaced: true,
        state: () => ({
          waves: [
            {
              duration: 601,
              notes: '',
              operations: [
                { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 },
                { type: 'plant', time: '0', columns: '', row: 2, targetCol: 2 },
                { type: 'remove', time: '500', columns: '', row: 1, targetCol: 1 }
              ]
            }
          ]
        }),
        getters: {
          waves: (state) => state.waves,
          totalOperations: (state) => state.waves.reduce((total, wave) => total + wave.operations.filter(op => op.type === 'fire').length, 0)
        },
        actions: {
          addWave() {},
          removeWave() {},
          updateWave() {},
          addOperation() {},
          removeOperation() {},
          updateOperation() {}
        }
      },
      clipboard: clipboardModule,
      selection: selectionModule
    }
  });
};

describe('ReusePage Validation', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = createTestStore();
    wrapper = mount(ReusePage, {
      global: {
        plugins: [store],
        stubs: {
          ExportDialog: true,
          WaveHeader: true,
          OperationCard: true
        }
      }
    });
  });

  describe('validateTime', () => {
    const testWaves = [{ duration: 601, notes: '', operations: [] }];
    
    test('should accept valid integer times', () => {
      expect(validateTime('300')).toBeNull();
      expect(validateTime('0')).toBeNull();
      expect(validateTime('1000')).toBeNull();
    });

    test('should accept valid variable expressions', () => {
      expect(validateTime('w')).toBeNull();
      expect(validateTime('w-200')).toBeNull();
      expect(validateTime('w+100')).toBeNull();
    });

    test('should reject empty or invalid times', () => {
      expect(validateTime('')).toContain('时间不能为空');
      expect(validateTime('   ')).toContain('时间不能为空');
      expect(validateTime('abc')).toContain('时间表达式语法错误');
      // Note: 300.5 is now valid as it returns a finite number
      expect(validateTime('300.5')).toBeNull();
    });

    test('should allow negative times if absolute time >= -600', () => {
      // -100 without wave context should be allowed (no absolute time check)
      expect(validateTime('-100')).toBeNull();
      
      // With wave context, check absolute time constraint
      // Wave 0 starts at absolute time 0, so -100 gives absolute time -100 (valid)
      expect(validateTime('-100', 0, testWaves)).toBeNull();
      
      // Test case that would violate the -600 constraint
      // Wave 0 starts at absolute time 0, so -700 gives absolute time -700 (invalid)
      expect(validateTime('-700', 0, testWaves)).toContain('绝对时间不能小于-600');
    });

    test('should reject invalid variable expressions', () => {
      expect(validateTime('w-')).toContain('时间表达式语法错误');
      expect(validateTime('w-abc')).toContain('时间表达式语法错误');
      expect(validateTime('x-200')).toContain('时间表达式语法错误');
    });

    test('should accept complex mathematical expressions', () => {
      expect(validateTime('w*2')).toBeNull();
      expect(validateTime('w/2')).toBeNull();
      expect(validateTime('w+100-50')).toBeNull();
      expect(validateTime('(w+100)/2')).toBeNull();
    });

    test('should reject expressions that return non-finite values', () => {
      expect(validateTime('w/0')).toContain('时间表达式必须返回有限数值');
      expect(validateTime('Infinity')).toContain('时间表达式必须返回有限数值');
      expect(validateTime('NaN')).toContain('时间表达式必须返回有限数值');
    });

    test('should validate variable expressions with absolute time constraint', () => {
      // w-200 in wave 0 (duration 601) gives absolute time 0 + (601-200) = 401 (valid)
      expect(validateTime('w-200', 0, testWaves)).toBeNull();
      
      // w-1300 in wave 0 (duration 601) gives absolute time 0 + (601-1300) = -699 (invalid)
      expect(validateTime('w-1300', 0, testWaves)).toContain('绝对时间不能小于-600');
    });
  });

  describe('validateRow', () => {
    test('should accept valid rows', () => {
      expect(validateRow(1, 'fire', 5)).toBeNull();
      expect(validateRow(3, 'plant', 5)).toBeNull();
      expect(validateRow(5, 'remove', 5)).toBeNull();
    });

    test('should reject invalid rows', () => {
      expect(validateRow(null, 'fire', 5)).toContain('行数不能为空');
      expect(validateRow('', 'fire', 5)).toContain('行数不能为空');
      expect(validateRow(1.5, 'fire', 5)).toContain('行数必须是整数');
      expect(validateRow(0, 'fire', 5)).toContain('行数必须在 1-5 范围内');
      expect(validateRow(6, 'fire', 5)).toContain('行数必须在 1-5 范围内');
    });
  });

  describe('validateTargetCol', () => {
    test('should accept valid target columns for fire operations', () => {
      expect(validateTargetCol(0, 'fire')).toBeNull();
      expect(validateTargetCol(0.0125, 'fire')).toBeNull(); // 1/80
      expect(validateTargetCol(0.025, 'fire')).toBeNull(); // 2/80
      expect(validateTargetCol(1.0, 'fire')).toBeNull(); // 80/80
      expect(validateTargetCol(5.5, 'fire')).toBeNull(); // 440/80
      expect(validateTargetCol(9.9875, 'fire')).toBeNull(); // 799/80
      
      // Test common game values
      expect(validateTargetCol(8.0125, 'fire')).toBeNull(); // 641/80
      expect(validateTargetCol(9.0, 'fire')).toBeNull(); // 720/80
    });

    test('should accept valid columns for plant/remove operations', () => {
      expect(validateTargetCol(1, 'plant')).toBeNull();
      expect(validateTargetCol(4, 'remove')).toBeNull();
      expect(validateTargetCol(8, 'plant')).toBeNull();
    });

    test('should reject invalid target columns for fire operations', () => {
      expect(validateTargetCol(null, 'fire')).toContain('列数不能为空');
      expect(validateTargetCol(-1, 'fire')).toContain('目标列必须在 0-9.9875 范围内');
      expect(validateTargetCol(10, 'fire')).toContain('目标列必须在 0-9.9875 范围内');
      
      // Test 1/80 multiple validation
      expect(validateTargetCol(0.01, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      expect(validateTargetCol(0.013, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      expect(validateTargetCol(5.51, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      expect(validateTargetCol(1.01, 'fire')).toContain('目标列必须是 1/80 的整数倍');
    });

    test('should reject invalid columns for plant/remove operations', () => {
      expect(validateTargetCol(null, 'plant')).toContain('列数不能为空');
      expect(validateTargetCol(1.5, 'plant')).toContain('列数必须是整数');
      expect(validateTargetCol(0, 'plant')).toContain('列数必须在 1-8 范围内');
      expect(validateTargetCol(9, 'remove')).toContain('列数必须在 1-8 范围内');
    });
  });

  describe('validateColumns', () => {
    test('should accept valid column specifications', () => {
      expect(validateColumns('1-8')).toBeNull();
      expect(validateColumns('1 3 5')).toBeNull();
      expect(validateColumns('1-3 5-7')).toBeNull();
      expect(validateColumns('2')).toBeNull();
    });

    test('should reject invalid column specifications', () => {
      expect(validateColumns('')).toContain('发射列不能为空');
      expect(validateColumns('   ')).toContain('发射列不能为空');
      expect(validateColumns('0-8')).toContain('列范围必须在 1-8 范围内');
      expect(validateColumns('1-9')).toContain('列范围必须在 1-8 范围内');
      expect(validateColumns('5-3')).toContain('列范围起始列不能大于结束列');
      expect(validateColumns('abc')).toContain('列数必须是整数');
      expect(validateColumns('1.5-3')).toContain('列范围必须是整数');
    });
  });

  describe('validateCannonPosition', () => {
    const testCannons = [
      { row: 1, col: 1 },
      { row: 2, col: 3 },
      { row: 3, col: 7 }
    ];
    const testWaves = [
      {
        duration: 601,
        notes: '',
        operations: [
          { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 },
          { type: 'plant', time: '0', columns: '', row: 2, targetCol: 2 },
          { type: 'remove', time: '500', columns: '', row: 1, targetCol: 1 }
        ]
      }
    ];

    test('should accept valid cannon removal', () => {
      // Cannon exists at row 1, col 1
      expect(validateCannonPosition(1, 1, 'remove', 0, 0, testCannons, testWaves)).toBeNull();
      // Cannon exists at row 2, col 3
      expect(validateCannonPosition(2, 3, 'remove', 0, 0, testCannons, testWaves)).toBeNull();
    });

    test('should accept valid cannon planting', () => {
      // No overlap with existing cannons - row 1, col 4 (far from cannon at 1,1)
      expect(validateCannonPosition(1, 4, 'plant', 0, 0, testCannons, testWaves)).toBeNull();
      // No overlap with existing cannons - row 4, col 5 (different row)
      expect(validateCannonPosition(4, 5, 'plant', 0, 0, testCannons, testWaves)).toBeNull();
    });

    test('should reject invalid cannon removal', () => {
      // No cannon at row 1, col 2
      expect(validateCannonPosition(1, 2, 'remove', 0, 0, testCannons, testWaves)).toContain('该位置没有炮可以铲除');
      // No cannon at row 5, col 8
      expect(validateCannonPosition(5, 8, 'remove', 0, 0, testCannons, testWaves)).toContain('该位置没有炮可以铲除');
    });

    test('should reject invalid cannon planting', () => {
      // Cannon already exists at row 1, col 1 - exact overlap
      expect(validateCannonPosition(1, 1, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
      // Cannon already exists at row 2, col 3 - exact overlap
      expect(validateCannonPosition(2, 3, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
      // Cannon at (1,1) occupies columns 1,2 - planting at (1,2) would overlap
      expect(validateCannonPosition(1, 2, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
      // Cannon at (2,3) occupies columns 3,4 - planting at (2,4) would overlap
      expect(validateCannonPosition(2, 4, 'plant', 0, 0, testCannons, testWaves)).toContain('该位置与已有炮重叠');
    });

    test('should return null for fire operations', () => {
      expect(validateCannonPosition(1, 1, 'fire', 0, 0, testCannons, testWaves)).toBeNull();
      expect(validateCannonPosition(5, 8, 'fire', 0, 0, testCannons, testWaves)).toBeNull();
    });

    test('should handle sequential plant/remove operations correctly', () => {
      // Setup a wave with sequential operations: plant -> remove -> plant
      const sequentialWaves = [
        {
          duration: 601,
          notes: '',
          operations: [
            { type: 'plant', time: '0', columns: '1-8', row: 4, targetCol: 6 },
            { type: 'remove', time: '1', columns: '1-8', row: 4, targetCol: 6 },
            { type: 'plant', time: '2', columns: '1-8', row: 4, targetCol: 6 }
          ]
        }
      ];
      
      // First plant operation (index 0) - should pass (no conflicts)
      expect(validateCannonPosition(4, 6, 'plant', 0, 0, testCannons, sequentialWaves)).toBeNull();
      
      // Remove operation (index 1) - should pass (cannon was planted)
      expect(validateCannonPosition(4, 6, 'remove', 0, 1, testCannons, sequentialWaves)).toBeNull();
      
      // Second plant operation (index 2) - should pass (cannon was removed)
      expect(validateCannonPosition(4, 6, 'plant', 0, 2, testCannons, sequentialWaves)).toBeNull();
    });
  });

  describe('validateWaveDuration', () => {
    test('should accept valid wave durations', () => {
      expect(validateWaveDuration(1)).toBeNull();
      expect(validateWaveDuration(601)).toBeNull();
      expect(validateWaveDuration(1000)).toBeNull();
    });

    test('should reject invalid wave durations', () => {
      expect(validateWaveDuration(null)).toContain('波长不能为空');
      expect(validateWaveDuration('')).toContain('波长不能为空');
      expect(validateWaveDuration(1.5)).toContain('波长必须是整数');
      expect(validateWaveDuration(0)).toContain('波长必须大于 0');
      expect(validateWaveDuration(-100)).toContain('波长必须大于 0');
    });
  });

  describe('component validation integration', () => {
    test('should validate all inputs and return true for valid data', () => {
      // Set up valid data in the store
      store.state.waves.waves = [
        {
          duration: 601,
          notes: '',
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

    test('should validate all inputs and return false for invalid data', () => {
      // Set up invalid data in the store
      store.state.waves.waves = [
        {
          duration: -1, // Invalid duration
          notes: '',
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
  });

  describe('ReusePage validation integration', () => {
    test('should handle validation errors correctly', () => {
      // Set invalid data in the store
      store.state.waves.waves = [
        {
          duration: 601,
          notes: '',
          operations: [
            { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }
          ]
        }
      ];
      
      wrapper.vm.validateAllInputs();
      
      // Check that validation error is set through the handleValidationError method
      const key = '0-0-time';
      expect(wrapper.vm.validationErrors.has(key)).toBe(true);
    });

    test('should prevent calculation with invalid inputs', () => {
      // Mock alert to avoid actual alert in tests
      global.alert = vi.fn();
      
      // Set invalid data in the store
      store.state.waves.waves = [
        {
          duration: 601,
          notes: '',
          operations: [
            { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }
          ]
        }
      ];
      
      // Try to calculate
      wrapper.vm.calculate();
      
      // Should show alert and not proceed with calculation
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('输入数据存在错误'));
      expect(wrapper.vm.calculationResult).toBeNull();
    });
  });
});