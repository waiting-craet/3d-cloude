# Design Document: Homepage Redesign

## Overview

This design document specifies the technical implementation for redesigning the homepage UI with a minimalist, elegant aesthetic inspired by traditional Chinese ink-wash painting (水墨风格). The redesign transforms the current colorful gradient-based design into a sophisticated, light-colored interface while preserving all existing functionality.

The design focuses on creating a calm, atmospheric user experience through:
- Soft, muted color palette inspired by ink-wash painting
- Clean typography and generous whitespace
- Subtle animations and depth effects
- Responsive grid-based layout
- Fixed navigation for consistent access to key actions

All existing functionality including authentication, project creation, search, and navigation will be preserved during the redesign.

## Architecture

### Component Structure

The homepage redesign follows a modular component architecture:

```
app/page.tsx (Homepage Container)
├── InkWashNavbar (Fixed Navigation)
│   ├── Logo/Brand
│   ├── Start Creating Button
│   └── Login/Logout Button
├── HeroSection
│   ├── Main Title
│   ├── Subtitle
│   └── Search Input
├── StatisticsDisplay
│   ├── Projects Count
│   ├── Knowledge Graphs Count
│   └── Total Graphs Count
└── GallerySection
    ├── Section Heading
    └── WorkCardGrid
        └── InkWashWorkCard[] (multiple cards)
```

### Design System Architecture

The design system is organized into three layers:

1. **Theme Layer**: Defines the ink-wash color palette, typography scale, spacing system, and animation timings
2. **Component Layer**: Implements reusable UI components following the design system
3. **Page Layer**: Composes components into the complete homepage experience

### State Management

The homepage maintains the following state:
- User authentication status (via useUserStore)
- Login modal visibility
- Project data (fetched from API)
- Search state (handled by ProjectSearch component)
- Pagination state (handled by ProjectList component)

All existing state management logic will be preserved.

## Components and Interfaces

### 1. InkWashNavbar Component

A fixed navigation bar with ink-wash aesthetic styling.

**Props Interface:**
```typescript
interface InkWashNavbarProps {
  isLoggedIn: boolean
  onStartCreating: () => void
  onLogin: () => void
  onLogout: () => void
}
```

**Styling Specifications:**
- Background: Semi-transparent white with subtle backdrop blur (`rgba(255, 255, 255, 0.95)`)
- Border: Soft gray bottom border (`#e8e8e8`)
- Position: Fixed at top with `z-index: 100`
- Typography: Clean sans-serif, logo in muted teal (`#5a9a8f`)
- Buttons: Outlined style with ink-wash color accents
- Hover effects: Subtle color transitions and slight elevation

### 2. HeroSection Component

The primary content area displaying title, subtitle, and search functionality.

**Props Interface:**
```typescript
interface HeroSectionProps {
  title: string
  subtitle: string
  onSearch?: (query: string) => void
}
```

**Styling Specifications:**
- Background: Subtle gradient from light gray to white (`linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)`)
- Typography: 
  - Title: 36-48px, semi-bold, dark gray (`#2c2c2c`)
  - Subtitle: 16-18px, regular, medium gray (`#666666`)
- Search input: Rounded, with subtle shadow and icon
- Spacing: Generous padding (80-120px vertical)

### 3. StatisticsDisplay Component

Displays platform metrics in a clean, readable format.

**Props Interface:**
```typescript
interface StatisticsDisplayProps {
  projectsCount: number
  knowledgeGraphsCount: number
  totalGraphsCount: number
}
```

**Styling Specifications:**
- Layout: Horizontal flex layout with equal spacing
- Typography: 
  - Numbers: 32-40px, bold, ink-wash accent color
  - Labels: 14px, regular, medium gray
- Background: Transparent or subtle white card
- Spacing: Centered with consistent gaps between items

### 4. GallerySection Component

Container for the work card grid with section heading.

**Props Interface:**
```typescript
interface GallerySectionProps {
  heading: string
  children: React.ReactNode
}
```

**Styling Specifications:**
- Heading: 24-28px, semi-bold, dark gray
- Layout: Full-width container with max-width constraint
- Spacing: Consistent padding and margin

### 5. InkWashWorkCard Component

Individual card displaying knowledge graph preview with ink-wash aesthetic.

**Props Interface:**
```typescript
interface InkWashWorkCardProps {
  project: Project
  onClick: (projectId: string) => void
}
```

