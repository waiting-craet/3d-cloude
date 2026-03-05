# Design Document

## Overview

This document outlines the technical design for fixing the AI node edit panel synchronization bug in the AI editing page modal. The current implementation requires users to manually close and reopen the edit panel when switching between nodes, creating a poor user experience. This design implements automatic panel synchronization, visual feedback, and state consistency to provide seamless node editing workflows.

## Architecture

### Component Structure

The solution involves modifications to the existing `AIPreviewModal` component and its child components:

```
AIPreviewModal
├── EditingSection
│   ├── NodeList (left panel)
│   └── NodeEditor/EdgeEditor (right panel)
└── Enhanced State Management
```

### Key Architectural Principles

1. **Reactive State Management**: Use React state to automatically trigger UI updates when node selection changes
2. **Centralized Selection State**: Maintain single source of truth for selected node/edge in parent component
3. **Event-Driven Updates**: Leverage React's component lifecycle to synchronize panel content
4. **Performance Optimization**: Implement efficient re-rendering strategies to prevent unnecessary updates

## Components and Interfaces

### Enhanced State Management

```typescript
interface EditPanelState {
  selectedNodeId: string | null
  selectedEdgeId: string | null
  panelMode: 'nodes' | 'edges'
  isLoading: boolean
  lastUpdateTimestamp: number
}

interface NodeSelectionEvent {
  nodeId: string
  timestamp: number
  source: 'list' | 'direct'
}
```

### Modified AIPreviewModal Component

The main modal component will be enhanced with:

```typescript
// Enhanced state for panel synchronization
const [panelState, setPanelState] = useState<EditPanelState>({
  selectedNodeId: null,
  selectedEdgeId: null,
  panelMode: 'nodes',
  isLoading: false,
  lastUpdateTimestamp: 0
})

// Synchronization handler
const handleNodeSelection = useCallback((nodeId: string) => {
  setPanelState(prev => ({
    ...prev,
    selectedNodeId: nodeId,
    selectedEdgeId: null, // Clear edge selection when selecting node
    isLoading: true,
    lastUpdateTimestamp: Date.now()
  }))
  
  // Simulate async loading for smooth transitions
  setTimeout(() => {
    setPanelState(prev => ({ ...prev, isLoading: false }))
  }, 50)
}, [])
```

### Enhanced EditingSection Component

The editing section will be modified to handle automatic synchronization:

```typescript
interface EditingSectionProps {
  nodes: PreviewNode[]
  edges: PreviewEdge[]
  panelState: EditPanelState
  onNodeSelect: (nodeId: string) => void
  onEdgeSelect: (edgeId: string) => void
  onNodeEdit: (nodeId: string, updates: Partial<PreviewNode>) => void
  onEdgeEdit: (edgeId: string, updates: Partial<PreviewEdge>) => void
}
```

### Synchronized NodeList Component

Enhanced with visual selection indicators:

```typescript
interface NodeListProps {
  nodes: PreviewNode[]
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string) => void
  highlightSelected?: boolean // New prop for enhanced visual feedback
}
```

### Auto-Updating NodeEditor Component

Enhanced to handle automatic content updates:

```typescript
interface NodeEditorProps {
  node: PreviewNode | null
  onNodeEdit: (nodeId: string, updates: Partial<PreviewNode>) => void
  onClose: () => void
  isLoading?: boolean // New prop for loading states
  autoFocus?: boolean // New prop for focus management
}
```

## Data Models

### Panel Synchronization State

```typescript
interface PanelSyncState {
  // Current selection
  activeNodeId: string | null
  activeEdgeId: string | null
  
  // Panel state
  isPanelOpen: boolean
  panelContent: 'node' | 'edge' | 'empty'
  
  // Loading and transition states
  isTransitioning: boolean
  transitionStartTime: number
  
  // Error handling
  lastError: string | null
  retryCount: number
}
```

### Node Selection Context

