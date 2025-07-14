<template>
  <div 
    class="wave-header" 
    :class="{ 'dark-theme': theme === 'dark', 'selected': isSelected }"
    @contextmenu.prevent="handleRightClick"
    @click.stop="$emit('click', waveIndex, $event)"
  >
    <div class="wave-info">
      <h6 class="wave-title">波次 {{ waveIndex + 1 }}</h6>
      <div class="wave-inputs">
        <div class="wave-duration">
          <label>波长:</label>
          <input
            type="number"
            class="form-control form-control-sm"
            :class="{ 'is-invalid': waveDurationError }"
            v-model.number="localWave.duration"
            min="1"
            @change="handleWaveUpdate"
            @click.stop
            :title="waveDurationError || ''"
          />
        </div>
        <div class="wave-notes">
          <label>备注:</label>
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="localWave.notes"
            @input="handleWaveUpdate"
            @change="handleWaveUpdate"
            @click.stop
            placeholder="在此输入备注信息..."
          />
        </div>
      </div>
    </div>
    <button class="btn btn-sm btn-danger" @click.stop="handleRemoveWave">
      移除波次
    </button>
  </div>
</template>

<script>
import { validateWaveDuration } from '../utils/validation.js';

export default {
  name: 'WaveHeader',
  props: {
    wave: {
      type: Object,
      required: true
    },
    waveIndex: {
      type: Number,
      required: true
    },
    theme: {
      type: String,
      default: 'light'
    },
    validationErrors: {
      type: Map,
      default: () => new Map()
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localWave: { ...this.wave }
    };
  },
  computed: {
    waveDurationError() {
      const key = `wave-${this.waveIndex}-duration`;
      return this.validationErrors.get(key) || null;
    }
  },
  watch: {
    wave: {
      handler(newWave) {
        this.localWave = { ...newWave };
      },
      deep: true
    }
  },
  methods: {
    handleWaveUpdate() {
      // Validate the wave
      const durationError = validateWaveDuration(this.localWave.duration);
      
      // Emit validation error
      this.$emit('validation-error', {
        waveIndex: this.waveIndex,
        field: 'duration',
        error: durationError
      });
      
      // Emit the update
      this.$emit('update-wave', {
        waveIndex: this.waveIndex,
        wave: this.localWave
      });
    },
    handleRemoveWave() {
      this.$emit('remove-wave', this.waveIndex);
    },
    
    handleRightClick(event) {
      this.$emit('context-menu', {
        event,
        type: 'wave',
        wave: this.localWave,
        waveIndex: this.waveIndex
      });
    }
  }
}
</script>

<style scoped>
.wave-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0;
  margin-bottom: 0;
  cursor: pointer;
}

.wave-header.dark-theme {
  background-color: rgba(255, 255, 255, 0.02);
  border-color: #495057;
}

/* Selection styles */
.wave-header.selected {
  background-color: rgba(0, 123, 255, 0.1) !important;
  border-color: rgba(0, 123, 255, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
}

.wave-header.dark-theme.selected {
  background-color: rgba(13, 110, 253, 0.2) !important;
  border-color: rgba(13, 110, 253, 0.6) !important;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.35) !important;
}

.wave-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  margin-right: 16px;
}

.wave-title {
  margin: 0;
  font-weight: 600;
  color: #495057;
}

.dark .wave-title {
  color: #adb5bd;
}

.wave-inputs {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.wave-duration {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.wave-duration label {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

.wave-duration input {
  width: 80px;
}

.wave-notes {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.wave-notes label {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

.wave-notes input {
  flex: 1;
  min-width: 0;
}

/* Validation error styles */
.form-control.is-invalid {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.dark .form-control.is-invalid {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.2);
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.form-control.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .wave-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }

  .wave-info {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .wave-inputs {
    flex-direction: column;
    gap: 8px;
  }

  .wave-duration,
  .wave-notes {
    justify-content: space-between;
  }
}
</style>