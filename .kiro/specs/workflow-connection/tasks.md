# Implementation Plan: Workflow Connection Feature

## Overview

This implementation plan breaks down the workflow connection feature into discrete coding tasks. The feature enables users to create visual connections between nodes by clicking and dragging from connection points. Implementation follows an incremental approach: state management → event handlers → rendering → hover detection → testing.

## Tasks

- [x] 1. Set up connection state management
  - Add connection state variables to WorkflowCanvas component (isDraggingConnection, connectingFrom, hoveredNode, dragLineEnd)
  - Add connections array to store created connections
  - Initialize all state with proper TypeScript types
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 1.1 Write property test for connection state initialization
  - **Property 1: Connection dragging state initialization**
  - **Validates: Requirements 1.1, 1.4, 6.1, 6.2**

- [x] 2. Implement connection point click handler
  - [x] 2.1 Create handleConnectionPointMouseDown function
    - Accept mouse event and node ID as parameters
    - Set isDraggingConnection to true
    - Store source node ID in connectingFrom
    - Record initial mouse position in dragLineEnd
    - Prevent event propagation to avoid triggering node drag
    - _Requirements: 1.1, 1.4, 6.1, 6.2_

  - [ ]* 2.2 Write property test for interaction blocking
    - **Property 2: Interaction blocking during connection dragging**
    - **Validates: Requirements 1.2**

- [x] 3. Implement mouse move handler for connection dragging
  - [x] 3.1 Update handleMouseMove to handle connection dragging
    - Check if isDraggingConnection is true
    - Calculate mouse position in canvas coordinates (accounting for offset and scale)
    - Update dragLineEnd state with current mouse position
    - Call hover detection function to update hoveredNode
    - _Requirements: 2.2, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.2 Write property test for preview line following cursor
    - **Property 5: Preview line follows cursor**
    - **Validates: Requirements 2.2**

- [x] 4. Implement hover detection algorithm
  - [x] 4.1 Create detectHoveredNode function
    - Accept mouse coordinates, nodes array, and source node ID
    - Loop through all nodes except source node
    - Calculate distance to both left and right connection points
    - Return node ID of closest connection point within 30px threshold
    - Return null if no connection points within threshold
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.2 Write property test for distance-based hover detection
    - **Property 18: Distance-based hover detection**
    - **Validates: Requirements 5.1**

  - [ ]* 4.3 Write property test for source node exclusion
    - **Property 21: Source node exclusion from hover**
    - **Validates: Requirements 5.4**

  - [ ]* 4.4 Write property test for closest connection point selection
    - **Property 20: Closest connection point selection**
    - **Validates: Requirements 5.3**

- [x] 5. Implement mouse up handler for connection completion
  - [x] 5.1 Create handleMouseUp function for connection dragging
    - Check if isDraggingConnection is true
    - If hoveredNode exists and is not source node, create connection
    - Check for duplicate connections before creating
    - Check for self-connections before creating
    - Generate unique connection ID
    - Add connection to connections array
    - Reset all connection state (isDraggingConnection, connectingFrom, hoveredNode)
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 6.3, 6.4, 6.5_

  - [ ]* 5.2 Write property test for connection state cleanup
    - **Property 3: Connection dragging state cleanup**
    - **Validates: Requirements 1.3, 6.3, 6.4, 6.5**

  - [ ]* 5.3 Write property test for valid connection creation
    - **Property 9: Connection creation on valid release**
    - **Validates: Requirements 3.1**

  - [ ]* 5.4 Write property test for duplicate prevention
    - **Property 10: Duplicate connection prevention**
    - **Validates: Requirements 3.2**

  - [ ]* 5.5 Write property test for self-connection prevention
    - **Property 11: Self-connection prevention**
    - **Validates: Requirements 3.3**

  - [ ]* 5.6 Write property test for connection ID uniqueness
    - **Property 12: Connection ID uniqueness**
    - **Validates: Requirements 3.4**

  - [ ]* 5.7 Write property test for connection cancellation
    - **Property 13: Connection cancellation on invalid release**
    - **Validates: Requirements 3.5**

- [x] 6. Checkpoint - Ensure connection logic works
  - Connection logic verified and working correctly

