# Implementation Plan: Homepage Redesign with Ink-Wash Aesthetic

## Overview

This implementation plan transforms the current colorful gradient-based homepage into a minimalist, elegant interface inspired by traditional Chinese ink-wash painting (水墨风格). The redesign uses a light color palette with soft, muted tones while preserving all existing functionality including authentication, project creation, search, and navigation.

The implementation follows a modular component architecture with a centralized design system, ensuring consistency and maintainability.

## Tasks

- [x] 1. Set up design system foundation
  - Create design tokens file with ink-wash color palette, typography scale, spacing system, and animation timings
  - Add CSS custom properties to globals.css for theme variables
  - Create number formatting utility function for statistics display
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 4.4_

- [x] 2. Implement InkWashNavbar component
  - [x] 2.1 Create InkWashNavbar component with fixed positioning and backdrop blur
    - Implement component with props for authentication state and action handlers
    - Add logo/brand display with ink-wash accent color
    - Include Start Creating and Login/Logout buttons with proper state handling
    - _Requirements: 2.1, 2.3, 2.4, 9.1_
  
  - [x] 2.2 Create InkWashNavbar styles with CSS modules
    - Implement fixed positioning with semi-transparent background
    - Add subtle border and backdrop blur effect
    - Style buttons with outlined design and hover effects
    - Ensure responsive layout for mobile viewports
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_
  
  - [ ]* 2.3 Write unit tests for InkWashNavbar
    - Test button rendering for logged in and logged out states
    - Test click handlers for Start Creating and Login/Logout buttons
    - Test responsive behavior at different viewport widths
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 3. Implement HeroSection component
  - [x] 3.1 Create HeroSection component with title, subtitle, and search input
    - Implement component with props for title, subtitle, and search handler
    - Add search input with icon
    - Use semantic HTML structure with proper heading hierarchy
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 3.2 Create HeroSection styles with subtle gradient background
    - Implement gradient background from light gray to white
    - Style title with larger font size than subtitle
    - Add search input styling with rounded corners and subtle shadow
    - Ensure generous vertical padding and centered layout
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.5_
  
  - [ ]* 3.3 Write unit tests for HeroSection
    - Test title and subtitle rendering
    - Test search input functionality
    - Test visual hierarchy (title larger than subtitle)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 4. Implement StatisticsDisplay component
  - [x] 4.1 Create StatisticsDisplay component with metrics display
    - Implement component with props for projects count, knowledge graphs count, and total graphs count
    - Use formatNumber utility for number formatting
    - Display metrics in horizontal flex layout with consistent spacing
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.2 Create StatisticsDisplay styles with clean layout
    - Style numbers with large font size and ink-wash accent color
    - Style labels with smaller font size and medium gray color
    - Add subtle dividers between metrics
    - Ensure responsive layout for mobile viewports
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.5_
  
  - [ ]* 4.3 Write property test for number formatting
    - **Property 12: Number formatting follows readable format**
    - **Validates: Requirements 4.4**
  
  - [ ]* 4.4 Write unit tests for StatisticsDisplay
    - Test metrics rendering with various values
    - Test number formatting for values >= 10,000
    - Test responsive layout behavior
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Implement InkWashWorkCard component
  - [x] 5.1 Create InkWashWorkCard component with project preview
    - Implement component with props for project data and click handler
    - Display project preview/thumbnail with fallback
    - Display project title and metadata
    - Add click handler for navigation to project
    - _Requirements: 6.1, 6.2, 6.5, 9.1_
  
  - [x] 5.2 Create InkWashWorkCard styles with hover effects
    - Style card with white background, subtle border, and rounded corners
    - Implement hover effects: elevation, scale transform, border color shift
    - Add smooth transitions for all hover effects
    - Style image with rounded corners and aspect ratio maintenance
    - _Requirements: 1.1, 1.2, 1.3, 6.3, 6.4, 10.3_
  
  - [ ]* 5.3 Write unit tests for InkWashWorkCard
    - Test card rendering with project data
    - Test click handler navigation
    - Test hover effects application
    - Test image fallback behavior
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 6. Implement WorkCardGrid component
  - [x] 6.1 Create WorkCardGrid component with responsive grid layout
    - Implement component with props for columns, gap, and children
    - Use CSS Grid for layout
    - Support responsive column counts (6 desktop, 4 tablet, 2 mobile)
    - _Requirements: 5.2, 5.3, 8.5_
  
  - [x] 6.2 Create WorkCardGrid styles with responsive breakpoints
    - Implement CSS Grid with responsive columns
    - Add media queries for tablet (768-1199px) and mobile (<768px)
    - Set consistent gap spacing
    - _Requirements: 5.2, 5.3, 8.1, 8.5_
  
  - [ ]* 6.3 Write property test for responsive grid behavior
    - **Property 15: Gallery columns adjust to viewport width**
    - **Validates: Requirements 5.3**
  
  - [ ]* 6.4 Write unit tests for WorkCardGrid
    - Test grid rendering with various numbers of children
    - Test responsive column counts at different viewport widths
    - Test gap spacing
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 7. Implement GallerySection component
  - [x] 7.1 Create GallerySection component as container for work cards
    - Implement component with props for heading and children
    - Display section heading with proper typography
    - Wrap children in container with max-width constraint
    - _Requirements: 5.1, 8.2, 8.3_
  
  - [x] 7.2 Create GallerySection styles with consistent spacing
    - Style heading with appropriate font size and weight
    - Add consistent padding and margin
    - Ensure full-width container with max-width constraint
    - _Requirements: 1.3, 1.5, 8.1, 8.2_
  
  - [ ]* 7.3 Write unit tests for GallerySection
    - Test heading rendering
    - Test children rendering
    - Test layout and spacing
    - _Requirements: 5.1, 8.1, 8.2_

