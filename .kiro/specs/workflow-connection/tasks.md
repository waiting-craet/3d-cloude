# Implementation Plan: Workflow Connection Optimization

## Overview

This implementation plan addresses the connection point positioning and node proportion issues in the 2D workflow canvas. The work is divided into three main phases: fixing connection point positions, ensuring node proportion consistency, and comprehensive testing.

## Tasks

- [x] 1. Enhance Node Interface and State Management
  - Add actualWidth, actualHeight, mediaWidth, and mediaHeight fields to Node interface
  - Update node state initialization to include new dimension fields
  - Implement helper function to update node dimensions in state
  - _Requirements: 1.1, 3.1, 3.5_

- [x] 2. Implement Connection Point Position Calculator
  - [x] 2.1 Create calculateConnectionPoint function
    - Accept node and side ('left' | 'right') as parameters
    - Calculate position based on actualWidth/actualHeight if available
    - Fall back to width/height if actual dimensions not yet measured
    - Return ConnectionPointPosition with x, y, and side
    - _Requirements: 1.1, 1.2, 6.1_

  - [x] 2.2 Write property test for connection point positioning
    - **Property 1: Connection Point Positioning Accuracy**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 3. Implement Node Dimension Calculator
  - [x] 3.1 Create calculateNodeDimensions function
    - Calculate base width (320px)
    - Calculate media height preserving aspect ratio (max 200px)
    - Calculate content height including title, description, media
    - Apply consistent padding and spacing
    - Return NodeDimensions object
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 3.2 Write unit tests for dimension calculation
    - Test node without media
    - Test node with square image
    - Test node with wide image
    - Test node with tall image
    - Test node with video
    - Test with and without description
    - _Requirements: 3.1, 3.3_

  - [x] 3.3 Write property test for aspect ratio preservation
    - **Property 4: Media Aspect Ratio Preservation**
    - **Validates: Requirements 3.3**

- [x] 4. Add Dimension Tracking with ResizeObserver
  - [x] 4.1 Implement useRef for node DOM elements
    - Create ref map to track node DOM elements
    - Update refs when nodes are rendered
    - _Requirements: 1.1, 6.2_

  - [x] 4.2 Implement ResizeObserver for dimension measurement
    - Set up ResizeObserver to watch node elements
    - Extract actual width and height from ResizeObserver entries
    - Update node state with actual dimensions
    - Clean up observer on component unmount
    - _Requirements: 1.1, 1.4, 6.3_

  - [x] 4.3 Write unit tests for dimension tracking
    - Test dimension update on media load
    - Test dimension update on content change
    - Test observer cleanup
    - _Requirements: 1.1, 1.4_

- [x] 5. Update Connection Line Rendering
  - [x] 5.1 Refactor renderConnections to use calculateConnectionPoint
    - Replace hardcoded connection point calculations
    - Use calculateConnectionPoint for both from and to nodes
    - Update SVG path generation with new coordinates
    - _Requirements: 1.2, 1.3, 2.2_

  - [x] 5.2 Implement connection point caching for performance
    - Cache calculated connection points in connection state
    - Invalidate cache when node dimensions change
    - Use cached values during rendering
    - _Requirements: 6.1, 6.3_

  - [x] 5.3 Write property test for connection line attachment
    - **Property 2: Connection Line Attachment Consistency**
    - **Validates: Requirements 1.2, 1.3**

- [x] 6. Implement Media Dimension Tracking
  - [x] 6.1 Track media dimensions on upload
    - Extract image dimensions using Image object
    - Extract video dimensions using video element
    - Store mediaWidth and mediaHeight in node state
    - _Requirements: 3.1, 3.3_

  - [x] 6.2 Track media dimensions on load (for existing nodes)
    - Add onLoad handlers to img and video elements
    - Extract dimensions from loaded media
    - Update node state with media dimensions
    - _Requirements: 3.2, 3.5_

  - [x] 6.3 Write unit tests for media dimension tracking
    - Test image dimension extraction
    - Test video dimension extraction
    - Test dimension persistence
    - _Requirements: 3.1, 3.2_

- [x] 7. Update Node Rendering with Consistent Sizing
  - [x] 7.1 Apply calculateNodeDimensions to node rendering
    - Calculate dimensions before rendering each node
    - Apply calculated width and height to node container
    - Apply calculated mediaHeight to media elements
    - Ensure consistent padding and spacing
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 7.2 Update media display styling
    - Set max-height to calculated mediaHeight
    - Use object-fit: cover for images
    - Maintain aspect ratio for videos
    - Ensure media doesn't overflow container
    - _Requirements: 3.3, 4.1_

  - [x] 7.3 Write property test for node dimension preservation
    - **Property 3: Node Dimension Preservation**
    - **Validates: Requirements 3.1, 3.2, 3.5**

