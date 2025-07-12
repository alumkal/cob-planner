/**
 * Validation utilities for CobPlanner
 * Extracted from ReusePage.vue for better code organization
 */

/**
 * Validate time expression (supports direct integers and variable expressions like "w-200")
 * @param {string} timeStr - The time expression to validate
 * @param {number|null} waveIndex - Wave index for absolute time validation (optional)
 * @param {Array} waves - Array of waves for absolute time calculation (optional)
 * @returns {string|null} Error message or null if valid
 */
export function validateTime(timeStr, waveIndex = null, waves = []) {
  if (!timeStr || timeStr.trim() === '') {
    return '时间不能为空';
  }
  
  const trimmed = timeStr.trim();
  
  // Check for variable expressions like "w-200", "w+100", etc.
  const variablePattern = /^w([+-]\d+)?$/;
  if (variablePattern.test(trimmed)) {
    const match = trimmed.match(/^w([+-]\d+)?$/);
    if (match[1]) {
      const offset = parseInt(match[1]);
      if (!Number.isInteger(offset)) {
        return '变量表达式中的偏移量必须是整数';
      }
      
      // Check absolute time if wave context is available
      if (waveIndex !== null && waveIndex < waves.length) {
        const wave = waves[waveIndex];
        const absoluteTime = calculateAbsoluteTime(waveIndex, wave.duration + offset, waves);
        if (absoluteTime < -600) {
          return '绝对时间不能小于-600';
        }
      }
    }
    return null;
  }
  
  // Check for direct integer
  const num = parseInt(trimmed);
  if (!Number.isInteger(num) || num.toString() !== trimmed) {
    return '时间必须是整数或变量表达式（如 w-200）';
  }
  
  // Check absolute time if wave context is available
  if (waveIndex !== null && waveIndex < waves.length) {
    const absoluteTime = calculateAbsoluteTime(waveIndex, num, waves);
    if (absoluteTime < -600) {
      return '绝对时间不能小于-600';
    }
  }
  
  return null;
}

/**
 * Calculate absolute time for a given wave and relative time
 * @param {number} waveIndex - Wave index
 * @param {number} relativeTime - Relative time within the wave
 * @param {Array} waves - Array of waves
 * @returns {number} Absolute time
 */
export function calculateAbsoluteTime(waveIndex, relativeTime, waves) {
  let absoluteTime = 0;
  for (let i = 0; i < waveIndex; i++) {
    if (i < waves.length) {
      absoluteTime += waves[i].duration;
    }
  }
  return absoluteTime + relativeTime;
}

/**
 * Validate row number
 * @param {number} row - Row number to validate
 * @param {string} type - Operation type (for context)
 * @param {number} maxRows - Maximum allowed rows
 * @returns {string|null} Error message or null if valid
 */
export function validateRow(row, type, maxRows) {
  if (row === null || row === undefined || row === '') {
    return '行数不能为空';
  }
  
  if (!Number.isInteger(row)) {
    return '行数必须是整数';
  }
  
  if (row < 1 || row > maxRows) {
    return `行数必须在 1-${maxRows} 范围内`;
  }
  
  return null;
}

/**
 * Validate target column based on operation type
 * @param {number} targetCol - Target column to validate
 * @param {string} type - Operation type ('fire', 'plant', 'remove')
 * @returns {string|null} Error message or null if valid
 */
export function validateTargetCol(targetCol, type) {
  if (targetCol === null || targetCol === undefined || targetCol === '') {
    return '列数不能为空';
  }
  
  if (type === 'fire') {
    if (typeof targetCol !== 'number') {
      return '目标列必须是数字';
    }
    if (targetCol < 0 || targetCol > 9.9875) {
      return '目标列必须在 0-9.9875 范围内';
    }
    // Check if the value is a multiple of 1/80 (0.0125)
    const scaledValue = Math.round(targetCol * 80);
    const expectedValue = scaledValue / 80;
    if (Math.abs(targetCol - expectedValue) > 1e-10) {
      return '目标列必须是 1/80 的整数倍（如 0.0125, 0.025, 1.0000）';
    }
  } else {
    if (!Number.isInteger(targetCol)) {
      return '列数必须是整数';
    }
    if (targetCol < 1 || targetCol > 8) {
      return '列数必须在 1-8 范围内';
    }
  }
  
  return null;
}

