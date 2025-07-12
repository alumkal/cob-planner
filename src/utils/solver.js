import LogicSolver from 'logic-solver';

// Get the Solver constructor and utility functions
const Solver = LogicSolver.Solver;
const Logic = {
  or: LogicSolver.or,
  and: LogicSolver.and,
  not: LogicSolver.not
};

// Calculate the fly time for a cob cannon
export function getRoofFlyTime(cobCol, dropCol) {
  // Validate cannon column range
  if (cobCol < 1 || cobCol > 8) {
    throw new Error(`Invalid cannon column: ${cobCol}. Must be between 1 and 8.`);
  }

  const flyTimeData = [
    { minDropX: 515, minFlyTime: 359 },
    { minDropX: 499, minFlyTime: 362 },
    { minDropX: 515, minFlyTime: 364 },
    { minDropX: 499, minFlyTime: 367 },
    { minDropX: 515, minFlyTime: 369 },
    { minDropX: 499, minFlyTime: 372 },
    { minDropX: 511, minFlyTime: 373 },
    { minDropX: 511, minFlyTime: 373 }
  ];

  const dropX = Math.floor(dropCol * 80);
  const minDropX = flyTimeData[cobCol - 1].minDropX;
  const minFlyTime = flyTimeData[cobCol - 1].minFlyTime;

  if (dropX >= minDropX) {
    return minFlyTime;
  } else {
    // Use integer division like C++ (truncates towards zero)
    const dividend = dropX - (minDropX - 1);
    const quotient = dividend >= 0 ? Math.floor(dividend / 32) : Math.ceil(dividend / 32);
    return minFlyTime + 1 - quotient;
  }
}

// Convert relative times to absolute times and sort operations
export function preprocessOperations(waves) {
  let absoluteTime = 0;
  let operations = [];

  waves.forEach((wave, waveIndex) => {
    // Check if operations exist and is an array
    if (!wave.operations || !Array.isArray(wave.operations)) {
      return; // Skip this wave if no valid operations
    }
    
    wave.operations.forEach((op, opIndex) => {
      // Parse the time expression
      let time;
      try {
        // Replace 'w' with the wave duration
        const timeExpr = op.time.toString().replace(/w/g, wave.duration);
        // Evaluate the expression
        time = Math.floor(Function(`return ${timeExpr}`)());
        
        // Validate the result is a finite number
        if (!isFinite(time)) {
          time = 0;
        }
      } catch (e) {
        time = 0;
      }

      // Convert to absolute time
      const absTime = absoluteTime + time;

      operations.push({
        ...op,
        absoluteTime: absTime,
        waveIndex,
        opIndex,
        originalIndex: operations.length
      });
    });

    absoluteTime += wave.duration;
  });

  // Sort operations by absolute time
  operations.sort((a, b) => a.absoluteTime - b.absoluteTime);

  return { operations, totalTime: absoluteTime };
}

// Check if a column is in the required set
export function isColumnInSet(col, columnSet) {
  if (!columnSet) return true;

  // Parse the column set (e.g., "1-5 7" => columns 1,2,3,4,5,7)
  const parts = columnSet.split(' ').filter(part => part.trim() !== '');
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (trimmedPart.includes('-')) {
      const rangeParts = trimmedPart.split('-');
      if (rangeParts.length !== 2 || rangeParts[0] === '' || rangeParts[1] === '') continue; // Skip invalid ranges
      
      const [start, end] = rangeParts.map(Number);
      if (isNaN(start) || isNaN(end)) continue; // Skip non-numeric ranges
      
      if (col >= start && col <= end) return true;
    } else {
      const num = parseInt(trimmedPart);
      if (!isNaN(num) && col === num) return true;
    }
  }

  return false;
}