**Styling Specifications:**
- Background: White with subtle shadow
- Border: 1px solid light gray (`#e8e8e8`)
- Border radius: 8-12px
- Hover effects:
  - Slight elevation (shadow increase)
  - Subtle scale transform (1.02)
  - Border color shift to ink-wash accent
- Typography: Clean, readable font
- Image: Rounded corners, aspect ratio maintained
- Transition: Smooth 0.3s ease for all hover effects

### 6. WorkCardGrid Component

Responsive grid layout for work cards.

**Props Interface:**
```typescript
interface WorkCardGridProps {
  columns: number
  gap: string
  children: React.ReactNode
}
```

**Styling Specifications:**
- Display: CSS Grid
- Columns: Responsive (6 on desktop, 4 on tablet, 2 on mobile)
- Gap: 24-32px
- Responsive breakpoints:
  - Desktop: 1200px+ (6 columns)
  - Tablet: 768-1199px (4 columns)
  - Mobile: <768px (2 columns)

## Data Models

### Color Palette

The ink-wash color palette consists of:

```typescript
interface InkWashPalette {
  // Primary colors
  primary: {
    main: '#5a9a8f'      // Muted teal (ink-wash accent)
    light: '#7db3a8'     // Light teal
    dark: '#3d6b62'      // Dark teal
  }
  
  // Neutral colors
  neutral: {
    white: '#ffffff'
    gray50: '#fafafa'
    gray100: '#f5f5f5'
    gray200: '#e8e8e8'
    gray300: '#d4d4d4'
    gray400: '#a3a3a3'
    gray500: '#737373'
    gray600: '#525252'
    gray700: '#404040'
    gray800: '#2c2c2c'
    gray900: '#1a1a1a'
  }
  
  // Accent colors (subtle, muted)
  accent: {
    sage: '#9caf88'      // Soft sage green
    stone: '#b8a99a'     // Warm stone
    mist: '#c4d4d8'      // Cool mist blue
  }
  
  // Semantic colors
  semantic: {
    success: '#7db3a8'
    warning: '#d4a574'
    error: '#c17b7b'
    info: '#8fa3b8'
  }
}
```

### Typography Scale

```typescript
interface TypographyScale {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    heading: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
  }
  
  fontSize: {
    xs: '12px'
    sm: '14px'
    base: '16px'
    lg: '18px'
    xl: '20px'
    '2xl': '24px'
    '3xl': '28px'
    '4xl': '36px'
    '5xl': '48px'
  }
  
  fontWeight: {
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
  }
  
  lineHeight: {
    tight: 1.2
    normal: 1.5
    relaxed: 1.75
  }
}
```

### Spacing System

```typescript
interface SpacingSystem {
  spacing: {
    xs: '4px'
    sm: '8px'
    md: '16px'
    lg: '24px'
    xl: '32px'
    '2xl': '48px'
    '3xl': '64px'
    '4xl': '80px'
    '5xl': '120px'
  }
}
```

### Animation Timings

