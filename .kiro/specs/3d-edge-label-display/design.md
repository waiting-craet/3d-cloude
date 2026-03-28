# Design Document: 3D Edge Label Display

## Overview

This design implements edge label visualization in the 3D knowledge graph. The solution uses React Three Fiber's Text component to render labels that always face the camera, positioned at the midpoint of each edge. The implementation focuses on performance, readability, and seamless integration with the existing 2D-to-3D conversion workflow.

## Architecture

### Current State

Currently, the system:
- Stores edge labels in the database (`Edge.label` field)
- Displays edge labels in 2D workflow canvas
- Converts edges from 2D to 3D preserving the label field
- Renders edges in 3D as simple lines without labels

### Proposed Enhancement

The enhancement will:
- Add text rendering to the `GraphEdges` component
- Calculate midpoint positions for each edge
- Use billboard text (always faces camera) for readability
- Apply conditional rendering (only show non-empty labels)
- Optimize performance with memoization and efficient rendering

## Components and Interfaces

### 1. GraphEdges Component (`components/GraphEdges.tsx`)

**Current Interface:**
```typescript
export default function GraphEdges() {
  const { edges, nodes } = useGraphStore()
  // Renders Line components for each edge
}
```

**Enhanced Implementation:**
```typescript
export default function GraphEdges() {
  const { edges, nodes } = useGraphStore()
  
  // For each edge:
  // 1. Render the Line (existing)
  // 2. If edge.label exists and is non-empty:
  //    - Calculate midpoint
  //    - Render Text component at midpoint
  //    - Apply billboard behavior (faces camera)
}
```

### 2. EdgeLabel Component (New)

**New Component:**
```typescript
interface EdgeLabelProps {
  position: [number, number, number]  // Midpoint of edge
  label: string                        // Label text
  color?: string                       // Text color
}

function EdgeLabel({ position, label, color = '#ffffff' }: EdgeLabelProps) {
  // Render Text component from @react-three/drei
  // Apply background plane for contrast
  // Handle text sizing and styling
}
```

### 3. Store Interface (No Changes Required)

The existing store already provides edge labels:
```typescript
interface Edge {
  id: string
  fromNodeId: string
  toNodeId: string
  label: string  // Already exists!
  // ... other properties
}
```

## Data Models

### Edge Label Data Flow

```
2D Canvas → Database → 3D Visualization
   ↓            ↓            ↓
Connection   Edge.label   Text Sprite
 .label                   (rendered)
```

### Midpoint Calculation

```typescript
interface EdgeMidpoint {
  x: number  // (fromNode.x + toNode.x) / 2
  y: number  // (fromNode.y + toNode.y) / 2
  z: number  // (fromNode.z + toNode.z) / 2
}
```

### Text Rendering Configuration

```typescript
interface TextConfig {
  fontSize: number        // Default: 0.5
  color: string          // Default: '#ffffff'
  anchorX: 'center'      // Horizontal alignment
  anchorY: 'middle'      // Vertical alignment
  outlineWidth: number   // Default: 0.05
  outlineColor: string   // Default: '#000000'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Label Preservation

*For any* edge with a non-empty label in the 2D canvas, after conversion to 3D, the edge should have the same label value in the database.

**Validates: Requirements 1.2**

### Property 2: Conditional Rendering

*For any* edge in the 3D graph, a text sprite should be rendered if and only if the edge has a non-empty, non-whitespace label.

**Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4**

### Property 3: Midpoint Positioning

*For any* edge connecting nodes A and B, the label position should be exactly at the midpoint: `[(A.x + B.x)/2, (A.y + B.y)/2, (A.z + B.z)/2]`.

**Validates: Requirements 3.1**

### Property 4: Dynamic Position Updates

*For any* edge, when either connected node's position changes, the label position should update to reflect the new midpoint.

**Validates: Requirements 3.2**

### Property 5: Billboard Behavior

*For any* rendered edge label, the text should always face the camera regardless of camera position or rotation.

**Validates: Requirements 2.2**

### Property 6: No Label Overlap with Edge Line

*For any* edge label, the text should be positioned with a small offset from the edge line to prevent visual overlap.

**Validates: Requirements 3.3**

### Property 7: Performance Threshold

*For any* graph with N edges where N ≤ 100, the frame rate should remain above 30 FPS when rendering all edge labels.

**Validates: Requirements 4.4**

## Error Handling

### Missing Node References

**Detection:**
- Check if `fromNode` or `toNode` is undefined
- Validate node IDs exist in the nodes array

**Recovery:**
- Skip rendering the edge and its label
- Log warning with edge ID
- Continue rendering other edges

**Prevention:**
- Ensure referential integrity in database
- Validate edge data before rendering

### Invalid Label Data

**Detection:**
- Check for null, undefined, or non-string labels
- Detect labels with only whitespace

**Recovery:**
- Treat as empty label (don't render)
- No error thrown, silent handling

**Prevention:**
- Validate label data type in TypeScript
- Trim labels before checking emptiness

### Text Rendering Failures

**Detection:**
- Catch errors from Text component
- Monitor for missing font resources

**Recovery:**
- Fall back to rendering edge without label
- Log error for debugging
- Don't crash the entire graph

**Prevention:**
- Use reliable font loading
- Test with various label lengths
- Handle special characters properly

## Testing Strategy

### Unit Tests

**EdgeLabel Component Tests:**
- Test rendering with valid label
- Test not rendering with empty label
- Test not rendering with whitespace-only label
- Test midpoint calculation
- Test text styling properties

**GraphEdges Component Tests:**
- Test rendering edges with labels
- Test rendering edges without labels
- Test mixed scenario (some with, some without labels)
- Test position updates when nodes move

### Property-Based Tests

**Property Test Configuration:**
- Minimum 100 iterations per test
- Use fast-check library for TypeScript
- Tag format: `Feature: 3d-edge-label-display, Property {N}: {description}`

**Test 1: Label Preservation**
- Generate random edges with labels
- Convert from 2D to 3D
- Verify labels match in database

**Test 2: Conditional Rendering**
- Generate edges with various label states (empty, whitespace, valid)
- Render in 3D
- Verify only non-empty labels create text sprites

**Test 3: Midpoint Calculation**
- Generate random node positions
- Calculate expected midpoints
- Verify rendered label positions match

**Test 4: Dynamic Updates**
- Generate initial node positions
- Move nodes to new positions
- Verify label positions update correctly

**Test 5: Performance**
- Generate graphs with 10, 50, 100 edges
- Measure frame rate
- Verify FPS ≥ 30

### Integration Tests

**End-to-End Label Flow:**
- Create labeled connections in 2D canvas
- Convert to 3D graph
- Verify labels appear in 3D visualization
- Check label positioning and readability

**Camera Interaction:**
- Rotate camera around graph
- Verify labels always face camera
- Check labels remain readable from all angles

**Mixed Label Scenarios:**
- Create graph with some labeled, some unlabeled edges
- Verify only labeled edges show text
- Check visual consistency

## Implementation Notes

### Text Rendering with @react-three/drei

**Using the Text Component:**
```typescript
import { Text } from '@react-three/drei'

