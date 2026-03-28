# Implementation Plan: AI Preview Modal Enhancement

## Overview

This implementation plan transforms the existing AIPreviewModal component into a comprehensive conflict detection and editing interface. The approach focuses on extending existing services (duplicate-detection.ts, merge-resolution.ts) while removing visualization capabilities and adding complete CRUD operations for knowledge graph elements.

## Tasks

- [ ] 1. Extend existing conflict detection services
  - [x] 1.1 Enhance duplicate-detection.ts with advanced conflict classification
    - Add ConflictType enum and classification logic
    - Implement confidence scoring algorithms
    - Add orphaned relationship detection
    - Add content conflict detection methods
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 1.2 Write property test for enhanced conflict detection
    - **Property 1: Comprehensive Conflict Analysis**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

  - [x] 1.3 Extend merge-resolution.ts with enhanced resolution strategies
    - Add resolution options for each conflict type
    - Implement batch conflict resolution
    - Add validation for conflict resolution choices
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ]* 1.4 Write unit tests for merge resolution enhancements
    - Test resolution strategies for each conflict type
    - Test batch resolution operations
    - _Requirements: 1.6, 1.7, 1.8_

- [ ] 2. Create new service modules
  - [x] 2.1 Implement node-manager.ts service
    - Create NodeManagerService with CRUD operations
    - Implement node validation logic
    - Add bulk operations support
    - Add search and filtering capabilities
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 2.2 Write property test for node management
    - **Property 3: Node Management Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8**

  - [x] 2.3 Implement relationship-manager.ts service
    - Create RelationshipManagerService with edge CRUD operations
    - Implement relationship validation and duplicate detection
    - Add relationship type management
    - Add bidirectional relationship support
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 2.4 Write property test for relationship management
    - **Property 5: Relationship Management Completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

  - [x] 2.5 Implement image-manager.ts service
    - Create ImageManagerService with upload and processing
    - Implement image validation and compression
    - Add image metadata management
    - Add node-image association logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 2.6 Write property test for image management
    - **Property 6: Image Management Integration**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

- [ ] 3. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Refactor AIPreviewModal component structure
  - [x] 4.1 Remove visualization tab and related components
    - Remove visualization tab from tab navigation
    - Remove all visualization-related imports and dependencies
    - Clean up unused visualization code
    - Update modal layout for remaining tabs
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.2 Enhance Stats tab with conflict statistics
    - Add conflict summary statistics
    - Add validation status indicators
    - Add edit progress tracking
    - Maintain existing stats functionality
    - _Requirements: 2.8, 8.8_

  - [x] 4.3 Create enhanced Conflicts tab component
    - Implement conflict classification display
    - Add side-by-side conflict comparison
    - Add confidence score visualization
    - Add resolution interface for each conflict type
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 4.4 Write property test for conflict display
    - **Property 2: Conflict Display Completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [ ] 5. Implement comprehensive editing interface
  - [x] 5.1 Create NodeEditor component
    - Implement node list view with virtualization
    - Add node detail editor with all fields
    - Add node creation form
    - Integrate with image manager
    - Add search and filtering capabilities
    - _Requirements: 3.1, 3.2, 3.3, 3.8, 9.1, 9.2_

  - [ ] 5.2 Implement undo/redo functionality for nodes
    - Add edit history tracking
    - Implement undo/redo operations
    - Maintain data integrity during state changes
    - _Requirements: 3.7_

  - [ ]* 5.3 Write property test for node edit history
    - **Property 4: Node Edit History Preservation**
    - **Validates: Requirements 3.7**

  - [ ] 5.4 Create RelationshipEditor component
    - Implement edge list view with node information
    - Add edge detail editor with validation
    - Add edge creation form with type selection
    - Add bidirectional relationship controls
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

  - [ ] 5.5 Create ImageManager component
    - Implement image upload interface
    - Add image preview gallery
    - Add image association controls
    - Implement drag-and-drop upload
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6_

- [ ] 6. Implement data validation system
  - [ ] 6.1 Create comprehensive validation service
    - Implement node data validation
    - Implement edge data validation
    - Add referential integrity checks
    - Add image validation
    - Create validation result interfaces
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7_

  - [ ]* 6.2 Write property test for data validation
    - **Property 8: Comprehensive Data Validation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**

  - [ ] 6.3 Implement error handling and user feedback
    - Add validation error display
    - Implement error recovery strategies
    - Add progress indicators for operations
    - Create user-friendly error messages
    - _Requirements: 8.4, 8.8_

- [ ] 7. Implement performance optimizations
  - [ ] 7.1 Add virtualization for large datasets
    - Implement virtual scrolling for node lists
    - Add lazy loading for node content
    - Implement debounced input handling
    - Add data caching mechanisms
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7_

  - [ ]* 7.2 Write property test for performance optimization
    - **Property 9: Performance Optimization**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8**

  - [ ] 7.3 Implement memory management
    - Add cleanup for unused components
    - Implement efficient state management
    - Add memory usage monitoring
    - _Requirements: 9.8_

- [ ] 8. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration and workflow preservation
  - [ ] 9.1 Maintain existing workflow integration
    - Preserve text-page AI generation workflow integration
    - Maintain navigation-service.ts compatibility
    - Ensure existing save functionality works
    - Preserve modal behavior and accessibility
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 9.2 Write property test for workflow integration
    - **Property 7: Workflow Integration Preservation**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

  - [ ] 9.3 Ensure service compatibility
    - Test integration with existing duplicate-detection service
    - Test integration with existing merge-resolution service
    - Verify backward compatibility with AI generation APIs
    - _Requirements: 1.8, 7.6_

  - [ ]* 9.4 Write property test for service integration
    - **Property 10: Service Integration Compatibility**
    - **Validates: Requirements 1.8, 2.8**

- [ ] 10. Final integration and testing
  - [ ] 10.1 Wire all components together
    - Connect enhanced conflict detection to modal
    - Integrate node and relationship editors
    - Connect image manager to node editor
    - Ensure all validation flows work end-to-end
    - _Requirements: All requirements integration_

  - [ ]* 10.2 Write integration tests
    - Test complete editing workflow
    - Test conflict resolution workflow
    - Test image upload and association workflow
    - _Requirements: All requirements integration_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Implementation builds on existing services to maintain compatibility
- Performance optimizations are integrated throughout the implementation
- Comprehensive validation ensures data integrity across all operations