/**
 * End-to-End Workflow Integration Tests for AIPreviewModal
 * 
 * Task 9.1: Create end-to-end integration tests
 * - Test complete save-to-navigation workflow with actual modal interactions
 * - Verify timing and state management in modal context
 * - Test error scenarios and recovery within modal
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import AIPreviewModal, { PreviewData } from '../AIPreviewModal'
import { NavigationService } from '@/lib/services/navigation-service'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock NavigationService
jest.mock('@/lib/services/navigation-service', () => ({
  NavigationService: {
    navigateToGraph: jest.fn(),
  },
}))

const mockNavigationService = NavigationService as jest.Mocked<typeof NavigationService>

describe('AIPreviewModal End-to-End Workflow Integration', () => {
  const mockPreviewData: PreviewData = {
    nodes: [
      {
        id: 'node1',
        name: 'Test Node 1',
        type: 'entity',
        properties: { description: 'First test node' },
      },
      {
        id: 'node2',
        name: 'Test Node 2',
        type: 'concept',
        properties: { category: 'test' },
      },
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        label: 'connects to',
        type: 'relationship',
      },
    ],
    stats: {
      totalNodes: 2,
      totalEdges: 1,
      duplicateNodes: 0,
      redundantEdges: 0,
      conflicts: 0,
    },
  }

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    data: mockPreviewData,
    onSave: jest.fn(),
    visualizationType: '3d' as const,
    enableAutoNavigation: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Complete Save-to-Navigation Workflow', () => {
    it('should execute complete workflow: save → loading → success → navigation → close', async () => {
      // Mock successful save with graphId
      const mockOnSave = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              graphId: 'workflow-test-123',
              graphName: 'Workflow Test Graph',
            })
          }, 500) // Simulate API delay
        })
      })

      // Mock successful navigation
      mockNavigationService.navigateToGraph.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)) // Simulate navigation delay
        return { success: true }
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      // Verify modal is open and shows data
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()

      // Click save button
      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Verify loading state
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      // Fast-forward through save delay
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Wait for save to complete and success message to appear
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Fast-forward through success message display time (1.5 seconds)
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation to be called
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith(
          'workflow-test-123',
          expect.any(Object)
        )
      })

      // Fast-forward through navigation delay
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // Wait for modal to close after successful navigation
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle timing correctly with 1-2 second success message display', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'timing-test-456',
        graphName: 'Timing Test Graph',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: true,
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Verify navigation hasn't been called yet (success message still showing)
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward 1.5 seconds (within the 1-2 second requirement)
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Now navigation should be called
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
    })
  })
  describe('Error Scenarios and Recovery', () => {
    it('should handle missing graphId error and remain open', async () => {
      // Mock successful save without graphId
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        // graphId is missing
        graphName: 'Test Graph',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/图谱保存成功，但缺少图谱ID，无法自动跳转/)).toBeInTheDocument()
      })

      // Verify modal remains open
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      
      // Verify navigation is not attempted
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
      
      // Verify onClose is not called
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('should handle navigation failure with fallback message', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'nav-fail-test-789',
        graphName: 'Navigation Fail Test',
      })

      // Mock navigation failure
      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: false,
        error: 'Navigation failed. Please manually navigate to the graph.',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for success message first
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Fast-forward through success message timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation error message
      await waitFor(() => {
        expect(screen.getByText('导航失败，请手动查看已保存的图谱')).toBeInTheDocument()
      }, { timeout: 2500 })

      // Verify navigation was attempted
      expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('nav-fail-test-789', expect.any(Object))
      
      // Verify modal remains open for user to see error
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
    })

    it('should not attempt navigation when save fails', async () => {
      // Mock failed save
      const mockOnSave = jest.fn().mockResolvedValue({
        success: false,
        error: 'Save operation failed due to server error',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Save operation failed due to server error')).toBeInTheDocument()
      })

      // Verify navigation is not attempted
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
      
      // Verify modal remains open
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Network connection failed'))

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for error handling
      await waitFor(() => {
        // The modal should handle the error gracefully
        expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      })

      // Verify navigation is not attempted
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
    })
  })

  describe('State Management and Loading States', () => {
    it('should manage loading states correctly during save operation', async () => {
      const mockOnSave = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              graphId: 'loading-test-123',
              graphName: 'Loading Test Graph',
            })
          }, 1000)
        })
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: true,
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Verify initial state
      expect(saveButton).not.toBeDisabled()
      expect(screen.queryByText('💾 保存中...')).not.toBeInTheDocument()

      // Click save
      fireEvent.click(saveButton)

      // Verify loading state
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      // Fast-forward through save operation
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Verify loading state is cleared
      expect(screen.queryByText('💾 保存中...')).not.toBeInTheDocument()
    })

    it('should show navigation loading state', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'nav-loading-test-456',
        graphName: 'Navigation Loading Test',
      })

      // Mock navigation with delay
      mockNavigationService.navigateToGraph.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 800))
        return { success: true }
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Fast-forward through success message timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation to be called
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      // Verify navigation is in progress (navigation message should be visible during navigation)
      expect(screen.getByText('正在跳转到3D可视化页面...')).toBeInTheDocument()

      // Fast-forward through navigation delay
      act(() => {
        jest.advanceTimersByTime(800)
      })

      // Wait for modal to close after navigation completes
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })
  })
  describe('Backward Compatibility and Configuration', () => {
    it('should not attempt navigation when enableAutoNavigation is false', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'no-nav-test-123',
        graphName: 'No Navigation Test',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
          enableAutoNavigation={false}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for modal to close (should close immediately after save without navigation)
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })

      // Verify navigation is not attempted
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
    })

    it('should maintain existing functionality when auto-navigation is disabled', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'legacy-test-456',
        graphName: 'Legacy Test Graph',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
          enableAutoNavigation={false}
        />
      )

      // Verify modal shows all expected content
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()

      // Verify save functionality works
      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })

      // Verify modal closes after save (legacy behavior)
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle undefined enableAutoNavigation prop (default behavior)', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'default-test-789',
        graphName: 'Default Test Graph',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: true,
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
          enableAutoNavigation={undefined}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Fast-forward through success message timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Verify navigation is attempted (default should be enabled)
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('default-test-789', expect.any(Object))
      })
    })
  })

  describe('Performance and User Experience', () => {
    it('should provide smooth transitions between states', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'smooth-test-123',
        graphName: 'Smooth Transition Test',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: true,
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Initial state
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      expect(saveButton).not.toBeDisabled()

      // Click save
      fireEvent.click(saveButton)

      // Loading state
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      // Success state
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Verify no loading text during success state
      expect(screen.queryByText('💾 保存中...')).not.toBeInTheDocument()

      // Fast-forward through success message
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Navigation and close
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('should handle rapid user interactions gracefully', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'rapid-test-456',
        graphName: 'Rapid Interaction Test',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: true,
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Rapid clicks should not cause issues
      fireEvent.click(saveButton)
      fireEvent.click(saveButton)
      fireEvent.click(saveButton)

      // Should only call save once
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
      })

      // Should still complete workflow normally
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })
    })
  })
})