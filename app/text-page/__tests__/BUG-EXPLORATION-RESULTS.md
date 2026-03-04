# Bug Condition Exploration Test Results

## Test Execution Summary

**Date**: Task 1 Execution
**Spec**: ai-project-creation-fix
**Test File**: `app/text-page/__tests__/project-creation.property.test.tsx`
**Status**: ✅ Bug Confirmed (Tests Failed as Expected on Unfixed Code)

## Bug Condition Validated

The property-based tests successfully confirmed the bug exists by demonstrating that:

```
Bug Condition: input.source == 'text-page' 
               AND input.hasParameter('name') == true 
               AND input.hasParameter('graphName') == false
```

## Counterexamples Found

### Test 1: Project Creation Success Property

**Property**: For any valid project name from text-page, creation should succeed with status 201

**Counterexample**: Project name "!"
- **Expected Behavior** (after fix): 
  - `result.success = true`
  - `result.status = 201`
  - `result.project` defined with project data
  - `result.graph` defined with graph data (name: '默认图谱')

- **Actual Behavior** (unfixed code):
  - `result.success = false`
  - `result.status = 400`
  - `result.error = "图谱名称不能为空"`

- **Root Cause**: The `handleCreateProject` function only sends the `name` parameter in the request body, missing the required `graphName` parameter.

### Test 2: Request Body Parameters Property

**Property**: For any project creation from text-page, the request body should include both name and graphName

**Counterexample**: Project name "!"
- **Expected Behavior** (after fix):
  - `capturedRequestBody.name = "!"`
  - `capturedRequestBody.graphName = "默认图谱"`

- **Actual Behavior** (unfixed code):
  - `capturedRequestBody.name = "!"`
  - `capturedRequestBody.graphName = undefined`

- **Root Cause**: Bug condition confirmed - `hasParameter('graphName') == false`

### Test 3: Import Page Consistency Property

**Property**: Text-page project creation should follow the same pattern as import page

**Counterexample**: Project name "!"
- **Expected Behavior** (after fix):
  - Import page: `response.ok = true`, `status = 201` ✓
  - Text page: `response.ok = true`, `status = 201` ✓
  - Both should produce identical results

- **Actual Behavior** (unfixed code):
  - Import page: `response.ok = true`, `status = 201` ✓ (works correctly)
  - Text page: `response.ok = false`, `status = 400` ✗ (fails)

- **Root Cause**: Inconsistent implementation - import page includes `graphName: '默认图谱'`, but text-page does not.

## Bug Analysis

### Location
- **File**: `app/text-page/page.tsx`
- **Function**: `handleCreateProject` (lines 413-450)
- **Specific Issue**: Line 422-424

### Current Code (Buggy)
```typescript
body: JSON.stringify({
  name: newProjectName.trim(),
  // Missing: graphName parameter
}),
```

### Expected Code (After Fix)
```typescript
body: JSON.stringify({
  name: newProjectName.trim(),
  graphName: '默认图谱', // Add this parameter
}),
```

## API Validation Behavior

The API endpoint `/api/projects/route.ts` correctly validates both parameters:

1. **Line 36-38**: Validates `name` parameter
   - Returns 400 error "项目名称不能为空" if missing

2. **Line 40-44**: Validates `graphName` parameter
   - Returns 400 error "图谱名称不能为空" if missing

The API validation is working correctly. The bug is in the frontend request.

## Test Configuration

- **Framework**: Jest + fast-check
- **Iterations**: 100 runs per property
- **Shrinking**: Enabled (counterexamples shrunk to minimal failing case "!")
- **Test Type**: Property-based testing (PBT)

## Next Steps

1. ✅ Task 1 Complete: Bug condition exploration test written and executed
2. ⏳ Task 2: Write preservation property tests (before implementing fix)
3. ⏳ Task 3: Implement the fix by adding `graphName: '默认图谱'` to the request body
4. ⏳ Task 3.2: Re-run this test to verify it passes after the fix
5. ⏳ Task 3.3: Verify preservation tests still pass (no regressions)

## Validation Strategy

This test encodes the **expected behavior** (after fix). When the fix is implemented:
- These same tests will be re-run
- They should **PASS**, confirming the bug is fixed
- No new tests need to be written - the same tests validate both the bug and the fix

This is the **bug condition exploration methodology**:
1. Write tests encoding expected behavior
2. Run on unfixed code → tests FAIL (confirms bug exists)
3. Implement fix
4. Re-run same tests → tests PASS (confirms fix works)