<Text
  position={[x, y, z]}
  fontSize={0.5}
  color="#ffffff"
  anchorX="center"
  anchorY="middle"
  outlineWidth={0.05}
  outlineColor="#000000"
>
  {label}
</Text>
```

**Billboard Behavior:**
The Text component from @react-three/drei automatically faces the camera (billboard behavior) by default, so no additional configuration is needed.

### Midpoint Calculation

```typescript
function calculateMidpoint(
  fromNode: Node,
  toNode: Node
): [number, number, number] {
  return [
    (fromNode.x + toNode.x) / 2,
    (fromNode.y + toNode.y) / 2,
    (fromNode.z + toNode.z) / 2,
  ]
}
```

### Label Validation

```typescript
function isValidLabel(label: string | null | undefined): boolean {
  return label != null && label.trim().length > 0
}
```

### Performance Optimization

**Memoization:**
- Use `useMemo` for midpoint calculations
- Memoize label validation results
- Cache text geometries when possible

**Conditional Rendering:**
- Early return for edges without labels
- Don't create Text components for empty labels
- Reduce component tree size

**Level of Detail (Future Enhancement):**
- Calculate distance from camera to label
- Hide labels beyond certain distance
- Reduce font detail for distant labels

## Visual Design

### Text Styling

**Font:**
- Family: System sans-serif (default)
- Size: 0.5 units (scales with scene)
- Weight: Normal

**Colors:**
- Text: White (#ffffff)
- Outline: Black (#000000)
- Outline Width: 0.05 units

**Background (Optional Enhancement):**
- Semi-transparent dark rectangle behind text
- Padding: 0.1 units on all sides
- Opacity: 0.7

### Positioning

**Offset from Edge:**
- Slight upward offset: +0.2 units on Y-axis
- Prevents overlap with edge line
- Maintains visual association

**Scaling:**
- Fixed size in 3D space (not screen space)
- Appears larger when camera is closer
- Maintains readability at typical viewing distances

## Integration with Existing System

### No Database Changes Required

The `Edge` model already has a `label` field:
```prisma
model Edge {
  id         String @id @default(cuid())
  fromNodeId String
  toNodeId   String
  label      String  // Already exists!
  // ...
}
```

### No API Changes Required

The sync API already preserves edge labels:
```typescript
// In app/api/graphs/[id]/sync/route.ts
// Already handles edge.label in the payload
```

### Minimal Component Changes

Only `GraphEdges.tsx` needs modification:
- Add Text import from @react-three/drei
- Add midpoint calculation
- Add conditional label rendering
- No changes to other components

## Performance Considerations

### Text Rendering Cost

- Text components are more expensive than simple lines
- Each label adds geometry and material to the scene
- Limit to reasonable number of labels (< 100)

### Optimization Strategies

1. **Conditional Rendering**: Only render non-empty labels
2. **Memoization**: Cache midpoint calculations
3. **Instancing**: Reuse materials across labels
4. **LOD**: Hide distant labels (future enhancement)

### Memory Management

- Text geometries are created per label
- Materials can be shared across labels
- Dispose of geometries when edges are removed
- Monitor memory usage with many labels

## Future Enhancements

1. **Interactive Labels**: Click to edit label in 3D view
2. **Label Backgrounds**: Add semi-transparent backgrounds for better contrast
3. **Smart Positioning**: Avoid label overlaps with intelligent placement
4. **Label Filtering**: Show/hide labels based on edge type or importance
5. **Animated Labels**: Fade in/out based on camera distance
6. **Rich Text**: Support for formatted text, icons, or emojis
7. **Localization**: Support for multiple languages and character sets

## Accessibility Considerations

- Ensure sufficient contrast between text and background
- Provide alternative ways to view edge information (tooltips, panels)
- Support keyboard navigation to edges and labels
- Consider colorblind-friendly color schemes

