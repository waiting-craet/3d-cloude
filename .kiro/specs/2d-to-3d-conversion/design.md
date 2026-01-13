# Design Document: 2D to 3D Knowledge Graph Conversion

## Overview

This design addresses two critical issues in the 2D to 3D conversion feature:
1. Database transaction timeout errors during conversion
2. Poor 3D node distribution causing visual clustering

The solution involves optimizing the database transaction strategy and improving the coordinate conversion algorithm to create better spatial distribution.

## Architecture

### Current Architecture Issues

**Problem 1: Transaction Timeout**
- The current implementation uses `Promise.all()` to create all nodes simultaneously within a transaction
- For large datasets, this causes the transaction to exceed the timeout limit
- The error message "Unable to start a transaction in the given time" indicates connection pool exhaustion

**Problem 2: Poor 3D Distribution**
- The current scaling factor (`scale * 0.05`) is too small, causing nodes to cluster
- All nodes are placed on the same Y plane (y3d = 0), creating a flat 2D appearance in 3D space
- No depth variation makes the graph visually uninteresting

### Proposed Architecture

**Solution 1: Batch Processing with Sequential Transactions**
- Split node creation into smaller batches (10-20 nodes per batch)
- Process batches sequentially to avoid connection pool exhaustion
- Use a single transaction for edges after all nodes are created
- Add progress tracking for user feedback

**Solution 2: Enhanced 3D Coordinate Algorithm**
- Increase the scaling factor to spread nodes further apart
- Add Y-axis (height) variation based on node properties or position
- Implement a force-directed layout adjustment for better spacing
- Add configurable spacing parameters

## Components and Interfaces

### 1. Conversion API (`app/api/convert/route.ts`)

**Current Interface:**
```typescript
POST /api/convert
Body: {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  metadata?: { canvasScale, canvasOffset }
  updateMode?: boolean
}
Response: {
  success: boolean
  stats?: { nodesCreated, edgesCreated }
  message?: string
}
```

**Enhanced Implementation:**
- Add batch processing logic
- Implement sequential node creation
- Add progress tracking
- Improve error handling with specific timeout detection

### 2. Coordinate Converter (`lib/coordinate-converter.ts`)

**Current Interface:**
```typescript
convertTo3DCoordinates(node: Node2D, allNodes: Node2D[]): Node3D
```

**Enhanced Implementation:**
- Increase base scaling factor from 0.05 to 0.3
- Add Y-axis variation using sine wave or node index
- Implement minimum distance enforcement
- Add configurable spacing parameters

### 3. Database Helper (`lib/db-helpers.ts`)

**New Module:**
```typescript
// Batch creation utilities
async function createNodesBatch(
  nodes: NodeData[],
  batchSize: number
): Promise<Node[]>

async function createEdgesBatch(
  edges: EdgeData[],
  batchSize: number
): Promise<Edge[]>
```

## Data Models

### Node3D (Enhanced)
```typescript
interface Node3D {
  label: string
  description: string
  x2d: number          // Original 2D x
  y2d: number          // Original 2D y
  x3d: number          // 3D x coordinate
  y3d: number          // 3D y coordinate (height)
  z3d: number          // 3D z coordinate (depth)
  spacing: number      // Minimum spacing from other nodes
}
```

