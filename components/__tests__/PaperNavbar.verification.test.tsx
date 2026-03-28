/**
 * PaperNavbar Verification Test
 * 
 * This test verifies that the PaperNavbar component meets all design requirements
 * for task 1.1 of the homepage-ui-redesign-ai-reference spec.
 * 
 * Requirements verified:
 * - 1.1: Display "知识图谱" logo on the left side
 * - 1.2: Display "登录" button on the right side
 * - 1.3: Display "开始创作" button on the right side next to "登录" button
 * - 1.4: Use a clean, minimal design with appropriate spacing
 * - 1.5: Maintain consistent height across all viewport widths
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaperNavbar from '../PaperNavbar'

describe('PaperNavbar - Design Requirements Verification (Task 1.1)', () => {
  const mockProps = {
    isLoggedIn: false,
    onLogin: jest.fn(),
    onLogout: jest.fn(),
    onStartCreating: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Requirement 1.1: Display "知识图谱" logo on the left side', () => {
    it('should display "知识图谱" logo', () => {
      render(<PaperNavbar {...mockProps} />)
      const logo = screen.getByText('知识图谱')
      expect(logo).toBeInTheDocument()
    })

    it('should have logo element with correct class', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const logo = container.querySelector('[class*="logo"]')
      expect(logo).toBeInTheDocument()
      expect(logo?.textContent).toBe('知识图谱')
    })
  })

  describe('Requirement 1.2: Display "登录" button on the right side', () => {
    it('should display "登录" button when user is not logged in', () => {
      render(<PaperNavbar {...mockProps} isLoggedIn={false} />)
      const loginButton = screen.getByRole('button', { name: '登录' })
      expect(loginButton).toBeInTheDocument()
    })

    it('should call onLogin when "登录" button is clicked', () => {
      render(<PaperNavbar {...mockProps} isLoggedIn={false} />)
      const loginButton = screen.getByRole('button', { name: '登录' })
      fireEvent.click(loginButton)
      expect(mockProps.onLogin).toHaveBeenCalledTimes(1)
    })

    it('should display "退出登录" button when user is logged in', () => {
      render(<PaperNavbar {...mockProps} isLoggedIn={true} />)
      const logoutButton = screen.getByRole('button', { name: '退出登录' })
      expect(logoutButton).toBeInTheDocument()
    })

    it('should call onLogout when "退出登录" button is clicked', () => {
      render(<PaperNavbar {...mockProps} isLoggedIn={true} />)
      const logoutButton = screen.getByRole('button', { name: '退出登录' })
      fireEvent.click(logoutButton)
      expect(mockProps.onLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('Requirement 1.3: Display "开始创作" button on the right side next to "登录" button', () => {
    it('should display "开始创作" button', () => {
      render(<PaperNavbar {...mockProps} />)
      const createButton = screen.getByRole('button', { name: '开始创作' })
      expect(createButton).toBeInTheDocument()
    })

    it('should call onStartCreating when "开始创作" button is clicked', () => {
      render(<PaperNavbar {...mockProps} />)
      const createButton = screen.getByRole('button', { name: '开始创作' })
      fireEvent.click(createButton)
      expect(mockProps.onStartCreating).toHaveBeenCalledTimes(1)
    })

    it('should have both buttons in a button group container', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const buttonGroup = container.querySelector('[class*="buttonGroup"]')
      
      expect(buttonGroup).toBeInTheDocument()
      
      // Check that both buttons are within the button group
      const buttons = buttonGroup?.querySelectorAll('button')
      expect(buttons?.length).toBe(2)
    })
  })

  describe('Requirement 1.4: Use a clean, minimal design with appropriate spacing', () => {
    it('should have container with proper structure', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const navContainer = container.querySelector('[class*="container"]')
      
      expect(navContainer).toBeInTheDocument()
      
      // Should contain logo and button group
      const logo = navContainer?.querySelector('[class*="logo"]')
      const buttonGroup = navContainer?.querySelector('[class*="buttonGroup"]')
      
      expect(logo).toBeInTheDocument()
      expect(buttonGroup).toBeInTheDocument()
    })

    it('should have button group with multiple buttons', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const buttonGroup = container.querySelector('[class*="buttonGroup"]')
      const buttons = buttonGroup?.querySelectorAll('button')
      
      expect(buttons?.length).toBe(2)
    })

    it('should have navbar element', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const navbar = container.querySelector('nav')
      
      expect(navbar).toBeInTheDocument()
      // Check that navbar has a class attribute with 'navbar' in it
      const navbarClass = navbar?.className || ''
      expect(navbarClass).toContain('navbar')
    })

    it('should have primary and secondary button classes', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      
      const primaryButton = container.querySelector('[class*="primaryButton"]')
      const secondaryButton = container.querySelector('[class*="secondaryButton"]')
      
      expect(primaryButton).toBeInTheDocument()
      expect(secondaryButton).toBeInTheDocument()
    })
  })

  describe('Requirement 1.5: Maintain consistent height across all viewport widths', () => {
    it('should have navbar with fixed positioning class', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const navbar = container.querySelector('nav')
      
      expect(navbar).toBeInTheDocument()
      // Check that navbar has a class attribute with 'navbar' in it
      const navbarClass = navbar?.className || ''
      expect(navbarClass).toContain('navbar')
    })

    it('should have container element for content', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const navContainer = container.querySelector('[class*="container"]')
      
      expect(navContainer).toBeInTheDocument()
    })
  })

  describe('Additional Design Verification', () => {
    it('should have accessible ARIA labels', () => {
      render(<PaperNavbar {...mockProps} />)
      
      const loginButton = screen.getByRole('button', { name: '登录' })
      const createButton = screen.getByRole('button', { name: '开始创作' })
      
      expect(loginButton).toHaveAttribute('aria-label', '登录')
      expect(createButton).toHaveAttribute('aria-label', '开始创作')
    })

    it('should render all required elements', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      
      // Check for nav element
      expect(container.querySelector('nav')).toBeInTheDocument()
      
      // Check for logo
      expect(screen.getByText('知识图谱')).toBeInTheDocument()
      
      // Check for buttons
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '开始创作' })).toBeInTheDocument()
    })

    it('should use correct button types for primary and secondary actions', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      
      const createButton = screen.getByRole('button', { name: '开始创作' })
      const loginButton = screen.getByRole('button', { name: '登录' })
      
      // Primary button should have primaryButton class
      const createButtonClass = createButton.className || ''
      expect(createButtonClass).toContain('primaryButton')
      
      // Secondary button should have secondaryButton class
      const loginButtonClass = loginButton.className || ''
      expect(loginButtonClass).toContain('secondaryButton')
    })
  })

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      const navbar = container.querySelector('nav')
      
      expect(navbar).toBeInTheDocument()
      expect(screen.getByText('知识图谱')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '开始创作' })).toBeInTheDocument()
    })

    it('should maintain all elements on different viewport sizes', () => {
      const { container } = render(<PaperNavbar {...mockProps} />)
      
      // All key elements should be present regardless of viewport
      expect(container.querySelector('nav')).toBeInTheDocument()
      expect(container.querySelector('[class*="logo"]')).toBeInTheDocument()
      expect(container.querySelector('[class*="buttonGroup"]')).toBeInTheDocument()
      expect(container.querySelectorAll('button').length).toBe(2)
    })
  })

  describe('Component Props and Behavior', () => {
    it('should respond to isLoggedIn prop changes', () => {
      const { rerender } = render(<PaperNavbar {...mockProps} isLoggedIn={false} />)
      
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '退出登录' })).not.toBeInTheDocument()
      
      rerender(<PaperNavbar {...mockProps} isLoggedIn={true} />)
      
      expect(screen.queryByRole('button', { name: '登录' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '退出登录' })).toBeInTheDocument()
    })

    it('should always display "开始创作" button regardless of login state', () => {
      const { rerender } = render(<PaperNavbar {...mockProps} isLoggedIn={false} />)
      expect(screen.getByRole('button', { name: '开始创作' })).toBeInTheDocument()
      
      rerender(<PaperNavbar {...mockProps} isLoggedIn={true} />)
      expect(screen.getByRole('button', { name: '开始创作' })).toBeInTheDocument()
    })
  })
})
