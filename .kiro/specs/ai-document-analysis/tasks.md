# Implementation Plan: AI-Powered Document Analysis

## Overview

This implementation plan breaks down the AI-powered document analysis feature into discrete coding tasks. The approach follows an incremental development strategy: build core services first, then API endpoints, then UI components, and finally integrate everything together. Each task includes property-based tests and unit tests as sub-tasks to ensure correctness at every step.

## Tasks

- [x] 1. Set up AI integration infrastructure
  - Create AI Integration Service module with API client
  - Implement request/response transformation logic
  - Add error handling for API failures
  - Configure API key from environment variables
  - _Requirements: 1.1, 1.5, 1.6_

- [x] 1.1 Write property test for AI API response validation
  - **Property 1: AI API Response Validation**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1.2 Write unit tests for AI Integration Service
  - Test API error handling
  - Test response transformation
  - Test timeout handling
  - _Requirements: 1.5_

- [x] 2. Implement duplicate detection service
  - [x] 2.1 Create Duplicate Detection Service module
    - Implement case-insensitive node name comparison
    - Implement property conflict detection logic
    - Return structured duplicate information
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2_

  - [x] 2.2 Write property test for duplicate node detection
    - **Property 2: Duplicate Node Detection Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 2.3 Write property test for property conflict detection
    - **Property 4: Property Conflict Detection Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 2.4 Implement redundant edge detection
    - Compare source node, target node, and relationship type
    - Return indices of redundant edges
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.5 Write property test for redundant edge detection
    - **Property 3: Redundant Edge Detection Accuracy**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 3. Implement merge resolution service
  - [x] 3.1 Create Merge Resolution Service module
    - Implement node merging logic based on user decisions
    - Implement property resolution (keep-existing, use-new, combine)
    - Generate node ID mapping for edge updates
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.2 Implement edge processing with node ID mapping
    - Filter out redundant edges
    - Update edge node references using ID mapping
    - _Requirements: 8.4, 8.5_

  - [x] 3.3 Write property test for node merge referential integrity
    - **Property 5: Node Merge Referential Integrity**
    - **Validates: Requirements 8.4**

  - [x] 3.4 Write unit tests for merge resolution
    - Test property resolution strategies
    - Test edge reference updates
    - Test node ID mapping
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 4. Create AI analysis API endpoint
  - [x] 4.1 Create `/api/ai/analyze` route handler
    - Parse request body (documentText, projectId, graphId, visualizationType)
    - Call AI Integration Service
    - Fetch existing graph data if graphId provided
    - Call Duplicate Detection Service
    - Return structured response with nodes, edges, and conflict info
    - _Requirements: 1.1, 1.2, 1.3, 5.5, 6.4_

  - [x] 4.2 Add comprehensive error handling
    - Catch AI API errors
    - Catch database errors
    - Return user-friendly error messages
    - Log errors server-side without exposing sensitive data
    - _Requirements: 1.5, 12.1, 12.2, 12.6_

  - [x] 4.3 Write integration tests for AI analysis endpoint
    - Test successful analysis flow
    - Test with existing graph (duplicate detection)
    - Test error scenarios
    - _Requirements: 1.1, 5.1, 6.1_

- [x] 5. Checkpoint - Ensure all service and API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Create preview modal component
  - [x] 6.1 Create AIPreviewModal component structure
    - Set up modal layout with sections (stats, conflicts, visualization, editing)
    - Implement state management for edited nodes and edges
    - Add loading state for save operation
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Implement stats summary section
    - Display total nodes, edges, duplicates, redundant edges, conflicts
    - Use visual indicators (badges, colors)
    - _Requirements: 4.7_

  - [ ] 6.3 Implement conflict resolution panel
    - Display list of duplicate nodes with conflicts
    - Show existing vs new property values side-by-side
    - Add radio buttons for merge decisions (merge, keep-both, skip)
    - Add dropdowns for property resolution (keep-existing, use-new, combine)
    - Highlight unresolved conflicts
    - _Requirements: 7.3, 7.4, 8.2_

  - [ ] 6.4 Implement graph visualization preview
    - Integrate with existing 2D/3D visualization components
    - Display nodes and edges from preview data
    - Highlight duplicate nodes and redundant edges visually
    - _Requirements: 4.2, 2.2, 2.3_

  - [ ] 6.5 Implement node and edge editing
    - Add click handlers for nodes and edges
    - Show editing panel when node/edge selected
    - Allow editing of labels, properties, relationship types
    - Update preview data on edit
    - _Requirements: 4.3, 4.4_

  - [x] 6.6 Implement save and cancel actions
    - Validate all conflicts are resolved before save
    - Call save handler with edited data and merge decisions
    - Show loading state during save
    - Close modal on cancel without saving
    - _Requirements: 4.5, 4.6_

  - [ ] 6.7 Write unit tests for preview modal
    - Test conflict display
    - Test editing functionality
    - Test save validation
    - Test cancel behavior
    - _Requirements: 4.3, 4.4, 4.6_

  - [ ] 6.8 Write property test for preview modal data immutability
    - **Property 8: Preview Modal Data Immutability**
    - **Validates: Requirements 4.6**

