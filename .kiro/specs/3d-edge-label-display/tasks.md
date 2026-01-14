# Implementation Plan: 3D Edge Label Display

## Overview

This implementation plan adds edge label visualization to the 3D knowledge graph. The approach enhances the existing `GraphEdges` component to render text labels at the midpoint of each edge using React Three Fiber's Text component.

## Tasks

- [x] 1. Implement edge label rendering in GraphEdges component
  - [x] 1.1 Add Text import from @react-three/drei
    - Import Text component at the top of GraphEdges.tsx
    - _Requirements: 1.4, 2.1_

  - [x] 1.2 Create midpoint calculation utility function
    - Implement `calculateMidpoint(fromNode, toNode)` function
    - Return tuple `[x, y, z]` with midpoint coordinates
    - Formula: `[(from.x + to.x)/2, (from.y + to.y)/2, (from.z + to.z)/2]`
    - _Requirements: 3.1_

  - [x] 1.3 Create label validation utility function
    - Implement `isValidLabel(label)` function
    - Return true only if label is non-null, non-undefined, and non-whitespace
    - Use `label?.trim().length > 0` for validation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 1.4 Add conditional label rendering in edge map
    - After rendering each Line component, check if edge has valid label
    - If valid, calculate midpoint position
    - Render Text component at midpoint with label text
    - Apply styling: fontSize={0.5}, color="#ffffff", anchorX="center", anchorY="middle"
    - Add outline: outlineWidth={0.05}, outlineColor="#000000"
    - _Requirements: 1.4, 2.1, 2.2, 2.4, 5.1, 5.2, 5.4_

  - [x] 1.5 Add slight Y-axis offset to prevent overlap with edge line
    - Add 0.2 units to the Y coordinate of label position
    - Ensures label doesn't visually overlap with the edge line
    - _Requirements: 3.3_

- [ ]* 1.6 Write unit tests for label rendering
  - Test midpoint calculation with various node positions
  - Test label validation with empty, whitespace, and valid labels
  - Test conditional rendering (labels appear only for valid labels)
  - _Requirements: 1.4, 3.1, 6.1, 6.2, 6.3, 6.4_

- [ ]* 1.7 Write property test for label preservation
  - **Property 1: Label Preservation**
  - **Validates: Requirements 1.2**
  - Generate random edges with labels in 2D
  - Convert to 3D and verify labels match in database
  - _Requirements: 1.2_

- [ ]* 1.8 Write property test for conditional rendering
  - **Property 2: Conditional Rendering**
  - **Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4**
  - Generate edges with various label states
  - Verify text sprites only render for non-empty labels
  - _Requirements: 1.4, 6.1, 6.2, 6.3, 6.4_

- [ ]* 1.9 Write property test for midpoint positioning
  - **Property 3: Midpoint Positioning**
  - **Validates: Requirements 3.1**
  - Generate random node positions
  - Verify label positions match calculated midpoints
  - _Requirements: 3.1_

- [x] 2. Verify edge label data flow from 2D to 3D
  - [x] 2.1 Confirm WorkflowCanvas stores edge labels correctly
    - Review `saveAndConvert` function in WorkflowCanvas.tsx
    - Verify `connections.map(c => ({ ..., label: c.label }))` includes label
    - No code changes needed (already implemented)
    - _Requirements: 1.1_

  - [x] 2.2 Confirm sync API preserves edge labels
    - Review `/api/graphs/[id]/sync/route.ts`
    - Verify edge creation includes label field
    - No code changes needed (already implemented)
    - _Requirements: 1.2_

  - [x] 2.3 Confirm store provides edge labels to components
    - Review `lib/store.ts` edge interface
    - Verify edges include label field
    - No code changes needed (already implemented)
    - _Requirements: 1.3_

