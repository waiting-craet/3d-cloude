# Design Document: Homepage Exact UI Replica

## Overview

This design document specifies the implementation for creating an exact replica of the reference UI design. The design features a warm paper-white background (#FAFAF8) with sky-blue/jade-green accent color (#6b8e85), emphasizing Eastern aesthetic minimalism and warmth.

## Color Palette

### Primary Colors
```typescript
{
  paperWhite: '#FAFAF8',      // Warm paper-white background
  skyBlue: '#6b8e85',          // Sky-blue/jade-green accent
  skyBlueLight: '#8ba9a0',     // Lighter variant for hover
  skyBlueDark: '#567169',      // Darker variant
}
```

### Neutral Colors
```typescript
{
  textPrimary: '#333333',      // Primary text
  textSecondary: '#666666',    // Secondary text
  textTertiary: '#999999',     // Tertiary text/metadata
  border: '#E8E8E6',           // Subtle warm gray border
  borderLight: '#F0F0EE',      // Lighter border
  cardBg: '#FFFFFF',           // Card background (pure white)
}
```

## Component Architecture

### 1. PaperNavbar Component

Fixed navigation bar with warm paper aesthetic.

**Props Interface:**
```typescript
interface PaperNavbarProps {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  onStartCreating: () => void
}
```

**Styling:**
- Background: rgba(250, 250, 248, 0.95) with backdrop blur
- Border bottom: 1px solid #E8E8E6
- Logo color: #6b8e85
- Primary button: filled with #6b8e85
- Secondary button: outlined with #E8E8E6

### 2. PaperHeroSection Component

Hero section with centered content and search.

**Props Interface:**
```typescript
interface PaperHeroSectionProps {
  title: string
  subtitle: string
  onSearch?: (query: string) => void
}
```

**Styling:**
- Background: linear-gradient(180deg, #FAFAF8 0%, #FFFFFF 100%)
- Title: 48px, semibold, #333333
- Subtitle: 18px, regular, #666666
- Search input: #FFFFFF background, #E8E8E6 border

### 3. PaperWorkCard Component

Card with icon placeholder and metadata.

**Props Interface:**
```typescript
interface PaperWorkCardProps {
  project: Project
  onClick: (projectId: string) => void
}
```

**Styling:**
- Background: #FFFFFF
- Border: 1px solid #E8E8E6
- Border radius: 12px
- Icon: Stacked layers in #CCCCCC
- Hover: border-color changes to #6b8e85, slight elevation

### 4. PaperWorkGrid Component

Responsive grid layout for cards.

**Props Interface:**
```typescript
interface PaperWorkGridProps {
  columns?: number
  gap?: string
  children: React.ReactNode
}
```

**Grid Configuration:**
- Desktop (≥1200px): 4 columns
- Tablet (768-1199px): 3 columns
- Mobile (<768px): 2 columns
- Gap: 20px

### 5. PaperGallerySection Component

Gallery container with heading and "view all" link.

**Props Interface:**
```typescript
interface PaperGallerySectionProps {
  heading: string
  viewAllText?: string
  onViewAll?: () => void
  children: React.ReactNode
}
```

**Styling:**
- Heading: 24px, semibold, #333333
- View all link: 14px, #6b8e85
- Background: #FFFFFF

## Layout Structure

```
app/page.tsx (Homepage Container)
├── PaperNavbar (Fixed Navigation)
│   ├── Logo "知识图谱"
│   ├── Login Button "登录"
│   └── Start Creating Button "开始创作"
├── PaperHeroSection
│   ├── Title "构建与发现知识的无尽脉络"
│   ├── Subtitle
│   └── Search Input
└── PaperGallerySection
    ├── Heading "推荐广场" + "查看全部记录"
    └── PaperWorkGrid
        └── PaperWorkCard[] (multiple cards)
```

## Typography Scale

```typescript
{
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '42px',
    '4xl': '48px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
}
```

## Spacing System

```typescript
{
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
    '5xl': '60px',
    '6xl': '80px',
  },
}
```

## Animation Timings

```typescript
{
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
```

## Implementation Details

### File Structure

```
components/
├── PaperNavbar.tsx
├── PaperNavbar.module.css
├── PaperHeroSection.tsx
├── PaperHeroSection.module.css
├── PaperWorkCard.tsx
├── PaperWorkCard.module.css
├── PaperWorkGrid.tsx
├── PaperWorkGrid.module.css
├── PaperGallerySection.tsx
├── PaperGallerySection.module.css
lib/
├── paper-design-tokens.ts
```

### Design Tokens

**lib/paper-design-tokens.ts:**
```typescript
export const paperTokens = {
  colors: {
    paperWhite: '#FAFAF8',
    skyBlue: '#6b8e85',
    skyBlueLight: '#8ba9a0',
    skyBlueDark: '#567169',
    textPrimary: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E8E8E6',
    borderLight: '#F0F0EE',
    cardBg: '#FFFFFF',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '42px',
      '4xl': '48px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
    '5xl': '60px',
  },
  animation: {
    duration: {
      normal: '300ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 4px 8px rgba(0, 0, 0, 0.08)',
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
  },
}
```

## Key Differences from Previous Design

1. **Warmer Color Palette**: #FAFAF8 (paper-white) vs #fafafa (cool gray)
2. **Different Accent**: #6b8e85 (sky-blue/jade) vs #5a9a8f (muted teal)
3. **Grid Layout**: 4 columns vs 6 columns
4. **Statistics Hidden**: Not displayed by default
5. **Icon Placeholders**: Stacked layers icon instead of images
6. **View All Link**: Added to gallery heading
7. **Warmer Borders**: #E8E8E6 vs #e8e8e8

## Migration Strategy

1. Create new components with "Paper" prefix
2. Update app/page.tsx to use new components
3. Preserve all existing functionality
4. Test responsive behavior
5. Verify accessibility

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 13+
- Chrome Mobile: Android 8+
