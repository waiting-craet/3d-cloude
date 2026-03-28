# HeroSection Component

The HeroSection component is the primary content area of the homepage, displaying the main title, subtitle, and search functionality with an elegant ink-wash aesthetic.

## Features

- **Subtle Gradient Background**: Linear gradient from light gray (#f5f5f5) to white (#ffffff)
- **Centered Layout**: Content is centered with generous vertical padding (80-120px)
- **Search Input**: Rounded search input with icon and subtle shadow
- **Responsive Design**: Adapts to mobile, tablet, and desktop viewports
- **Semantic HTML**: Uses proper heading hierarchy (h1 for title)
- **Accessibility**: Includes ARIA labels and keyboard navigation support

## Props

```typescript
interface HeroSectionProps {
  title: string          // Main heading text
  subtitle: string       // Descriptive subtitle text
  onSearch?: (query: string) => void  // Optional search callback
}
```

## Usage

```tsx
import HeroSection from '@/components/HeroSection'

function HomePage() {
  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Searching for:', query)
  }

  return (
    <HeroSection
      title="构建与发现知识的无尽脉络"
      subtitle="在这里，每一个想法都能找到它的位置，每一条知识都能连接成网络"
      onSearch={handleSearch}
    />
  )
}
```

## Design Specifications

### Typography
- **Title**: 48px (desktop), 40px (tablet), 32px (mobile), semi-bold, dark gray (#2c2c2c)
- **Subtitle**: 18px (desktop), 17px (tablet), 16px (mobile), regular, medium gray (#666666)

### Spacing
- **Vertical Padding**: 80px (desktop), 64px (tablet), 48px (mobile)
- **Container Max Width**: 800px
- **Search Input Max Width**: 500px

### Colors
- **Background**: Linear gradient from #f5f5f5 to #ffffff
- **Title**: #2c2c2c (dark gray)
- **Subtitle**: #666666 (medium gray)
- **Search Border**: #e8e8e8 (light gray)
- **Search Focus**: #5a9a8f (ink-wash accent)

### Effects
- **Search Shadow**: Subtle shadow (0 2px 8px rgba(0, 0, 0, 0.04))
- **Focus Shadow**: Enhanced shadow (0 4px 12px rgba(90, 154, 143, 0.15))
- **Transitions**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)

## Responsive Breakpoints

- **Desktop**: >= 1200px (48px title, 80px padding)
- **Tablet**: 768px - 1199px (40px title, 64px padding)
- **Mobile**: < 768px (32px title, 48px padding)

## Accessibility

- Uses semantic HTML (`<section>`, `<h1>`, `<p>`, `<form>`)
- Search input has `aria-label` for screen readers
- Search icon has `aria-hidden="true"` to prevent duplication
- Keyboard accessible (Tab to focus, Enter to submit)
- Sufficient color contrast (WCAG AA compliant)

## Requirements Validated

- **3.1**: Displays the title "构建与发现知识的无尽脉络"
- **3.2**: Displays a descriptive subtitle
- **3.3**: Includes a search input field with an icon
- **3.4**: Positioned prominently near the top of the page
- **3.5**: Uses visual hierarchy (title larger than subtitle)
- **1.1**: Uses light color palette
- **1.2**: Incorporates ink-wash style visual elements
- **1.3**: Maintains clean layout with appropriate whitespace
- **1.5**: Uses elegant and readable typography

## Example

See `components/examples/HeroSectionExample.tsx` for a complete usage example.
