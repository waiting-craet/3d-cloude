# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Text-Page Project Creation Missing GraphName
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to text-page project creation requests with valid name but missing graphName parameter
  - Test that project creation from text-page with only name parameter fails with 400 error "图谱名称不能为空"
  - Test implementation details from Fault Condition: input.source == 'text-page' AND input.hasParameter('name') == true AND input.hasParameter('graphName') == false
  - The test assertions should match Expected Behavior: after fix, creation should succeed with status 201 and include both project and graph data
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with 400 error (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Creating 'Test Project' from text-page returns 400 error instead of 201 success")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - API Validation and Import Page Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Import page project creation with both name and graphName succeeds with 201
    - API validation rejects empty name with "项目名称不能为空"
    - API validation rejects missing graphName with "图谱名称不能为空"
    - Successful creation returns project and graph data structure
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test cases:
    - Import page creation continues to work (already includes both parameters)
    - API validation for missing name parameter continues to return correct error
    - API validation for missing graphName parameter continues to return correct error
    - Success response structure remains unchanged
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for AI project creation missing graphName parameter

  - [x] 3.1 Implement the fix in text-page handleCreateProject
    - Modify the request body in `app/text-page/page.tsx` at line 422-424
    - Change from: `body: JSON.stringify({ name: newProjectName.trim() })`
    - Change to: `body: JSON.stringify({ name: newProjectName.trim(), graphName: '默认图谱' })`
    - Use the same default value ('默认图谱') as import page for consistency
    - _Bug_Condition: isBugCondition(input) where input.source == 'text-page' AND input.hasParameter('name') == true AND input.hasParameter('graphName') == false_
    - _Expected_Behavior: Project creation succeeds with status 201, returns project and graph data with graph.name == '默认图谱'_
    - _Preservation: API validation logic, error messages, import page behavior, and transaction atomicity remain unchanged_
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Text-Page Project Creation Succeeds
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify project creation from text-page now succeeds with status 201
    - Verify response includes both project and graph data
    - Verify graph name is '默认图谱'
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - API Validation and Import Page Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm import page creation still works
    - Confirm API validation errors remain unchanged
    - Confirm success response structure is preserved
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
