# Bugfix Requirements Document

## Introduction

This document addresses the 500 Internal Server Error that occurs when users attempt to create projects from the AI creation page (text-page). When a user clicks the "创建" button to create a new project, the POST request to `/api/projects` fails with a 500 error, preventing project creation and displaying a generic error message "创建项目失败: 创建项目失败".

The bug prevents users from creating new projects through the AI creation workflow, blocking a critical user flow. The root cause is likely related to database connectivity issues (Neon database paused/unreachable), Prisma client initialization problems, or missing error details in the response.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks "创建" button on the AI creation page with a valid project name THEN the system returns 500 Internal Server Error instead of creating the project

1.2 WHEN the POST /api/projects endpoint encounters a database error THEN the system returns a generic error message "创建项目失败" without exposing the actual error details to help diagnose the issue

1.3 WHEN the Neon database is paused or unreachable THEN the system fails silently with a 500 error instead of providing meaningful feedback about the connection issue

1.4 WHEN the Prisma client fails to initialize or connect THEN the system crashes with a 500 error instead of handling the connection failure gracefully

### Expected Behavior (Correct)

2.1 WHEN a user clicks "创建" button on the AI creation page with a valid project name THEN the system SHALL successfully create the project in the database and return the project data with a 200 status

2.2 WHEN the POST /api/projects endpoint encounters a database error THEN the system SHALL log the detailed error to the console for debugging while returning a user-friendly error message

2.3 WHEN the Neon database is paused or unreachable THEN the system SHALL detect the connection failure, attempt to reconnect or wake the database, and provide clear feedback to the user

2.4 WHEN the Prisma client fails to initialize or connect THEN the system SHALL handle the error gracefully, log diagnostic information, and return a specific error message indicating a database connection issue

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user creates a project from other pages (import page, TopNavbar) with valid input THEN the system SHALL CONTINUE TO create projects successfully as before

3.2 WHEN a user creates a project with an empty or whitespace-only name THEN the system SHALL CONTINUE TO return a 400 Bad Request error with message "项目名称不能为空"

3.3 WHEN a user creates a project with both name and graphName parameters THEN the system SHALL CONTINUE TO create both the project and graph in a transaction as implemented

3.4 WHEN a user creates a project with only a name parameter (no graphName) THEN the system SHALL CONTINUE TO create only the project without a graph as per the optional graph creation feature

3.5 WHEN the project creation succeeds THEN the system SHALL CONTINUE TO return the project data with success status and metadata about graph creation

3.6 WHEN the GET /api/projects endpoint is called THEN the system SHALL CONTINUE TO return the list of all projects ordered by updatedAt descending

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ProjectCreationRequest
  OUTPUT: boolean
  
  // Returns true when the bug condition is met
  // Bug occurs when creating project from text-page with valid name
  // AND database connection fails or Prisma client has issues
  RETURN (X.source = "text-page" OR X.source = "ai-creation-page") 
         AND X.name IS NOT NULL 
         AND X.name.trim() != ""
         AND (database_connection_failed(X) OR prisma_client_error(X))
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Successful Project Creation
FOR ALL X WHERE isBugCondition(X) DO
  result ← createProject'(X)
  ASSERT result.status = 200 
         AND result.project IS NOT NULL
         AND result.project.id IS NOT NULL
         AND result.project.name = X.name.trim()
         AND no_500_error(result)
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking - Existing Functionality Unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT createProject(X) = createProject'(X)
END FOR
```

This ensures that:
- **Fix Checking**: All project creation requests from the AI creation page with valid names succeed without 500 errors
- **Preservation Checking**: All other project creation scenarios (different sources, validation errors, optional graph creation) continue to work exactly as before

## Key Definitions

- **F**: The original (unfixed) POST /api/projects endpoint - returns 500 error for database connection issues
- **F'**: The fixed POST /api/projects endpoint - handles database connection issues gracefully and returns appropriate errors or successfully creates projects
- **Counterexample**: Creating a project from text-page with name "Test Project" returns 500 Internal Server Error instead of creating the project
