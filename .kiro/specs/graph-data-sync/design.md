# Design Document: Graph Data Synchronization

## Overview

The Graph Data Synchronization feature enables users to edit existing knowledge graphs in 2D mode and intelligently synchronize changes back to the database. The system will compare the current workflow state with the database state to determine which nodes and edges need to be added, updated, or deleted.

## Architecture

### High-Level Flow

```
User edits 2D graph → Click "Save & Convert to 3D" → 
Load existing graph data from DB → 
Compare workflow data with DB data →
Identify changes (add/update/delete) →
Execute sync operations in transaction →
Update 3D visualization
```

### Key Components

1. **WorkflowCanvas Component**: Loads and displays existing graph data for editing
2. **Graph Sync API** (`/api/graphs/[id]/sync`): Handles synchronization logic
3. **Change Detection Module**: Identifies differences between workflow and database
4. **Batch Operations Module**: Executes multiple database operations efficiently

## Components and Interfaces

### 1. WorkflowCanvas Enhancement

**Purpose**: Load existing graph data when editing

**Interface**:
```typescript
interface WorkflowCanvasProps {
  graphId?: string  // If provided, load existing graph
  mode: 'create' | 'edit'
}

interface LoadGraphResponse {
  nodes: WorkflowNode[]
  edges: WorkflowConnection[]
}
```

**Behavior**:
- When `graphId` is provided, fetch graph data from `/api/graphs/[id]`
- Convert 3D coordinates back to 2D for editing
- Preserve node and edge IDs for synchronization

### 2. Graph Sync API

**Endpoint**: `POST /api/graphs/[id]/sync`

**Request Body**:
```typescript
interface SyncRequest {
  nodes: WorkflowNode[]  // Current workflow nodes
  connections: WorkflowConnection[]  // Current workflow connections
}

interface WorkflowNode {
  id?: string  // Database ID if exists
  tempId?: string  // Temporary ID for new nodes
  label: string
  description?: string
  x: number
  y: number
  imageUrl?: string
  videoUrl?: string
}

interface WorkflowConnection {
  id?: string  // Database ID if exists
  from: string  // Node ID or tempId
  to: string  // Node ID or tempId
  label?: string
}
```

**Response**:
```typescript
interface SyncResponse {
  success: boolean
  stats: {
    nodesAdded: number
    nodesUpdated: number
    nodesDeleted: number
    edgesAdded: number
    edgesUpdated: number
    edgesDeleted: number
  }
  message?: string
  errors?: string[]
}
```

### 3. Change Detection Module

**Purpose**: Identify what changed between workflow and database

**Algorithm**:
```typescript
interface ChangeSet {
  nodesToAdd: WorkflowNode[]
  nodesToUpdate: { id: string, updates: Partial<Node> }[]
  nodesToDelete: string[]  // Node IDs
  edgesToAdd: WorkflowConnection[]
  edgesToUpdate: { id: string, updates: Partial<Edge> }[]
  edgesToDelete: string[]  // Edge IDs
}

function detectChanges(
  workflowNodes: WorkflowNode[],
  workflowConnections: WorkflowConnection[],
  dbNodes: Node[],
  dbEdges: Edge[]
): ChangeSet
```

**Logic**:

1. **Nodes to Add**: Workflow nodes without a database ID
2. **Nodes to Update**: Workflow nodes with a database ID where properties changed
3. **Nodes to Delete**: Database nodes not present in workflow data
4. **Edges to Add**: Workflow connections without a database ID
5. **Edges to Update**: Workflow connections with a database ID where properties changed
6. **Edges to Delete**: Database edges not present in workflow data

### 4. Batch Operations Module

**Purpose**: Execute multiple database operations efficiently

**Functions**:
```typescript
async function syncNodes(
  graphId: string,
  projectId: string,
  changeSet: ChangeSet
): Promise<{ created: Node[], updated: Node[], deleted: string[] }>

async function syncEdges(
  graphId: string,
  projectId: string,
  changeSet: ChangeSet,
  nodeIdMap: Map<string, string>  // tempId -> dbId mapping
): Promise<{ created: Edge[], updated: Edge[], deleted: string[] }>
```

## Data Models

### Node Comparison

**Fields to Compare**:
- `name` (from workflow `label`)
- `description`
- `x`, `y`, `z` (3D coordinates calculated from 2D)
- `imageUrl`
- `videoUrl`

**Update Strategy**:
- If any field differs, update the entire node
- Preserve `id`, `projectId`, `graphId`, `createdAt`
- Update `updatedAt` timestamp

### Edge Comparison

**Fields to Compare**:
- `fromNodeId`
- `toNodeId`
- `label`

**Update Strategy**:
- If any field differs, update the entire edge
- Preserve `id`, `projectId`, `graphId`, `createdAt`
- Update `updatedAt` timestamp

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Data Preservation on Load

*For any* graph loaded from the database, all node IDs, edge IDs, and their properties should be preserved in the workflow canvas representation.

**Validates: Requirements 1.2, 1.3**

### Property 2: Change Detection Completeness

*For any* pair of workflow data and database data, the change detection algorithm should correctly identify all nodes and edges that were added, modified, or deleted.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Node Update Preserves Identity

*For any* node with an existing database ID, when its properties are modified and synchronized, the node's ID should remain unchanged and no duplicate node should be created.

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 4: Node Update Completeness

*For any* node being updated, all modified fields (label, description, coordinates, media URLs) should be reflected in the database after synchronization.

**Validates: Requirements 3.3**

### Property 5: New Node Creation

*For any* node without a database ID, when synchronized, a new node should be created in the database with the correct graphId and valid 3D coordinates calculated from 2D coordinates.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Node Count Accuracy