```typescript
interface NodeSelectionContext {
  previousNodeId: string | null
  currentNodeId: string | null
  selectionSource: 'click' | 'keyboard' | 'programmatic'
  hasUnsavedChanges: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*
### Property 1: Panel Content Synchronization

*For any* node selection event, the edit panel content should immediately reflect the selected node's information, clearing previous data and displaying the new node's details within 100ms.

**Validates: Requirements 1.1, 1.2, 3.2, 5.1**

### Property 2: Visual Selection Feedback

*For any* node in the node list, when selected, it should display distinct visual indicators (highlighting, borders, or styling) that differentiate it from unselected nodes, and the panel header should show the selected node's identifier.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Panel State Consistency

*For any* system state, the panel's displayed content should always match the currently selected node, and the panel should maintain its open state when switching between nodes.

**Validates: Requirements 1.3, 3.1, 4.3**

### Property 4: Empty State Handling

*For any* system state where no node is selected, the edit panel should display an appropriate empty or default state rather than stale content.

**Validates: Requirements 1.4**

### Property 5: Error Handling

*For any* node selection that fails to load, the edit panel should display an appropriate error message instead of hanging or showing incorrect content.

**Validates: Requirements 3.3**

### Property 6: Race Condition Prevention

*For any* sequence of rapid node selections, the final panel state should reflect only the last selected node, with no intermediate states visible to the user.

**Validates: Requirements 3.4, 5.3**

### Property 7: Functionality Preservation

*For any* existing edit panel operation (editing, validation, close button), the functionality should work identically before and after implementing synchronization.

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 8: Performance Under Load

*For any* sequence of rapid node selections, the system should maintain response times within 100ms and show no performance degradation.

**Validates: Requirements 5.2**

### Property 9: Unsaved Changes Handling

*For any* node switch operation when the current node has unsaved changes, the system should handle the transition gracefully by either saving, discarding, or prompting the user.

**Validates: Requirements 5.4**

## Error Handling

### Error Scenarios and Recovery Strategies

1. **Node Loading Failures**
   - **Scenario**: Selected node data fails to load from the server
   - **Detection**: API request timeout or error response
   - **Recovery**: Display error message in panel, allow retry, maintain previous selection state
   - **User Feedback**: "Failed to load node data. Click to retry."

2. **Race Condition Detection**
   - **Scenario**: Multiple rapid node selections cause conflicting state updates
   - **Detection**: Timestamp comparison and request cancellation
   - **Recovery**: Cancel previous requests, process only the latest selection
   - **User Feedback**: Smooth transition without visible errors

3. **Panel State Corruption**
   - **Scenario**: Panel state becomes inconsistent with selection state
   - **Detection**: State validation checks during updates
   - **Recovery**: Reset panel state to match current selection
   - **User Feedback**: Brief loading indicator during reset

4. **Unsaved Changes Conflicts**
   - **Scenario**: User switches nodes with unsaved changes in current node
   - **Detection**: Form dirty state tracking
   - **Recovery**: Show confirmation dialog with save/discard options
   - **User Feedback**: "You have unsaved changes. Save before switching?"

### Error State Management

```typescript
interface ErrorState {
  type: 'loading' | 'validation' | 'network' | 'race_condition'
  message: string
  isRecoverable: boolean
  retryAction?: () => void
  timestamp: number
}

