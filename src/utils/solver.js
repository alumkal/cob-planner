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
    wave.operations.forEach((op, opIndex) => {
      // Parse the time expression
      let time;
      try {
        // Replace 'w' with the wave duration
        const timeExpr = op.time.toString().replace(/w/g, wave.duration);
        // Evaluate the expression
        time = Math.floor(Function(`return ${timeExpr}`)());
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
  const parts = columnSet.split(' ');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (col >= start && col <= end) return true;
    } else {
      if (col === parseInt(part)) return true;
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
        col: op.col,
        available: false,
        plantTime: op.absoluteTime,
        lastUsed: -Infinity,
        nextAvailable: op.absoluteTime + 625
      };
      cannons.push(newCannon);
    } else if (op.type === 'remove') {
      // Find and mark the cannon as removed
      const cannonIndex = cannons.findIndex(c => c.row === op.row && c.col === op.col);
      if (cannonIndex !== -1) {
        cannons[cannonIndex].available = false;
        cannons[cannonIndex].removeTime = op.absoluteTime;
      }
    }
  }

  // Extract only fire operations
  const fireOps = operations.filter(op => op.type === 'fire');

  // Try to solve incrementally
  const fireResults = [];

  for (let maxOps = 1; maxOps <= fireOps.length; maxOps++) {
    const solver = new Solver();
    const cannonVars = {};

    // Generate variables for the first maxOps operations
    for (let i = 0; i < maxOps; i++) {
      const op = fireOps[i];

      // Find valid cannons for this fire operation
      for (let j = 0; j < cannons.length; j++) {
        const cannon = cannons[j];

        // Check if cannon is valid for this operation
        const isValid = (
          // Cannon must be in the required column set
          isColumnInSet(cannon.col, op.columns) &&
          // Cannon must be planted and not removed at this time
          (cannon.plantTime === undefined || cannon.plantTime + 625 <= op.absoluteTime) &&
          (cannon.removeTime === undefined || cannon.removeTime - 204 > op.absoluteTime)
        );

        if (isValid) {
          // Calculate the fire time
          const fireTime = op.absoluteTime - getRoofFlyTime(cannon.col, op.targetCol);

          // Create a variable for this cannon-operation pair
          const varName = `fire_${i}_${j}`;
          cannonVars[varName] = { opIndex: i, cannonIndex: j, fireTime };
        }
      }
    }

    // Add constraint: exactly one cannon must be used for each operation
    for (let i = 0; i < maxOps; i++) {
      const operationVars = Object.keys(cannonVars)
        .filter(varName => cannonVars[varName].opIndex === i);

      if (operationVars.length === 0) {
        // No valid cannons for this operation, stop here
        return {
          successCount: fireResults.length,
          fireResults,
          nextAvailableTimes: calculateNextAvailableTimes(cannons)
        };
      }

      // Add constraint: at least one cannon must be used for this operation
      solver.require(Logic.or(...operationVars));
    }

    // Add time constraints between operations
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

    // Try to solve with the current constraints
    const solution = solver.solve();

    // If no solution, we've reached the maximum number of operations we can satisfy
    if (!solution) {
      break;
    }

    // Update fire results with the current solution
    fireResults.length = 0; // Clear previous results
    for (let i = 0; i < maxOps; i++) {
      const op = fireOps[i];
      const operationVars = Object.keys(cannonVars)
        .filter(varName => cannonVars[varName].opIndex === i);

      const usedVar = operationVars.find(varName => solution.evaluate(varName));
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

export function solveReuse(cannons, waves) {
  // Preprocess operations
  const { operations, totalTime } = preprocessOperations(waves);

  // Solve the reuse problem
  const result = solveCobReuse(cannons, operations);

  // Map results back to the original operations
  const mappedResults = operations.map((op, index) => {
    if (index < result.successCount) {
      const fireResult = result.fireResults.find(r => r.opIndex === op.originalIndex);
      return {
        ...op,
        success: true,
        cannonRow: fireResult ? fireResult.cannonRow : null,
        cannonCol: fireResult ? fireResult.cannonCol : null
      };
    } else {
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
    successCount: result.successCount,
    nextAvailable
  };
}