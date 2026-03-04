# Bugfix Requirements Document

## Introduction

Users cannot create new projects from the AI creation page (localhost:3000/text-page) due to a parameter mismatch between the frontend and backend API. The frontend `handleCreateProject` function only sends the `name` parameter, but the API endpoint `/api/projects/route.ts` requires both `name` and `graphName` parameters. This results in a 400 Bad Request error with the message "创建项目失败: 图谱名称不能为空" (Project creation failed: Graph name cannot be empty), preventing all project creation attempts from the AI page.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user attempts to create a new project from the AI creation page (text-page) THEN the system returns a 400 Bad Request error with message "图谱名称不能为空" (Graph name cannot be empty)

1.2 WHEN the frontend sends a POST request to `/api/projects` with only the `name` parameter THEN the API validation rejects the request due to missing `graphName` parameter

1.3 WHEN the API receives a project creation request without `graphName` THEN the system fails validation at line 36-38 of `/api/projects/route.ts` and returns an error response

### Expected Behavior (Correct)

2.1 WHEN a user attempts to create a new project from the AI creation page THEN the system SHALL successfully create the project with both `name` and `graphName` parameters provided

2.2 WHEN the frontend sends a POST request to `/api/projects` THEN the system SHALL include both `name` and `graphName` parameters in the request body

2.3 WHEN the API receives a project creation request with valid `name` and `graphName` THEN the system SHALL pass validation and create the project successfully

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user creates a project from other pages with both `name` and `graphName` parameters THEN the system SHALL CONTINUE TO create projects successfully

3.2 WHEN the API receives invalid or empty `name` parameter THEN the system SHALL CONTINUE TO return "项目名称不能为空" (Project name cannot be empty) error

3.3 WHEN the API receives invalid or empty `graphName` parameter THEN the system SHALL CONTINUE TO return "图谱名称不能为空" (Graph name cannot be empty) error

3.4 WHEN a project is created successfully THEN the system SHALL CONTINUE TO return the created project data with status 201