/**
 * Validate columns string for fire operations (e.g., "1-5 7")
 * @param {string} columnsStr - Columns string to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateColumns(columnsStr) {
  if (!columnsStr || columnsStr.trim() === '') {
    return '发射列不能为空';
  }
  
  const trimmed = columnsStr.trim();
  
  // Parse column ranges and individual columns
  const parts = trimmed.split(/\s+/);
  
  for (const part of parts) {
    if (part.includes('-')) {
      // Range format like "1-5"
      const [start, end] = part.split('-');
      const startNum = parseInt(start);
      const endNum = parseInt(end);
      
      if (!Number.isInteger(startNum) || !Number.isInteger(endNum) || 
          startNum.toString() !== start || endNum.toString() !== end) {
        return '列范围必须是整数';
      }
      
      if (startNum < 1 || startNum > 8 || endNum < 1 || endNum > 8) {
        return '列范围必须在 1-8 范围内';
      }
      
      if (startNum > endNum) {
        return '列范围起始列不能大于结束列';
      }
    } else {
      // Individual column
      const num = parseInt(part);
      if (!Number.isInteger(num) || num.toString() !== part) {
        return '列数必须是整数';
      }
      
      if (num < 1 || num > 8) {
        return '列数必须在 1-8 范围内';
      }
    }
  }
  
  return null;
}

/**
 * Validate wave duration
 * @param {number} duration - Wave duration to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateWaveDuration(duration) {
  if (duration === null || duration === undefined || duration === '') {
    return '波长不能为空';
  }
  
  if (!Number.isInteger(duration)) {
    return '波长必须是整数';
  }
  
  if (duration < 1) {
    return '波长必须大于 0';
  }
  
  return null;
}

/**
 * Check if two cannons would overlap (cannons are 1x2, centers must be 2+ apart in same row)
 * @param {number} row1 - Row of first cannon
 * @param {number} col1 - Column of first cannon
 * @param {number} row2 - Row of second cannon
 * @param {number} col2 - Column of second cannon
 * @returns {boolean} True if cannons would overlap
 */
export function doCannonsOverlap(row1, col1, row2, col2) {
  return row1 === row2 && Math.abs(col1 - col2) < 2;
}

/**
 * Validate cannon position for plant/remove operations
 * @param {number} row - Cannon row
 * @param {number} targetCol - Cannon column
 * @param {string} type - Operation type ('plant' or 'remove')
 * @param {number} waveIndex - Current wave index
 * @param {number} opIndex - Current operation index
 * @param {Array} cannons - Initial cannons array
 * @param {Array} waves - All waves array
 * @returns {string|null} Error message or null if valid
 */
export function validateCannonPosition(row, targetCol, type, waveIndex, opIndex, cannons, waves) {
  if (type === 'remove') {
    // For remove operations, check dynamically if cannon exists at operation time
    const cannonExists = checkCannonExistsAtTime(row, targetCol, waveIndex, opIndex, cannons, waves);
    if (!cannonExists) {
      return '该位置没有炮可以铲除';
    }
  } else if (type === 'plant') {
    // For plant operations, check for 1x2 overlap dynamically
    const wouldOverlap = checkPlantOverlapAtTime(row, targetCol, waveIndex, opIndex, cannons, waves);
    if (wouldOverlap) {
      return '该位置与已有炮重叠（炮为1x2大小）';
    }
  }
  
  return null;
}

/**
 * Check if cannon exists at a specific time by simulating operations
 * @param {number} row - Cannon row
 * @param {number} targetCol - Cannon column
 * @param {number} currentWaveIndex - Current wave index
 * @param {number} currentOpIndex - Current operation index
 * @param {Array} cannons - Initial cannons
 * @param {Array} waves - All waves
 * @returns {boolean} True if cannon exists at the specified time
 */
export function checkCannonExistsAtTime(row, targetCol, currentWaveIndex, currentOpIndex, cannons, waves) {
  // Get all operations up to this point
  const allOps = getAllOperationsUpToPoint(currentWaveIndex, currentOpIndex, waves);
  
  // Start with initial cannons
  const cannonState = cannons.map(c => ({ row: c.row, col: c.col }));
  
  // Simulate operations chronologically
  for (const op of allOps) {
    if (op.type === 'plant') {
      cannonState.push({ row: op.row, col: op.targetCol });
    } else if (op.type === 'remove') {
      const index = cannonState.findIndex(c => c.row === op.row && c.col === op.targetCol);
      if (index !== -1) {
        cannonState.splice(index, 1);
      }
    }
  }
  
  // Check if cannon exists at target position
  return cannonState.some(c => c.row === row && c.col === targetCol);
}

/**
 * Check if planting would cause overlap at a specific time
 * @param {number} row - Cannon row
 * @param {number} targetCol - Cannon column
 * @param {number} currentWaveIndex - Current wave index
 * @param {number} currentOpIndex - Current operation index
 * @param {Array} cannons - Initial cannons
 * @param {Array} waves - All waves
 * @returns {boolean} True if planting would cause overlap
 */