- [ ] 7. Create graph save API endpoint
  - [x] 7.1 Create `/api/ai/save-graph` route handler
    - Parse request body (nodes, edges, mergeDecisions, projectId, graphId)
    - Call Merge Resolution Service
    - Use Prisma transaction for atomicity
    - Create or update graph record
    - Create nodes with proper associations
    - Create edges with proper associations
    - Update graph statistics (nodeCount, edgeCount)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 7.2 Implement transaction rollback on error
    - Wrap all database operations in Prisma transaction
    - Rollback on any error
    - Return error message to client
    - _Requirements: 9.7_

  - [ ] 7.3 Write property test for data persistence atomicity
    - **Property 6: Data Persistence Atomicity**
    - **Validates: Requirements 9.7**

  - [ ] 7.4 Write property test for project-graph association consistency
    - **Property 7: Project-Graph Association Consistency**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ] 7.5 Write integration tests for save endpoint
    - Test new graph creation
    - Test adding to existing graph
    - Test merge operations
    - Test transaction rollback
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7_

- [ ] 8. Checkpoint - Ensure all API and component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Integrate AI analysis into text page
  - [x] 9.1 Update text page to fetch projects and graphs from database
    - Replace mock data with API calls to `/api/projects` and `/api/graphs`
    - Add loading states for data fetching
    - Handle empty states (no projects, no graphs)
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 9.2 Add "Analyze with AI" button to text page
    - Place button next to existing "Generate Knowledge Graph" button
    - Add icon and styling consistent with existing design
    - Disable when no text/file or no project selected
    - _Requirements: 10.2_

  - [x] 9.3 Implement AI analysis handler
    - Validate project selection before analysis
    - Show loading state during AI processing
    - Call `/api/ai/analyze` endpoint
    - Handle success and error responses
    - Open preview modal on success
    - _Requirements: 10.3, 10.4, 12.3, 12.4_

  - [x] 9.4 Integrate AIPreviewModal component
    - Import and render AIPreviewModal
    - Pass AI-generated data to modal
    - Implement save handler that calls `/api/ai/save-graph`
    - Show success message after save
    - Refresh graph list after save
    - _Requirements: 10.5_

  - [x] 9.5 Add retry functionality for network errors
    - Catch network errors separately from API errors
    - Display retry button on network failure
    - Preserve user input during retry
    - _Requirements: 12.5_

  - [ ] 9.6 Write property test for loading state consistency
    - **Property 9: Loading State Consistency**
    - **Validates: Requirements 1.4, 10.4**

  - [ ] 9.7 Write integration tests for text page AI flow
    - Test full flow from button click to save
    - Test validation errors
    - Test network error handling
    - _Requirements: 10.2, 10.3, 12.3, 12.4, 12.5_

- [ ] 10. Add error handling and user feedback
  - [ ] 10.1 Implement error message display component
    - Create reusable error banner component
    - Support different error types (API, network, validation)
    - Add dismiss functionality
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 10.2 Add validation for required fields
    - Validate project selection before analysis
    - Validate graph selection or "create new" before save
    - Display inline validation messages
    - Disable buttons until validation passes
    - _Requirements: 12.3, 12.4_

  - [ ] 10.3 Write property test for error message clarity
    - **Property 10: Error Message Clarity**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.6**

  - [ ] 10.4 Write unit tests for error handling
    - Test error message display
    - Test validation logic
    - Test sensitive data filtering
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

- [ ] 11. Final integration and testing
  - [ ] 11.1 Test end-to-end flow
    - Test with various document types (text, JSON, CSV)
    - Test creating new graph
    - Test adding to existing graph
    - Test duplicate detection and conflict resolution
    - Test error scenarios
    - _Requirements: All_

  - [ ] 11.2 Add environment variable configuration
    - Document required environment variables (AI_API_KEY, DATABASE_URL)
    - Add validation for missing environment variables
    - Add helpful error messages for configuration issues
    - _Requirements: 1.6, 9.5_

  - [ ] 11.3 Update documentation
    - Add API endpoint documentation
    - Add component usage examples
    - Document AI API integration requirements
    - _Requirements: All_

- [ ] 12. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The AI API endpoint URL and request/response format will need to be determined based on the actual AI service documentation
- Environment variables should be added to `.env.local` for local development