// Main solver function
export function solveCobReuse(initialCannons, operations) {
  // Track the state of each cannon
  let cannons = initialCannons.map(c => ({
    ...c,
    available: true,
    lastUsed: -Infinity,
    nextAvailable: 0
  }));

  // First pass: process plant and remove operations
  for (const op of operations) {
    if (op.type === 'plant') {
      // Add a new cannon
      const newCannon = {
        row: op.row,
        col: op.targetCol,
        available: false,
        plantTime: op.absoluteTime,
        lastUsed: -Infinity,
        nextAvailable: op.absoluteTime + 625
      };
      cannons.push(newCannon);
    } else if (op.type === 'remove') {
      // Find and mark the cannon as removed
      const cannonIndex = cannons.findIndex(c => c.row === op.row && c.col === op.targetCol);
      if (cannonIndex !== -1) {
        cannons[cannonIndex].available = false;
        cannons[cannonIndex].removeTime = op.absoluteTime;
      }
    }
  }

  // Extract only fire operations
  const fireOps = operations.filter(op => op.type === 'fire');
  
  if (fireOps.length === 0) {
    return {
      successCount: 0,
      fireResults: [],
      nextAvailableTimes: calculateNextAvailableTimes(cannons)
    };
  }

  // Build the complete SAT problem with ALL variables and time constraints
  const solver = new Solver();
  const cannonVars = {};

  // Generate variables for ALL fire operations
  for (let i = 0; i < fireOps.length; i++) {
    const op = fireOps[i];

    // Find valid cannons for this fire operation
    for (let j = 0; j < cannons.length; j++) {
      const cannon = cannons[j];

      // Calculate the fire time first
      const fireTime = op.absoluteTime - getRoofFlyTime(cannon.col, op.targetCol);

      // Check if cannon is valid for this operation based on fire time
      const isValid = (
        // Cannon must be in the required column set
        isColumnInSet(cannon.col, op.columns) &&
        // Cannon must be planted and available by fire time
        (cannon.plantTime === undefined || cannon.plantTime + 625 <= fireTime) &&
        // Cannon must not be removed or unavailable by fire time
        (cannon.removeTime === undefined || cannon.removeTime - 204 > fireTime)
      );

      if (isValid) {
        // Create a variable for this cannon-operation pair
        const varName = `fire_${i}_${j}`;
        cannonVars[varName] = { opIndex: i, cannonIndex: j, fireTime };
      }
    }
  }

  // Add ALL time constraints between operations
  for (const varName1 in cannonVars) {
    const { cannonIndex: ci1, fireTime: ft1 } = cannonVars[varName1];

    for (const varName2 in cannonVars) {
      if (varName1 !== varName2) {
        const { cannonIndex: ci2, fireTime: ft2 } = cannonVars[varName2];

        // If same cannon and fire times are too close, add constraint
        if (ci1 === ci2 && Math.abs(ft1 - ft2) < 3475) {
          solver.forbid(Logic.and(varName1, varName2));
        }
      }
    }
  }

  // Incrementally add operation constraints
  const fireResults = [];
  let successCount = 0;
  let lastSolution = null;

  for (let i = 0; i < fireOps.length; i++) {
    // Find variables for this operation
    const operationVars = Object.keys(cannonVars)
      .filter(varName => cannonVars[varName].opIndex === i);

    if (operationVars.length === 0) {
      // No valid cannons for this operation, stop here
      break;
    }

    // Add this operation's constraint
    const newConstraint = Logic.or(...operationVars);
    solver.require(newConstraint);
    
    // Test if the problem is still satisfiable
    const solution = solver.solve();
    
    if (!solution) {
      // Adding this constraint made the problem unsatisfiable, stop here
      break;
    }

    // Successfully added this operation
    lastSolution = solution;
    successCount++;
  }

  // Use the last successful solution
  const finalSolution = lastSolution;
  
  if (finalSolution) {
    // Extract fire results from the final solution
    for (let i = 0; i < successCount; i++) {
      const op = fireOps[i];
      const operationVars = Object.keys(cannonVars)
        .filter(varName => cannonVars[varName].opIndex === i);

      const usedVar = operationVars.find(varName => finalSolution.evaluate(varName));
      if (usedVar) {
        const { cannonIndex, fireTime } = cannonVars[usedVar];

        fireResults.push({
          opIndex: op.originalIndex,
          cannonRow: cannons[cannonIndex].row,
          cannonCol: cannons[cannonIndex].col,
          fireTime
        });
      }
    }
  }

  // Update cannon states based on final results
  cannons.forEach(cannon => {
    cannon.lastUsed = -Infinity;
  });

  fireResults.forEach(result => {
    const cannon = cannons.find(c => c.row === result.cannonRow && c.col === result.cannonCol);
    if (cannon) {
      cannon.lastUsed = Math.max(cannon.lastUsed, result.fireTime);
    }
  });

  return {
    successCount: fireResults.length,
    fireResults,
    nextAvailableTimes: calculateNextAvailableTimes(cannons)
  };
}

// Helper function to calculate next available times
function calculateNextAvailableTimes(cannons) {
  const nextAvailableTimes = cannons.map(cannon => {
    if (cannon.lastUsed === -Infinity) {
      return { row: cannon.row, col: cannon.col, nextAvailable: 0 };
    } else {
      const nextTime = cannon.lastUsed + 3475 + getRoofFlyTime(cannon.col, 9);
      return { row: cannon.row, col: cannon.col, nextAvailable: nextTime };
    }
  });

  // Sort by next available time
  nextAvailableTimes.sort((a, b) => a.nextAvailable - b.nextAvailable);

  return nextAvailableTimes;
}