- [x] 7. Render connection points on nodes
  - [x] 7.1 Add connection point circles to node rendering
    - Render left connection point at (node.x, node.y + node.height / 2)
    - Render right connection point at (node.x + node.width, node.y + node.height / 2)
    - Apply green highlight and scale(1.3) when node ID matches hoveredNode
    - Attach handleConnectionPointMouseDown to onMouseDown event
    - Style with appropriate colors and sizes
    - _Requirements: 2.3, 2.4_

  - [ ]* 7.2 Write property test for connection point highlight
    - **Property 6: Connection point highlight on hover**
    - **Validates: Requirements 2.3**

  - [ ]* 7.3 Write property test for highlight removal
    - **Property 7: Connection point highlight removal**
    - **Validates: Requirements 2.4**

- [x] 8. Render preview line during dragging
  - [x] 8.1 Add preview line rendering in SVG
    - Check if isDraggingConnection is true
    - Calculate source connection point position from connectingFrom node
    - Render dashed line from source to dragLineEnd coordinates
    - Use SVG path element with stroke-dasharray for dashed effect
    - _Requirements: 2.1, 2.5_

  - [ ]* 8.2 Write property test for preview line visibility
    - **Property 4: Preview line visibility**
    - **Validates: Requirements 2.1**

  - [ ]* 8.3 Write property test for preview line removal
    - **Property 8: Preview line removal on drag end**
    - **Validates: Requirements 2.5**

- [x] 9. Implement Bezier curve calculation for connections
  - [x] 9.1 Create calculateConnectionPath function
    - Accept source node and target node as parameters
    - Calculate source point at (fromNode.x + fromNode.width, fromNode.y + fromNode.height / 2)
    - Calculate target point at (toNode.x, toNode.y + toNode.height / 2)
    - Calculate control points at midpoint X with source/target Y
    - Return SVG path string: `M x1 y1 C midX y1, midX y2, x2 y2`
    - _Requirements: 4.1_

  - [ ]* 9.2 Write unit tests for Bezier curve calculation
    - Test with specific node positions
    - Test edge cases (overlapping nodes, far apart nodes)
    - _Requirements: 4.1_

- [x] 10. Render connection lines
  - [x] 10.1 Add connection line rendering in SVG
    - Create SVG element positioned at (-5000, -5000) with size (15000, 15000)
    - Loop through connections array
    - For each connection, find source and target nodes
    - Call calculateConnectionPath to get path string
    - Render SVG path with blue stroke
    - Render arrowhead polygon at target connection point
    - _Requirements: 4.1, 4.2_

  - [ ]* 10.2 Write property test for connection line rendering
    - **Property 14: Connection line rendering**
    - **Validates: Requirements 4.1**

  - [ ]* 10.3 Write property test for arrowhead rendering
    - **Property 15: Arrowhead rendering**
    - **Validates: Requirements 4.2**

- [x] 11. Implement dynamic line updates
  - [x] 11.1 Ensure connections update on node movement
    - Verify that connection rendering uses current node positions
    - Test that moving nodes updates connected lines automatically
    - _Requirements: 4.3_

  - [ ]* 11.2 Write property test for dynamic line updates
    - **Property 16: Dynamic line updates on node movement**
    - **Validates: Requirements 4.3**

  - [ ]* 11.3 Write property test for line positioning under transformations
    - **Property 17: Line positioning under transformations**
    - **Validates: Requirements 4.4**

- [x] 12. Add coordinate transformation utilities
  - [x] 12.1 Create helper functions for coordinate conversion
    - Create function to convert screen coordinates to canvas coordinates
    - Account for canvas offset (translate)
    - Account for canvas scale (zoom)
    - Use in mouse move handler and hover detection
    - _Requirements: 5.1_

  - [ ]* 12.2 Write unit tests for coordinate conversion
    - Test with various offset and scale values
    - Test edge cases (zero scale, negative offset)
    - _Requirements: 5.1_

- [x] 13. Final checkpoint - Integration testing
  - [x] 13.1 Test complete connection workflow
    - Test creating connections between multiple nodes
    - Test connection rendering with various node positions
    - Test hover detection accuracy
    - Test duplicate and self-connection prevention
    - _Requirements: All_

  - [ ]* 13.2 Write integration tests
    - Test complete workflow from click to release
    - Test interaction with node dragging and canvas panning
    - Test connection persistence across re-renders
    - _Requirements: All_

- [x] 14. Checkpoint - Ensure all tests pass
  - All core functionality implemented and verified working

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- All coordinate calculations must account for canvas offset and scale transformations
- Connection state must be properly cleaned up to prevent memory leaks
