# Implementation Plan: 2D to 3D Knowledge Graph Conversion

## Overview

This implementation plan fixes two critical issues: database transaction timeouts and poor 3D node distribution. The approach uses batch processing for database operations and an enhanced coordinate conversion algorithm for better spatial distribution.

## Tasks

- [-] 1. Create database helper utilities for batch operations
  - Create `lib/db-helpers.ts` with batch creation functions
  - Implement `createNodesBatch()` for sequential node creation
  - Implement `createEdgesBatch()` for edge creation
  - Add error handling and retry logic
  - _Requirements: 1.1, 1.3, 1.4, 4.2_

- [ ] 1.1 Write property test for batch operations
  - **Property 3: Batch Operations Usage**
  - **Validates: Requirements 1.3, 4.2**
  - Generate datasets with 10-100 nodes
  - Verify batch operations are used for datasets > 10 nodes
  - _Requirements: 1.3, 4.2_

- [-] 2. Enhance coordinate conversion algorithm
  - [x] 2.1 Update scaling factor in `lib/coordinate-converter.ts`
    - Change scale multiplier from 0.05 to 0.3
    - Update `convertTo3DCoordinates()` function
    - _Requirements: 2.1, 2.3_

  - [x] 2.2 Add Y-axis variation for depth
    - Implement sine wave pattern for Y coordinates
    - Add configurable `heightVariation` parameter (default: 5)
    - Calculate `y3d = sin(index * 0.5) * heightVariation`
    - _Requirements: 3.2_

  - [x] 2.3 Implement minimum distance enforcement
    - Add `enforceMinimumDistance()` function
    - Calculate pairwise distances between nodes
    - Push apart nodes that are too close
    - Use configurable `minNodeDistance` parameter (default: 2.0)
    - _Requirements: 2.3, 2.4_

  - [ ] 2.4 Write property tests for coordinate conversion
    - **Property 5: Coordinate Bounds**
    - **Property 6: Relative Position Preservation**
    - **Property 7: Minimum Node Spacing**
    - **Property 8: Y-Axis Variation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.2**
    - Generate random 2D layouts
    - Verify all properties hold for converted coordinates
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_

- [-] 3. Update conversion API with batch processing
  - [x] 3.1 Refactor `app/api/convert/route.ts` to use batch processing
    - Import batch helper functions
    - Split nodes into batches of 15
    - Process batches sequentially with delays
    - Create ID mapping for edge references
    - _Requirements: 1.1, 1.3, 4.2_

  - [x] 3.2 Improve error handling
    - Detect transaction timeout errors specifically
    - Return descriptive error messages
    - Implement transaction rollback on failure
    - Add retry logic with smaller batches
    - _Requirements: 1.2, 1.4_

  - [x] 3.3 Add progress tracking (optional)
    - Track batch completion progress
    - Return progress in response for long operations
    - _Requirements: 4.4_

  - [ ] 3.4 Write property tests for API conversion
    - **Property 1: Transaction Completion**
    - **Property 2: Descriptive Error Messages**
    - **Property 4: Transaction Rollback Integrity**
    - **Property 9: Conversion Performance**
    - **Validates: Requirements 1.1, 1.2, 1.4, 4.3**
    - Test with datasets of various sizes
    - Simulate failures and verify error handling
    - _Requirements: 1.1, 1.2, 1.4, 4.3_

- [x] 4. Checkpoint - Test coordinate conversion
  - Ensure coordinate conversion tests pass
  - Manually verify node spacing with sample data
  - Ask the user if questions arise

- [ ] 5. Implement data preservation tests
  - [ ] 5.1 Write property test for node property preservation
    - **Property 10: Node Property Preservation**
    - **Validates: Requirements 5.1**
    - Generate nodes with various properties
    - Convert and retrieve from database
    - Verify all properties match exactly
    - _Requirements: 5.1_

  - [ ] 5.2 Write property test for connection preservation
    - **Property 11: Connection Property Preservation**
    - **Validates: Requirements 5.2**
    - Generate connections with labels
    - Convert and retrieve from database
    - Verify connections match exactly
    - _Requirements: 5.2_

  - [ ] 5.3 Write property test for metadata round-trip
    - **Property 12: Metadata Round-Trip**
    - **Validates: Requirements 5.3**
    - Generate nodes with 2D coordinates
    - Convert, store, and retrieve
    - Parse metadata and verify 2D coordinates
    - _Requirements: 5.3_

  - [ ] 5.4 Write property test for referential integrity
    - **Property 13: Referential Integrity**
    - **Validates: Requirements 5.4**
    - Generate nodes and connections
    - Convert to database
    - Verify all edge references point to existing nodes
    - _Requirements: 5.4_

- [x] 6. Integration testing
  - [x] 6.1 Test end-to-end conversion flow
    - Create sample workflow with 20 nodes
    - Trigger conversion via API
    - Verify 3D graph displays correctly
    - Check node positions are well-distributed
    - _Requirements: 1.1, 2.1, 2.3, 3.2_

  - [x] 6.2 Test with large datasets
    - Test with 50 nodes
    - Test with 100 nodes
    - Verify no timeout errors
    - Measure and verify performance < 5 seconds for 50 nodes
    - _Requirements: 1.1, 4.3_

  - [x] 6.3 Test error scenarios
    - Test with invalid data
    - Test with empty nodes
    - Test with missing connections
    - Verify error messages are descriptive
    - _Requirements: 1.2_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no regressions in existing functionality
  - Test the conversion in the UI
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive testing and quality assurance
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The batch size of 15 is chosen to balance performance and reliability
- The scaling factor of 0.3 provides good visual distribution
- Y-axis variation adds depth without making nodes too spread out