/**
 * Check if two cob cannons would overlap (cobs are 1x2, centers must be 2+ apart in same row)
 * @param {number} row1 - Row of first cob
 * @param {number} col1 - Column of first cob  
 * @param {number} row2 - Row of second cob
 * @param {number} col2 - Column of second cob
 * @returns {boolean} True if cobs would overlap
 */
function doCobsOverlap(row1, col1, row2, col2) {
  return row1 === row2 && Math.abs(col1 - col2) < 2;
}

/**
 * Validate plant/remove operations by simulating them sequentially
 * @param {Array} cannons - Initial cannons
 * @param {Array} operations - All operations sorted by absolute time
 * @returns {Object} Validation results for each operation
 */
function validateOperationsSequentially(cannons, operations) {
  // Create a mutable cannon state, starting with initial cannons
  const cannonState = cannons.map(c => ({ row: c.row, col: c.col, planted: true }));
  const validationResults = {};
  
  // Sort operations by absolute time to simulate chronologically
  const sortedOps = [...operations].sort((a, b) => a.absoluteTime - b.absoluteTime);
  
  for (const op of sortedOps) {
    const opKey = `${op.waveIndex}-${op.opIndex}`;
    
    if (op.type === 'plant') {
      // Check if we can plant at this position
      const wouldOverlap = cannonState.some(cannon => 
        cannon.planted && doCobsOverlap(cannon.row, cannon.col, op.row, op.targetCol)
      );
      
      if (wouldOverlap) {
        validationResults[opKey] = { success: false, reason: 'Overlaps with existing cob' };
      } else {
        // Plant is valid, add to state
        cannonState.push({ row: op.row, col: op.targetCol, planted: true });
        validationResults[opKey] = { success: true };
      }
      
    } else if (op.type === 'remove') {
      // Check if cannon exists at this position
      const cannonIndex = cannonState.findIndex(c => c.row === op.row && c.col === op.targetCol && c.planted);
      
      if (cannonIndex === -1) {
        validationResults[opKey] = { success: false, reason: 'No cannon exists at this position' };
      } else {
        // Remove is valid, remove from state
        cannonState.splice(cannonIndex, 1);
        validationResults[opKey] = { success: true };
      }
      
    } else if (op.type === 'fire') {
      // Fire operations don't change cannon state, validation handled by SAT solver
      validationResults[opKey] = { success: true }; // Will be overridden by SAT results
    }
  }
  
  return validationResults;
}

export function solveReuse(cannons, waves) {
  // Preprocess operations
  const { operations, totalTime } = preprocessOperations(waves);

  // Validate plant/remove operations sequentially  
  const validationResults = validateOperationsSequentially(cannons, operations);
  
  // Solve the reuse problem
  const result = solveCobReuse(cannons, operations);

  // Map results back to the original operations
  const mappedResults = operations.map((op, index) => {
    if (op.type === 'fire') {
      // For fire operations, check if there's a successful fire result
      const fireResult = result.fireResults.find(r => r.opIndex === op.originalIndex);
      return {
        ...op,
        success: !!fireResult,
        cannonRow: fireResult ? fireResult.cannonRow : null,
        cannonCol: fireResult ? fireResult.cannonCol : null
      };
    } else if (op.type === 'plant') {
      // Plant operations validated by sequential simulation (checks overlaps)
      const opKey = `${op.waveIndex}-${op.opIndex}`;
      const validation = validationResults[opKey] || { success: false };
      return {
        ...op,
        success: validation.success
      };
    } else if (op.type === 'remove') {
      // Remove operations validated by sequential simulation (checks existence)
      const opKey = `${op.waveIndex}-${op.opIndex}`;
      const validation = validationResults[opKey] || { success: false };
      return {
        ...op,
        success: validation.success
      };
    } else {
      // Unknown operation type
      return {
        ...op,
        success: false
      };
    }
  });

  // Get the next available cannons
  const nextAvailable = result.nextAvailableTimes.slice(0, 8).map(cannon => ({
    position: `${cannon.row}-${cannon.col}`,
    time: cannon.nextAvailable - totalTime
  }));

  // If we have fewer than 8 cannons, duplicate them with later times
  const originalCannonCount = nextAvailable.length;
  while (nextAvailable.length < 8 && originalCannonCount > 0) {
    // Calculate which cannon to duplicate next (cycle through all cannons)
    const cannonIndex = nextAvailable.length - originalCannonCount;
    const cannon = { ...nextAvailable[cannonIndex] };
    cannon.time += 3475;
    nextAvailable.push(cannon);
  }

  // Sort by time after all duplications
  nextAvailable.sort((a, b) => a.time - b.time);

  return {
    operations: mappedResults,
    successCount: mappedResults.filter(op => op.type === 'fire' && op.success).length,
    nextAvailable
  };
}