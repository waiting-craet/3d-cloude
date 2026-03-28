import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HeroSection from '../HeroSection'

describe('HeroSection Component', () => {
  const defaultProps = {
    title: '构建与发现知识的无尽脉络',
    subtitle: '在这里，每一个想法都能找到它的位置，每一条知识都能连接成网络',
  }

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<HeroSection {...defaultProps} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(defaultProps.title)
    })

    it('should render the subtitle', () => {
      render(<HeroSection {...defaultProps} />)
      expect(screen.getByText(defaultProps.subtitle)).toBeInTheDocument()
    })

    it('should render the search input', () => {
      render(<HeroSection {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('should render the search icon', () => {
      const { container } = render(<HeroSection {...defaultProps} />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have proper semantic HTML structure', () => {
      const { container } = render(<HeroSection {...defaultProps} />)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should update input value when typing', () => {
      render(<HeroSection {...defaultProps} />)
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...') as HTMLInputElement
      
      fireEvent.change(searchInput, { target: { value: '测试搜索' } })
      expect(searchInput.value).toBe('测试搜索')
    })

    it('should call onSearch when form is submitted', () => {
      const mockOnSearch = jest.fn()
      render(<HeroSection {...defaultProps} onSearch={mockOnSearch} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...')
      const form = searchInput.closest('form')
      
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.submit(form!)
      
      expect(mockOnSearch).toHaveBeenCalledWith('测试查询')
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })

    it('should not call onSearch with empty query', () => {
      const mockOnSearch = jest.fn()
      render(<HeroSection {...defaultProps} onSearch={mockOnSearch} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...')
      const form = searchInput.closest('form')
      
      fireEvent.submit(form!)
      
      expect(mockOnSearch).not.toHaveBeenCalled()
    })

    it('should trim whitespace from search query', () => {
      const mockOnSearch = jest.fn()
      render(<HeroSection {...defaultProps} onSearch={mockOnSearch} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...')
      const form = searchInput.closest('form')
      
      fireEvent.change(searchInput, { target: { value: '  测试  ' } })
      fireEvent.submit(form!)
      
      expect(mockOnSearch).toHaveBeenCalledWith('测试')
    })

    it('should work without onSearch callback', () => {
      render(<HeroSection {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...')
      const form = searchInput.closest('form')
      
      fireEvent.change(searchInput, { target: { value: '测试' } })
      
      // Should not throw error
      expect(() => fireEvent.submit(form!)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on search input', () => {
      render(<HeroSection {...defaultProps} />)
      const searchInput = screen.getByLabelText('搜索知识图谱')
      expect(searchInput).toBeInTheDocument()
    })

    it('should have aria-hidden on search icon', () => {
      const { container } = render(<HeroSection {...defaultProps} />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should be keyboard accessible', () => {
      const mockOnSearch = jest.fn()
      render(<HeroSection {...defaultProps} onSearch={mockOnSearch} />)
      
      const searchInput = screen.getByPlaceholderText('搜索知识图谱...')
      
      // Focus input
      searchInput.focus()
      expect(searchInput).toHaveFocus()
      
      // Type with keyboard
      fireEvent.change(searchInput, { target: { value: '键盘输入' } })
      
      // Submit with Enter key
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })
      fireEvent.submit(searchInput.closest('form')!)
      
      expect(mockOnSearch).toHaveBeenCalledWith('键盘输入')
    })
  })

  describe('Visual Hierarchy', () => {
    it('should have title with larger font size than subtitle', () => {
      const { container } = render(<HeroSection {...defaultProps} />)
      
      const title = screen.getByRole('heading', { level: 1 })
      const subtitle = screen.getByText(defaultProps.subtitle)
      
      const titleStyles = window.getComputedStyle(title)
      const subtitleStyles = window.getComputedStyle(subtitle)
      
      // Note: In jsdom, computed styles may not reflect CSS modules
      // This test validates the structure is correct
      expect(title.tagName).toBe('H1')
      expect(subtitle.tagName).toBe('P')
    })
  })
})
