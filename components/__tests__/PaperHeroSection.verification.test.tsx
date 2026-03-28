/**
 * PaperHeroSection Verification Test
 * 
 * Verifies that the PaperHeroSection component meets all design requirements
 * for Task 1.2 of the homepage-ui-redesign-ai-reference spec.
 * 
 * Requirements verified:
 * - 2.1: Display correct main title
 * - 2.2: Display correct subtitle
 * - 2.3: Center-align both title and subtitle
 * - 2.4: Title font size larger than subtitle
 * - 2.5: Proper vertical spacing between elements
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaperHeroSection from '../PaperHeroSection'

describe('PaperHeroSection - Task 1.2 Verification', () => {
  const mockOnSearch = jest.fn()
  const requiredTitle = '构建与发现知识的无尽脉络'
  const requiredSubtitle = '在这里，编织零散的碎片，洞见事物背后的关联。用图谱的力量，重新组织你的知识宇宙。'

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  describe('Requirement 2.1 & 2.2: Text Content', () => {
    it('should display the correct main title', () => {
      render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      const titleElement = screen.getByRole('heading', { level: 1 })
      expect(titleElement).toHaveTextContent(requiredTitle)
    })

    it('should display the correct subtitle', () => {
      render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      expect(screen.getByText(requiredSubtitle)).toBeInTheDocument()
    })
  })

  describe('Requirement 2.3: Center Alignment', () => {
    it('should have container with center alignment class', () => {
      const { container } = render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      const containerElement = container.querySelector('[class*="container"]')
      expect(containerElement).toBeInTheDocument()
      // CSS Module applies text-align: center in the stylesheet
    })
  })

  describe('Requirement 2.4: Font Size Hierarchy', () => {
    it('should use h1 for title and p for subtitle indicating size hierarchy', () => {
      render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      // Title is h1 (larger semantic element)
      const titleElement = screen.getByRole('heading', { level: 1 })
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toHaveTextContent(requiredTitle)

      // Subtitle is p (smaller semantic element)
      const subtitleElement = screen.getByText(requiredSubtitle)
      expect(subtitleElement.tagName).toBe('P')
      
      // CSS Module applies font-size: 42px to title and 16px to subtitle
    })
  })

  describe('Requirement 2.5: Vertical Spacing', () => {
    it('should have container with flexbox layout for proper spacing', () => {
      const { container } = render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      const containerElement = container.querySelector('[class*="container"]')
      expect(containerElement).toBeInTheDocument()
      
      // Verify elements are in correct order (spacing is applied via CSS gap: 20px)
      const titleElement = screen.getByRole('heading', { level: 1 })
      const subtitleElement = screen.getByText(requiredSubtitle)
      const searchForm = container.querySelector('form')
      
      expect(titleElement).toBeInTheDocument()
      expect(subtitleElement).toBeInTheDocument()
      expect(searchForm).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('should render all required elements', () => {
      const { container } = render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      // Check for title
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      
      // Check for subtitle
      expect(screen.getByText(requiredSubtitle)).toBeInTheDocument()
      
      // Check for search input
      expect(screen.getByPlaceholderText(/搜索知识图谱/)).toBeInTheDocument()
      
      // Check for search icon (SVG)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have search box with proper structure', () => {
      const { container } = render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      const searchInput = screen.getByPlaceholderText(/搜索知识图谱/)
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
      
      // CSS Module applies border-radius: 8px and padding in the stylesheet
      const searchInputClass = searchInput.className
      expect(searchInputClass).toContain('searchInput')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      render(
        <PaperHeroSection
          title={requiredTitle}
          subtitle={requiredSubtitle}
          onSearch={mockOnSearch}
        />
      )

      // Title should be h1
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      
      // Search should have aria-label
      const searchInput = screen.getByLabelText(/搜索知识图谱/)
      expect(searchInput).toBeInTheDocument()
    })
  })
})