- [x] 8. Update Connection Point Visual Elements
  - [x] 8.1 Adjust connection point positioning in JSX
    - Update left connection point position calculation
    - Update right connection point position calculation
    - Ensure connection points use actualHeight for vertical centering
    - Ensure connection points use actualWidth for horizontal positioning
    - _Requirements: 1.1, 1.5, 4.4_

  - [x] 8.2 Ensure connection point visibility with media
    - Position connection points outside media area
    - Increase z-index if necessary
    - Add visual feedback for hovering
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.3 Write property test for connection point visibility
    - **Property 5: Connection Point Visibility**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [x] 9. Implement Dynamic Connection Updates
  - [x] 9.1 Add effect to update connections on dimension changes
    - Listen for node dimension changes
    - Trigger connection line re-render
    - Update connection point positions
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 9.2 Update handleMediaUpload to trigger dimension recalculation
    - Recalculate node dimensions after media upload
    - Update connection points
    - Trigger connection line re-render
    - _Requirements: 5.1, 5.2_

  - [x] 9.3 Update handleDeleteMedia to trigger dimension recalculation
    - Recalculate node dimensions after media deletion
    - Update connection points
    - Trigger connection line re-render
    - _Requirements: 5.2_

  - [x] 9.4 Write property test for dynamic layout updates
    - **Property 7: Dynamic Layout Update**
    - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ] 10. Checkpoint - Test connection point positioning
  - Manually test connection lines with nodes containing images
  - Manually test connection lines with nodes containing videos
  - Manually test connection lines with nodes without media
  - Verify lines attach to connection points correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 11. Update Save/Load Logic for Dimension Persistence
  - [ ] 11.1 Update saveAndConvert to persist media dimensions
    - Include mediaWidth and mediaHeight in payload
    - Include actualWidth and actualHeight in payload
    - _Requirements: 3.1, 3.5_

  - [ ] 11.2 Update data loading to restore dimensions
    - Load mediaWidth and mediaHeight from stored data
    - Load actualWidth and actualHeight from stored data
    - Apply dimensions to nodes on load
    - _Requirements: 3.2, 3.5_

  - [ ] 11.3 Write property test for dimension persistence
    - **Property 3: Node Dimension Preservation**
    - **Validates: Requirements 3.1, 3.2, 3.5**

- [ ] 12. Implement Multi-Connection Support Verification
  - [ ] 12.1 Verify multiple connections can share connection points
    - Test creating multiple connections from same point
    - Verify all connections use same origin coordinates
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 12.2 Write property test for multi-connection support
    - **Property 6: Multi-Connection Support**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 13. Implement Coordinate Precision Optimization
  - [ ] 13.1 Ensure sub-pixel precision in calculations
    - Use floating-point arithmetic for all calculations
    - Avoid rounding until final rendering
    - _Requirements: 6.4_

  - [ ] 13.2 Add memoization for performance
    - Memoize calculateNodeDimensions
    - Memoize calculateConnectionPoint
    - Cache results until dependencies change
    - _Requirements: 6.1, 6.3_

  - [ ] 13.3 Write property test for coordinate precision
    - **Property 8: Coordinate Calculation Precision**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 14. Add Error Handling
  - [ ] 14.1 Add fallback for dimension calculation errors
    - Catch errors in calculateNodeDimensions
    - Return default dimensions (320x180) on error
    - Log error for debugging
    - _Requirements: 1.1, 3.1_

  - [ ] 14.2 Add fallback for connection point calculation errors
    - Catch errors in calculateConnectionPoint
    - Use node center as fallback position
    - Log error with node ID and state
    - _Requirements: 1.1, 6.1_

  - [ ] 14.3 Add error handling for media loading failures
    - Display placeholder on media load error
    - Preserve last known dimensions
    - Allow retry or removal
    - _Requirements: 3.1, 3.2_

  - [ ] 14.4 Write unit tests for error handling
    - Test dimension calculation fallback
    - Test connection point calculation fallback
    - Test media loading error handling
    - _Requirements: 1.1, 3.1, 6.1_

- [ ] 15. Final Checkpoint - Comprehensive Testing
  - Run all unit tests and verify they pass
  - Run all property-based tests (100+ iterations each)
  - Manually test complete workflow:
    - Create nodes with images
    - Create nodes with videos
    - Create connections between nodes
    - Save and reload
    - Verify proportions are maintained
    - Verify connections attach correctly
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
