# Drag-and-Drop Implementation Plan for CobPlanner

## Overview
Implement drag-and-drop functionality to enable:
1. **Operation Reordering**: Drag operation cards within the same wave to reorder them
2. **Cross-Wave Operation Moving**: Drag operation cards between different waves
3. **Wave Reordering**: Drag wave headers to reorder entire waves

## Implementation Strategy

### Phase 1: Create New Branch and Setup
- Create new branch `feature/drag-and-drop`
- Install `vuedraggable@next` library (Vue 3 compatible drag-and-drop component)
- Update package.json with new dependency

### Phase 2: Extend Vuex Store
- Add new actions to `waves.js`:
  - `moveOperationWithinWave(fromIndex, toIndex, waveIndex)`
  - `moveOperationBetweenWaves(fromWaveIndex, fromOpIndex, toWaveIndex, toOpIndex)`
  - Extend existing `moveWave` action for better drag-and-drop integration

### Phase 3: Create Drag-and-Drop Composable
- Create `src/composables/useDragDrop.js` for reusable drag-and-drop logic
- Handle drag events, validation, and state management
- Integrate with existing undo/redo system via `useUndoRedo.js`

### Phase 4: Update Components

#### ReusePage.vue
- Import and integrate `vuedraggable` component
- Wrap wave containers with draggable for wave reordering
- Add drag feedback and visual indicators
- Handle drop zones and validation

#### OperationCard.vue
- Add drag handle or make entire card draggable
- Add visual feedback during drag operations
- Maintain existing functionality (selection, context menu)

#### WaveHeader.vue
- Add drag handle for wave reordering
- Visual feedback during drag operations
- Preserve existing click and selection behavior

### Phase 5: Implementation Details

#### Operation Drag-and-Drop
- Use `vuedraggable` with `item-key="id"` for operation cards
- Enable cross-wave dragging with `group` prop
- Implement drop zones between waves
- Handle validation during drag operations

#### Wave Drag-and-Drop
- Wrap wave containers with `vuedraggable`
- Use wave index as key
- Implement visual feedback for drop zones
- Maintain wave selection state during drag

#### Visual Enhancements
- Add drag cursors and visual feedback
- Implement drop zone highlights
- Add smooth animations for drag operations
- Maintain theme consistency (light/dark mode)

### Phase 6: Integration and Testing
- Integrate with existing selection system
- Ensure compatibility with copy-paste functionality
- Maintain undo/redo functionality
- Add comprehensive tests for drag-and-drop operations
- Test keyboard accessibility and mobile responsiveness

### Phase 7: Error Handling and Edge Cases
- Handle invalid drop targets
- Prevent dragging to invalid positions
- Maintain data integrity during drag operations
- Handle drag cancellation and errors

## Technical Considerations

### Library Choice
- **vuedraggable@next**: Most mature, Vue 3 compatible, based on Sortable.js
- Provides excellent cross-browser compatibility
- Integrates well with Vuex using computed properties

### Performance
- Use computed properties for reactive drag lists
- Implement proper key management for efficient re-rendering
- Optimize drag feedback to avoid unnecessary re-renders

### User Experience
- Smooth animations during drag operations
- Clear visual feedback for valid/invalid drop zones
- Maintain existing keyboard shortcuts and accessibility
- Preserve selection states during drag operations

## Files to Modify/Create
1. `package.json` - Add vuedraggable dependency
2. `src/composables/useDragDrop.js` - New composable for drag-and-drop logic
3. `src/store/modules/waves.js` - Add drag-and-drop actions
4. `src/components/ReusePage.vue` - Integrate drag-and-drop functionality
5. `src/components/OperationCard.vue` - Add drag handles and feedback
6. `src/components/WaveHeader.vue` - Add wave drag functionality
7. `tests/unit/dragDrop.test.js` - New test file for drag-and-drop functionality

## Implementation Timeline
- **Phase 1-2**: Setup and store extensions (~2 hours)
- **Phase 3**: Drag-and-drop composable (~3 hours)
- **Phase 4**: Component updates (~4 hours)
- **Phase 5**: Visual enhancements (~2 hours)
- **Phase 6**: Integration and testing (~3 hours)
- **Phase 7**: Error handling and polish (~2 hours)

**Total estimated time: 16 hours**

## Current Architecture Analysis

### Existing Components Structure
- **ReusePage.vue**: Main container with wave containers and operations grid
- **OperationCard.vue**: Individual operation cards with form inputs
- **WaveHeader.vue**: Wave headers with duration and notes inputs

### Existing State Management
- **waves.js**: Already has `moveWave` action for wave reordering
- **selection.js**: Handles multiple selection of operations and waves
- **clipboard.js**: Manages copy-paste functionality

### Existing Styling
- Operation cards use flexbox layout with hover effects
- Wave containers have selection styles
- Dark/light theme support throughout

## Implementation Notes

### Drag-and-Drop Requirements
1. **Operation Cards**: Must be draggable within same wave and between waves
2. **Wave Headers**: Must be draggable to reorder waves
3. **Visual Feedback**: Clear indicators for valid drop zones
4. **Undo/Redo**: Must integrate with existing undo/redo system
5. **Selection**: Must preserve selection states during drag operations

### Key Technical Decisions
- Use `vuedraggable@next` for mature, Vue 3 compatible drag-and-drop
- Implement unique IDs for operations to support proper drag-and-drop
- Use computed properties for reactive drag lists
- Integrate with existing Vuex store patterns

This plan provides a comprehensive approach to adding drag-and-drop functionality while maintaining the existing architecture and user experience of the CobPlanner application.