```typescript
interface AnimationTimings {
  duration: {
    fast: '150ms'
    normal: '300ms'
    slow: '500ms'
  }
  
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)'
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

### Project Data Model

The existing Project interface is preserved:

```typescript
interface Project {
  id: string
  name: string
  description?: string
  graphCount: number
  createdAt: string
  updatedAt: string
  userId: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: No emoji characters in UI

*For any* rendered homepage content, the text content should not contain emoji characters (Unicode ranges U+1F300-U+1F9FF and related emoji blocks).

**Validates: Requirements 1.4**

### Property 2: Navigation bar is fixed at top

*For any* viewport state, the navigation bar element should have CSS position fixed and be positioned at the top of the viewport.

**Validates: Requirements 2.1**

### Property 3: Navigation bar remains visible while scrolling

*For any* scroll position on the homepage, the navigation bar should remain visible in the viewport.

**Validates: Requirements 2.2, 7.3**

### Property 4: Navigation contains required buttons

*For any* authentication state (logged in or logged out), the navigation bar should contain both the Start Creating button and the Login/Logout button.

**Validates: Requirements 2.3, 2.4**

### Property 5: Start creating button preserves functionality

*For any* click event on the Start Creating button, the system should either navigate to the creation page (if logged in) or display the login modal (if not logged in).

**Validates: Requirements 2.5, 9.4**

### Property 6: Login button preserves functionality

*For any* click event on the Login button when logged out, the login modal should become visible.

**Validates: Requirements 2.6, 9.5**

### Property 7: Hero section contains subtitle

*For any* rendered hero section, it should contain a subtitle element with non-empty text content.

**Validates: Requirements 3.2**

### Property 8: Hero section contains search input with icon

*For any* rendered hero section, it should contain both a search input element and an icon element.

**Validates: Requirements 3.3**

### Property 9: Hero section positioned before other sections

*For any* rendered homepage, the hero section should appear in the DOM before the statistics display and gallery section.

**Validates: Requirements 3.4**

### Property 10: Title has larger font size than subtitle

*For any* rendered hero section, the title element should have a larger computed font-size than the subtitle element.

**Validates: Requirements 3.5**

### Property 11: Statistics display shows all required metrics

*For any* rendered statistics display, it should contain elements showing projects count, knowledge graphs count, and total graphs count.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 12: Number formatting follows readable format

*For any* number displayed in the statistics, numbers >= 10,000 should be formatted with Chinese units (e.g., "2.4万" for 24,000).

**Validates: Requirements 4.4**

### Property 13: Statistics positioned below hero section

*For any* rendered homepage, the statistics display should appear in the DOM after the hero section.

**Validates: Requirements 4.5**

### Property 14: Gallery uses responsive grid layout

*For any* rendered gallery section, it should use CSS grid or flexbox with responsive column properties.

**Validates: Requirements 5.2**

### Property 15: Gallery columns adjust to viewport width

*For any* viewport width change, the gallery grid should adjust the number of columns (6 for desktop >=1200px, 4 for tablet 768-1199px, 2 for mobile <768px).

**Validates: Requirements 5.3**

### Property 16: Gallery displays multiple work cards

*For any* rendered gallery section with available projects, it should display multiple work card elements (>= 1).

**Validates: Requirements 5.4**

### Property 17: Gallery positioned below statistics

*For any* rendered homepage, the gallery section should appear in the DOM after the statistics display.

**Validates: Requirements 5.5**

### Property 18: Work cards display required information

*For any* rendered work card, it should contain both a preview/thumbnail element and a title element with text content.

**Validates: Requirements 6.1, 6.2**

### Property 19: Work cards have hover effects

*For any* work card element, hovering should trigger CSS changes (transform, box-shadow, or border-color).

**Validates: Requirements 6.4**

### Property 20: Work card click triggers navigation

*For any* work card click event, the system should navigate to the corresponding knowledge graph or display the graph list.

**Validates: Requirements 6.5**

### Property 21: Homepage supports vertical scrolling

*For any* homepage state where content height exceeds viewport height, the page should allow vertical scrolling.

**Validates: Requirements 7.1**

### Property 22: Scrollbar appears when content exceeds viewport

*For any* homepage state where content height exceeds viewport height, a scrollbar should be visible.

**Validates: Requirements 7.2**

### Property 23: Smooth scrolling behavior

*For any* programmatic scroll action on the homepage, the scroll-behavior CSS property should be set to smooth or smooth scrolling should be implemented.

**Validates: Requirements 7.4**

### Property 24: Consistent spacing between sections

*For any* adjacent major sections (hero, statistics, gallery), the vertical spacing between them should be consistent (within a defined tolerance).

**Validates: Requirements 8.1**

### Property 25: Elements align to visual grid

*For any* major content elements on the homepage, their horizontal positions should align to consistent grid positions.

**Validates: Requirements 8.3**

### Property 26: Sufficient color contrast for readability

*For any* text element on the homepage, the color contrast ratio between text and background should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 8.4**

### Property 27: Responsive layout adaptation

*For any* viewport width (mobile, tablet, desktop), the homepage layout should adapt appropriately without horizontal scrolling or content overflow.

**Validates: Requirements 8.5**

### Property 28: Routing and navigation preserved

*For any* navigation action on the homepage, the routing should work correctly and navigate to the expected destination.

**Validates: Requirements 9.1**

### Property 29: API integrations preserved

*For any* API call made by the homepage (fetching projects, authentication), the call should execute correctly and return expected data.

**Validates: Requirements 9.2**

### Property 30: State management preserved

*For any* state change on the homepage (login state, modal visibility, project data), the state should update correctly and trigger appropriate UI updates.

**Validates: Requirements 9.3**

### Property 31: Interactive elements have animations

*For any* interactive element (buttons, cards, inputs), CSS transitions or animations should be defined for state changes.

**Validates: Requirements 10.3**

## Error Handling

### Navigation Errors

**Scenario**: Navigation to creation page or graph view fails

**Handling Strategy**:
- Catch navigation errors in try-catch blocks
- Fall back to `window.location.href` for client-side navigation
- Display user-friendly error message if navigation fails
- Log errors to console for debugging

**Implementation**:
```typescript
try {
  router.push('/creation')
} catch (error) {
  console.error('Navigation failed:', error)
  window.location.href = '/creation'
}
```

### API Errors

**Scenario**: Project data fetch fails

**Handling Strategy**:
- Display error message to user with retry option
- Preserve existing error handling in ProjectList component
- Show loading state during fetch
- Gracefully handle empty data states

**Implementation**:
- Use existing ErrorMessage component
- Provide retry callback to re-fetch data
- Show empty state when no projects available

### Authentication Errors

**Scenario**: User authentication state is inconsistent

**Handling Strategy**:
- Initialize authentication state from storage on mount
- Listen for login state change events
- Prompt user to login when attempting protected actions
- Preserve existing authentication flow

**Implementation**:
- Use existing useUserStore hook
- Maintain loginStateChange event listener
- Show login modal when unauthenticated user attempts to create

### Responsive Layout Errors

**Scenario**: Layout breaks at certain viewport sizes

**Handling Strategy**:
- Use CSS media queries with tested breakpoints
- Implement mobile-first responsive design
- Test at standard viewport widths (320px, 768px, 1024px, 1440px)
- Use flexible units (%, rem, em) instead of fixed pixels where appropriate

### Missing Data Errors

**Scenario**: Project data is incomplete or malformed

**Handling Strategy**:
- Validate project data structure before rendering
- Filter out invalid projects
- Provide default values for optional fields
- Show placeholder content for missing images

**Implementation**:
```typescript
const validProjects = projects.filter(project => 
  project && 
  project.id && 
  project.name && 
  typeof project.graphCount === 'number'
)
```

## Testing Strategy

### Dual Testing Approach

The homepage redesign will be validated through both unit tests and property-based tests:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific button click behaviors
- Modal open/close interactions
- Empty state rendering
- Error state rendering
- Specific viewport width layouts

**Property Tests**: Verify universal properties across all inputs
- Color contrast ratios for all text elements
- Responsive behavior across viewport width ranges
- Navigation bar visibility at all scroll positions
- Number formatting for various input values
- Grid layout behavior with different project counts

### Property-Based Testing Configuration

**Library**: fast-check (for TypeScript/React)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: homepage-redesign, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check'

describe('Feature: homepage-redesign, Property 12: Number formatting', () => {
  it('should format numbers >= 10000 with Chinese units', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 1000000 }),
        (num) => {
          const formatted = formatNumber(num)
          expect(formatted).toMatch(/[\d.]+万/)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing Strategy

**Component Tests**:
- InkWashNavbar: Button rendering, click handlers, authentication states
- HeroSection: Content rendering, search input functionality
- StatisticsDisplay: Number formatting, data display
- InkWashWorkCard: Hover effects, click navigation, data rendering
- WorkCardGrid: Responsive column counts, gap spacing

**Integration Tests**:
- Full homepage rendering with mock data
- Authentication flow (login/logout)
- Project creation flow
- Navigation between pages
- API integration with mock responses

**Visual Regression Tests** (optional):
- Capture screenshots at different viewport sizes
- Compare against baseline images
- Detect unintended visual changes

### Test Coverage Goals

- Component unit tests: 90%+ coverage
- Property tests: All 31 properties implemented
- Integration tests: All user flows covered
- Accessibility tests: WCAG AA compliance verified

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **fast-check**: Property-based testing library
- **jest-axe**: Accessibility testing
- **MSW (Mock Service Worker)**: API mocking

### Continuous Testing

- Run tests on every commit (pre-commit hook)
- Run full test suite in CI/CD pipeline
- Generate coverage reports
- Block merges if tests fail or coverage drops


## Implementation Details

### File Structure

The redesign will modify and create the following files:

```
app/
├── page.tsx (modify - main homepage container)
├── globals.css (modify - add ink-wash design tokens)
components/
├── InkWashNavbar.tsx (create - new navigation component)
├── InkWashNavbar.module.css (create - navigation styles)
├── HeroSection.tsx (create - hero section component)
├── HeroSection.module.css (create - hero styles)
├── StatisticsDisplay.tsx (create - statistics component)
├── StatisticsDisplay.module.css (create - statistics styles)
├── GallerySection.tsx (create - gallery container)
├── GallerySection.module.css (create - gallery styles)
├── InkWashWorkCard.tsx (create - redesigned work card)
├── InkWashWorkCard.module.css (create - work card styles)
├── WorkCardGrid.tsx (create - responsive grid layout)
├── WorkCardGrid.module.css (create - grid styles)
lib/
├── utils/formatNumber.ts (create - number formatting utility)
├── design-tokens.ts (create - ink-wash design system tokens)
__tests__/
├── components/
│   ├── InkWashNavbar.test.tsx (create)
│   ├── HeroSection.test.tsx (create)
│   ├── StatisticsDisplay.test.tsx (create)
│   ├── InkWashWorkCard.test.tsx (create)
│   └── WorkCardGrid.test.tsx (create)
├── integration/
│   └── homepage.integration.test.tsx (create)
└── property/
    ├── homepage.contrast.property.test.tsx (create)
    ├── homepage.responsive.property.test.tsx (create)
    └── homepage.formatting.property.test.tsx (create)
```

### Design Tokens Implementation

Create a centralized design tokens file for the ink-wash design system:

**lib/design-tokens.ts**:
```typescript
export const inkWashTokens = {
  colors: {
    primary: {
      main: '#5a9a8f',
      light: '#7db3a8',
      dark: '#3d6b62',
    },
    neutral: {
      white: '#ffffff',
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#e8e8e8',
      gray300: '#d4d4d4',
      gray400: '#a3a3a3',
      gray500: '#737373',
      gray600: '#525252',
      gray700: '#404040',
      gray800: '#2c2c2c',
      gray900: '#1a1a1a',
    },
    accent: {
      sage: '#9caf88',
      stone: '#b8a99a',
      mist: '#c4d4d8',
    },
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      heading: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '80px',
    '5xl': '120px',
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
}
```

### Number Formatting Utility

**lib/utils/formatNumber.ts**:
```typescript
/**
 * Formats numbers for display in statistics
 * Numbers >= 10,000 are formatted with Chinese units (万)
 * 
 * Examples:
 * - 1234 -> "1,234"
 * - 24000 -> "2.4万"
 * - 150000 -> "15万"
 */
export function formatNumber(num: number): string {
  if (num >= 10000) {
    const wan = num / 10000
    // Format with 1 decimal place if needed, remove trailing .0
    const formatted = (Math.round(wan * 10) / 10).toString()
    return `${formatted}万`
  }
  
  // Format with thousand separators for numbers < 10,000
  return num.toLocaleString('zh-CN')
}
```

### Component Implementation Guidelines

#### InkWashNavbar Component

**Key Features**:
- Fixed positioning with backdrop blur
- Responsive button layout
- Smooth transitions on hover
- Authentication state handling

**CSS Modules Approach**:
```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  transition: all 0.3s ease;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-main);
}

.buttonGroup {
  display: flex;
  gap: 12px;
  align-items: center;
}

.primaryButton {
  padding: 10px 24px;
  background: transparent;
  color: var(--primary-main);
  border: 1.5px solid var(--primary-main);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primaryButton:hover {
  background: var(--primary-main);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(90, 154, 143, 0.2);
}

.secondaryButton {
  padding: 10px 24px;
  background: transparent;
  color: var(--gray-600);
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondaryButton:hover {
  border-color: var(--primary-main);
  color: var(--primary-main);
}
```

#### HeroSection Component

**Key Features**:
- Subtle gradient background
- Centered content layout
- Search input with icon
- Responsive typography

**Layout Structure**:
```typescript
<section className={styles.hero}>
  <div className={styles.container}>
    <h1 className={styles.title}>构建与发现知识的无尽脉络</h1>
    <p className={styles.subtitle}>
      在这里，每一个想法都能找到它的位置，每一条知识都能连接成网络
    </p>
    <div className={styles.searchContainer}>
      <SearchIcon className={styles.searchIcon} />
      <input 
        type="text"
        placeholder="搜索知识图谱..."
        className={styles.searchInput}
      />
    </div>
  </div>
</section>
```

#### StatisticsDisplay Component

**Key Features**:
- Horizontal flex layout
- Number formatting with formatNumber utility
- Responsive spacing
- Subtle dividers between items

**Data Flow**:
```typescript
interface StatisticsDisplayProps {
  projectsCount: number
  knowledgeGraphsCount: number
  totalGraphsCount: number
}

// Fetch statistics from API or calculate from project data
const stats = {
  projectsCount: projects.length,
  knowledgeGraphsCount: projects.reduce((sum, p) => sum + p.graphCount, 0),
  totalGraphsCount: projects.reduce((sum, p) => sum + p.graphCount, 0),
}
```

#### InkWashWorkCard Component

**Key Features**:
- White background with subtle border
- Hover elevation effect
- Rounded corners
- Image with fallback
- Clean typography

**Hover Animation**:
```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-light);
}

.card:hover .image {
  transform: scale(1.05);
}

.image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}
```

#### WorkCardGrid Component

**Key Features**:
- CSS Grid layout
- Responsive columns
- Consistent gap spacing
- Auto-fit for flexible layouts

**Responsive Grid**:
```css
.grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(6, 1fr);
}

@media (max-width: 1199px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
```

### Migration Strategy

The redesign will be implemented incrementally to minimize risk:

**Phase 1: Design System Setup**
1. Create design tokens file
2. Add CSS custom properties to globals.css
3. Create utility functions (formatNumber)

**Phase 2: Component Creation**
1. Build InkWashNavbar component
2. Build HeroSection component
3. Build StatisticsDisplay component
4. Build InkWashWorkCard component
5. Build WorkCardGrid component
6. Build GallerySection component

**Phase 3: Integration**
1. Update app/page.tsx to use new components
2. Preserve existing functionality (authentication, navigation, API calls)
3. Test all user flows

**Phase 4: Testing**
1. Write unit tests for all components
2. Write property-based tests for key properties
3. Write integration tests for user flows
4. Perform accessibility testing

**Phase 5: Refinement**
1. Adjust spacing and typography based on visual review
2. Fine-tune animations and transitions
3. Optimize performance
4. Cross-browser testing

### Accessibility Considerations

**Keyboard Navigation**:
- All interactive elements must be keyboard accessible
- Logical tab order through navigation, hero, statistics, gallery
- Focus indicators visible on all interactive elements

**Screen Reader Support**:
- Semantic HTML elements (nav, section, article)
- ARIA labels for icon-only buttons
- Alt text for all images
- Proper heading hierarchy (h1 → h2 → h3)

**Color Contrast**:
- All text meets WCAG AA standards (4.5:1 for normal text)
- Interactive elements have sufficient contrast
- Focus indicators have 3:1 contrast ratio

**Responsive Design**:
- Text remains readable at all zoom levels
- Layout doesn't break at 200% zoom
- Touch targets minimum 44x44px on mobile

### Performance Considerations

**Image Optimization**:
- Use Next.js Image component for automatic optimization
- Lazy load images below the fold
- Provide appropriate image sizes for different viewports
- Use WebP format with fallbacks

**CSS Optimization**:
- Use CSS modules for scoped styles
- Minimize use of expensive properties (backdrop-filter)
- Use CSS custom properties for theming
- Avoid layout thrashing

**JavaScript Optimization**:
- Minimize re-renders with React.memo where appropriate
- Use useCallback for event handlers
- Debounce search input
- Code split components if bundle size grows

**Loading Strategy**:
- Show loading skeleton for project cards
- Progressive enhancement approach
- Graceful degradation for older browsers

### Browser Support

**Target Browsers**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 13+
- Chrome Mobile: Android 8+

**Fallbacks**:
- backdrop-filter: Solid background color fallback
- CSS Grid: Flexbox fallback for older browsers
- CSS custom properties: Sass variables as fallback

### Deployment Checklist

Before deploying the redesign:

- [ ] All unit tests passing
- [ ] All property tests passing
- [ ] Integration tests passing
- [ ] Accessibility audit completed (jest-axe)
- [ ] Visual regression tests reviewed
- [ ] Cross-browser testing completed
- [ ] Mobile testing on real devices
- [ ] Performance metrics acceptable (Lighthouse score > 90)
- [ ] SEO metadata preserved
- [ ] Analytics tracking verified
- [ ] Error tracking configured
- [ ] Rollback plan documented

