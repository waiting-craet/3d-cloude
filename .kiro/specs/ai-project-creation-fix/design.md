# AI Project Creation Fix - Bugfix Design

## Overview

The bug prevents users from creating projects on the AI creation page (text-page) due to a parameter mismatch. The frontend `handleCreateProject` function only sends the `name` parameter, while the backend API requires both `name` and `graphName`. The fix involves adding the missing `graphName` parameter to the frontend request, following the pattern already used successfully in the import page.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when project creation is attempted from text-page without the graphName parameter
- **Property (P)**: The desired behavior - project creation succeeds with both name and graphName parameters
- **Preservation**: Existing API validation and error handling that must remain unchanged
- **handleCreateProject**: The function in `app/text-page/page.tsx` (line 413) that sends the POST request to create a new project
- **POST /api/projects**: The API endpoint in `app/api/projects/route.ts` that validates and creates projects with graphs

## Bug Details

### Fault Condition

The bug manifests when a user attempts to create a project from the AI creation page (text-page). The `handleCreateProject` function sends only the `name` parameter in the request body, causing the API validation to fail at line 36-38 of `/api/projects/route.ts` because the required `graphName` parameter is missing.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ProjectCreationRequest
  OUTPUT: boolean
  
  RETURN input.source == 'text-page'
         AND input.hasParameter('name') == true
         AND input.hasParameter('graphName') == false
         AND apiValidationFails(input) == true
END FUNCTION
```

### Examples

- **Example 1**: User enters "My AI Project" in text-page modal → clicks create → receives 400 error "图谱名称不能为空"
- **Example 2**: User enters "Research Project" in text-page modal → submits with Enter key → receives 400 error "图谱名称不能为空"
- **Example 3**: User enters "Data Analysis" in import page modal → clicks create → succeeds because import page includes graphName parameter
- **Edge Case**: User enters empty project name → should still receive "项目名称不能为空" error (validation works correctly)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- API validation for empty or missing `name` parameter must continue to return "项目名称不能为空" error
- API validation for empty or missing `graphName` parameter must continue to return "图谱名称不能为空" error
- Project creation from import page (which already sends both parameters) must continue to work
- Successful project creation must continue to return status 201 with project and graph data
- Transaction-based creation (project + graph) must remain atomic

**Scope:**
All inputs that do NOT originate from the text-page handleCreateProject function should be completely unaffected by this fix. This includes:
- Project creation from import page
- Project creation from any other UI components
- API validation logic and error messages
- Database transaction behavior

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing Parameter in Frontend Request**: The `handleCreateProject` function in text-page (line 413-450) only includes `name` in the request body, omitting the required `graphName` parameter
   - Line 422-424 shows: `body: JSON.stringify({ name: newProjectName.trim() })`
   - The import page correctly includes both parameters (line 87-89): `body: JSON.stringify({ name: newProjectName.trim(), graphName: '默认图谱' })`

2. **API Validation is Correct**: The API endpoint properly validates both parameters (lines 36-44), so the validation logic is working as designed

3. **Inconsistent Implementation**: Different pages use different patterns - import page follows the correct pattern, but text-page does not

## Correctness Properties

Property 1: Fault Condition - Project Creation with GraphName

_For any_ project creation request from the text-page where a valid project name is provided, the fixed handleCreateProject function SHALL include both the `name` and `graphName` parameters in the request body, allowing the API validation to pass and the project to be created successfully with status 201.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - API Validation Behavior

_For any_ project creation request that does NOT originate from the text-page handleCreateProject function (such as from import page or other components), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing validation logic, error messages, and success responses.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `app/text-page/page.tsx`

**Function**: `handleCreateProject` (lines 413-450)

**Specific Changes**:
1. **Add graphName Parameter**: Modify the request body to include the `graphName` parameter
   - Current: `body: JSON.stringify({ name: newProjectName.trim() })`
   - Fixed: `body: JSON.stringify({ name: newProjectName.trim(), graphName: '默认图谱' })`
   - Use the same default value ('默认图谱') as the import page for consistency

2. **Location**: Line 422-424 in the fetch call to '/api/projects'

3. **No Other Changes Required**: The API endpoint, validation logic, and error handling are all correct and should not be modified

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Write tests that simulate project creation from text-page with only the name parameter. Run these tests on the UNFIXED code to observe 400 errors and confirm the missing graphName parameter is the root cause.

**Test Cases**:
1. **Text-Page Creation Test**: Simulate creating project "Test Project" from text-page without graphName (will fail on unfixed code with 400 error)
2. **Import Page Creation Test**: Simulate creating project "Test Project" from import page with graphName (will succeed on unfixed code)
3. **Empty Name Test**: Simulate creating project with empty name (will fail with "项目名称不能为空" on both fixed and unfixed code)
4. **API Direct Call Test**: Call API directly without graphName parameter (will fail with 400 error on both fixed and unfixed code)

**Expected Counterexamples**:
- Text-page requests fail with "图谱名称不能为空" error
- Root cause confirmed: missing graphName parameter in request body

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleCreateProject_fixed(input)
  ASSERT result.status == 201
  ASSERT result.project.name == input.name
  ASSERT result.graph.name == '默认图谱'
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleCreateProject_original(input) = handleCreateProject_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for import page and API validation, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Import Page Preservation**: Verify import page project creation continues to work with both parameters
2. **API Validation Preservation**: Verify API continues to reject requests with missing name parameter
3. **API Validation Preservation**: Verify API continues to reject requests with missing graphName parameter
4. **Success Response Preservation**: Verify successful creation returns same structure (project + graph data)

### Unit Tests

- Test text-page project creation with valid name (should succeed after fix)
- Test text-page project creation with empty name (should fail with appropriate error)
- Test that created project includes both project and graph data
- Test that modal closes and project list refreshes after successful creation

### Property-Based Tests

- Generate random valid project names and verify creation succeeds with graphName parameter
- Generate random API request variations and verify validation behavior is preserved
- Test that all error messages remain unchanged across many scenarios
- Verify transaction atomicity (project and graph created together or not at all)

### Integration Tests

- Test full flow: open modal → enter name → create → verify project appears in list
- Test that newly created project is automatically selected after creation
- Test that project creation from different pages (text-page vs import page) produces consistent results
- Test error handling flow: invalid input → error message → user can retry
