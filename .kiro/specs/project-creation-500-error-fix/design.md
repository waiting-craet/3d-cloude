# Project Creation 500 Error Fix - Bugfix Design

## Overview

This bugfix addresses the 500 Internal Server Error that occurs when users attempt to create projects from the AI creation page. The bug is caused by database connection failures (Neon database paused/unreachable) and inadequate error handling in the POST /api/projects endpoint. The fix implements connection retry logic with exponential backoff, explicit database connection management, and comprehensive error handling to ensure reliable project creation while preserving all existing functionality.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user attempts to create a project from the AI creation page with a valid name, but the database connection fails or the Prisma client encounters initialization issues
- **Property (P)**: The desired behavior when the bug condition occurs - the system should handle database connection failures gracefully, retry with exponential backoff, and either succeed in creating the project or return a descriptive error message
- **Preservation**: All existing project creation functionality from other pages (import page, TopNavbar), validation logic, optional graph creation, and error responses must remain unchanged
- **createProject**: The POST handler in `/app/api/projects/route.ts` that creates new projects
- **prisma**: The Prisma client instance from `/lib/prisma.ts` that manages database connections
- **retryOperation**: The existing retry utility in `/lib/db-helpers.ts` that implements exponential backoff for database operations
- **Neon Database**: The PostgreSQL database provider that may pause connections after inactivity, requiring reconnection

## Bug Details

### Fault Condition

The bug manifests when a user clicks the "创建" button on the AI creation page (text-page) with a valid project name, but the database connection is unavailable. The Neon database may be paused after inactivity, or the Prisma client may fail to establish a connection. The current implementation does not handle these connection failures gracefully, resulting in a 500 error with a generic error message.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ProjectCreationRequest
  OUTPUT: boolean
  
  RETURN (input.source = "text-page" OR input.source = "ai-creation-page")
         AND input.name IS NOT NULL
         AND input.name.trim() != ""
         AND (databaseConnectionFailed(input) OR prismaClientError(input))
         AND NOT connectionRetryAttempted(input)
END FUNCTION
```

### Examples

- **Example 1**: User enters "我的知识图谱" on text-page and clicks "创建" → Database is paused → Returns 500 error with "创建项目失败" instead of retrying connection
- **Example 2**: User enters "Test Project" on text-page → Prisma client fails to connect → Returns 500 error without diagnostic information
- **Example 3**: User enters "新项目" on text-page → Database connection times out → Returns generic error instead of specific "database connection timeout" message
- **Edge Case**: User enters "Project" on text-page with graphName "Graph" → Database fails during transaction → Both project and graph fail to create, but error doesn't indicate which operation failed

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Project creation from import page and TopNavbar must continue to work exactly as before
- Validation logic for empty/whitespace project names must return 400 Bad Request with "项目名称不能为空"
- Optional graph creation (when graphName is provided) must continue to work in a transaction
- Project-only creation (when graphName is not provided) must continue to work
- GET /api/projects endpoint must continue to return all projects ordered by updatedAt descending
- Response format with success, project, graphCreated, graph, and warnings fields must remain unchanged

**Scope:**
All inputs that do NOT involve database connection failures should be completely unaffected by this fix. This includes:
- Valid project creation requests when database is available
- Invalid requests (empty names, whitespace-only names)
- Requests from other pages (import, TopNavbar)
- GET requests to list projects

## Hypothesized Root Cause

Based on the bug description and codebase analysis, the most likely issues are:

1. **No Connection Retry Logic**: The current implementation does not retry database operations when connections fail. Neon databases pause after inactivity and require a reconnection attempt, but the code fails immediately on the first connection error.

2. **Missing Explicit Connection Management**: The Prisma client is initialized once at module load time, but there's no explicit `$connect()` call before database operations. This means connection failures aren't detected until the actual query executes.

3. **Generic Error Handling**: The catch block logs the error but returns a generic "创建项目失败" message without exposing diagnostic information. This makes it impossible to distinguish between connection errors, validation errors, and other database issues.

4. **No Connection State Validation**: The code doesn't check if the database connection is healthy before attempting operations, leading to unnecessary failures that could be prevented with a connection health check.

5. **Transaction Timeout Issues**: The transaction for creating project + graph may timeout if the database is slow to respond, but there's no retry logic for transaction-specific errors.

## Correctness Properties

Property 1: Fault Condition - Successful Project Creation with Retry

_For any_ project creation request from the AI creation page where the database connection initially fails but can be recovered through retry, the fixed createProject function SHALL retry the connection with exponential backoff (up to 3 attempts), successfully establish the connection, create the project, and return a 200 response with the project data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Connection-Failure Behavior

_For any_ project creation request where the database connection does NOT fail (successful connections, validation errors, requests from other pages), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing validation logic, response formats, optional graph creation, and error messages.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/api/projects/route.ts`

