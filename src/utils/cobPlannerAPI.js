/**
 * CobPlanner High-Level API
 * Provides a unified interface for sanity checking, solving, and exporting cob cannon reuse calculations
 */

import { solveReuse, getRoofFlyTime, preprocessOperations, isColumnInSet } from './solver.js';
import { generateAvZ2Code } from './avz2Export.js';

/**
 * Configuration options for the CobPlanner API
 */
const DEFAULT_CONFIG = {
  validateInput: true,
  includeDetailedErrors: true,
  maxOperations: 100,
  maxWaves: 20,
  maxCannons: 45 // 5 rows * 9 columns
};

/**
 * High-level API class for CobPlanner functionality
 */
export class CobPlannerAPI {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Comprehensive sanity check for cannons and waves configuration
   * @param {Array} cannons - Array of cannon objects with row and col properties
   * @param {Array} waves - Array of wave objects with duration and operations
   * @returns {Object} Validation result with success status and detailed errors
   */
  sanityCheck(cannons, waves) {
    const result = {
      success: true,
      errors: [],
      warnings: [],
      summary: {
        totalCannons: cannons?.length || 0,
        totalWaves: waves?.length || 0,
        totalOperations: 0,
        fireOperations: 0,
        plantOperations: 0,
        removeOperations: 0
      }
    };

    try {
      // Validate input structure
      if (!this._validateInputStructure(cannons, waves, result)) {
        return result;
      }

      // Validate cannons
      this._validateCannons(cannons, result);

      // Validate waves and operations
      this._validateWaves(waves, result);

      // Count operations for summary
      waves.forEach(wave => {
        if (wave.operations && Array.isArray(wave.operations)) {
          result.summary.totalOperations += wave.operations.length;
          wave.operations.forEach(op => {
            switch (op.type) {
              case 'fire':
                result.summary.fireOperations++;
                break;
              case 'plant':
                result.summary.plantOperations++;
                break;
              case 'remove':
                result.summary.removeOperations++;
                break;
            }
          });
        }
      });

      // Check for logical issues
      this._checkLogicalConsistency(cannons, waves, result);

      // Set final success status
      result.success = result.errors.length === 0;

    } catch (error) {
      result.success = false;
      result.errors.push(`Unexpected error during sanity check: ${error.message}`);
    }

    return result;
  }

  /**
   * Solve the cob cannon reuse problem
   * @param {Array} cannons - Array of cannon objects
   * @param {Array} waves - Array of wave objects
   * @returns {Object} Comprehensive solve result with success status and detailed information
   */
  solve(cannons, waves) {
    const result = {
      success: false,
      sanityCheck: null,
      solveResult: null,
      performance: {
        startTime: Date.now(),
        endTime: null,
        duration: null
      },
      errors: [],
      warnings: []
    };

    try {
      // First perform sanity check
      result.sanityCheck = this.sanityCheck(cannons, waves);
      
      if (!result.sanityCheck.success) {
        result.errors.push('Sanity check failed - cannot proceed with solving');
        return result;
      }

      // Perform the solve operation
      result.solveResult = solveReuse(cannons, waves);
      
      // Analyze results
      const analysis = this._analyzeResults(result.solveResult, waves);
      result.analysis = analysis;

      // Check for warnings
      if (analysis.successRate < 1.0) {
        result.warnings.push(`Only ${Math.round(analysis.successRate * 100)}% of fire operations succeeded`);
      }

      if (analysis.unusedCannons > 0) {
        result.warnings.push(`${analysis.unusedCannons} cannons were not used`);
      }

      result.success = true;

    } catch (error) {
      result.errors.push(`Solve operation failed: ${error.message}`);
    } finally {
      result.performance.endTime = Date.now();
      result.performance.duration = result.performance.endTime - result.performance.startTime;
    }

    return result;
  }

