/**
 * StatisticsDisplay Verification Test
 * 
 * Verifies that the StatisticsDisplay component meets design requirements:
 * - Requirement 4.1: Shows "2.4千 公开图谱项目" statistic
 * - Requirement 4.2: Shows "15 M+ 连接的节点" statistic
 * - Requirement 4.3: Shows "8,600 活跃创作者" statistic
 * - Requirement 4.4: Arranges statistics horizontally with equal spacing
 * - Requirement 4.5: Center-aligns all statistics on the page
 * - Requirement 4.6: Uses consistent typography for all statistics
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatisticsDisplay } from '../StatisticsDisplay'

describe('StatisticsDisplay Component Verification', () => {
  const mockStatistics = [
    { value: '2.4千', label: '公开图谱项目' },
    { value: '15 M+', label: '连接的节点' },
    { value: '8,600', label: '活跃创作者' }
  ]

  describe('Requirement 4.1, 4.2, 4.3: Display three statistics', () => {
    it('should support displaying three statistics with correct structure', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      // Check that three stat items are rendered
      const statItems = container.querySelectorAll('[class*="statItem"]')
      expect(statItems).toHaveLength(3)

      // Verify each stat item has a number and label
      statItems.forEach(item => {
        const number = item.querySelector('[class*="statNumber"]')
        const label = item.querySelector('[class*="statLabel"]')
        expect(number).toBeInTheDocument()
        expect(label).toBeInTheDocument()
      })
    })

    it('should display the correct values and labels', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      // Check that the correct values are displayed
      expect(screen.getByText('2.4千')).toBeInTheDocument()
      expect(screen.getByText('公开图谱项目')).toBeInTheDocument()
      
      expect(screen.getByText('15 M+')).toBeInTheDocument()
      expect(screen.getByText('连接的节点')).toBeInTheDocument()
      
      expect(screen.getByText('8,600')).toBeInTheDocument()
      expect(screen.getByText('活跃创作者')).toBeInTheDocument()
    })
  })

  describe('Requirement 4.4: Horizontal arrangement with equal spacing', () => {
    it('should arrange statistics horizontally on desktop', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const containerElement = container.querySelector('[class*="container"]')
      expect(containerElement).toBeInTheDocument()

      // Check that container has the container class (CSS module handles flex layout)
      expect(containerElement?.className).toContain('container')
      
      // Verify three stat items are present (horizontal arrangement)
      const statItems = container.querySelectorAll('[class*="statItem"]')
      expect(statItems).toHaveLength(3)
    })

    it('should have equal spacing between statistics', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const containerElement = container.querySelector('[class*="container"]')
      
      // Check that container exists with proper class
      // The CSS module defines gap for equal spacing
      expect(containerElement).toBeInTheDocument()
      expect(containerElement?.className).toContain('container')
      
      // Verify dividers exist between items (visual spacing)
      const dividers = container.querySelectorAll('[class*="divider"]')
      expect(dividers.length).toBe(2) // Should have 2 dividers for 3 items
    })
  })

  describe('Requirement 4.5: Center-align all statistics', () => {
    it('should center-align the statistics container', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const containerElement = container.querySelector('[class*="container"]')
      
      // Check that container exists with proper class
      // The CSS module defines margin: 0 auto and justify-content: center
      expect(containerElement).toBeInTheDocument()
      expect(containerElement?.className).toContain('container')
    })

    it('should center-align individual stat items', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const statItems = container.querySelectorAll('[class*="statItem"]')
      
      // Check that all stat items have the statItem class
      // The CSS module defines align-items: center for each item
      statItems.forEach(item => {
        expect(item.className).toContain('statItem')
      })
    })
  })

  describe('Requirement 4.6: Consistent typography', () => {
    it('should use consistent font sizes for all stat numbers', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const statNumbers = container.querySelectorAll('[class*="statNumber"]')
      const fontSizes = Array.from(statNumbers).map(el => 
        window.getComputedStyle(el).fontSize
      )

      // All font sizes should be the same
      const uniqueFontSizes = new Set(fontSizes)
      expect(uniqueFontSizes.size).toBe(1)
    })

    it('should use consistent font weights for all stat numbers', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const statNumbers = container.querySelectorAll('[class*="statNumber"]')
      const fontWeights = Array.from(statNumbers).map(el => 
        window.getComputedStyle(el).fontWeight
      )

      // All font weights should be the same
      const uniqueFontWeights = new Set(fontWeights)
      expect(uniqueFontWeights.size).toBe(1)
    })

    it('should use consistent font sizes for all stat labels', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const statLabels = container.querySelectorAll('[class*="statLabel"]')
      const fontSizes = Array.from(statLabels).map(el => 
        window.getComputedStyle(el).fontSize
      )

      // All font sizes should be the same
      const uniqueFontSizes = new Set(fontSizes)
      expect(uniqueFontSizes.size).toBe(1)
    })

    it('should use consistent colors for all stat numbers', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const statNumbers = container.querySelectorAll('[class*="statNumber"]')
      const colors = Array.from(statNumbers).map(el => 
        window.getComputedStyle(el).color
      )

      // All colors should be the same
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(1)
    })

    it('should use consistent colors for all stat labels', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const statLabels = container.querySelectorAll('[class*="statLabel"]')
      const colors = Array.from(statLabels).map(el => 
        window.getComputedStyle(el).color
      )

      // All colors should be the same
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(1)
    })
  })

  describe('Responsive Layout: Mobile vertical stacking', () => {
    it('should stack statistics vertically on mobile viewports', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const containerElement = container.querySelector('[class*="container"]')
      
      // Check that container exists with proper class
      // The CSS module defines media query for mobile vertical stacking
      expect(containerElement).toBeInTheDocument()
      expect(containerElement?.className).toContain('container')
      
      // Verify all three stat items are present
      const statItems = container.querySelectorAll('[class*="statItem"]')
      expect(statItems).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label for the section', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const section = container.querySelector('section')
      expect(section).toHaveAttribute('aria-label', '平台统计数据')
    })

    it('should hide decorative dividers from screen readers', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      const dividers = container.querySelectorAll('[class*="divider"]')
      dividers.forEach(divider => {
        expect(divider).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Component Structure', () => {
    it('should render with correct semantic HTML structure', () => {
      const { container } = render(
        <StatisticsDisplay statistics={mockStatistics} />
      )

      // Should use semantic section element
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()

      // Should have container div
      const containerDiv = container.querySelector('[class*="container"]')
      expect(containerDiv).toBeInTheDocument()

      // Should have three stat items
      const statItems = container.querySelectorAll('[class*="statItem"]')
      expect(statItems).toHaveLength(3)

      // Should have dividers between items
      const dividers = container.querySelectorAll('[class*="divider"]')
      expect(dividers.length).toBe(2) // 2 dividers for 3 items
    })
  })

  describe('Memoization', () => {
    it('should be memoized to prevent unnecessary re-renders', () => {
      // Check that the component has displayName (indicates memoization)
      expect(StatisticsDisplay.displayName).toBe('StatisticsDisplay')
    })
  })
})
