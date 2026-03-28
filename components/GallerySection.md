# GallerySection Component

A container component for the work card gallery with a section heading. Provides consistent spacing and max-width constraint for the gallery content.

## Features

- Section heading with ink-wash typography
- Full-width container with max-width constraint (1200px)
- Consistent padding and margin
- Responsive spacing for tablet and mobile viewports
- Clean, minimalist design aligned with ink-wash aesthetic

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `heading` | `string` | Yes | The section heading text (e.g., "推荐广场") |
| `children` | `React.ReactNode` | Yes | The WorkCardGrid and work cards to display |

## Usage

```tsx
import { GallerySection } from '@/components/GallerySection'
import { WorkCardGrid } from '@/components/WorkCardGrid'
import { InkWashWorkCard } from '@/components/InkWashWorkCard'

function HomePage() {
  const projects = [
    // ... your project data
  ]

  return (
    <GallerySection heading="推荐广场">
      <WorkCardGrid>
        {projects.map((project) => (
          <InkWashWorkCard
            key={project.id}
            project={project}
            onClick={(id) => console.log('Clicked:', id)}
          />
        ))}
      </WorkCardGrid>
    </GallerySection>
  )
}
```

## Styling

The component uses CSS modules for styling with the following specifications:

- **Section padding**: 64px vertical (48px on tablet, 32px on mobile)
- **Container max-width**: 1200px
- **Container padding**: 32px horizontal (24px on tablet, 16px on mobile)
- **Heading font-size**: 28px (24px on tablet, 20px on mobile)
- **Heading font-weight**: 600 (semi-bold)
- **Heading color**: #2c2c2c (dark gray)
- **Heading margin-bottom**: 32px (24px on tablet, 20px on mobile)

## Responsive Behavior

The component adapts to different viewport sizes:

- **Desktop (1200px+)**: Full padding and spacing
- **Tablet (768-1199px)**: Reduced padding and font sizes
- **Mobile (<768px)**: Minimal padding and smaller typography

## Design Tokens

The component uses the following design tokens from the ink-wash design system:

- Typography: System font stack
- Colors: Dark gray (#2c2c2c) for heading
- Spacing: Consistent padding and margin values
- Background: White (#ffffff)

## Accessibility

- Uses semantic `<section>` element
- Proper heading hierarchy with `<h2>` for section heading
- Maintains readable font sizes across all viewports
- Sufficient color contrast for text

## Related Components

- **WorkCardGrid**: Responsive grid layout for work cards
- **InkWashWorkCard**: Individual work card component
- **HeroSection**: Hero section component
- **StatisticsDisplay**: Statistics display component

## Requirements Validated

- **Requirement 5.1**: Gallery section displays heading
- **Requirement 8.1**: Consistent spacing between sections
- **Requirement 8.2**: Appropriate margins and padding
- **Requirement 8.3**: Elements align to visual grid
- **Requirement 1.3**: Clean and uncluttered layout
- **Requirement 1.5**: Elegant and readable typography
