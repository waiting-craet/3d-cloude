# Implementation Plan: Graph Data Synchronization

## Overview

This implementation plan converts the graph data synchronization design into actionable coding tasks. The feature will enable users to edit existing 2D knowledge graphs and intelligently sync changes to the database, updating existing nodes/edges rather than creating duplicates.

## Tasks

- [-] 1. Implement change detection module
  - Create `lib/graph-sync.ts` with change detection functions
  - Implement `detectNodeChanges()` to identify added, updated, and deleted nodes
  - Implement `detectEdgeChanges()` to identify added, updated, and deleted edges
  - Handle ID mapping between temporary IDs and database IDs
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 1.1 Write property test for change detection completeness
  - **Property 2: Change Detection Completeness**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - Generate random workflow and database states
  - Verify all differences are correctly identified

- [ ] 1.2 Write unit tests for change detection edge cases
  - Test empty graphs
  - Test identical data (no changes)
  - Test all nodes added
  - Test all nodes deleted
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Implement node synchronization operations
  - Create batch operations for adding nodes
  - Create batch operations for updating nodes
  - Create batch operations for deleting nodes
  - Ensure node ID preservation during updates
  - Update graph node count after operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.3_

- [ ] 2.1 Write property test for node update identity preservation
  - **Property 3: Node Update Preserves Identity**
  - **Validates: Requirements 3.1, 3.2, 3.4**
  - Generate random node updates
  - Verify IDs unchanged and no duplicates created

- [ ] 2.2 Write property test for node count accuracy
  - **Property 6: Node Count Accuracy**
  - **Validates: Requirements 4.4, 5.3**
  - Generate random add/delete operations
  - Verify node count matches expected value

- [ ] 3. Implement edge synchronization operations
  - Create batch operations for adding edges
  - Create batch operations for updating edges
  - Create batch operations for deleting edges
  - Implement cascading delete for edges when nodes are deleted
  - Update graph edge count after operations
  - _Requirements: 5.2, 5.4, 6.1, 6.2, 6.3, 6.4_

- [ ] 3.1 Write property test for referential integrity on deletion
  - **Property 7: Referential Integrity on Deletion**
  - **Validates: Requirements 5.2, 5.4**
  - Generate random graphs
  - Delete random nodes
  - Verify no orphaned edges remain

- [ ] 3.2 Write property test for edge count accuracy
  - **Property 9: Edge Count Accuracy**
  - **Validates: Requirements 6.4**
  - Generate random edge operations
  - Verify edge count matches expected value

- [x] 4. Create graph sync API endpoint
  - Create `app/api/graphs/[id]/sync/route.ts`
  - Implement POST handler for sync operations
  - Validate graph exists before syncing
  - Fetch existing graph data from database
  - Call change detection module
  - Execute sync operations in a transaction
  - Return sync statistics (nodes/edges added/updated/deleted)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 4.1 Write property test for transaction atomicity
  - **Property 10: Transaction Atomicity**
  - **Validates: Requirements 7.2, 7.3**
  - Generate random sync operations
  - Force random failures
  - Verify either all changes committed or none

- [ ] 4.2 Write unit tests for API error handling
  - Test graph not found (404)
  - Test invalid node data (400)
  - Test referential integrity violations (400)
  - Test transaction failures (500)
  - _Requirements: 7.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Add graph loading functionality to WorkflowCanvas
  - Modify `app/workflow/page.tsx` to accept graphId parameter
  - Fetch graph data from `/api/graphs/[id]` when graphId is provided
  - Convert 3D coordinates to 2D for editing
  - Preserve node and edge database IDs in workflow state
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6.1 Write property test for data preservation on load
  - **Property 1: Data Preservation on Load**
  - **Validates: Requirements 1.2, 1.3**
  - Generate random graphs
  - Load from database
  - Verify all IDs and properties preserved

- [ ] 7. Update WorkflowCanvas save functionality
  - Modify save button to detect if editing existing graph
  - If editing existing graph, call `/api/graphs/[id]/sync` instead of `/api/convert`
  - If creating new graph, continue using `/api/convert`
  - Display sync statistics to user after save
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7.1 Write property test for no-op optimization
  - **Property 11: No-Op Optimization**
  - **Validates: Requirements 8.3**
  - Load graph, make no changes, save
  - Verify no database operations executed

- [ ] 8. Add edit button to ProjectGraphManager
  - Add "Edit" button next to each graph in the list
  - On click, navigate to `/workflow?graphId={id}`
  - Pass graph ID to WorkflowCanvas for loading
  - _Requirements: 1.1_

- [ ] 9. Add coordinate conversion utilities
  - Create functions to convert 3D coordinates to 2D for editing
  - Create functions to convert 2D coordinates to 3D for saving
  - Ensure coordinate preservation during round-trip conversion
  - _Requirements: 1.4_

- [ ] 9.1 Write unit tests for coordinate conversion
  - Test 3D to 2D conversion
  - Test 2D to 3D conversion
  - Test round-trip preservation
  - _Requirements: 1.4_

- [ ] 10. Final checkpoint - Integration testing
  - Test complete workflow: create graph → edit → sync → verify
  - Test adding nodes to existing graph
  - Test updating existing nodes
  - Test deleting nodes from graph
  - Test edge synchronization
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Property tests use fast-check library with minimum 100 iterations
- All sync operations use database transactions for atomicity
- Change detection is the foundation for all sync operations
