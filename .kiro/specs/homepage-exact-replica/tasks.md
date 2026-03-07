# Implementation Plan: Homepage Exact UI Replica

## Overview

This implementation plan creates an exact replica of the reference UI design with warm paper-white background (#FAFAF8) and sky-blue/jade-green accent (#6b8e85).

## Tasks

- [x] 1. Set up paper design system
  - Create paper-design-tokens.ts with color palette and typography
  - Add CSS custom properties to globals.css
  - Update background color to #FAFAF8
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement PaperNavbar component
  - [x] 2.1 Create PaperNavbar component
    - Fixed positioning with paper-white background
    - Logo "知识图谱" in sky-blue color
    - "登录" button (outlined)
    - "开始创作" button (filled with sky-blue)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.2 Create PaperNavbar styles
    - Semi-transparent background with backdrop blur
    - Warm gray border (#E8E8E6)
    - Button styles with sky-blue accent
    - Responsive layout
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement PaperHeroSection component
  - [x] 3.1 Create PaperHeroSection component
    - Title "构建与发现知识的无尽脉络"
    - Subtitle text
    - Search input with icon
    - Centered layout
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.2 Create PaperHeroSection styles
    - Subtle gradient background (paper-white to white)
    - Typography hierarchy
    - Search input styling
    - Responsive design
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement PaperWorkCard component
  - [x] 4.1 Create PaperWorkCard component
    - Icon placeholder (stacked layers)
    - Project title
    - Metadata (creator + graph count)
    - Click handler
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 4.2 Create PaperWorkCard styles
    - White background with warm gray border
    - Icon placeholder styling
    - Hover effects (elevation + border color)
    - Smooth transitions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Implement PaperWorkGrid component
  - [x] 5.1 Create PaperWorkGrid component
    - Responsive CSS Grid
    - 4 columns (desktop), 3 (tablet), 2 (mobile)
    - 20px gap
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 5.2 Create PaperWorkGrid styles
    - Grid layout with breakpoints
    - Consistent spacing
    - Responsive behavior
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Implement PaperGallerySection component
  - [x] 6.1 Create PaperGallerySection component
    - Heading "推荐广场"
    - "查看全部记录" link
    - Container for grid
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 6.2 Create PaperGallerySection styles
    - Heading and link styling
    - Container layout
    - Spacing and padding
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3_

- [x] 7. Update homepage integration
  - [x] 7.1 Update app/page.tsx
    - Replace components with Paper versions
    - Hide statistics section
    - Update color scheme
    - Preserve all functionality
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 7.2 Update globals.css
    - Change background to #FAFAF8
    - Update CSS custom properties
    - Add paper design tokens
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Test and verify
  - [x] 8.1 Visual verification
    - Compare with reference image
    - Verify colors match exactly
    - Check spacing and layout
    - _Requirements: All_
  
  - [x] 8.2 Functionality testing
    - Test authentication flow
    - Test navigation
    - Test search
    - Test card clicks
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 8.3 Responsive testing
    - Test at 1440px (desktop)
    - Test at 1024px (tablet)
    - Test at 768px (tablet)
    - Test at 375px (mobile)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Final polish
  - [x] 9.1 Fine-tune spacing
    - Adjust padding and margins
    - Verify alignment
    - Check consistency
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 9.2 Verify accessibility
    - Check color contrast
    - Test keyboard navigation
    - Verify ARIA labels
    - _Requirements: 7.4, 8.4_
  
  - [x] 9.3 Performance check
    - Verify smooth animations
    - Check load times
    - Test on slower devices
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Notes

- All existing functionality must be preserved
- Statistics section is hidden but prepared for future use
- Icon placeholders use stacked layers design
- 4-column grid instead of 6-column
- Warmer color palette with Eastern aesthetic
- "查看全部记录" link added to gallery heading
