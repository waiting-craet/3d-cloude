# Design Document: Workflow Connection Feature

## Overview

This document describes the design for the workflow canvas node connection feature. The system enables users to create visual connections between nodes by clicking and dragging from connection points. The design focuses on providing smooth visual feedback, accurate hover detection, and reliable connection creation.

## Architecture

The connection system is implemented entirely within the `WorkflowCanvas` component using React state management and event handlers. The architecture consists of:

1. **State Management Layer**: React hooks managing connection state (isDraggingConnection, connectingFrom, hoveredNode, dragLineEnd)
2. **Event Handler Layer**: Mouse event handlers for initiating, updating, and completing connections
3. **Rendering Layer**: SVG-based rendering for connection lines and preview lines
4. **Detection Layer**: Distance-based algorithm for detecting hover over connection points

## Components and Interfaces

### State Interface

```typescript
interface ConnectionState {
  isDraggingConnection: boolean      // Whether user is currently dragging a connection
  connectingFrom: string | null      // Source node ID when dragging
  hoveredNode: string | null         // Currently hovered target node ID
  dragLineEnd: { x: number, y: number }  // Current mouse position for preview line
}

interface Connection {
  id: string      // Unique connection identifier
  from: string    // Source node ID
  to: string      // Target node ID
}
```

### Event Handlers

```typescript
// Initiates connection dragging from a connection point
handleConnectionPointMouseDown(e: React.MouseEvent, nodeId: string): void

// Updates preview line and hover detection during dragging
handleMouseMove(e: MouseEvent): void

// Completes or cancels connection on mouse release
handleMouseUp(): void
```

### Rendering Functions

```typescript
// Renders all connection lines and preview line
renderConnections(): JSX.Element[]

// Calculates Bezier curve path for a connection
calculateConnectionPath(fromNode: Node, toNode: Node): string
```

## Data Models

### Node Model (existing)

```typescript
interface Node {
  id: string
  label: string
  description: string
  x: number          // Node position X
  y: number          // Node position Y
  width: number      // Node width (320px)
  height: number     // Node height (180px minimum)
  isEditing: boolean
}
```

### Connection Point Positions

Connection points are positioned at:
- **Right connection point**: `(node.x + node.width, node.y + node.height / 2)`
- **Left connection point**: `(node.x, node.y + node.height / 2)`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Connection dragging state initialization
*For any* connection point, when clicked, the system should set isDraggingConnection to true and store the node ID in connectingFrom
**Validates: Requirements 1.1, 1.4, 6.1, 6.2**

### Property 2: Interaction blocking during connection dragging
*For any* interaction attempt (canvas pan, node drag) while isDraggingConnection is true, the interaction should be prevented from executing
**Validates: Requirements 1.2**

### Property 3: Connection dragging state cleanup
*For any* connection dragging session, when the mouse is released, the system should set isDraggingConnection to false, clear connectingFrom, and clear hoveredNode
**Validates: Requirements 1.3, 6.3, 6.4, 6.5**

### Property 4: Preview line visibility
*For any* connection dragging session, a dashed preview line should be rendered from the source connection point to the current mouse position
**Validates: Requirements 2.1**

### Property 5: Preview line follows cursor
*For any* mouse movement during connection dragging, the preview line endpoint should update to match the mouse coordinates
**Validates: Requirements 2.2**

### Property 6: Connection point highlight on hover
*For any* connection point (excluding source node), when the mouse is within 30 pixels during dragging, the connection point should display green color and scale(1.3) transform
**Validates: Requirements 2.3**

### Property 7: Connection point highlight removal
*For any* previously highlighted connection point, when the mouse moves more than 30 pixels away, the highlight styling should be removed
**Validates: Requirements 2.4**

### Property 8: Preview line removal on drag end
*For any* connection dragging session, when dragging ends, the preview line element should be removed from the DOM
**Validates: Requirements 2.5**

### Property 9: Connection creation on valid release
*For any* valid target node (not the source node), when the mouse is released while hovering over it, a new connection should be created with correct source and target IDs
**Validates: Requirements 3.1**

### Property 10: Duplicate connection prevention
*For any* pair of nodes, attempting to create a second connection between them (in either direction) should not create a duplicate connection
**Validates: Requirements 3.2**

### Property 11: Self-connection prevention
*For any* node, attempting to connect it to itself should not create a connection
**Validates: Requirements 3.3**

### Property 12: Connection ID uniqueness
*For any* set of created connections, all connection IDs should be unique
**Validates: Requirements 3.4**

### Property 13: Connection cancellation on invalid release
*For any* mouse release not over a valid target node, no connection should be created
**Validates: Requirements 3.5**

### Property 14: Connection line rendering
*For any* connection, a blue Bezier curve SVG path should be rendered from the source node's right edge to the target node's left edge
**Validates: Requirements 4.1**