- [x] 8. Checkpoint - Ensure all components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integrate components into homepage
  - [x] 9.1 Update app/page.tsx to use new components
    - Replace inline navigation with InkWashNavbar component
    - Replace title area with HeroSection component
    - Add StatisticsDisplay component with calculated metrics
    - Wrap ProjectList with GallerySection and WorkCardGrid components
    - Preserve all existing state management and event handlers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 9.2 Calculate and pass statistics data to StatisticsDisplay
    - Fetch projects data from existing ProjectList logic
    - Calculate total projects count
    - Calculate total knowledge graphs count
    - Calculate total graphs count
    - _Requirements: 4.1, 4.2, 4.3, 9.2_
  
  - [x] 9.3 Preserve existing authentication and navigation functionality
    - Maintain useUserStore integration
    - Preserve login modal state management
    - Preserve project creation flow
    - Preserve routing and navigation logic
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 9.4 Write integration tests for homepage
    - Test full homepage rendering with mock data
    - Test authentication flow (login/logout)
    - Test project creation flow
    - Test navigation between pages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Implement scrolling and layout behavior
  - [x] 10.1 Add smooth scrolling and fixed navigation behavior
    - Ensure navigation bar remains fixed while scrolling
    - Add smooth scroll-behavior CSS property
    - Test scrolling with content exceeding viewport height
    - _Requirements: 2.2, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 10.2 Ensure consistent spacing and alignment
    - Verify consistent spacing between sections
    - Ensure elements align to visual grid
    - Add appropriate margins and padding throughout
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 10.3 Write property tests for scrolling behavior
    - **Property 3: Navigation bar remains visible while scrolling**
    - **Validates: Requirements 2.2, 7.3**
  
  - [ ]* 10.4 Write property tests for layout consistency
    - **Property 24: Consistent spacing between sections**
    - **Validates: Requirements 8.1**