- [ ] 3. Test and optimize performance
  - [ ] 3.1 Test with small graph (10 edges with labels)
    - Create test graph with 10 labeled edges
    - Verify labels render correctly
    - Check frame rate remains smooth
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 3.2 Test with medium graph (50 edges with labels)
    - Create test graph with 50 labeled edges
    - Verify all labels render without performance issues
    - Measure frame rate (should be ≥ 30 FPS)
    - _Requirements: 4.1, 4.4_

  - [ ] 3.3 Test with large graph (100 edges with labels)
    - Create test graph with 100 labeled edges
    - Verify performance remains acceptable
    - Measure frame rate (should be ≥ 30 FPS)
    - _Requirements: 4.4_

  - [ ]* 3.4 Write property test for performance
    - **Property 7: Performance Threshold**
    - **Validates: Requirements 4.4**
    - Generate graphs with 10, 50, 100 edges
    - Measure frame rate during rendering
    - Verify FPS ≥ 30 for all test cases
    - _Requirements: 4.4_

- [ ] 4. Test edge cases and error handling
  - [ ] 4.1 Test with edges missing node references
    - Create edge with invalid fromNodeId or toNodeId
    - Verify component doesn't crash
    - Verify edge and label are skipped gracefully
    - _Requirements: 1.4_

  - [ ] 4.2 Test with null and undefined labels
    - Create edges with label = null
    - Create edges with label = undefined
    - Verify no text sprites are rendered
    - Verify no errors are thrown
    - _Requirements: 6.1, 6.2_

  - [ ] 4.3 Test with whitespace-only labels
    - Create edges with label = "   " (spaces)
    - Create edges with label = "\t\n" (tabs/newlines)
    - Verify no text sprites are rendered
    - _Requirements: 6.3_

  - [ ] 4.4 Test with very long labels
    - Create edge with label = 100+ character string
    - Verify label renders without breaking layout
    - Check for text overflow or clipping issues
    - _Requirements: 2.4, 5.4_

  - [ ] 4.5 Test with special characters in labels
    - Create edges with labels containing: emojis, Chinese characters, symbols
    - Verify all characters render correctly
    - Check for encoding issues
    - _Requirements: 2.4_

- [ ] 5. Integration testing
  - [ ] 5.1 Test end-to-end label flow
    - Create labeled connections in 2D workflow canvas
    - Save and convert to 3D graph
    - Verify labels appear in 3D visualization
    - Verify label text matches 2D input
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 5.2 Test camera interaction with labels
    - Rotate camera around the graph
    - Verify labels always face the camera (billboard behavior)
    - Check labels remain readable from all angles
    - _Requirements: 2.2_

  - [ ] 5.3 Test mixed label scenario
    - Create graph with some labeled edges and some unlabeled edges
    - Verify only labeled edges show text
    - Verify visual consistency across the graph
    - _Requirements: 1.4, 6.4_

  - [ ] 5.4 Test label positioning accuracy
    - Create edges with known node positions
    - Calculate expected midpoints manually
    - Verify rendered labels appear at correct positions
    - _Requirements: 3.1, 3.3_

  - [ ] 5.5 Test dynamic position updates
    - Load graph with labeled edges
    - Modify node positions (if supported)
    - Verify label positions update to new midpoints
    - _Requirements: 3.2_

- [ ] 6. Visual quality assurance
  - [ ] 6.1 Verify text readability
    - Check font size is appropriate for typical viewing distances
    - Verify text color provides sufficient contrast
    - Check outline improves readability against various backgrounds
    - _Requirements: 2.1, 2.4, 5.1, 5.2_

  - [ ] 6.2 Verify label positioning doesn't overlap edges
    - Check Y-axis offset prevents visual overlap with edge lines
    - Verify labels are clearly associated with their edges
    - _Requirements: 3.3_

  - [ ] 6.3 Check for label overlap issues
    - Create graph with many edges in close proximity
    - Identify any problematic label overlaps
    - Document any issues for future enhancement
    - _Requirements: 2.3_

  - [ ] 6.4 Verify styling consistency
    - Check all labels use consistent font, size, and color
    - Verify outline styling is uniform
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no regressions in existing edge rendering
  - Test the feature in the UI with real data
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The existing database schema, API, and data flow already support edge labels
- Only the `GraphEdges.tsx` component needs modification
- The Text component from @react-three/drei provides billboard behavior automatically
- Performance should be monitored with graphs containing many labeled edges
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

