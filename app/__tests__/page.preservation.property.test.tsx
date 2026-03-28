/**
 * Preservation Property Tests for Homepage Card Click 404 Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * This test verifies that non-project-card interactions continue to work
 * normally after the fix is implemented. These tests should PASS on unfixed code
 * and continue to PASS after the fix.
 * 
 * Preservation behaviors tested:
 * - Page loads and fetches project data correctly
 * - Navigation buttons (开始创作, 登录) work normally
 * - Project cards display correctly in gallery view
 * - Login modal functionality works
 * - Error handling and retry functionality works
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LandingPage from '@/app/page'
import * as fc from 'fast-check'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock userStore
jest.mock('@/lib/userStore', () => ({
  useUserStore: () => ({
    isLoggedIn: false,
    logout: jest.fn(),
    initializeFromStorage: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Preservation Properties: Non-Project-Card Interactions', () => {
  let mockRouter: any

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * Property: Page loads and fetches project data correctly
   * Validates: Requirement 3.1, 3.4
   */
  it('Property: Page loads and displays project cards correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.option(fc.string({ maxLength: 100 })),
            graphCount: fc.integer({ min: 0, max: 100 }),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString()),
            userId: fc.uuid(),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (projects) => {
          // Mock API response
          ;(global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ projects }),
          })

          // Render page
          const { container } = render(<LandingPage />)

          // Wait for projects to load
          await waitFor(() => {
            expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument()
          }, { timeout: 2000 })

          // Verify projects are displayed
          for (const project of projects.slice(0, 12)) {
            expect(screen.getByText(project.name)).toBeInTheDocument()
          }

          // Verify fetch was called correctly
          expect(global.fetch).toHaveBeenCalledWith('/api/projects')
        }
      ),
      { numRuns: 3 } // Reduced runs for faster execution
    )
  })

  /**
   * Property: Navigation to creation page works
   * Validates: Requirement 3.3
   */
  it('Property: Start creating button navigation works', async () => {
    // Mock projects
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: [] }),
    })

    // Mock logged in user
    jest.spyOn(require('@/lib/userStore'), 'useUserStore').mockReturnValue({
      isLoggedIn: true,
      logout: jest.fn(),
      initializeFromStorage: jest.fn(),
    })

    render(<LandingPage />)

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Find and click start creating button
    const startButton = screen.getByRole('button', { name: /开始创作/i })
    await userEvent.click(startButton)

    // Verify navigation was attempted
    expect(mockRouter.push).toHaveBeenCalledWith('/creation')
  })

  /**
   * Property: Login modal opens correctly
   * Validates: Requirement 3.3
   */
  it('Property: Login button opens login modal', async () => {
    // Mock projects
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: [] }),
    })

    render(<LandingPage />)

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Find and click login button
    const loginButton = screen.getByRole('button', { name: /登录/i })
    await userEvent.click(loginButton)

    // Verify modal opens (check for modal content)
    await waitFor(() => {
      // LoginModal should be rendered with isOpen=true
      const modal = document.querySelector('[role="dialog"]')
      expect(modal).toBeInTheDocument()
    })
  })

  /**
   * Property: Error handling and retry works
   * Validates: Requirement 3.4
   */
  it('Property: Error state displays and retry works', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    // Mock window.location.reload
    const reloadMock = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(<LandingPage />)

    // Wait for error to display
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find and click retry button
    const retryButton = screen.getByRole('button', { name: /重试/i })
    await userEvent.click(retryButton)

    // Verify reload was called
    expect(reloadMock).toHaveBeenCalled()
  })

  /**
   * Property: Empty state displays correctly
   * Validates: Requirement 3.1
   */
  it('Property: Empty state displays when no projects', async () => {
    // Mock empty projects
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: [] }),
    })

    render(<LandingPage />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument()
    }, { timeout: 2000 })

    // Verify empty state is displayed
    expect(screen.getByText(/暂无项目/i)).toBeInTheDocument()
    expect(screen.getByText(/还没有创建任何项目/i)).toBeInTheDocument()
  })

  /**
   * Property: Project cards are clickable and have correct accessibility
   * Validates: Requirement 3.1
   */
  it('Property: Project cards have correct accessibility attributes', async () => {
    const testProject = {
      id: 'test-123',
      name: '测试项目',
      description: '测试描述',
      graphCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-123',
    }

    // Mock API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: [testProject] }),
    })

    render(<LandingPage />)

    // Wait for project to load
    await waitFor(() => {
      expect(screen.getByText('测试项目')).toBeInTheDocument()
    })

    // Verify card has correct accessibility attributes
    const card = screen.getByRole('button', { name: '查看项目: 测试项目' })
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('tabIndex', '0')
  })
})