- [x] 11. Implement accessibility features
  - [x] 11.1 Add semantic HTML and ARIA labels
    - Use semantic HTML elements (nav, section, article)
    - Add ARIA labels for icon-only buttons
    - Add alt text for all images
    - Ensure proper heading hierarchy (h1 → h2 → h3)
    - _Requirements: 8.4_
  
  - [x] 11.2 Ensure keyboard navigation and focus indicators
    - Verify all interactive elements are keyboard accessible
    - Add visible focus indicators to all interactive elements
    - Ensure logical tab order through page sections
    - _Requirements: 8.4_
  
  - [ ]* 11.3 Write property test for color contrast
    - **Property 26: Sufficient color contrast for readability**
    - **Validates: Requirements 8.4**
  
  - [ ]* 11.4 Write accessibility tests with jest-axe
    - Test homepage for WCAG AA compliance
    - Test all components for accessibility violations
    - Test keyboard navigation
    - _Requirements: 8.4_

- [x] 12. Implement atmospheric design elements
  - [x] 12.1 Add subtle animations and transitions
    - Add hover animations to interactive elements
    - Add smooth transitions for state changes
    - Ensure animations use appropriate timing and easing
    - _Requirements: 10.3_
  
  - [x] 12.2 Refine visual design details
    - Add subtle gradient effects consistent with ink-wash style
    - Add soft shadows and depth effects sparingly
    - Ensure visual consistency across all sections
    - Verify no emoji characters in UI elements
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2, 10.4, 10.5_
  
  - [ ]* 12.3 Write property test for no emoji characters
    - **Property 1: No emoji characters in UI**
    - **Validates: Requirements 1.4**

- [x] 13. Checkpoint - Ensure all functionality works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Performance optimization
  - [x] 14.1 Optimize images and assets
    - Use Next.js Image component for automatic optimization
    - Implement lazy loading for images below the fold
    - Provide appropriate image sizes for different viewports
    - _Requirements: 8.5_
  
  - [x] 14.2 Optimize CSS and JavaScript
    - Minimize use of expensive CSS properties (backdrop-filter)
    - Use React.memo for components where appropriate
    - Use useCallback for event handlers
    - Debounce search input if needed
    - _Requirements: 8.5_
  
  - [ ]* 14.3 Write performance tests
    - Test component render times
    - Test page load performance
    - Test responsive layout performance
    - _Requirements: 8.5_

- [x] 15. Cross-browser and responsive testing
  - [x] 15.1 Test across target browsers
    - Test on Chrome/Edge (last 2 versions)
    - Test on Firefox (last 2 versions)
    - Test on Safari (last 2 versions)
    - Test on Mobile Safari (iOS 13+)
    - Test on Chrome Mobile (Android 8+)
    - _Requirements: 8.5_
  
  - [x] 15.2 Test responsive behavior at various viewport sizes
    - Test at 320px (small mobile)
    - Test at 768px (tablet)
    - Test at 1024px (small desktop)
    - Test at 1440px (large desktop)
    - Verify no horizontal scrolling at any viewport size
    - _Requirements: 8.5, 5.3_
  
  - [ ]* 15.3 Write property test for responsive layout
    - **Property 27: Responsive layout adaptation**
    - **Validates: Requirements 8.5**

- [x] 16. Final integration and polish
  - [x] 16.1 Verify all requirements are met
    - Review all acceptance criteria from requirements document
    - Verify all existing functionality is preserved
    - Verify all new components are integrated correctly
    - _Requirements: All_
  
  - [x] 16.2 Final visual review and adjustments
    - Review spacing and typography across all sections
    - Fine-tune animations and transitions
    - Ensure visual consistency with ink-wash aesthetic
    - Verify light color palette throughout
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 10.1, 10.2, 10.4, 10.5_
  
  - [ ]* 16.3 Run full test suite
    - Run all unit tests
    - Run all property tests
    - Run all integration tests
    - Run accessibility tests
    - Verify test coverage meets goals (90%+ for components)
    - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass and requirements are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All existing functionality (authentication, navigation, API calls) must be preserved
- The design uses TypeScript with React and CSS Modules
- Focus on creating a minimalist, elegant aesthetic with soft, muted colors
- Avoid emoji characters throughout the UI
- Ensure responsive behavior across all viewport sizes
