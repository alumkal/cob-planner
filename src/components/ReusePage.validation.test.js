import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ReusePage from './ReusePage.vue';

// Create a minimal store for testing
const createTestStore = () => {
  return createStore({
    state() {
      return {
        theme: 'light',
        rows: 5,
        cannons: [
          { row: 1, col: 1 },
          { row: 2, col: 3 },
          { row: 3, col: 7 }
        ],
        waves: [
          {
            duration: 601,
            operations: [
              { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 },
              { type: 'plant', time: '0', columns: '', row: 2, targetCol: 2 },
              { type: 'remove', time: '500', columns: '', row: 1, targetCol: 1 }
            ]
          }
        ]
      };
    },
    mutations: {
      updateWave() {},
      updateOperation() {},
      addOperation() {}
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
        plugins: [store]
      }
    });
  });

  describe('validateTime', () => {
    test('should accept valid integer times', () => {
      expect(wrapper.vm.validateTime('300')).toBeNull();
      expect(wrapper.vm.validateTime('0')).toBeNull();
      expect(wrapper.vm.validateTime('1000')).toBeNull();
    });

    test('should accept valid variable expressions', () => {
      expect(wrapper.vm.validateTime('w')).toBeNull();
      expect(wrapper.vm.validateTime('w-200')).toBeNull();
      expect(wrapper.vm.validateTime('w+100')).toBeNull();
    });

    test('should reject empty or invalid times', () => {
      expect(wrapper.vm.validateTime('')).toContain('时间不能为空');
      expect(wrapper.vm.validateTime('   ')).toContain('时间不能为空');
      expect(wrapper.vm.validateTime('abc')).toContain('时间必须是整数或变量表达式');
      expect(wrapper.vm.validateTime('300.5')).toContain('时间必须是整数或变量表达式');
    });

    test('should allow negative times if absolute time >= -600', () => {
      // -100 without wave context should be allowed (no absolute time check)
      expect(wrapper.vm.validateTime('-100')).toBeNull();
      
      // With wave context, check absolute time constraint
      // Wave 0 starts at absolute time 0, so -100 gives absolute time -100 (valid)
      expect(wrapper.vm.validateTime('-100', 0)).toBeNull();
      
      // Test case that would violate the -600 constraint
      // Wave 0 starts at absolute time 0, so -700 gives absolute time -700 (invalid)
      expect(wrapper.vm.validateTime('-700', 0)).toContain('绝对时间不能小于-600');
    });

    test('should reject invalid variable expressions', () => {
      expect(wrapper.vm.validateTime('w-')).toContain('时间必须是整数或变量表达式');
      expect(wrapper.vm.validateTime('w-abc')).toContain('时间必须是整数或变量表达式');
      expect(wrapper.vm.validateTime('x-200')).toContain('时间必须是整数或变量表达式');
    });

    test('should validate variable expressions with absolute time constraint', () => {
      // w-200 in wave 0 (duration 601) gives absolute time 0 + (601-200) = 401 (valid)
      expect(wrapper.vm.validateTime('w-200', 0)).toBeNull();
      
      // w-1300 in wave 0 (duration 601) gives absolute time 0 + (601-1300) = -699 (invalid)
      expect(wrapper.vm.validateTime('w-1300', 0)).toContain('绝对时间不能小于-600');
    });
  });

  describe('validateRow', () => {
    test('should accept valid rows', () => {
      expect(wrapper.vm.validateRow(1, 'fire')).toBeNull();
      expect(wrapper.vm.validateRow(3, 'plant')).toBeNull();
      expect(wrapper.vm.validateRow(5, 'remove')).toBeNull();
    });

    test('should reject invalid rows', () => {
      expect(wrapper.vm.validateRow(null, 'fire')).toContain('行数不能为空');
      expect(wrapper.vm.validateRow('', 'fire')).toContain('行数不能为空');
      expect(wrapper.vm.validateRow(1.5, 'fire')).toContain('行数必须是整数');
      expect(wrapper.vm.validateRow(0, 'fire')).toContain('行数必须在 1-5 范围内');
      expect(wrapper.vm.validateRow(6, 'fire')).toContain('行数必须在 1-5 范围内');
    });
  });

  describe('validateTargetCol', () => {
    test('should accept valid target columns for fire operations', () => {
      expect(wrapper.vm.validateTargetCol(0, 'fire')).toBeNull();
      expect(wrapper.vm.validateTargetCol(0.0125, 'fire')).toBeNull(); // 1/80
      expect(wrapper.vm.validateTargetCol(0.025, 'fire')).toBeNull(); // 2/80
      expect(wrapper.vm.validateTargetCol(1.0, 'fire')).toBeNull(); // 80/80
      expect(wrapper.vm.validateTargetCol(5.5, 'fire')).toBeNull(); // 440/80
      expect(wrapper.vm.validateTargetCol(9.9875, 'fire')).toBeNull(); // 799/80
      
      // Test common game values
      expect(wrapper.vm.validateTargetCol(8.0125, 'fire')).toBeNull(); // 641/80
      expect(wrapper.vm.validateTargetCol(9.0, 'fire')).toBeNull(); // 720/80
    });

    test('should accept valid columns for plant/remove operations', () => {
      expect(wrapper.vm.validateTargetCol(1, 'plant')).toBeNull();
      expect(wrapper.vm.validateTargetCol(4, 'remove')).toBeNull();
      expect(wrapper.vm.validateTargetCol(8, 'plant')).toBeNull();
    });

    test('should reject invalid target columns for fire operations', () => {
      expect(wrapper.vm.validateTargetCol(null, 'fire')).toContain('列数不能为空');
      expect(wrapper.vm.validateTargetCol(-1, 'fire')).toContain('目标列必须在 0-9.9875 范围内');
      expect(wrapper.vm.validateTargetCol(10, 'fire')).toContain('目标列必须在 0-9.9875 范围内');
      
      // Test 1/80 multiple validation
      expect(wrapper.vm.validateTargetCol(0.01, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      expect(wrapper.vm.validateTargetCol(0.013, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      expect(wrapper.vm.validateTargetCol(5.51, 'fire')).toContain('目标列必须是 1/80 的整数倍');
      expect(wrapper.vm.validateTargetCol(1.01, 'fire')).toContain('目标列必须是 1/80 的整数倍');
    });

    test('should reject invalid columns for plant/remove operations', () => {
      expect(wrapper.vm.validateTargetCol(null, 'plant')).toContain('列数不能为空');
      expect(wrapper.vm.validateTargetCol(1.5, 'plant')).toContain('列数必须是整数');
      expect(wrapper.vm.validateTargetCol(0, 'plant')).toContain('列数必须在 1-8 范围内');
      expect(wrapper.vm.validateTargetCol(9, 'remove')).toContain('列数必须在 1-8 范围内');
    });
  });

  describe('validateColumns', () => {
    test('should accept valid column specifications', () => {
      expect(wrapper.vm.validateColumns('1-8')).toBeNull();
      expect(wrapper.vm.validateColumns('1 3 5')).toBeNull();
      expect(wrapper.vm.validateColumns('1-3 5-7')).toBeNull();
      expect(wrapper.vm.validateColumns('2')).toBeNull();
    });

    test('should reject invalid column specifications', () => {
      expect(wrapper.vm.validateColumns('')).toContain('发射列不能为空');
      expect(wrapper.vm.validateColumns('   ')).toContain('发射列不能为空');
      expect(wrapper.vm.validateColumns('0-8')).toContain('列范围必须在 1-8 范围内');
      expect(wrapper.vm.validateColumns('1-9')).toContain('列范围必须在 1-8 范围内');
      expect(wrapper.vm.validateColumns('5-3')).toContain('列范围起始列不能大于结束列');
      expect(wrapper.vm.validateColumns('abc')).toContain('列数必须是整数');
      expect(wrapper.vm.validateColumns('1.5-3')).toContain('列范围必须是整数');
    });
  });

  describe('validateCannonPosition', () => {
    test('should accept valid cannon removal', () => {
      // Cannon exists at row 1, col 1
      expect(wrapper.vm.validateCannonPosition(1, 1, 'remove')).toBeNull();
      // Cannon exists at row 2, col 3
      expect(wrapper.vm.validateCannonPosition(2, 3, 'remove')).toBeNull();
    });

    test('should accept valid cannon planting', () => {
      // No overlap with existing cannons - row 1, col 4 (far from cannon at 1,1)
      expect(wrapper.vm.validateCannonPosition(1, 4, 'plant')).toBeNull();
      // No overlap with existing cannons - row 4, col 5 (different row)
      expect(wrapper.vm.validateCannonPosition(4, 5, 'plant')).toBeNull();
    });

    test('should reject invalid cannon removal', () => {
      // No cannon at row 1, col 2
      expect(wrapper.vm.validateCannonPosition(1, 2, 'remove')).toContain('该位置没有炮可以铲除');
      // No cannon at row 5, col 8
      expect(wrapper.vm.validateCannonPosition(5, 8, 'remove')).toContain('该位置没有炮可以铲除');
    });

    test('should reject invalid cannon planting', () => {
      // Cannon already exists at row 1, col 1 - exact overlap
      expect(wrapper.vm.validateCannonPosition(1, 1, 'plant')).toContain('该位置与已有炮重叠');
      // Cannon already exists at row 2, col 3 - exact overlap
      expect(wrapper.vm.validateCannonPosition(2, 3, 'plant')).toContain('该位置与已有炮重叠');
      // Cannon at (1,1) occupies columns 1,2 - planting at (1,2) would overlap
      expect(wrapper.vm.validateCannonPosition(1, 2, 'plant')).toContain('该位置与已有炮重叠');
      // Cannon at (2,3) occupies columns 3,4 - planting at (2,4) would overlap
      expect(wrapper.vm.validateCannonPosition(2, 4, 'plant')).toContain('该位置与已有炮重叠');
    });

    test('should return null for fire operations', () => {
      expect(wrapper.vm.validateCannonPosition(1, 1, 'fire')).toBeNull();
      expect(wrapper.vm.validateCannonPosition(5, 8, 'fire')).toBeNull();
    });

    test('should handle sequential plant/remove operations correctly', () => {
      // Setup a wave with sequential operations: plant -> remove -> plant
      const testWave = {
        duration: 601,
        operations: [
          { type: 'plant', time: '0', columns: '1-8', row: 4, targetCol: 6 },
          { type: 'remove', time: '1', columns: '1-8', row: 4, targetCol: 6 },
          { type: 'plant', time: '2', columns: '1-8', row: 4, targetCol: 6 }
        ]
      };
      
      // Temporarily add this wave to the component
      wrapper.vm.waves.push(testWave);
      const waveIndex = wrapper.vm.waves.length - 1;
      
      // First plant operation (index 0) - should pass (no conflicts)
      expect(wrapper.vm.validateCannonPosition(4, 6, 'plant', waveIndex, 0)).toBeNull();
      
      // Remove operation (index 1) - should pass (cannon was planted)
      expect(wrapper.vm.validateCannonPosition(4, 6, 'remove', waveIndex, 1)).toBeNull();
      
      // Second plant operation (index 2) - should pass (cannon was removed)
      expect(wrapper.vm.validateCannonPosition(4, 6, 'plant', waveIndex, 2)).toBeNull();
      
      // Clean up
      wrapper.vm.waves.pop();
    });

    test('should handle cross-wave operations with negative time correctly', () => {
      // Create a new test store with the cross-wave scenario
      const testStore = createStore({
        state: () => ({
          theme: 'light',
          rows: 5,
          cannons: [{ row: 2, col: 6 }],
          waves: [
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
          ]
        }),
        mutations: {
          updateOperation() {},
          addOperation() {},
          removeOperation() {}
        }
      });
      
      // Mount component with test store
      const testWrapper = mount(ReusePage, {
        global: { plugins: [testStore] }
      });
      
      // First plant operation (wave 0, index 0) - should pass (no conflicts)
      expect(testWrapper.vm.validateCannonPosition(4, 6, 'plant', 0, 0)).toBeNull();
      
      // Remove operation (wave 1, index 0) - should pass (cannon was planted)
      expect(testWrapper.vm.validateCannonPosition(4, 6, 'remove', 1, 0)).toBeNull();
      
      // Second plant operation (wave 0, index 1) - should pass (cannon was removed at same time)
      expect(testWrapper.vm.validateCannonPosition(4, 6, 'plant', 0, 1)).toBeNull();
    });
  });

  describe('validateWaveDuration', () => {
    test('should accept valid wave durations', () => {
      expect(wrapper.vm.validateWaveDuration(1)).toBeNull();
      expect(wrapper.vm.validateWaveDuration(601)).toBeNull();
      expect(wrapper.vm.validateWaveDuration(1000)).toBeNull();
    });

    test('should reject invalid wave durations', () => {
      expect(wrapper.vm.validateWaveDuration(null)).toContain('波长不能为空');
      expect(wrapper.vm.validateWaveDuration('')).toContain('波长不能为空');
      expect(wrapper.vm.validateWaveDuration(1.5)).toContain('波长必须是整数');
      expect(wrapper.vm.validateWaveDuration(0)).toContain('波长必须大于 0');
      expect(wrapper.vm.validateWaveDuration(-100)).toContain('波长必须大于 0');
    });
  });

  describe('validateAllInputs', () => {
    test('should validate all inputs and return true for valid data', () => {
      // Set up valid data
      store.state.waves = [
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
      expect(wrapper.vm.hasValidationErrors()).toBe(false);
    });

    test('should validate all inputs and return false for invalid data', () => {
      // Set up invalid data
      store.state.waves = [
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
      expect(wrapper.vm.hasValidationErrors()).toBe(true);
    });
  });

  describe('validation integration', () => {
    test('should show validation errors in the UI', () => {
      // Set invalid data
      store.state.waves = [
        {
          duration: 601,
          operations: [
            { type: 'fire', time: 'invalid', columns: '1-8', row: 1, targetCol: 9 }
          ]
        }
      ];
      
      wrapper.vm.validateAllInputs();
      
      // Check that validation error is set
      expect(wrapper.vm.getValidationError(0, 0, 'time')).toContain('时间必须是整数或变量表达式');
    });

    test('should prevent calculation with invalid inputs', () => {
      // Mock alert to avoid actual alert in tests
      global.alert = vi.fn();
      
      // Set invalid data
      store.state.waves = [
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
  });
});