**Function**: `POST` handler

**Specific Changes**:

1. **Add Connection Health Check**: Before attempting database operations, explicitly call `prisma.$connect()` to ensure the connection is established and wake up paused Neon databases.

2. **Wrap Operations in Retry Logic**: Use the existing `retryOperation` utility from `lib/db-helpers.ts` to wrap the entire project creation logic with exponential backoff (3 retries, starting with 1000ms delay).

3. **Improve Error Logging**: Log detailed error information including error type, message, and stack trace to help diagnose connection issues. Use the existing `getDescriptiveErrorMessage` utility for user-facing error messages.

4. **Add Connection-Specific Error Handling**: Detect connection errors specifically (using error message patterns like "connection", "connect", "ECONNREFUSED") and return a descriptive error message indicating database connectivity issues.

5. **Preserve Transaction Logic**: Keep the existing transaction logic for creating project + optional graph, but wrap it in the retry mechanism to handle transient connection failures.

6. **Add Diagnostic Metadata**: Include additional metadata in error responses (when in development mode) to help diagnose issues, such as retry attempts, error type, and connection state.

**File**: `lib/prisma.ts`

**Changes**:

7. **Add Connection Logging**: Add logging when Prisma client is initialized to track connection lifecycle.

8. **Add Connection Timeout Configuration**: Configure Prisma client with appropriate connection timeout and pool settings for Neon databases.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code by simulating database connection failures, then verify the fix works correctly with retry logic and preserves existing behavior for all non-connection-failure scenarios.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis by simulating database connection failures. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate database connection failures (paused Neon database, connection timeout, Prisma client errors) and verify that the UNFIXED code returns 500 errors without retry attempts. Use mocking to simulate connection failures.

**Test Cases**:
1. **Paused Database Test**: Mock Prisma client to throw "connection refused" error on first attempt (will fail on unfixed code - returns 500 immediately)
2. **Connection Timeout Test**: Mock Prisma client to throw timeout error (will fail on unfixed code - no retry logic)
3. **Prisma Client Initialization Error**: Mock Prisma client to fail during $connect() (will fail on unfixed code - not caught)
4. **Transaction Timeout Test**: Mock transaction to timeout during project+graph creation (may fail on unfixed code - no transaction retry)

**Expected Counterexamples**:
- POST /api/projects returns 500 error immediately without retry attempts
- Error message is generic "创建项目失败" without diagnostic information
- Possible causes: no retry logic, no explicit connection management, inadequate error handling

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (database connection failures), the fixed function successfully retries and either creates the project or returns a descriptive error message.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := createProject_fixed(input)
  ASSERT (result.status = 200 AND result.project IS NOT NULL)
         OR (result.status = 500 AND result.error CONTAINS "database connection")
  ASSERT retryAttemptsMade(result) >= 1
  ASSERT errorMessageIsDescriptive(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (successful connections, validation errors, other pages), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT createProject_original(input) = createProject_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (valid names, empty names, with/without graphName)
- It catches edge cases that manual unit tests might miss (special characters, very long names, Unicode)
- It provides strong guarantees that behavior is unchanged for all non-connection-failure inputs

**Test Plan**: Observe behavior on UNFIXED code first for successful project creation, validation errors, and optional graph creation, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Successful Creation Preservation**: Observe that valid project creation works on unfixed code when database is available, then verify this continues after fix with same response format
2. **Validation Error Preservation**: Observe that empty/whitespace names return 400 error on unfixed code, then verify this continues after fix
3. **Optional Graph Creation Preservation**: Observe that project+graph creation works in transaction on unfixed code, then verify this continues after fix
4. **GET Endpoint Preservation**: Observe that GET /api/projects returns projects list on unfixed code, then verify this continues after fix

### Unit Tests

- Test connection retry logic with mocked Prisma client that fails N times then succeeds
- Test that explicit $connect() is called before database operations
- Test error message formatting for different error types (connection, timeout, validation)
- Test that validation errors (empty name) still return 400 without retry attempts
- Test that successful creation (no connection issues) doesn't trigger unnecessary retries

### Property-Based Tests

- Generate random valid project names and verify creation succeeds when database is available
- Generate random invalid inputs (empty, whitespace, null) and verify validation errors are preserved
- Generate random project+graph combinations and verify transaction behavior is preserved
- Test across many scenarios that non-connection-failure cases produce identical results before and after fix

### Integration Tests

- Test full project creation flow from text-page with simulated database pause/resume
- Test that retry logic successfully recovers from transient connection failures
- Test that permanent connection failures (database unreachable) eventually return descriptive error after max retries
- Test that connection health check wakes up paused Neon database before operations
