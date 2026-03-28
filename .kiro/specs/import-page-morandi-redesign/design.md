# Design Document: Import Page Morandi Green Redesign

## Overview

This design document specifies the technical approach for redesigning the import data page (`/app/import/page.tsx`) with a Morandi green color palette and ink wash aesthetic (水墨风格). The redesign is purely visual - all existing functionality including project/graph management, file upload, template downloads, and import workflows must remain completely unchanged.

The current implementation uses a teal color scheme (#00bfa5) with standard Material Design-inspired styling. The redesign will transform this into an elegant, calming interface inspired by traditional Chinese ink wash paintings, using muted Morandi green tones, subtle gradients, soft shadows, and artistic visual effects.

### Design Goals

1. Replace all teal (#00bfa5) colors with Morandi green palette colors
2. Apply ink wash aesthetic through gradients, shadows, and transparency
3. Integrate custom file type and download icons
4. Maintain 100% functional compatibility with existing implementation
5. Preserve component structure and React hooks to minimize code changes
6. Ensure all existing tests pass without modification

## Architecture

### Component Structure Preservation

The redesign maintains the existing React component structure:

```
ImportPage (main component)
├── Navigation Bar
├── Page Title
├── Project/Graph Selection Area
│   ├── Project Selector + New Button
│   └── (Graph selector rendered in left panel)
├── Main Content (2-column grid)
│   ├── Left Panel: Import Data
│   │   ├── File Type Selection Cards (Excel, CSV, JSON)
│   │   ├── File Input (hidden)
│   │   ├── Selected File Display
│   │   └── Graph Selector + New Button
│   └── Right Panel: Template Download
│       └── Download Buttons (Excel, CSV, JSON)
├── Generate Button Section
│   ├── Generate Graph Button
│   └── Status Message Display
└── Modal Dialogs
    ├── New Project Modal
    ├── New Graph Modal
    ├── Confirm Import Modal
    └── Loading/Progress Modal (with statistics)
```

All modals, state management, event handlers, and API calls remain unchanged. Only inline styles will be modified.

### Styling Approach

The implementation uses inline styles throughout. The redesign will:
- Modify color values in existing style objects
- Add gradient, shadow, and transparency properties
- Integrate icon components/images
- Preserve all layout properties (flex, grid, padding, margins)
- Maintain responsive behavior

No CSS modules or external stylesheets will be added to minimize changes.

## Components and Interfaces

### Color Palette Definition

The Morandi Green Palette consists of carefully selected muted tones:

```typescript
const MorandiColors = {
  // Primary Colors
  skyBlue: '#87CEEB',           // 天青色 - primary accent
  darkGreen: '#2F4F4F',         // 黛绿色 - secondary accent
  
  // Background Greens
  sageGreen: '#8B9D83',         // Morandi green - main backgrounds
  mintGreen: '#A8B5A0',         // Lighter Morandi green - secondary backgrounds
  paleGreen: '#C8D5C8',         // Very light green - subtle backgrounds
  
  // Neutral Tones
  warmGray: '#E8E6E3',          // Warm gray - borders and dividers
  softWhite: '#F5F4F2',         // Off-white - card backgrounds
  charcoal: '#4A4A48',          // Dark gray - text
  
  // State Colors (muted to complement palette)
  successGreen: '#7FA87F',      // Muted green - success states
  warningAmber: '#D4B896',      // Muted amber - warnings
  errorRose: '#C89B9B',         // Muted rose - errors
  
  // Hover States (slightly lighter/darker variants)
  skyBlueHover: '#9DD9F3',      // Lighter sky blue
  darkGreenHover: '#3D6363',    // Lighter dark green
  sageGreenHover: '#9BAA93',    // Lighter sage green
}
```

### Ink Wash Visual Effects

Ink wash styling is achieved through CSS properties:

```typescript
const InkWashEffects = {
  // Gradient backgrounds (subtle, vertical)
  cardGradient: 'linear-gradient(180deg, #F5F4F2 0%, #E8E6E3 100%)',
  navGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F5F4F2 100%)',
  modalGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F5F4F2 100%)',
  
  // Soft shadows (multiple layers for depth)
  softShadow: '0 2px 8px rgba(75, 75, 72, 0.08), 0 1px 3px rgba(75, 75, 72, 0.06)',
  cardShadow: '0 4px 12px rgba(75, 75, 72, 0.1), 0 2px 4px rgba(75, 75, 72, 0.06)',
  modalShadow: '0 8px 24px rgba(75, 75, 72, 0.15), 0 4px 8px rgba(75, 75, 72, 0.1)',
  
  // Border radius (soft, rounded)
  smallRadius: '8px',
  mediumRadius: '12px',
  largeRadius: '16px',
  pillRadius: '24px',
  
  // Transparency for overlays
  modalOverlay: 'rgba(47, 79, 79, 0.6)',  // Dark green with transparency
  loadingOverlay: 'rgba(47, 79, 79, 0.7)',
  
  // Blur effects
  backdropBlur: 'blur(8px)',
}
```

### Icon Integration Strategy

Custom icons will be integrated using Next.js Image component or inline SVG:

```typescript
// Icon paths (to be provided by user)
const IconPaths = {
  excel: '/icons/excel-morandi.svg',    // User-provided Excel icon
  csv: '/icons/csv-morandi.svg',        // User-provided CSV icon
  json: '/icons/json-morandi.svg',      // User-provided JSON icon
  download: '/icons/download-morandi.svg', // User-provided download icon
}

// Icon component wrapper
const FileTypeIcon = ({ type }: { type: 'excel' | 'csv' | 'json' }) => (
  <Image 
    src={IconPaths[type]} 
    alt={`${type} icon`}
    width={48}
    height={48}
    style={{ 
      filter: 'opacity(0.8)',  // Slight transparency for ink wash effect
      transition: 'all 0.2s'
    }}
  />
)
```

Icons will be styled with:
- Consistent sizing (48x48px for file types, 20x20px for download)
- Opacity filters for muted appearance
- Smooth transitions on hover
- Color filters if needed to match palette

## Data Models

No changes to data models. All interfaces remain unchanged:

```typescript
interface Project {
  id: string
  name: string
}

interface Graph {
  id: string
  name: string
}

interface ImportStats {
  duplicateNodesCount: number
  duplicateEdgesCount: number
  importedNodesCount: number
  importedEdgesCount: number
  totalNodesInFile: number
  totalEdgesInFile: number
}
```

State management structure remains identical:
- `projects`, `graphs` - data arrays
- `selectedProject`, `selectedGraph` - selection state
- `selectedFile`, `fileType` - file upload state
- `uploading`, `uploadStatus` - upload progress
- `showNewProjectModal`, `showNewGraphModal`, `showConfirmModal`, `showLoadingModal` - modal visibility
- `newProjectName`, `newGraphName` - form input state
- `creating` - creation progress
- `abortController` - upload cancellation
- `importStats` - import statistics

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies to eliminate:

1. **Color verification properties**: Multiple criteria test that specific elements use Morandi colors. These can be consolidated into comprehensive properties that check all elements of a type.

2. **Hover state properties**: Multiple criteria test hover effects. These can be combined into properties that verify all interactive elements have proper hover states.

3. **Ink wash effect properties**: Multiple criteria test for shadows and rounded corners. These can be consolidated into properties that verify all styled elements have these effects.

4. **Icon presence properties**: Individual icon tests (3.1, 3.2, 3.3) can be combined with the general icon property (3.4).

5. **Functional preservation properties**: Multiple criteria test that functionality is preserved. These can be consolidated into comprehensive behavioral properties.

After consolidation, the following properties provide unique validation value:

### Property 1: Morandi Color Palette Application

*For any* rendered UI element with a color style property (background, border, or text color), the color value should be from the Morandi green palette or neutral tones, and should not be the old teal color (#00bfa5).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

### Property 2: Hover State Color Consistency

*For any* interactive element (buttons, cards, dropdowns, links), when a hover event is simulated, the resulting color should be from the Morandi green palette hover variants.

**Validates: Requirements 1.5, 5.3, 6.5, 7.3**

### Property 3: Ink Wash Shadow Effects

*For any* card, panel, modal, or button element, the computed box-shadow property should contain multiple shadow layers with low opacity values (< 0.2) to create soft, layered depth effects.

**Validates: Requirements 2.2, 2.4, 5.4, 6.4, 7.4, 8.4, 9.2, 10.4, 11.4**

### Property 4: Gradient Background Application

*For any* background element (navigation bar, cards, modals), the background style should contain a linear-gradient with subtle color transitions (color difference < 10% in HSL lightness).

**Validates: Requirements 2.1, 4.3, 9.2**

### Property 5: Transparency and Layering

*For any* overlay element (modal backdrops, loading screens), the background color should use rgba or hsla format with alpha < 0.8 to create semi-transparent layering effects.

**Validates: Requirements 2.3**

### Property 6: Rounded Corner Consistency

*For any* styled element (cards, buttons, inputs, modals), the border-radius property should be >= 6px to ensure soft, rounded corners throughout the interface.

**Validates: Requirements 2.4, 5.4, 6.4, 8.4, 11.4**

### Property 7: File Type Icon Integration

*For any* file type card (Excel, CSV, JSON), the card should contain an image or SVG element with a src or path matching the corresponding icon file.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 8: Icon Sizing and Alignment

*For any* icon element (file type or download), the width and height should be consistent within icon type (48px for file types, 20px for download), and the icon should be centered within its container.

**Validates: Requirements 3.5**

### Property 9: Icon Color Styling

*For any* icon element, the computed style should include a filter or color property that adjusts the icon appearance to match the Morandi aesthetic (opacity or color filters applied).

**Validates: Requirements 3.6**

### Property 10: API Call Preservation

*For any* user action that previously triggered an API call (fetch projects, fetch graphs, create project, create graph, import file), the same API endpoint should be called with the same parameters after the redesign.

**Validates: Requirements 12.1**

### Property 11: State Management Preservation

*For any* user interaction that updates component state (selecting project, selecting graph, selecting file, opening modal), the state variable should update to the same value as before the redesign.

**Validates: Requirements 12.2**

### Property 12: Interactive Behavior Preservation

*For any* interactive element (dropdown, button, file input, modal), the element should respond to user events (click, change, hover) with the same behavior as before the redesign.

**Validates: Requirements 12.3, 4.5, 5.5, 6.6, 7.5, 8.5, 9.6, 11.5**

### Property 13: Navigation Preservation

*For any* successful import operation, the application should navigate to the graph page with the same URL parameters (projectId, graphId) as before the redesign.

**Validates: Requirements 12.4**

### Property 14: Validation Logic Preservation

*For any* invalid input (empty project name, unsupported file type, missing required field), the same validation error should be displayed as before the redesign.

**Validates: Requirements 12.5**

### Property 15: Error Handling Preservation

*For any* error condition (network failure, API error, user cancellation), the same error handling behavior should occur as before the redesign.

**Validates: Requirements 12.6**

### Property 16: Statistics Display Styling

*For any* import statistics card (file counts, duplicate counts, imported counts), the card should use Morandi green for success indicators, muted amber for warnings, and maintain the same data values and layout structure.

**Validates: Requirements 10.1, 10.2, 10.3, 10.5**

### Property 17: Component Structure Preservation

*For any* React component in the import page, the component should use the same hooks (useState, useEffect, useRouter) with the same dependencies and the same component hierarchy as before the redesign.

**Validates: Requirements 12.8**

## Error Handling

Error handling remains completely unchanged. All existing error handling logic is preserved:

1. **Network Errors**: Try-catch blocks around fetch calls with console.error logging
2. **Validation Errors**: Alert dialogs for missing required fields
3. **API Errors**: Response status checking with error message display
4. **User Cancellation**: AbortController for upload cancellation
5. **File Type Errors**: File extension validation with status message

The only changes are visual - error messages will be styled with muted rose color (#C89B9B) instead of bright red, with soft shadows and rounded corners.

## Testing Strategy

### Dual Testing Approach

The redesign requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific color values on key elements (navigation bar, generate button, modals)
- Icon presence and correct src paths
- Specific user interactions (clicking generate, opening modals)
- Edge cases (disabled states, empty selections)
- Integration points (API calls, navigation)

**Property-Based Tests** focus on:
- Universal color palette compliance across all elements
- Hover state behavior across all interactive elements
- Ink wash effects (shadows, gradients, transparency) across all styled elements
- Functional preservation across all user workflows
- State management consistency across all interactions

Together, these approaches provide comprehensive validation: unit tests catch specific visual regressions, while property tests verify general correctness across the entire interface.

### Property-Based Testing Configuration

**Library**: fast-check (for TypeScript/React)

**Configuration**:
```typescript
import fc from 'fast-check'

// Minimum 100 iterations per property test
fc.assert(property, { numRuns: 100 })
```

**Test Tagging Format**:
```typescript
// Feature: import-page-morandi-redesign, Property 1: Morandi Color Palette Application
test('all UI elements use Morandi color palette', () => {
  // Property test implementation
})
```

Each correctness property will be implemented as a single property-based test that generates random inputs (element selectors, user actions, data values) and verifies the property holds across all generated cases.

### Unit Test Examples

```typescript
// Color verification
test('navigation bar uses Morandi green gradient', () => {
  render(<ImportPage />)
  const nav = screen.getByRole('navigation')
  const styles = window.getComputedStyle(nav)
  expect(styles.background).toContain('linear-gradient')
  expect(styles.background).toContain('#F5F4F2')
})

// Icon integration
test('Excel card displays Excel icon', () => {
  render(<ImportPage />)
  const excelIcon = screen.getByAltText('excel icon')
  expect(excelIcon).toBeInTheDocument()
  expect(excelIcon).toHaveAttribute('src', '/icons/excel-morandi.svg')
})

// Functional preservation
test('selecting project fetches graphs', async () => {
  const mockFetch = jest.fn()
  global.fetch = mockFetch
  render(<ImportPage />)
  
  const projectSelect = screen.getByRole('combobox', { name: /项目选择/ })
  fireEvent.change(projectSelect, { target: { value: 'project-123' } })
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/projects/project-123/graphs')
  })
})
```

### Visual Regression Testing

While not automated, manual visual review should verify:
- Color palette consistency across all screens
- Ink wash aesthetic quality (gradients, shadows, transparency)
- Icon integration and alignment
- Responsive behavior at different screen sizes
- Hover and interaction states

Screenshots should be taken before and after redesign for comparison.

## Implementation Steps

### Phase 1: Color Palette Setup

1. Define color constants at top of component
2. Create helper function to map old colors to new colors
3. Test color mapping with a single element

### Phase 2: Navigation Bar Redesign

1. Update navigation bar background with gradient
2. Update logo/brand colors from teal to Morandi green
3. Apply soft shadow to navigation bar
4. Verify navigation functionality unchanged

### Phase 3: Project/Graph Selection Redesign

1. Update dropdown border and background colors
2. Update "新建" button colors and hover states
3. Apply soft shadows and rounded corners
4. Verify selection and creation functionality

### Phase 4: File Upload Area Redesign

1. Integrate file type icons (Excel, CSV, JSON)
2. Update card borders and backgrounds
3. Update selection highlight color
4. Apply ink wash effects (gradients, shadows)
5. Update hover states
6. Verify file selection and drag-drop functionality

### Phase 5: Template Download Redesign

1. Integrate download icons
2. Update button colors and borders
3. Update hover states
4. Apply soft shadows
5. Verify download functionality

### Phase 6: Generate Button Redesign

1. Update button background color
2. Update disabled state color
3. Update hover state
4. Apply soft shadow and rounded corners
5. Verify button functionality and state management

### Phase 7: Modal Dialogs Redesign

1. Update modal backdrop transparency and color
2. Update modal background with gradient
3. Update modal shadows
4. Update button colors in modals
5. Update input field borders
6. Update loading spinner color
7. Verify all modal functionality (open, close, submit, cancel)

### Phase 8: Statistics Display Redesign

1. Update statistics card backgrounds and borders
2. Update success indicator colors (green)
3. Update warning indicator colors (amber)
4. Apply ink wash effects
5. Verify statistics display and data formatting

### Phase 9: Status Messages Redesign

1. Update success message colors
2. Update error message colors
3. Update warning message colors
4. Apply soft shadows and rounded corners
5. Verify message display timing and content

### Phase 10: Testing and Validation

1. Run all existing unit tests - verify they pass
2. Implement new property-based tests
3. Run property tests - verify all properties hold
4. Manual visual review and comparison
5. Cross-browser testing
6. Responsive design testing

### Phase 11: Icon Asset Integration

1. Receive icon files from user
2. Place icons in `/public/icons/` directory
3. Update icon paths in component
4. Verify icon display and sizing
5. Apply color filters if needed

## Verification Methods

### Automated Verification

1. **Color Compliance**: Parse all inline styles, extract color values, verify against palette
2. **Shadow Effects**: Check computed styles for box-shadow properties with multiple layers
3. **Gradient Application**: Verify background properties contain linear-gradient
4. **Border Radius**: Check all styled elements have border-radius >= 6px
5. **Icon Integration**: Verify image elements with correct src attributes
6. **Functional Tests**: Run existing test suite, verify 100% pass rate
7. **API Monitoring**: Intercept network requests, verify endpoints and parameters unchanged
8. **State Tracking**: Monitor React state updates, verify values match expected behavior

### Manual Verification

1. **Visual Comparison**: Side-by-side screenshots before/after
2. **Hover States**: Manually hover over all interactive elements, verify color changes
3. **Modal Flows**: Open and interact with all modals, verify styling and functionality
4. **Import Workflow**: Complete full import process, verify styling and behavior
5. **Responsive Testing**: Test at mobile, tablet, and desktop sizes
6. **Browser Testing**: Test in Chrome, Firefox, Safari, Edge

### Acceptance Criteria Checklist

Each requirement's acceptance criteria will be verified through a combination of automated tests and manual review. A checklist will track completion:

- [ ] Requirement 1: Morandi Green Color Palette Application (6 criteria)
- [ ] Requirement 2: Ink Wash Aesthetic Styling (6 criteria)
- [ ] Requirement 3: Custom Icon Integration (6 criteria)
- [ ] Requirement 4: Navigation Bar Redesign (5 criteria)
- [ ] Requirement 5: Project and Graph Selection Redesign (5 criteria)
- [ ] Requirement 6: File Upload Area Redesign (6 criteria)
- [ ] Requirement 7: Template Download Section Redesign (5 criteria)
- [ ] Requirement 8: Generate Button Redesign (5 criteria)
- [ ] Requirement 9: Modal Dialog Redesign (6 criteria)
- [ ] Requirement 10: Import Statistics Display Redesign (5 criteria)
- [ ] Requirement 11: Status Message Redesign (5 criteria)
- [ ] Requirement 12: Functional Preservation (8 criteria)

Total: 68 acceptance criteria to verify

## Technical Considerations

### Performance

The redesign should have minimal performance impact:
- Inline styles are already used (no additional CSS parsing)
- Gradients and shadows are GPU-accelerated
- Icon images should be optimized (SVG preferred, < 10KB each)
- No additional JavaScript logic or state management

### Browser Compatibility

All CSS features used are widely supported:
- Linear gradients: Supported in all modern browsers
- Box shadows: Supported in all modern browsers
- Border radius: Supported in all modern browsers
- RGBA colors: Supported in all modern browsers
- CSS filters: Supported in all modern browsers (IE11 requires -webkit- prefix)

### Accessibility

The redesign maintains accessibility:
- Color contrast ratios meet WCAG AA standards (verify with contrast checker)
- All interactive elements remain keyboard accessible
- Alt text for icons
- ARIA labels unchanged
- Focus states visible (add focus outline in Morandi colors)

### Maintainability

The redesign minimizes maintenance burden:
- No new dependencies added
- Component structure unchanged
- State management unchanged
- API integration unchanged
- Inline styles keep styling co-located with components
- Color constants at top of file for easy updates

## Future Enhancements

Potential improvements beyond this redesign:

1. **CSS-in-JS Migration**: Move inline styles to styled-components or emotion for better maintainability
2. **Theme System**: Create a theme context for consistent color management across the application
3. **Animation Library**: Add subtle animations (fade-in, slide-in) for ink wash aesthetic
4. **Custom Icon Set**: Commission a complete Morandi-styled icon set for the entire application
5. **Dark Mode**: Create a dark variant of the Morandi palette
6. **Accessibility Enhancements**: Add focus indicators, improve keyboard navigation
7. **Component Library**: Extract reusable components (MorandiButton, MorandiCard, MorandiModal)

These enhancements are out of scope for this redesign but could be considered for future iterations.
