# InkWashWorkCard Component

A card component for displaying project previews with ink-wash aesthetic styling. Part of the homepage redesign with minimalist, elegant design inspired by traditional Chinese ink-wash painting.

## Features

- **Project Preview**: Displays project thumbnail with fallback placeholder showing project initial
- **Project Information**: Shows project name and graph count metadata
- **Hover Effects**: Subtle elevation, scale transform, and border color shift on hover
- **Accessibility**: Full keyboard navigation support with proper ARIA labels
- **Responsive**: Adapts to different screen sizes with appropriate sizing
- **Smooth Animations**: 0.3s ease transitions for all interactive states

## Props

```typescript
interface InkWashWorkCardProps {
  project: Project
  onClick: (projectId: string) => void
}

interface Project {
  id: string
  name: string
  description?: string
  graphCount?: number
  createdAt?: string
  updatedAt?: string
  userId?: string
  graphs?: Array<{
    id: string
    name: string
    nodeCount: number
    edgeCount: number
  }>
}
```

## Usage

```tsx
import { InkWashWorkCard } from '@/components/InkWashWorkCard'
import { useRouter } from 'next/navigation'

function ProjectGallery({ projects }) {
  const router = useRouter()

  const handleCardClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project?.graphs?.[0]) {
      router.push(`/graph?id=${project.graphs[0].id}`)
    }
  }

  return (
    <div className={styles.grid}>
      {projects.map(project => (
        <InkWashWorkCard
          key={project.id}
          project={project}
          onClick={handleCardClick}
        />
      ))}
    </div>
  )
}
```

## Design Specifications

### Colors (Ink-Wash Palette)

- **Background**: White (#ffffff)
- **Border**: Light gray (#e8e8e8)
- **Border (hover)**: Ink-wash accent (#5a9a8f)
- **Title**: Dark gray (#2c2c2c)
- **Metadata**: Medium gray (#737373)
- **Placeholder**: Muted teal (#5a9a8f) at 30% opacity

### Layout

- **Border Radius**: 12px
- **Image Height**: 200px (desktop), 160px (mobile)
- **Content Padding**: 20px (desktop), 16px (mobile)
- **Gap**: 12px (desktop), 10px (mobile)

### Hover Effects

- **Transform**: translateY(-4px) scale(1.02)
- **Shadow**: 0 12px 24px rgba(0, 0, 0, 0.1)
- **Border Color**: Changes to #5a9a8f
- **Image Scale**: 1.05
- **Transition**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)

### Typography

- **Title**: 18px (desktop), 16px (mobile), font-weight 600
- **Metadata**: 14px, font-weight 400
- **Placeholder**: 64px (desktop), 48px (mobile), font-weight 600

## Accessibility

- **Keyboard Navigation**: Full support with Enter and Space key handlers
- **Focus Indicators**: Visible focus outline with ink-wash accent color
- **ARIA Labels**: Descriptive labels for screen readers
- **Semantic HTML**: Uses `<article>` element with proper role
- **Reduced Motion**: Respects `prefers-reduced-motion` media query

## Responsive Behavior

### Desktop (>768px)
- Image height: 200px
- Content padding: 20px
- Title font size: 18px
- Placeholder font size: 64px

### Mobile (≤767px)
- Image height: 160px
- Content padding: 16px
- Title font size: 16px
- Placeholder font size: 48px

## Integration with Homepage

The InkWashWorkCard is designed to be used within the WorkCardGrid component in the homepage redesign:

```tsx
<GallerySection heading="推荐广场">
  <WorkCardGrid columns={6} gap="24px">
    {projects.map(project => (
      <InkWashWorkCard
        key={project.id}
        project={project}
        onClick={handleProjectClick}
      />
    ))}
  </WorkCardGrid>
</GallerySection>
```

## Requirements Validation

This component validates the following requirements from the homepage redesign spec:

- **Requirement 6.1**: Displays project preview/thumbnail
- **Requirement 6.2**: Displays project title and metadata
- **Requirement 6.3**: Uses ink-wash style aesthetic
- **Requirement 6.4**: Has subtle hover effects
- **Requirement 6.5**: Click handler for navigation
- **Requirement 1.1-1.3**: Light color palette with ink-wash aesthetic
- **Requirement 10.3**: Smooth animations for interactive elements

## Related Components

- **WorkCardGrid**: Grid layout container for multiple cards
- **GallerySection**: Section wrapper with heading
- **InkWashNavbar**: Navigation bar with matching aesthetic
- **HeroSection**: Hero section with matching design system