export function checkPlantOverlapAtTime(row, targetCol, currentWaveIndex, currentOpIndex, cannons, waves) {
  // Get all operations up to this point
  const allOps = getAllOperationsUpToPoint(currentWaveIndex, currentOpIndex, waves);
  
  // Start with initial cannons
  const cannonState = cannons.map(c => ({ row: c.row, col: c.col }));
  
  // Simulate operations chronologically
  for (const op of allOps) {
    if (op.type === 'plant') {
      cannonState.push({ row: op.row, col: op.targetCol });
    } else if (op.type === 'remove') {
      const index = cannonState.findIndex(c => c.row === op.row && c.col === op.targetCol);
      if (index !== -1) {
        cannonState.splice(index, 1);
      }
    }
  }
  
  // Check if planting at target position would overlap with existing cannons
  return cannonState.some(c => doCannonsOverlap(c.row, c.col, row, targetCol));
}

/**
 * Get all operations up to a specific point, sorted by time
 * @param {number} currentWaveIndex - Current wave index
 * @param {number} currentOpIndex - Current operation index
 * @param {Array} waves - All waves
 * @returns {Array} Array of operations up to the specified point
 */
export function getAllOperationsUpToPoint(currentWaveIndex, currentOpIndex, waves) {
  // First, collect ALL operations with their absolute times
  const allOperationsWithTime = [];
  let waveStartTime = 0;
  
  for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
    const wave = waves[waveIndex];
    
    for (let opIndex = 0; opIndex < wave.operations.length; opIndex++) {
      const op = wave.operations[opIndex];
      
      // Only include plant/remove operations
      if (op.type === 'plant' || op.type === 'remove') {
        // Parse the time expression
        let time;
        try {
          const timeExpr = op.time.toString().replace(/w/g, wave.duration);
          time = Math.floor(Function(`return ${timeExpr}`)());
        } catch (e) {
          time = 0;
        }
        
        allOperationsWithTime.push({
          ...op,
          absoluteTime: waveStartTime + time,
          waveIndex,
          opIndex
        });
      }
    }
    
    waveStartTime += wave.duration;
  }
  
  // Sort all operations by absolute time
  allOperationsWithTime.sort((a, b) => a.absoluteTime - b.absoluteTime);
  
  // Find the current operation in the sorted list
  const currentOp = allOperationsWithTime.find(op => 
    op.waveIndex === currentWaveIndex && op.opIndex === currentOpIndex
  );
  
  if (!currentOp) {
    return []; // Current operation not found
  }
  
  // Return all operations that happen before the current operation in time
  // Also include operations at the same time that are remove operations (they should process first)
  return allOperationsWithTime.filter(op => {
    if (op.absoluteTime < currentOp.absoluteTime) {
      return true;
    }
    if (op.absoluteTime === currentOp.absoluteTime && op.type === 'remove' && currentOp.type === 'plant') {
      return true;
    }
    return false;
  });
}

/**
 * Validate a single operation
 * @param {Object} operation - Operation to validate
 * @param {number} waveIndex - Wave index
 * @param {number} opIndex - Operation index
 * @param {number} maxRows - Maximum rows allowed
 * @param {Array} cannons - Initial cannons
 * @param {Array} waves - All waves
 * @returns {Object} Validation errors keyed by field name
 */
export function validateOperation(operation, waveIndex, opIndex, maxRows, cannons, waves) {
  const errors = {};
  
  // Validate time
  const timeError = validateTime(operation.time, waveIndex, waves);
  if (timeError) {
    errors.time = timeError;
  }
  
  // Validate row
  const rowError = validateRow(operation.row, operation.type, maxRows);
  if (rowError) {
    errors.row = rowError;
  }
  
  // Validate target column
  const targetColError = validateTargetCol(operation.targetCol, operation.type);
  if (targetColError) {
    errors.targetCol = targetColError;
  }
  
  // Validate columns for fire operations
  if (operation.type === 'fire') {
    const columnsError = validateColumns(operation.columns);
    if (columnsError) {
      errors.columns = columnsError;
    }
  }
  
  // Validate cannon position for plant/remove operations
  if (operation.type === 'plant' || operation.type === 'remove') {
    const cannonError = validateCannonPosition(
      operation.row, 
      operation.targetCol, 
      operation.type, 
      waveIndex, 
      opIndex, 
      cannons, 
      waves
    );
    if (cannonError) {
      errors.targetCol = cannonError;
    }
  }
  
  return errors;
}

/**
 * Validate a single wave
 * @param {Object} wave - Wave to validate
 * @param {number} waveIndex - Wave index
 * @returns {Object} Validation errors keyed by field name
 */
export function validateWave(wave, waveIndex) {
  const errors = {};
  
  const durationError = validateWaveDuration(wave.duration);
  if (durationError) {
    errors.duration = durationError;
  }
  
  return errors;
}