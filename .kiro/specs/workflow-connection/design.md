# Design Document: Workflow Connection Optimization

## Overview

This design addresses critical issues in the 2D workflow canvas where connection lines do not properly attach to connection points when nodes contain media (images/videos), and where node proportions become inconsistent after saving and re-editing. The solution involves refactoring the connection point positioning system to be media-aware and implementing a consistent node sizing strategy.

## Architecture

The system follows a component-based architecture with the WorkflowCanvas component managing:
- Node rendering and layout
- Connection point positioning
- Connection line rendering
- Media content display
- State persistence

### Key Components

1. **WorkflowCanvas**: Main container component managing canvas state
2. **Node Rendering System**: Handles node layout with dynamic sizing
3. **Connection Point System**: Manages connection point positioning
4. **Connection Line Renderer**: SVG-based line rendering with Bezier curves
5. **Media Handler**: Manages image/video upload and display

## Components and Interfaces

### Node Interface Enhancement

```typescript
interface Node {
  id: string
  label: string
  description: string
  x: number
  y: number
  width: number
  height: number
  isEditing: boolean
  imageUrl?: string
  videoUrl?: string
  mediaType?: 'image' | 'video' | null
  // NEW: Store actual rendered dimensions
  actualWidth?: number
  actualHeight?: number
  // NEW: Store media dimensions for aspect ratio preservation
  mediaWidth?: number
  mediaHeight?: number
}
```

### Connection Point Position Calculator

```typescript
interface ConnectionPointPosition {
  x: number  // Absolute X coordinate in canvas space
  y: number  // Absolute Y coordinate in canvas space
  side: 'left' | 'right'  // Which side of the node
}

function calculateConnectionPoint(
  node: Node,
  side: 'left' | 'right'
): ConnectionPointPosition {
  // Calculate based on actual rendered node dimensions
  const actualHeight = node.actualHeight || node.height
  const actualWidth = node.actualWidth || node.width
  
  if (side === 'right') {
    return {
      x: node.x + actualWidth,
      y: node.y + actualHeight / 2,
      side: 'right'
    }
  } else {
    return {
      x: node.x,
      y: node.y + actualHeight / 2,
      side: 'left'
    }
  }
}
```

### Node Dimension Calculator

```typescript
interface NodeDimensions {
  width: number
  height: number
  mediaHeight: number
}

function calculateNodeDimensions(node: Node): NodeDimensions {
  const baseWidth = 320
  const basePadding = 40  // 20px on each side
  const contentPadding = 28  // Internal padding
  
  // Calculate media height while preserving aspect ratio
  let mediaHeight = 0
  if (node.mediaType && (node.mediaWidth && node.mediaHeight)) {
    const maxMediaHeight = 200
    const aspectRatio = node.mediaWidth / node.mediaHeight
    const calculatedHeight = baseWidth / aspectRatio
    mediaHeight = Math.min(calculatedHeight, maxMediaHeight)
  }
  
  // Calculate total height
  const titleHeight = 24  // Approximate title height
  const descriptionHeight = node.description ? 80 : 0
  const editHintHeight = 30
  const spacing = 14  // Gap between elements
  
  const contentHeight = titleHeight + 
                       (mediaHeight > 0 ? mediaHeight + spacing : 0) +
                       (descriptionHeight > 0 ? descriptionHeight + spacing : 0) +
                       editHintHeight
  
  const totalHeight = contentHeight + contentPadding * 2 + 4  // 4px for top bar
  
  return {
    width: baseWidth,
    height: totalHeight,
    mediaHeight
  }
}
```

## Data Models

### Enhanced Node State

The node state will be enhanced to track actual rendered dimensions:

```typescript
// Current state
const [nodes, setNodes] = useState<Node[]>([])

// Enhanced with dimension tracking
const updateNodeDimensions = (nodeId: string, dimensions: NodeDimensions) => {
  setNodes(prev => prev.map(node =>
    node.id === nodeId
      ? {
          ...node,
          actualWidth: dimensions.width,
          actualHeight: dimensions.height
        }
      : node
  ))
}
```

### Connection Line Data Model

