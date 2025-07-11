/**
 * AvZ2 DSL Export Utility
 * Converts calculation results to AvZ2 DSL format
 */

/**
 * Generate AvZ2 DSL code from calculation results
 * @param {Object} calculationResult - Result from solver
 * @param {Array} waves - Wave configuration from store
 * @param {boolean} includeNotes - Whether to include notes as comments
 * @returns {string} Generated AvZ2 DSL code
 */
export function generateAvZ2Code(calculationResult, waves, includeNotes = false) {
  if (!calculationResult || calculationResult.successCount === 0) {
    return '// No successful operations to export';
  }

  // Group operations by wave
  const operationsByWave = groupOperationsByWave(calculationResult.operations, waves);
  
  // Generate code for each wave
  const waveBlocks = [];
  for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
    const waveOps = operationsByWave[waveIndex] || [];
    if (waveOps.length > 0) {
      const waveCode = generateWaveBlock(waveIndex + 1, waveOps, waves[waveIndex], includeNotes);
      waveBlocks.push(waveCode);
    }
  }

  return waveBlocks.join('\n\n');
}

/**
 * Group operations by wave index
 */
function groupOperationsByWave(operations, waves) {
  const grouped = {};
  
  // Calculate cumulative wave start times
  const waveStartTimes = [];
  let cumulativeTime = 0;
  for (let i = 0; i < waves.length; i++) {
    waveStartTimes.push(cumulativeTime);
    cumulativeTime += waves[i].duration;
  }

  // Group operations by wave
  operations.forEach(op => {
    if (op.success && typeof op.waveIndex === 'number') {
      if (!grouped[op.waveIndex]) {
        grouped[op.waveIndex] = [];
      }
      
      // Calculate relative time within the wave
      const waveStartTime = waveStartTimes[op.waveIndex] || 0;
      const relativeTime = op.absoluteTime - waveStartTime;
      
      grouped[op.waveIndex].push({
        ...op,
        relativeTime
      });
    }
  });

  // Sort operations within each wave by relative time
  Object.keys(grouped).forEach(waveIndex => {
    grouped[waveIndex].sort((a, b) => a.relativeTime - b.relativeTime);
  });

  return grouped;
}

/**
 * Generate code block for a single wave
 */
function generateWaveBlock(waveNumber, operations, waveConfig, includeNotes = false) {
  // Group operations by time
  const operationsByTime = {};
  
  operations.forEach(op => {
    const timeKey = op.relativeTime;
    if (!operationsByTime[timeKey]) {
      operationsByTime[timeKey] = [];
    }
    operationsByTime[timeKey].push(op);
  });

  // Generate time blocks
  const timeBlocks = [];
  const sortedTimes = Object.keys(operationsByTime)
    .map(t => parseInt(t))
    .sort((a, b) => a - b);

  sortedTimes.forEach(time => {
    const ops = operationsByTime[time];
    const timeCommand = getTimeCommand(time, waveConfig);
    const operationCommands = ops.map(generateOperationCommand);
    const combinedOps = operationCommands.join(' & ');
    timeBlocks.push(`    ${timeCommand} ${combinedOps}`);
  });

  // Prepare the wave block
  let waveBlock = '';
  
  // Add note comment if enabled and wave has notes
  if (includeNotes && waveConfig.notes && waveConfig.notes.trim()) {
    waveBlock += `// ${waveConfig.notes.trim()}\n`;
  }
  
  waveBlock += `OnWave(${waveNumber}) {\n${timeBlocks.join(',\n')}\n};`;
  
  return waveBlock;
}

/**
 * Determine whether to use At() or TrigAt() based on the original time expression
 */
function getTimeCommand(relativeTime, waveConfig) {
  // Check if this time corresponds to a w-200 type expression
  const trigTime = waveConfig.duration - 200;
  if (Math.abs(relativeTime - trigTime) < 1) {
    return `TrigAt(${waveConfig.duration - 200})`;
  }
  
  return `At(${relativeTime})`;
}

/**
 * Generate command for a single operation
 */
function generateOperationCommand(operation) {
  switch (operation.type) {
    case 'fire':
      return `RP(${operation.cannonRow}, ${operation.cannonCol}, ${operation.row}, ${operation.targetCol})`;
    
    case 'plant':
      return `Card(ACOB_CANNON, ${operation.row}, ${operation.targetCol})`;
    
    case 'remove':
      return `Shovel(${operation.row}, ${operation.targetCol})`;
    
    default:
      return `// Unknown operation: ${operation.type}`;
  }
}

/**
 * Check if a time expression represents a trigger timing (w-offset)
 */
function isTriggerTiming(timeExpression, waveDuration) {
  if (typeof timeExpression !== 'string') return false;
  
  // Check for expressions like "w-200", "w - 200", etc.
  const triggerPattern = /^w\s*-\s*(\d+)$/;
  const match = timeExpression.match(triggerPattern);
  
  if (match) {
    const offset = parseInt(match[1]);
    return waveDuration - offset;
  }
  
  return false;
}