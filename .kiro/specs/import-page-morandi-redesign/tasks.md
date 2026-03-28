# Implementation Plan: Import Page Morandi Green Redesign

## Overview

This implementation plan transforms the import data page (`/app/import/page.tsx`) from a teal-colored Material Design interface to an elegant Morandi green aesthetic with ink wash styling (水墨风格). The redesign is purely visual - all existing functionality including project/graph management, file upload, template downloads, and import workflows remains completely unchanged.

The implementation modifies only inline styles and integrates custom icons. No component structure, state management, or API logic changes are required.

## Tasks

- [x] 1. Set up color palette and visual effects constants
  - Define Morandi color palette constants at top of component
  - Define ink wash effect constants (gradients, shadows, border radius)
  - Define icon path constants
  - Create helper functions for color mapping if needed
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.4_

- [x] 2. Redesign navigation bar
  - [x] 2.1 Update navigation bar background with Morandi gradient
    - Replace teal background with Morandi green gradient
    - Apply soft shadow effect
    - Maintain layout and positioning
    - _Requirements: 4.1, 4.3_
  
  - [x] 2.2 Update logo/brand element colors
    - Replace teal colors with Morandi green tones
    - Ensure visual consistency with new palette
    - _Requirements: 4.2_
  
  - [ ]* 2.3 Write unit tests for navigation bar styling
    - Test gradient background application
    - Test shadow effects
    - Test color values
    - _Requirements: 4.1, 4.3_

- [x] 3. Redesign project and graph selection controls
  - [x] 3.1 Update dropdown selectors styling
    - Update border colors to Morandi green palette
    - Update background colors with subtle gradients
    - Apply soft shadows and rounded corners
    - Add hover effects with Morandi colors
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [x] 3.2 Update "新建" (New) buttons styling
    - Replace teal colors with Morandi green tones
    - Add hover effects with lighter Morandi green
    - Apply soft shadows and rounded corners
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 3.3 Write unit tests for selection controls
    - Test dropdown styling and hover states
    - Test button styling and hover states
    - Verify selection functionality preserved
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 4. Integrate custom file type icons
  - [x] 4.1 Add icon files to project
    - Create `/public/icons/` directory if not exists
    - Add Excel, CSV, JSON, and download icon files
    - Verify icon file formats (SVG preferred)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.2 Create icon component wrapper
    - Implement FileTypeIcon component with Image or SVG
    - Set consistent sizing (48x48px for file types)
    - Apply opacity filters for ink wash effect
    - Add smooth transitions for hover states
    - _Requirements: 3.5, 3.6_
  
  - [ ]* 4.3 Write unit tests for icon integration
    - Test icon presence in file type cards
    - Test icon src paths
    - Test icon sizing and alignment
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Redesign file upload area
  - [x] 5.1 Update file type cards styling
    - Update card borders with Morandi green palette
    - Update card backgrounds with subtle gradients
    - Apply soft shadows and rounded corners
    - Update selection highlight color to Morandi green
    - Add hover effects with Morandi colors
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  
  - [x] 5.2 Integrate file type icons into cards
    - Add FileTypeIcon components to Excel, CSV, JSON cards
    - Ensure proper positioning and alignment
    - Apply color filters if needed
    - _Requirements: 6.3_
  
  - [ ]* 5.3 Write property test for file upload area
    - **Property 7: File Type Icon Integration**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [ ]* 5.4 Write unit tests for file upload area
    - Test card styling and hover states
    - Test icon display and positioning
    - Verify file selection functionality preserved
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 6. Redesign template download section
  - [x] 6.1 Update download buttons styling
    - Update button colors with Morandi green palette
    - Apply soft shadows and rounded corners
    - Add hover effects with lighter Morandi green
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [x] 6.2 Integrate download icons
    - Add download icon to each template button
    - Set consistent sizing (20x20px)
    - Ensure proper alignment with button text
    - _Requirements: 7.2_
  
  - [ ]* 6.3 Write unit tests for template download section
    - Test button styling and hover states
    - Test download icon presence and sizing
    - Verify download functionality preserved
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Redesign generate button
  - [x] 7.1 Update generate button styling
    - Update enabled state with prominent Morandi green
    - Update disabled state with muted gray
    - Add hover effect with lighter/darker Morandi green
    - Apply soft shadow and rounded corners
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 7.2 Write unit tests for generate button
    - Test enabled state styling
    - Test disabled state styling
    - Test hover state
    - Verify button functionality preserved
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Checkpoint - Verify core UI elements
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Redesign modal dialogs
  - [x] 9.1 Update modal backdrop styling
    - Update backdrop color with dark green transparency
    - Apply backdrop blur effect
    - _Requirements: 9.1, 9.2_
  
  - [x] 9.2 Update modal container styling
    - Update modal background with Morandi gradient
    - Apply soft shadows for depth
    - Update border radius for rounded corners
    - _Requirements: 9.1, 9.2_
  
  - [x] 9.3 Update modal button styling
    - Update primary action buttons with Morandi green
    - Update secondary/cancel buttons with neutral tones
    - Add hover effects
    - _Requirements: 9.3_
  
  - [x] 9.4 Update modal input fields styling
    - Update input borders with Morandi green palette
    - Update focus states with Morandi colors
    - Apply rounded corners
    - _Requirements: 9.4_
  
  - [x] 9.5 Update loading modal styling
    - Update loading spinner color to Morandi green
    - Update progress text colors
    - Maintain loading overlay transparency
    - _Requirements: 9.5_
  
  - [ ]* 9.6 Write property test for modal styling
    - **Property 4: Gradient Background Application**
    - **Validates: Requirements 2.1, 4.3, 9.2**
  
  - [ ]* 9.7 Write unit tests for modal dialogs
    - Test all four modal types (new project, new graph, confirm, loading)
    - Test backdrop and container styling
    - Test button and input styling
    - Verify modal functionality preserved
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 10. Redesign import statistics display
  - [x] 10.1 Update statistics cards styling
    - Update card backgrounds with Morandi palette
    - Update card borders with Morandi green
    - Apply soft shadows and subtle gradients
    - Apply rounded corners
    - _Requirements: 10.1, 10.4_
  
  - [x] 10.2 Update statistics indicator colors
    - Update success indicators with muted Morandi green
    - Update warning indicators with muted amber
    - Ensure colors complement the palette
    - _Requirements: 10.2, 10.3_
  
  - [ ]* 10.3 Write property test for statistics display
    - **Property 16: Statistics Display Styling**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**
  
  - [ ]* 10.4 Write unit tests for statistics display
    - Test card styling
    - Test indicator colors
    - Verify data formatting preserved
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Redesign status messages
  - [x] 11.1 Update status message styling
    - Update success messages with muted Morandi green
    - Update error messages with muted rose
    - Update warning messages with muted amber
    - Apply soft shadows and rounded corners
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 11.2 Write unit tests for status messages
    - Test success message styling
    - Test error message styling
    - Test warning message styling
    - Verify message display functionality preserved
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Checkpoint - Verify all visual elements
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement comprehensive property-based tests
  - [ ]* 13.1 Write property test for color palette compliance
    - **Property 1: Morandi Color Palette Application**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**
  
  - [ ]* 13.2 Write property test for hover states
    - **Property 2: Hover State Color Consistency**
    - **Validates: Requirements 1.5, 5.3, 6.5, 7.3**
  
  - [ ]* 13.3 Write property test for shadow effects
    - **Property 3: Ink Wash Shadow Effects**
    - **Validates: Requirements 2.2, 2.4, 5.4, 6.4, 7.4, 8.4, 9.2, 10.4, 11.4**
  
  - [ ]* 13.4 Write property test for transparency and layering
    - **Property 5: Transparency and Layering**
    - **Validates: Requirements 2.3**
  
  - [ ]* 13.5 Write property test for rounded corners
    - **Property 6: Rounded Corner Consistency**
    - **Validates: Requirements 2.4, 5.4, 6.4, 8.4, 11.4**
  
  - [ ]* 13.6 Write property test for icon sizing
    - **Property 8: Icon Sizing and Alignment**
    - **Validates: Requirements 3.5**
  
  - [ ]* 13.7 Write property test for icon color styling
    - **Property 9: Icon Color Styling**
    - **Validates: Requirements 3.6**