*For any* synchronization operation, the graph's node count should increase by the number of nodes added and decrease by the number of nodes deleted.

**Validates: Requirements 4.4, 5.3**

### Property 7: Referential Integrity on Deletion

*For any* node deleted from the database, all edges connected to that node (either as source or target) should also be deleted, and no edges should reference non-existent nodes after the operation.

**Validates: Requirements 5.2, 5.4**

### Property 8: Edge Synchronization

*For any* edge in the workflow data, if it has a database ID and properties changed, it should be updated; if it has no database ID, it should be created; and any database edge not in the workflow should be deleted.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 9: Edge Count Accuracy

*For any* synchronization operation, the graph's edge count should accurately reflect the number of edges added and removed.

**Validates: Requirements 6.4**

### Property 10: Transaction Atomicity

*For any* synchronization operation, either all changes should be committed to the database or none should be committed if any error occurs.

**Validates: Requirements 7.2, 7.3**

### Property 11: No-Op Optimization

*For any* synchronization where the workflow data is identical to the database data, no database write operations should be executed.

**Validates: Requirements 8.3**



## Error Handling

### 1. Graph Not Found
- **Scenario**: User tries to sync to a non-existent graph
- **Response**: Return 404 with message "Graph not found"
- **Action**: Do not attempt any database operations

### 2. Invalid Node Data
- **Scenario**: Workflow node has invalid or missing required fields
- **Response**: Return 400 with validation errors
- **Action**: Reject the entire sync operation

### 3. Database Transaction Failure
- **Scenario**: Any database operation fails during sync
- **Response**: Rollback all changes, return 500 with error details
- **Action**: Ensure database remains in consistent state

### 4. Referential Integrity Violation
- **Scenario**: Edge references a node that doesn't exist
- **Response**: Return 400 with details about invalid references
- **Action**: Reject the sync operation

### 5. Concurrent Modification
- **Scenario**: Graph was modified by another user during editing
- **Response**: Return 409 (Conflict) with message
- **Action**: Suggest user reload and retry

## Testing Strategy

### Unit Tests

Unit tests will verify specific scenarios and edge cases:

1. **Change Detection Tests**
   - Test detecting added nodes
   - Test detecting modified nodes
   - Test detecting deleted nodes
   - Test detecting edge changes
   - Test handling empty graphs
   - Test handling identical data (no changes)

2. **Coordinate Conversion Tests**
   - Test 3D to 2D conversion for loading
   - Test 2D to 3D conversion for saving
   - Test coordinate preservation

3. **ID Mapping Tests**
   - Test mapping temporary IDs to database IDs
   - Test preserving existing database IDs
   - Test edge ID resolution

4. **Error Handling Tests**
   - Test invalid graph ID
   - Test missing required fields
   - Test referential integrity violations

### Property-Based Tests

Property-based tests will verify universal properties across many generated inputs. Each test will run a minimum of 100 iterations.

1. **Property 1: Data Preservation on Load**
   - Generate random graphs with nodes and edges
   - Load from database
   - Verify all IDs and properties preserved
   - **Tag**: Feature: graph-data-sync, Property 1: Data Preservation on Load

2. **Property 2: Change Detection Completeness**
   - Generate random workflow and database states
   - Run change detection
   - Verify all differences identified correctly
   - **Tag**: Feature: graph-data-sync, Property 2: Change Detection Completeness

3. **Property 3: Node Update Preserves Identity**
   - Generate random node updates
   - Execute sync
   - Verify node IDs unchanged and no duplicates
   - **Tag**: Feature: graph-data-sync, Property 3: Node Update Preserves Identity

4. **Property 6: Node Count Accuracy**
   - Generate random add/delete operations
   - Execute sync
   - Verify node count matches expected
   - **Tag**: Feature: graph-data-sync, Property 6: Node Count Accuracy

5. **Property 7: Referential Integrity on Deletion**
   - Generate random graphs
   - Delete random nodes
   - Verify no orphaned edges remain
   - **Tag**: Feature: graph-data-sync, Property 7: Referential Integrity on Deletion

6. **Property 10: Transaction Atomicity**
   - Generate random sync operations
   - Force random failures
   - Verify either all changes committed or none
   - **Tag**: Feature: graph-data-sync, Property 10: Transaction Atomicity

### Integration Tests

Integration tests will verify the complete flow:

1. **Full Sync Workflow**
   - Create a graph
   - Load it for editing
   - Make various changes (add, update, delete)
   - Sync changes
   - Verify database state matches expectations

2. **Concurrent Access**
   - Simulate multiple users editing same graph
   - Verify conflict detection works

3. **Performance Tests**
   - Test sync with 100 nodes
   - Verify completion within 5 seconds

### Testing Framework

- **Unit Tests**: Jest
- **Property-Based Tests**: fast-check (TypeScript property-based testing library)
- **Integration Tests**: Jest with test database

## Implementation Notes

### Phase 1: Change Detection
1. Implement change detection algorithm
2. Write unit tests for change detection
3. Write property tests for completeness

### Phase 2: Sync Operations
1. Implement node sync (add, update, delete)
2. Implement edge sync (add, update, delete)
3. Write property tests for sync operations

### Phase 3: API Integration
1. Create `/api/graphs/[id]/sync` endpoint
2. Integrate with WorkflowCanvas component
3. Add transaction handling

### Phase 4: UI Integration
1. Add "Edit" button to graph list
2. Load graph data into WorkflowCanvas
3. Update "Save & Convert" to use sync API

## Dependencies

- Prisma ORM for database operations
- Next.js API routes
- React for UI components
- fast-check for property-based testing
- coordinate-converter library for 2D/3D conversion
