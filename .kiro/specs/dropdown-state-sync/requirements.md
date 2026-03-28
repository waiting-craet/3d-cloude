# Requirements Document

## Introduction

This specification addresses two critical issues with the project/graph dropdown state synchronization:
1. After saving and converting 2D workflow to 3D, the newly created/edited project and graph disappear from the dropdown
2. After deleting a project or graph, the deleted items still appear in the dropdown and cause 404 errors when attempting to delete again

## Glossary

- **Dropdown**: The "现有图谱" (Existing Graphs) dropdown menu in the top navigation bar
- **2D_Workflow_Canvas**: The workflow editing interface where users create nodes and connections
- **3D_View**: The main knowledge graph visualization page
- **Sync_API**: The `/api/graphs/[id]/sync` endpoint that saves 2D workflow data to the database
- **Delete_API**: The `/api/projects/[id]` and `/api/graphs/[id]` endpoints for deletion
- **GraphStore**: The Zustand store managing application state
- **TopNavbar**: The navigation component containing the dropdown

## Requirements

### Requirement 1: Dropdown Refresh After Save and Convert

**User Story:** As a user, I want to see my newly created or edited project and graph in the dropdown immediately after saving and converting from 2D to 3D, so that I can verify my changes were saved and access the graph.

#### Acceptance Criteria

1. WHEN a user clicks "保存并转换为3D" (Save and Convert to 3D) in the 2D workflow canvas, THEN the System SHALL save the data to the database via the Sync API
2. WHEN the Sync API successfully saves the data, THEN the System SHALL refresh the project list in GraphStore
3. WHEN the project list is refreshed, THEN the System SHALL redirect to the 3D view with the current project and graph selected
4. WHEN the 3D view loads, THEN the System SHALL display the updated project and graph in the dropdown menu
5. WHEN the dropdown is opened, THEN the System SHALL show the correct node count and edge count for the graph

### Requirement 2: Dropdown State After Deletion

**User Story:** As an administrator, I want deleted projects and graphs to immediately disappear from the dropdown, so that I don't see stale data or encounter errors when trying to interact with deleted items.

#### Acceptance Criteria

1. WHEN an administrator deletes a project, THEN the System SHALL remove the project from the database
2. WHEN the project is successfully deleted, THEN the System SHALL refresh the project list in GraphStore
3. WHEN the project list is refreshed, THEN the System SHALL remove the deleted project from the dropdown immediately
4. WHEN an administrator deletes a graph, THEN the System SHALL remove the graph from the database
5. WHEN the graph is successfully deleted, THEN the System SHALL refresh the project list in GraphStore
6. WHEN the project list is refreshed, THEN the System SHALL remove the deleted graph from the dropdown immediately
7. IF the deleted project or graph was currently selected, THEN the System SHALL clear the selection and reload the page

### Requirement 3: Dropdown Refresh Reliability

**User Story:** As a user, I want the dropdown to always show accurate, up-to-date information, so that I can trust the data I see and avoid confusion.

#### Acceptance Criteria

1. WHEN the System refreshes the project list, THEN it SHALL use cache-busting headers to ensure fresh data
2. WHEN the database write operation completes, THEN the System SHALL wait for database synchronization before fetching updated data
3. IF the first refresh attempt doesn't return updated data, THEN the System SHALL retry up to 3 times with exponential backoff
4. WHEN all retry attempts fail, THEN the System SHALL force a page reload to ensure data consistency
5. WHEN the System fetches project data, THEN it SHALL include all graphs with their current node counts and edge counts

### Requirement 4: Error Handling for Deletion

**User Story:** As an administrator, I want clear error messages when deletion fails, so that I can understand what went wrong and take appropriate action.

#### Acceptance Criteria

1. WHEN a deletion API call returns a 404 error, THEN the System SHALL display an error message "项目不存在" or "图谱不存在"
2. WHEN a deletion API call returns a 500 error, THEN the System SHALL display the error message from the API response
3. WHEN a deletion fails, THEN the System SHALL NOT remove the item from the dropdown
4. WHEN a deletion succeeds but refresh fails, THEN the System SHALL force a page reload to ensure consistency
5. WHEN displaying error messages, THEN the System SHALL automatically dismiss them after 5 seconds