### ConversionConfig
```typescript
interface ConversionConfig {
  batchSize: number           // Nodes per batch (default: 15)
  scaleFactor: number         // Base scaling (default: 0.3)
  heightVariation: number     // Y-axis variation (default: 5)
  minNodeDistance: number     // Minimum spacing (default: 2)
  useForceLayout: boolean     // Apply force-directed adjustment
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction Completion

*For any* valid workflow dataset with N nodes where N ≤ 100, the conversion process should complete all database operations without timeout errors.

**Validates: Requirements 1.1**

### Property 2: Descriptive Error Messages

*For any* database transaction failure, the API response should contain an error message that describes the specific failure reason (not generic errors).

**Validates: Requirements 1.2**

### Property 3: Batch Operations Usage

*For any* workflow dataset with N nodes where N > 10, the conversion process should use batch operations to create nodes (not individual transactions for each node).

**Validates: Requirements 1.3, 4.2**

### Property 4: Transaction Rollback Integrity

*For any* transaction that fails or times out, the database should contain zero nodes or edges from that conversion attempt (complete rollback).

**Validates: Requirements 1.4**

### Property 5: Coordinate Bounds

*For any* converted 3D graph, all node coordinates (x3d, y3d, z3d) should fall within the viewing volume [-50, 50] on each axis.

**Validates: Requirements 2.1**

### Property 6: Relative Position Preservation

*For any* two nodes A and B, if A.x > B.x in 2D space, then A.x3d > B.x3d in 3D space (horizontal relative positioning is preserved).

**Validates: Requirements 2.2**

### Property 7: Minimum Node Spacing

*For any* pair of distinct nodes in the converted 3D graph, the Euclidean distance between them should be at least the configured minimum distance (default: 2.0 units).

**Validates: Requirements 2.3, 2.4**

### Property 8: Y-Axis Variation

*For any* converted 3D graph with N nodes where N ≥ 3, the standard deviation of Y coordinates should be greater than 0 (nodes have height variation).

**Validates: Requirements 3.2**

### Property 9: Conversion Performance

*For any* workflow dataset with N nodes where N ≤ 50, the conversion should complete and return a response within 5 seconds.

**Validates: Requirements 4.3**

### Property 10: Node Property Preservation

*For any* node in the workflow canvas with properties (label, description, imageUrl, videoUrl), after conversion and database retrieval, the node should have identical property values.

**Validates: Requirements 5.1**

### Property 11: Connection Property Preservation

*For any* connection in the workflow canvas with properties (from, to, label), after conversion and database retrieval, the edge should connect the same nodes with the same label.

**Validates: Requirements 5.2**

### Property 12: Metadata Round-Trip

*For any* node with 2D coordinates (x, y), after conversion and storage, parsing the node's metadata JSON should yield an object containing original2D.x === x and original2D.y === y.

**Validates: Requirements 5.3**

### Property 13: Referential Integrity

*For any* connection in the workflow canvas, after conversion, the corresponding database edge should reference two nodes that both exist in the database.

**Validates: Requirements 5.4**

## Error Handling

### Transaction Timeout Errors

**Detection:**
- Catch Prisma errors with code `P2024` or message containing "transaction"
- Monitor transaction duration

**Recovery:**
- Reduce batch size dynamically if timeout occurs
- Retry with smaller batches
- Provide clear error message to user

**Prevention:**
- Use optimal batch size (15 nodes)
- Process batches sequentially
- Close connections properly

### Coordinate Calculation Errors

**Detection:**
- Validate that all coordinates are finite numbers
- Check for NaN or Infinity values
- Verify coordinates are within bounds

**Recovery:**
- Fall back to default positioning
- Log warning with node details
- Continue processing other nodes

**Prevention:**
- Validate input coordinates before conversion
- Handle edge cases (single node, collinear nodes)
- Use safe math operations

### Data Validation Errors

**Detection:**
- Check for empty node labels
- Verify connection references exist
- Validate data types

**Recovery:**
- Filter out invalid nodes/connections
- Return warnings in response
- Proceed with valid data

**Prevention:**
- Validate data in WorkflowCanvas before sending
- Use TypeScript types strictly
- Add runtime validation

## Testing Strategy

### Unit Tests

**Coordinate Converter Tests:**
- Test single node conversion
- Test multiple nodes with various layouts
- Test edge cases (overlapping nodes, single node)
- Test scaling calculations
- Test Y-axis variation

**Batch Processing Tests:**
- Test batch splitting logic
- Test sequential processing
- Test error handling in batches
- Test transaction rollback

**Data Validation Tests:**
- Test empty label filtering
- Test invalid connection filtering
- Test metadata preservation

### Property-Based Tests

**Property Test Configuration:**
- Minimum 100 iterations per test
- Use fast-check library for TypeScript
- Tag format: `Feature: 2d-to-3d-conversion, Property {N}: {description}`

**Test 1: Transaction Completion**
- Generate random workflow datasets (1-100 nodes)
- Verify conversion completes without timeout
- Check all nodes are created in database

**Test 2: Data Integrity**
- Generate random nodes with labels and descriptions
- Convert and retrieve from database
- Verify all properties match

**Test 3: Minimum Spacing**
- Generate random 2D layouts
- Convert to 3D
- Calculate all pairwise distances
- Verify all distances ≥ minimum

**Test 4: Coordinate Bounds**
- Generate random 2D layouts
- Convert to 3D
- Verify all coordinates within [-50, 50]

**Test 5: Relative Position**
- Generate pairs of nodes with known relative positions
- Convert to 3D
- Verify relative positions preserved

**Test 6: Metadata Round-Trip**
- Generate nodes with 2D coordinates
- Convert, store, and retrieve
- Parse metadata and verify 2D coordinates match

**Test 7: Batch Equivalence**
- Generate random dataset
- Convert with batch size 5
- Convert same dataset with batch size 20
- Verify identical results

### Integration Tests

**End-to-End Conversion:**
- Create workflow in canvas
- Trigger conversion
- Verify 3D graph displays correctly
- Check node positions and connections

**Performance Tests:**
- Test with 10, 50, 100 nodes
- Measure conversion time
- Verify completion within 5 seconds for 50 nodes

**Error Recovery Tests:**
- Simulate transaction timeout
- Verify graceful error handling
- Test retry logic

## Implementation Notes

### Coordinate Conversion Algorithm

**Enhanced Algorithm:**
```
1. Calculate bounds of all 2D nodes
2. Determine scale factor:
   - targetSize = 40
   - scale = min(targetSize/width, targetSize/height) * 0.3