- [ ] 14. Implement functional preservation property tests
  - [ ]* 14.1 Write property test for API call preservation
    - **Property 10: API Call Preservation**
    - **Validates: Requirements 12.1**
  
  - [ ]* 14.2 Write property test for state management preservation
    - **Property 11: State Management Preservation**
    - **Validates: Requirements 12.2**
  
  - [ ]* 14.3 Write property test for interactive behavior preservation
    - **Property 12: Interactive Behavior Preservation**
    - **Validates: Requirements 12.3, 4.5, 5.5, 6.6, 7.5, 8.5, 9.6, 11.5**
  
  - [ ]* 14.4 Write property test for navigation preservation
    - **Property 13: Navigation Preservation**
    - **Validates: Requirements 12.4**
  
  - [ ]* 14.5 Write property test for validation logic preservation
    - **Property 14: Validation Logic Preservation**
    - **Validates: Requirements 12.5**
  
  - [ ]* 14.6 Write property test for error handling preservation
    - **Property 15: Error Handling Preservation**
    - **Validates: Requirements 12.6**
  
  - [ ]* 14.7 Write property test for component structure preservation
    - **Property 17: Component Structure Preservation**
    - **Validates: Requirements 12.8**

- [x] 15. Run comprehensive validation
  - [x] 15.1 Run all existing unit tests
    - Execute existing test suite
    - Verify 100% pass rate
    - Document any failures
    - _Requirements: 12.7_
  
  - [x] 15.2 Run all new property-based tests
    - Execute all 17 property tests
    - Verify all properties hold
    - Document any failures
    - _Requirements: All requirements_
  
  - [x] 15.3 Perform manual visual review
    - Compare before/after screenshots
    - Verify color palette consistency
    - Verify ink wash aesthetic quality
    - Verify icon integration and alignment
    - Test responsive behavior at different screen sizes
    - Test all hover and interaction states
    - _Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.6_
  
  - [x] 15.4 Verify accessibility compliance
    - Check color contrast ratios (WCAG AA)
    - Verify keyboard navigation
    - Verify focus states visible
    - Verify alt text for icons
    - _Requirements: All requirements_

- [x] 16. Final checkpoint - Complete validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all elements
- Unit tests validate specific examples and edge cases
- The redesign is purely visual - no functional changes required
- All existing functionality must be preserved and verified through testing
- Icon files must be provided by the user before task 4.1 can be completed
- Manual visual review is critical to ensure aesthetic quality
