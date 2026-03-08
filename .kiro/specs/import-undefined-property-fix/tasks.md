# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Property Access TypeError on Success Response
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to successful import scenarios where response building occurs
  - Test that successful import returns 200 with correct `skippedEdges` field (from Fault Condition in design)
  - Test scenarios: complete import (all edges created), partial import (some edges skipped), no edges file, large dataset
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with `TypeError: Cannot read properties of undefined (reading 'length')`
  - Document counterexamples found: error occurs when accessing `validatedData.edge.length`
  - Root cause: property name typo (`edge` vs `edges`)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Error Handling and Statistics Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (error paths)
  - Observe: validation errors return 400 with detailed error messages
  - Observe: database connection errors return 500 with descriptive messages
  - Observe: duplicate detection errors return 500 with descriptive messages
  - Observe: successful imports calculate other statistics correctly (nodesCount, edgesCount, etc.)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix property access error in import API response

  - [x] 3.1 Implement the fix
    - Change line 207 in `app/api/import/route.ts` from `validatedData.edge.length` to `validatedData.edges.length`
    - Add explicit type annotation for `validatedData` to prevent similar errors: `const validatedData: ParsedGraphData = importResult.validatedData!`
    - Add defensive boundary check (optional but recommended): `const skippedEdges = (validatedData.edges?.length || 0) - createdEdges.length`
    - _Bug_Condition: isBugCondition(executionState) where executionState.importSuccessful = true AND executionState.buildingResponse = true AND executionState.accessingProperty = 'validatedData.edge.length'_
    - _Expected_Behavior: Access validatedData.edges.length (correct plural form) to calculate skipped edges, return 200 success response with accurate skippedEdges value_
    - _Preservation: All error handling paths (validation, database, duplicate detection) and other success response statistics remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Correct Property Access
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify successful imports return 200 with correct `skippedEdges` field
    - Verify no TypeError occurs when accessing property
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Error Handling and Statistics Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm validation error handling unchanged
    - Confirm database error handling unchanged
    - Confirm duplicate detection error handling unchanged
    - Confirm other statistics calculations unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