### Property 15: Arrowhead rendering
*For any* connection, an SVG polygon arrowhead should be rendered at the target connection point
**Validates: Requirements 4.2**

### Property 16: Dynamic line updates on node movement
*For any* node movement, all connections involving that node should update their line coordinates to maintain accurate visual connections
**Validates: Requirements 4.3**

### Property 17: Line positioning under transformations
*For any* canvas zoom or pan operation, connection lines should maintain correct positioning relative to their connected nodes
**Validates: Requirements 4.4**

### Property 18: Distance-based hover detection
*For any* mouse position during dragging, a connection point should be considered hovered if and only if the distance is less than 30 pixels
**Validates: Requirements 5.1**

### Property 19: Comprehensive connection point checking
*For any* hover detection calculation, both left and right connection points of all nodes (except source) should be checked
**Validates: Requirements 5.2**

### Property 20: Closest connection point selection
*For any* situation where multiple connection points are within 30 pixels, the connection point with the minimum distance should be selected as hovered
**Validates: Requirements 5.3**

### Property 21: Source node exclusion from hover
*For any* hover detection during dragging, the source node's connection points should not be considered as valid hover targets
**Validates: Requirements 5.4**

## Error Handling

### Invalid Connection Attempts
- **Self-connection**: Silently ignore when user attempts to connect a node to itself
- **Duplicate connection**: Silently ignore when user attempts to create an existing connection
- **Invalid release**: Cancel dragging state without creating connection when released over empty space

### Edge Cases
- **Node deletion during dragging**: If source node is deleted while dragging, cancel the connection attempt
- **Rapid clicking**: Debounce connection point clicks to prevent multiple simultaneous drag sessions
- **Browser compatibility**: Use standard mouse events (not pointer events) for maximum compatibility

## Testing Strategy

### Unit Tests
Unit tests will verify specific examples and edge cases:
- Connection creation with specific node pairs
- Duplicate connection prevention with known node IDs
- Self-connection prevention with same node ID
- State cleanup after connection completion
- Distance calculation edge cases (exactly 30px, 29px, 31px)

### Property-Based Tests
Property-based tests will verify universal properties across randomized inputs using a JavaScript PBT library (fast-check):
- Each test will run minimum 100 iterations
- Tests will generate random node positions, sizes, and mouse coordinates
- Each property test will reference its design document property number

**Test Configuration**:
- Library: fast-check (JavaScript/TypeScript property-based testing)
- Iterations: 100 minimum per property test
- Tag format: `// Feature: workflow-connection, Property N: [property text]`

**Testing Approach**:
- Unit tests focus on specific scenarios and edge cases
- Property tests verify behavior across all possible inputs
- Both approaches are complementary and necessary for comprehensive coverage
- Property tests handle input space exploration, unit tests validate specific important cases

### Integration Tests
- Test complete connection workflow from click to release
- Test interaction with node dragging and canvas panning
- Test connection rendering with various node positions and canvas transformations
- Test connection persistence across component re-renders

## Implementation Notes

### Coordinate System
The canvas uses a transformed coordinate system with `translate(offset.x, offset.y) scale(scale)`. When calculating mouse positions for hover detection and line rendering:
1. Get mouse position relative to canvas: `e.clientX - rect.left`
2. Subtract canvas offset: `mouseX - offset.x`
3. Divide by scale: `(mouseX - offset.x) / scale`

### SVG Positioning
The SVG element for connections is positioned at `(-5000px, -5000px)` with size `(15000px, 15000px)` to ensure lines are visible regardless of node positions. This large canvas accommodates nodes at any position within the transformed coordinate space.

### Hover Detection Algorithm
```typescript
function detectHoveredNode(mouseX: number, mouseY: number, nodes: Node[], sourceNodeId: string): string | null {
  let closestNode: string | null = null
  let minDistance = 30  // Detection threshold
  
  for (const node of nodes) {
    if (node.id === sourceNodeId) continue  // Skip source node
    
    // Check right connection point
    const rightDist = distance(mouseX, mouseY, node.x + node.width, node.y + node.height / 2)
    
    // Check left connection point
    const leftDist = distance(mouseX, mouseY, node.x, node.y + node.height / 2)
    
    const dist = Math.min(rightDist, leftDist)
    
    if (dist < minDistance) {
      minDistance = dist
      closestNode = node.id
    }
  }
  
  return closestNode
}
```

### Bezier Curve Calculation
Connections use cubic Bezier curves for smooth, professional appearance:
```typescript
const x1 = fromNode.x + fromNode.width  // Source right edge
const y1 = fromNode.y + fromNode.height / 2
const x2 = toNode.x  // Target left edge
const y2 = toNode.y + toNode.height / 2
const midX = (x1 + x2) / 2  // Control point X

// SVG path: M start C control1 control2 end
const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
```

This creates a horizontal-out, horizontal-in curve that looks natural for left-to-right connections.
