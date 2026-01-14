# Implementation Plan: Dropdown State Synchronization

## Overview

This implementation plan fixes two critical issues with dropdown state synchronization:
1. Projects/graphs disappearing from dropdown after save and convert
2. Deleted items persisting in dropdown and causing 404 errors

The approach involves coordinating state updates with navigation actions and ensuring proper verification of database changes.

## Tasks

- [x] 1. Fix WorkflowCanvas save and convert flow
  - Modify saveAndConvert to wait for refreshProjects before redirecting ✅
  - Add query parameters to redirect URL for state restoration ✅
  - Ensure localStorage is updated before redirect ✅
  - _Requirements: 1.1, 1.2, 1.3_
  - **Status**: ✅ IMPLEMENTED AND DEPLOYED
  - **Bug Fix**: ✅ Fixed refreshProjects validation logic (2025-01-14)

- [!] 1.1 Write unit tests for save and convert flow
  - Test that refreshProjects is called after successful sync
  - Test that redirect URL contains correct query parameters
  - Test error handling when Sync API fails
  - _Requirements: 1.1, 1.2, 1.3_
  - **Status**: ❌ BLOCKED - jsdom does not support window.location.href navigation
  - **Alternative**: Manual testing completed successfully
  - **See**: DROPDOWN-STATE-SYNC-TEST-STATUS.md for details

- [-] 2. Enhance TopNavbar project loading with query param support
  - [x] 2.1 Add query parameter parsing in useEffect
    - Extract projectId and graphId from URL search params
    - Prioritize URL params over localStorage
    - Clean up URL params after restoring state
    - _Requirements: 1.3, 1.4_

  - [x] 2.2 Implement state restoration logic
    - Verify project and graph exist in loaded data
    - Call switchGraph with restored IDs
    - Clear invalid IDs from localStorage
    - _Requirements: 1.4_

  - [ ] 2.3 Write unit tests for state restoration
    - Test query params override localStorage
    - Test invalid IDs are cleared
    - Test dropdown shows correct selection
    - _Requirements: 1.3, 1.4_

- [-] 3. Improve delete confirmation with verification
  - [x] 3.1 Add deletion verification logic
    - Check if deleted item was currently selected
    - Clear selection and reload if needed
    - Implement retry loop with verification
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
    - **Status**: ✅ FIXED in Task 7.2

  - [x] 3.2 Enhance error handling for deletions
    - Display specific error messages for 404 and 500 errors
    - Preserve state when deletion fails
    - Force reload if verification fails after max retries
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
    - **Status**: ✅ FIXED in Task 7.3

  - [x] 3.3 Write unit tests for delete flow
    - Test successful deletion triggers refresh
    - Test 404 error displays correct message
    - Test 500 error displays API message
    - Test current selection is cleared when deleted
    - Test failed deletions preserve state
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 4.1, 4.2, 4.3_
    - **Status**: ✅ IMPLEMENTED - `components/__tests__/TopNavbar.delete.test.tsx`

- [-] 4. Enhance GraphStore refreshProjects method
  - [x] 4.1 Add verification logic to refreshProjects
    - Implement retry loop with exponential backoff
    - Verify current selection exists in refreshed data
    - Update state with verified data
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Improve cache-busting headers
    - Ensure all fetch calls use no-cache headers
    - Add Pragma header for older browsers
    - _Requirements: 3.1_

  - [x] 4.3 Write property test for retry logic
    - **Property 3: Retry logic uses exponential backoff**
    - **Validates: Requirements 3.3**
    - **Status**: ✅ IMPLEMENTED - `lib/__tests__/store.retry.property.test.ts`
    - **Note**: Reduced to 10 iterations due to timing delays (500ms, 1000ms, 1500ms per test)

  - [x] 4.4 Write property test for data completeness
    - **Property 6: Data completeness in API responses**
    - **Validates: Requirements 3.5**
    - **Status**: ✅ IMPLEMENTED - `lib/__tests__/store.dataCompleteness.property.test.ts`

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Write property tests for dropdown state
  - [x] 6.1 Write property test for dropdown counts
    - **Property 1: Dropdown counts match database counts**
    - **Validates: Requirements 1.5**
    - **Status**: ✅ IMPLEMENTED - `components/__tests__/dropdown.property.test.tsx`

  - [x] 6.2 Write property test for deleted entities
    - **Property 2: Deleted entities are removed from state**
    - **Validates: Requirements 2.3, 2.6**
    - **Status**: ✅ IMPLEMENTED - `components/__tests__/dropdown.property.test.tsx`

  - [x] 6.3 Write property test for error message propagation
    - **Property 4: Error messages are propagated correctly**
    - **Validates: Requirements 4.2**
    - **Status**: ✅ IMPLEMENTED - `components/__tests__/dropdown.property.test.tsx`

  - [x] 6.4 Write property test for failed deletion state
    - **Property 5: Failed deletions preserve state**
    - **Validates: Requirements 4.3**
    - **Status**: ✅ IMPLEMENTED - `components/__tests__/dropdown.property.test.tsx`

- [x] 7. Fix production deletion verification bug
  - [x] 7.1 Add immediate UI feedback during deletion
    - Disable all delete buttons immediately when deletion starts ✅
    - Show loading state in dropdown during refresh ✅
    - Prevent user interaction until verification completes ✅
    - _Requirements: 2.3, 2.6, 4.3_
    - **Status**: ✅ IMPLEMENTED
  
  - [x] 7.2 Improve verification logic robustness
    - Add more detailed logging for debugging ✅
    - Ensure verification check runs correctly for both projects and graphs ✅
    - Add fallback: if verification fails, immediately reload page (don't wait) ✅
    - Save deletion info before closing dialog for accurate verification ✅
    - _Requirements: 2.3, 2.6, 3.4_
    - **Status**: ✅ IMPLEMENTED
  
  - [x] 7.3 Handle 404 errors gracefully
    - When delete API returns 404, immediately refresh dropdown ✅
    - Show user-friendly message: "该项目/图谱已被删除" ✅
    - Don't show error alert for 404 (it's expected if already deleted) ✅
    - _Requirements: 4.1, 4.3_
    - **Status**: ✅ IMPLEMENTED

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on fixing the core synchronization issues first (tasks 1-4)
- Testing tasks (1.1, 2.3, 3.3, 4.3, 4.4, 6.x) can be done later if time is limited