const handlePanelError = (error: ErrorState) => {
  // Log error for debugging
  console.error('Panel sync error:', error)
  
  // Update UI with appropriate error message
  setPanelError(error)
  
  // Auto-clear recoverable errors after timeout
  if (error.isRecoverable) {
    setTimeout(() => setPanelError(null), 5000)
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test specific node selection scenarios
- Verify error handling with mock failures
- Test UI component interactions
- Validate state transitions

**Property Tests**: Verify universal properties across all inputs
- Test panel synchronization with randomly generated node selections
- Verify timing requirements with various selection patterns
- Test race condition handling with rapid random selections
- Validate state consistency across all possible states

### Property-Based Testing Configuration

- **Library**: Use `fast-check` for TypeScript/React property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Test Tags**: Each property test references its design document property

Example property test structure:
```typescript
// Feature: ai-node-edit-panel-sync, Property 1: Panel Content Synchronization
test('panel content synchronizes with node selection within 100ms', async () => {
  await fc.assert(fc.asyncProperty(
    fc.array(fc.string(), { minLength: 1, maxLength: 10 }), // Random node IDs
    async (nodeIds) => {
      // Test implementation
    }
  ), { numRuns: 100 })
})
```

### Unit Testing Focus Areas

1. **Component Integration Tests**
   - AIPreviewModal with EditingSection integration
   - NodeList selection event propagation
   - NodeEditor content updates

2. **State Management Tests**
   - Panel state transitions
   - Selection state consistency
   - Error state handling

3. **Performance Tests**
   - Response time measurements
   - Memory usage during rapid selections
   - UI rendering performance

4. **Edge Case Tests**
   - Empty node lists
   - Invalid node selections
   - Network failure scenarios
   - Concurrent user interactions

### Test Environment Setup

```typescript
// Test utilities for panel synchronization
const createMockNodeData = (count: number): PreviewNode[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    name: `Node ${i}`,
    type: 'test',
    properties: {}
  }))
}

const measurePanelUpdateTime = async (
  selectNode: (id: string) => void,
  nodeId: string
): Promise<number> => {
  const startTime = performance.now()
  selectNode(nodeId)
  
  // Wait for panel to update
  await waitFor(() => {
    expect(screen.getByTestId('node-editor')).toHaveTextContent(nodeId)
  })
  
  return performance.now() - startTime
}
```

## Implementation Plan

### Phase 1: Core Synchronization (Week 1)
1. Enhance AIPreviewModal state management
2. Implement automatic panel content updates
3. Add basic visual selection feedback
4. Create unit tests for core functionality

### Phase 2: Performance and Polish (Week 2)
1. Implement race condition prevention
2. Add loading states and transitions
3. Enhance error handling
4. Create property-based tests

### Phase 3: Edge Cases and Validation (Week 3)
1. Handle unsaved changes scenarios
2. Add comprehensive error recovery
3. Performance optimization
4. Integration testing

### Phase 4: Documentation and Deployment (Week 4)
1. Update component documentation
2. Create user guide for new features
3. Performance benchmarking
4. Production deployment

## Dependencies

### Internal Dependencies
- `AIPreviewModal` component (existing)
- `EditingSection` component (existing)
- `NodeList` and `NodeEditor` components (existing)
- React state management hooks

### External Dependencies
- React 18+ (for concurrent features)
- TypeScript 4.5+ (for enhanced type safety)
- `fast-check` library (for property-based testing)
- Jest and React Testing Library (for unit tests)

### Browser Compatibility
- Modern browsers supporting ES2020+
- React 18 concurrent features
- Performance.now() API for timing measurements

## Performance Considerations

### Optimization Strategies

1. **Debounced Updates**: Prevent excessive re-renders during rapid selections
2. **Memoization**: Cache expensive computations and component renders
3. **Lazy Loading**: Load node details only when selected
4. **Virtual Scrolling**: Handle large node lists efficiently

### Performance Metrics

- Panel update time: < 100ms (requirement)
- Memory usage: < 50MB for 1000+ nodes
- CPU usage: < 10% during normal operations
- First paint time: < 200ms for initial load

### Monitoring and Alerting

```typescript
// Performance monitoring utilities
const trackPanelPerformance = (operation: string, duration: number) => {
  if (duration > 100) {
    console.warn(`Panel operation '${operation}' took ${duration}ms`)
  }
  
  // Send metrics to monitoring service
  analytics.track('panel_performance', {
    operation,
    duration,
    timestamp: Date.now()
  })
}
```