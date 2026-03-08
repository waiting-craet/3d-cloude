# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Prisma Query Field Name Mismatch
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Test batch delete with projects containing nodes and edges to ensure the field name mismatch causes runtime errors
  - Test that deleteProject function fails when accessing `project.nodes.length` and `project.edges.length` because Prisma query uses singular `node` and `edge` in include statement
  - The test assertions should verify that after fix, the query returns data with `nodes` and `edges` fields (plural) matching schema definition
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with TypeError: Cannot read property 'length' of undefined (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Batch delete of project with 5 nodes and 3 edges fails because project.nodes is undefined")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Batch Delete Functionality Integrity
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (request validation, error handling, response format)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Request validation logic (invalid projectIds array returns 400 error)
    - Error handling for non-existent projects (returns "项目不存在" error)
    - Blob file cleanup logic (attempts to delete associated files)
    - Promise.allSettled parallel processing (ensures other deletions continue on failure)
    - Response format (BatchDeleteResponse structure with success/failure statistics)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix Prisma query field names in batch delete

  - [x] 3.1 Implement the fix
    - Change `node: { select: {...} }` to `nodes: { select: {...} }` in Prisma query include statement (line 145-156)
    - Change `edge: { select: {...} }` to `edges: { select: {...} }` in Prisma query include statement (line 145-156)
    - Verify field names match Prisma schema Project model relation definitions (plural forms)
    - Ensure code accessing `project.nodes.length` and `project.edges.length` (line 167-169) remains unchanged
    - Verify TypeScript type definitions reflect correct field names
    - _Bug_Condition: isBugCondition(input) where prismaQuery.include uses singular 'node'/'edge' but code accesses plural 'project.nodes'/'project.edges' and schema defines plural 'nodes'/'edges'_
    - _Expected_Behavior: Prisma query SHALL use plural field names 'nodes' and 'edges' matching schema definition, enabling correct access to project.nodes and project.edges properties_
    - _Preservation: Request validation, Promise.allSettled parallel processing, Prisma transaction management, Blob cleanup logic, error handling, and response format SHALL remain unchanged_
    - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Prisma Query Field Name Correctness
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - batch delete successfully accesses project.nodes and project.edges)
    - _Requirements: 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Batch Delete Functionality Integrity
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - all validation, error handling, Blob cleanup, parallel processing, and response format continue working)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