3. Calculate center point
4. For each node:
   - x3d = (x - centerX) * scale
   - z3d = -(y - centerY) * scale  // Inverted for 3D space
   - y3d = sin(index * 0.5) * heightVariation  // Add wave pattern
5. Apply minimum distance enforcement:
   - For each pair of nodes too close:
     - Push them apart along the vector between them
6. Return converted coordinates
```

### Batch Processing Strategy

**Optimal Batch Size:**
- 15 nodes per batch (balances speed and reliability)
- Adjustable based on system performance
- Sequential processing to avoid connection pool issues

**Processing Flow:**
```
1. Split nodes into batches of 15
2. For each batch:
   - Create nodes in database
   - Store ID mapping (workflow ID → database ID)
   - Add small delay (100ms) between batches
3. After all nodes created:
   - Create all edges in single transaction
   - Use stored ID mapping for references
4. Return success with statistics
```

### Configuration

**Default Values:**
```typescript
const DEFAULT_CONFIG = {
  batchSize: 15,
  scaleFactor: 0.3,
  heightVariation: 5,
  minNodeDistance: 2,
  useForceLayout: false,  // Future enhancement
  batchDelay: 100,  // ms between batches
}
```

## Performance Considerations

### Database Optimization

- Use batch inserts instead of individual creates
- Process batches sequentially to avoid pool exhaustion
- Add delays between batches to allow connection cleanup
- Use indexes on frequently queried fields

### Coordinate Calculation Optimization

- Calculate bounds once for all nodes
- Cache scale factor and center point
- Use efficient distance calculations
- Avoid unnecessary iterations

### Memory Management

- Process nodes in batches to limit memory usage
- Clear temporary data structures after each batch
- Use streaming for large datasets (future enhancement)

## Future Enhancements

1. **Force-Directed Layout**: Apply physics-based layout for optimal spacing
2. **Clustering Detection**: Group related nodes in 3D space
3. **Progressive Loading**: Stream large graphs incrementally
4. **Layout Presets**: Offer different 3D layout algorithms (sphere, helix, grid)
5. **Animation**: Smooth transition from 2D to 3D positions