```typescript
interface Connection {
  id: string
  from: string  // Source node ID
  to: string    // Target node ID
  label?: string
  // NEW: Cache connection point positions for performance
  cachedFromPoint?: ConnectionPointPosition
  cachedToPoint?: ConnectionPointPosition
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Connection Point Positioning Accuracy

*For any* workflow node with or without media content, the connection points SHALL be positioned at exactly the vertical center of the node's actual rendered height and at the horizontal edges of the node's actual rendered width.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Connection Line Attachment Consistency

*For any* connection line between two nodes, the line endpoints SHALL always attach to the calculated connection point positions, regardless of whether the nodes contain media content.

**Validates: Requirements 1.2, 1.3**

### Property 3: Node Dimension Preservation

*For any* node that is saved with media content, when the node is loaded again, its dimensions SHALL match the dimensions it had when saved, preserving the media aspect ratio.

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 4: Media Aspect Ratio Preservation

*For any* media content (image or video) added to a node, the displayed media SHALL maintain its original aspect ratio within the maximum height constraint of 200px.

**Validates: Requirements 3.3**

### Property 5: Connection Point Visibility

*For any* node with media content, the connection points SHALL remain visible and positioned outside or above the media display area.

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 6: Multi-Connection Support

*For any* connection point on a node, multiple connection lines SHALL be able to originate from or terminate at that point, with all lines sharing the same origin coordinates.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 7: Dynamic Layout Update

*For any* node where media is added or removed, all connection lines attached to that node SHALL update their endpoints to reflect the new connection point positions.

**Validates: Requirements 5.1, 5.2, 5.4**

### Property 8: Coordinate Calculation Precision

*For any* node transformation (position change, size change), the connection point coordinates SHALL be recalculated with sub-pixel precision to ensure crisp line rendering.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

## Error Handling

### Media Loading Errors

- If media fails to load, display placeholder with error message
- Preserve node dimensions based on last known media dimensions
- Allow user to retry upload or remove failed media

### Dimension Calculation Errors

- If dimension calculation fails, fall back to default dimensions (320x180)
- Log error for debugging
- Ensure connection points still render at fallback positions

### Connection Point Calculation Errors

- If connection point calculation fails, use node center as fallback
- Log error with node ID and state for debugging
- Prevent connection line rendering errors from crashing the canvas

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Connection Point Calculation**
   - Test connection point position for node without media
   - Test connection point position for node with image
   - Test connection point position for node with video
   - Test connection point position after node resize

2. **Dimension Calculation**
   - Test dimension calculation for node without media
   - Test dimension calculation for node with square image
   - Test dimension calculation for node with wide image
   - Test dimension calculation for node with tall image
   - Test dimension calculation for node with video
   - Test dimension calculation with description text
   - Test dimension calculation without description text

3. **Media Aspect Ratio**
   - Test aspect ratio preservation for 16:9 video
   - Test aspect ratio preservation for 4:3 image
   - Test aspect ratio preservation for portrait image
   - Test max height constraint enforcement

### Property-Based Tests

Property tests will verify universal properties across all inputs using a property-based testing library (fast-check for TypeScript):

1. **Property Test: Connection Point Positioning Accuracy** (Property 1)
   - Generate random nodes with various media configurations
   - Verify connection points are always at vertical center and horizontal edges

2. **Property Test: Connection Line Attachment Consistency** (Property 2)
   - Generate random node pairs with connections
   - Verify line endpoints match calculated connection points

3. **Property Test: Node Dimension Preservation** (Property 3)
   - Generate random nodes with media
   - Simulate save/load cycle
   - Verify dimensions match after reload

4. **Property Test: Media Aspect Ratio Preservation** (Property 4)
   - Generate random media with various aspect ratios
   - Verify displayed media maintains aspect ratio

5. **Property Test: Multi-Connection Support** (Property 6)
   - Generate random nodes with multiple connections
   - Verify all connections share same origin coordinates

6. **Property Test: Dynamic Layout Update** (Property 7)
   - Generate random nodes
   - Simulate media add/remove
   - Verify connection lines update correctly

Each property test will run a minimum of 100 iterations to ensure comprehensive coverage.

## Implementation Details

### Phase 1: Connection Point Position Fix

1. **Add useRef for node DOM elements**
   - Track actual rendered dimensions
   - Update on media load and layout changes

2. **Implement dimension measurement**
   - Use ResizeObserver to track node size changes
   - Store actual dimensions in node state

3. **Update connection point calculation**
   - Use actual dimensions instead of fixed dimensions
   - Recalculate on dimension changes

4. **Update connection line rendering**
   - Use updated connection point positions
   - Ensure lines redraw on position changes

### Phase 2: Node Proportion Consistency

1. **Implement media dimension tracking**
   - Store media width/height when loaded
   - Calculate aspect ratio

2. **Implement consistent sizing algorithm**
   - Calculate node height based on content
   - Apply consistent padding and spacing
   - Preserve media aspect ratio

3. **Update save/load logic**
   - Persist media dimensions
   - Restore dimensions on load

4. **Update media display**
   - Apply calculated dimensions
   - Use object-fit: cover for images
   - Maintain aspect ratio for videos

### Phase 3: Testing and Refinement

1. **Implement unit tests**
   - Test dimension calculations
   - Test connection point calculations
   - Test aspect ratio preservation

2. **Implement property-based tests**
   - Test universal properties
   - Run 100+ iterations per property

3. **Manual testing**
   - Test with various media types
   - Test save/load cycles
   - Test multi-connection scenarios

## Performance Considerations

- Use memoization for dimension calculations
- Debounce dimension updates during resize
- Cache connection point positions
- Only recalculate when necessary (media load, node move, etc.)

## Browser Compatibility

- Use standard DOM APIs for dimension measurement
- Ensure SVG rendering works across browsers
- Test on Chrome, Firefox, Safari, Edge
