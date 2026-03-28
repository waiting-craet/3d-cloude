# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Layout Controls Panel Visibility
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the Layout Controls panel is visible
  - **Scoped PBT Approach**: Test the concrete case where user visits 3D graph page and Layout Controls panel is rendered
  - Test that KnowledgeGraph component renders "Layout Controls" text in unfixed code
  - Test that layout strategy selector (Auto, Force Directed, Hierarchical, Radial, Grid, Spherical) is present
  - Test that Re-layout button is present and clickable
  - Test that quality metrics display is present
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Layout Controls panel found at top-left corner with all control elements")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - 3D Graph Core Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for core 3D graph features (node rendering, edge rendering, user interactions, data loading)
  - Write property-based tests capturing observed behavior patterns:
    - Nodes render correctly with proper positions and visual properties
    - Edges render correctly connecting nodes
    - User interactions (rotate, zoom, pan, click nodes) work correctly
    - Graph data loads and applies layout algorithm correctly
    - Other UI elements (node detail panel, camera controls) continue to work
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for Layout Controls Panel Removal

  - [x] 3.1 Remove Layout Controls panel JSX code
    - Delete lines 445-617 in components/KnowledgeGraph.tsx (complete Layout Controls panel code block)
    - Delete lines 410-442 (Quality Toast that appears after Re-layout)
    - Ensure no orphaned JSX fragments remain
    - _Bug_Condition: isBugCondition(pageState) where pageState.currentPage == '3D知识图谱页面' AND pageState.hasLayoutControlsPanel == true_
    - _Expected_Behavior: Layout Controls panel SHALL NOT be rendered in the component_
    - _Preservation: Core 3D graph rendering and interaction SHALL remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Remove related state variables
    - Delete `showLayoutPanel` useState declaration (line 191)
    - Delete `selectedStrategy` useState declaration (line 190)
    - Delete `qualityMetrics` useState declaration (line 188)
    - Delete `showQualityToast` useState declaration (around line 190)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Remove related functions
    - Delete `handleReLayout` function (lines 196-240)
    - Delete `getQualityColor` function (lines 250-254)
    - Remove any calls to `setQualityMetrics` and `setShowQualityToast` in other functions (lines 231, 307, 233, 309)
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Clean up unused imports
    - Check if `LayoutQualityMetrics` type import (line 13) is still used elsewhere
    - If not used, remove the import statement
    - _Requirements: 2.1_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - No Layout Controls Panel
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms Layout Controls panel is removed
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Core Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all core 3D graph features still work correctly (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