  /**
   * Export solve results to specified format
   * @param {Object} solveResult - Result from solve() method
   * @param {Array} waves - Original wave configuration
   * @param {string} format - Export format ('avz2' supported)
   * @param {Object} options - Export options
   * @returns {Object} Export result with generated code
   */
  export(solveResult, waves, format = 'avz2', options = {}) {
    const result = {
      success: false,
      format,
      code: '',
      errors: [],
      metadata: {
        exportedOperations: 0,
        totalOperations: 0,
        timestamp: new Date().toISOString()
      }
    };

    try {
      // Validate inputs
      if (!solveResult || !solveResult.solveResult) {
        result.errors.push('Invalid solve result provided');
        return result;
      }

      if (!waves || !Array.isArray(waves)) {
        result.errors.push('Invalid waves configuration provided');
        return result;
      }

      // Generate export based on format
      switch (format.toLowerCase()) {
        case 'avz2':
          result.code = generateAvZ2Code(
            solveResult.solveResult,
            waves,
            options.includeNotes !== false
          );
          break;
        
        default:
          result.errors.push(`Unsupported export format: ${format}`);
          return result;
      }

      // Calculate metadata
      const operations = solveResult.solveResult.operations || [];
      result.metadata.totalOperations = operations.length;
      result.metadata.exportedOperations = operations.filter(op => op.success).length;

      result.success = true;

    } catch (error) {
      result.errors.push(`Export failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Load configuration from JSON data
   * @param {string|Object} jsonData - JSON string or parsed object
   * @returns {Object} Parsed configuration with cannons and waves
   */
  loadFromJSON(jsonData) {
    const result = {
      success: false,
      cannons: [],
      waves: [],
      errors: []
    };

    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (data.cannons && Array.isArray(data.cannons)) {
        result.cannons = data.cannons;
      }
      
      if (data.waves && Array.isArray(data.waves)) {
        result.waves = data.waves;
      }

      result.success = true;

    } catch (error) {
      result.errors.push(`Failed to load JSON: ${error.message}`);
    }

    return result;
  }

  /**
   * Save configuration to JSON format
   * @param {Array} cannons - Cannon configuration
   * @param {Array} waves - Wave configuration
   * @returns {Object} JSON export result
   */
  saveToJSON(cannons, waves) {
    const result = {
      success: false,
      json: '',
      errors: []
    };

    try {
      const data = {
        cannons: cannons || [],
        waves: waves || [],
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          generator: 'CobPlanner API'
        }
      };

      result.json = JSON.stringify(data, null, 2);
      result.success = true;

    } catch (error) {
      result.errors.push(`Failed to save JSON: ${error.message}`);
    }

    return result;
  }

  // Private validation methods

  _validateInputStructure(cannons, waves, result) {
    if (!Array.isArray(cannons)) {
      result.errors.push('Cannons must be an array');
      result.success = false;
      return false;
    }

    if (!Array.isArray(waves)) {
      result.errors.push('Waves must be an array');
      result.success = false;
      return false;
    }

    if (cannons.length > this.config.maxCannons) {
      result.errors.push(`Too many cannons (${cannons.length}), maximum is ${this.config.maxCannons}`);
      result.success = false;
      return false;
    }

    if (waves.length > this.config.maxWaves) {
      result.errors.push(`Too many waves (${waves.length}), maximum is ${this.config.maxWaves}`);
      result.success = false;
      return false;
    }

    return true;
  }

  _validateCannons(cannons, result) {
    const positions = new Set();

    cannons.forEach((cannon, index) => {
      if (!cannon || typeof cannon !== 'object') {
        result.errors.push(`Cannon ${index} is not a valid object`);
        return;
      }

      if (!Number.isInteger(cannon.row) || cannon.row < 1 || cannon.row > 5) {
        result.errors.push(`Cannon ${index} has invalid row (${cannon.row}), must be 1-5`);
      }

      if (!Number.isInteger(cannon.col) || cannon.col < 1 || cannon.col > 9) {
        result.errors.push(`Cannon ${index} has invalid column (${cannon.col}), must be 1-9`);
      }

      // Check for overlapping cannons (cobs are 1x2, need 2+ spaces apart in same row)
      const posKey = `${cannon.row}-${cannon.col}`;
      if (positions.has(posKey)) {
        result.errors.push(`Duplicate cannon at position ${posKey}`);
      } else {
        positions.add(posKey);
        
        // Check for overlaps with other cannons in the same row
        cannons.forEach((otherCannon, otherIndex) => {
          if (index !== otherIndex && 
              cannon.row === otherCannon.row && 
              Math.abs(cannon.col - otherCannon.col) < 2) {
            result.errors.push(`Cannons at (${cannon.row},${cannon.col}) and (${otherCannon.row},${otherCannon.col}) overlap`);
          }
        });
      }
    });
  }

  _validateWaves(waves, result) {
    let totalOperations = 0;

    waves.forEach((wave, waveIndex) => {
      if (!wave || typeof wave !== 'object') {
        result.errors.push(`Wave ${waveIndex} is not a valid object`);
        return;
      }

      if (!Number.isInteger(wave.duration) || wave.duration <= 0) {
        result.errors.push(`Wave ${waveIndex} has invalid duration (${wave.duration})`);
      }

      if (!Array.isArray(wave.operations)) {
        result.errors.push(`Wave ${waveIndex} operations must be an array`);
        return;
      }

      wave.operations.forEach((op, opIndex) => {
        totalOperations++;
        this._validateOperation(op, waveIndex, opIndex, wave, result);
      });
    });

    if (totalOperations > this.config.maxOperations) {
      result.errors.push(`Too many operations (${totalOperations}), maximum is ${this.config.maxOperations}`);
    }
  }

  _validateOperation(op, waveIndex, opIndex, wave, result) {
    const opId = `Wave ${waveIndex}, Operation ${opIndex}`;

    if (!op || typeof op !== 'object') {
      result.errors.push(`${opId}: Invalid operation object`);
      return;
    }

    if (!['fire', 'plant', 'remove'].includes(op.type)) {
      result.errors.push(`${opId}: Invalid operation type (${op.type})`);
    }

    // Validate time expression
    if (op.time === undefined || op.time === null || op.time === '') {
      result.errors.push(`${opId}: Missing time`);
    } else {
      try {
        const timeExpr = op.time.toString().replace(/w/g, wave.duration);
        const time = Math.floor(Function(`return ${timeExpr}`)());
        if (!Number.isInteger(time) || time < 0) {
          result.errors.push(`${opId}: Invalid time expression (${op.time})`);
        }
      } catch (error) {
        result.errors.push(`${opId}: Invalid time expression (${op.time})`);
      }
    }

    // Validate based on operation type
    switch (op.type) {
      case 'fire':
        if (!Number.isInteger(op.row) || op.row < 1 || op.row > 5) {
          result.errors.push(`${opId}: Invalid target row (${op.row})`);
        }
        
        if (typeof op.targetCol !== 'number' || op.targetCol < 1 || op.targetCol > 9) {
          result.errors.push(`${opId}: Invalid target column (${op.targetCol})`);
        } else {
          // Check 1/80 precision requirement for fire operations
          const targetCol80 = Math.round(op.targetCol * 80);
          if (Math.abs(op.targetCol * 80 - targetCol80) > 0.0001) {
            result.errors.push(`${opId}: Target column must be multiple of 1/80 (0.0125)`);
          }
        }
        break;

      case 'plant':
      case 'remove':
        if (!Number.isInteger(op.row) || op.row < 1 || op.row > 5) {
          result.errors.push(`${opId}: Invalid row (${op.row})`);
        }
        if (!Number.isInteger(op.targetCol) || op.targetCol < 1 || op.targetCol > 9) {
          result.errors.push(`${opId}: Invalid column (${op.targetCol})`);
        }
        break;
    }
  }

  _checkLogicalConsistency(cannons, waves, result) {
    // Check if there are fire operations but no cannons
    const hasFireOperations = waves.some(wave => 
      wave.operations && wave.operations.some(op => op.type === 'fire')
    );

    if (hasFireOperations && cannons.length === 0) {
      result.warnings.push('Fire operations found but no initial cannons defined');
    }

    // Check for remove operations without corresponding plant operations
    const plantedPositions = new Set(cannons.map(c => `${c.row}-${c.col}`));
    const removedPositions = new Set();

    waves.forEach((wave, waveIndex) => {
      if (!wave.operations) return;

      wave.operations.forEach((op, opIndex) => {
        const posKey = `${op.row}-${op.targetCol}`;
        
        if (op.type === 'plant') {
          plantedPositions.add(posKey);
        } else if (op.type === 'remove') {
          if (!plantedPositions.has(posKey)) {
            result.warnings.push(`Wave ${waveIndex}, Operation ${opIndex}: Removing cannon that was never planted at (${op.row},${op.targetCol})`);
          }
          removedPositions.add(posKey);
        }
      });
    });
  }

  _analyzeResults(solveResult, waves) {
    const analysis = {
      successRate: 0,
      successfulOperations: 0,
      totalFireOperations: 0,
      unusedCannons: 0,
      performance: {
        averageCannonUsage: 0,
        timespan: 0
      }
    };

    if (!solveResult || !solveResult.operations) {
      return analysis;
    }

    const operations = solveResult.operations;
    const fireOperations = operations.filter(op => op.type === 'fire');
    const successfulFires = fireOperations.filter(op => op.success);

    analysis.totalFireOperations = fireOperations.length;
    analysis.successfulOperations = successfulFires.length;
    analysis.successRate = fireOperations.length > 0 ? successfulFires.length / fireOperations.length : 0;

    // Calculate timespan
    if (operations.length > 0) {
      const times = operations.map(op => op.absoluteTime).filter(t => t !== undefined);
      if (times.length > 0) {
        analysis.performance.timespan = Math.max(...times) - Math.min(...times);
      }
    }

    return analysis;
  }
}

/**
 * Create a new CobPlanner API instance
 * @param {Object} config - Configuration options
 * @returns {CobPlannerAPI} New API instance
 */
export function createCobPlannerAPI(config = {}) {
  return new CobPlannerAPI(config);
}

/**
 * Quick helper functions for common operations
 */
export const CobPlannerHelpers = {
  /**
   * Quick sanity check without creating API instance
   */
  quickSanityCheck: (cannons, waves) => {
    const api = new CobPlannerAPI();
    return api.sanityCheck(cannons, waves);
  },

  /**
   * Quick solve without creating API instance
   */
  quickSolve: (cannons, waves) => {
    const api = new CobPlannerAPI();
    return api.solve(cannons, waves);
  },

  /**
   * Quick export without creating API instance
   */
  quickExport: (solveResult, waves, format = 'avz2', options = {}) => {
    const api = new CobPlannerAPI();
    return api.export(solveResult, waves, format, options);
  }
};

// Export default instance for convenience
export default new CobPlannerAPI();