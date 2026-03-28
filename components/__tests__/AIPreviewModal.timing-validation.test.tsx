/**
 * AI Preview Modal Timing Validation Tests
 * 
 * Task 9.3: Performance and timing validation
 * - Verify navigation occurs within 1-2 seconds
 * - Test loading state transitions
 * - Validate success message display timing
 * - Requirements: 4.2, 4.3
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import AIPreviewModal, { AIPreviewModalProps, PreviewData } from '../AIPreviewModal'
import { NavigationService } from '@/lib/services/navigation-service'

// Mock NavigationService
jest.mock('@/lib/services/navigation-service')
const mockNavigationService = NavigationService as jest.Mocked<typeof NavigationService>

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Preview3DGraph component
jest.mock('../Preview3DGraph', () => {
  return {
    __esModule: true,
    default: ({ nodes, edges }: any) => (
      <div data-testid="preview-3d-graph">
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
      </div>
    ),
  }
})

// Mock graph layouts
jest.mock('@/lib/graph-layouts', () => ({
  applyLayout: (nodes: any[], edges: any[]) => ({
    nodes: nodes.map((node, index) => ({
      ...node,
      x: index * 10,
      y: index * 10,
    })),
    analysis: {
      recommendedLayout: 'force',
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density: 0.5,
      hasHierarchy: false,
      hasCycles: false,
    },
  }),
}))

describe('AIPreviewModal Timing Validation', () => {
  const mockPreviewData: PreviewData = {
    nodes: [
      {
        id: 'node1',
        name: 'Test Node 1',
        type: 'concept',
        properties: { description: 'Test node 1' },
      },
    ],
    edges: [],
    stats: {
      totalNodes: 1,
      totalEdges: 0,
      duplicateNodes: 0,
      redundantEdges: 0,
      conflicts: 0,
    },
  }

  const defaultProps: AIPreviewModalProps = {
    isOpen: true,
    onClose: jest.fn(),
    data: mockPreviewData,
    onSave: jest.fn(),
    visualizationType: '3d',
    enableAutoNavigation: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Reset NavigationService mocks
    mockNavigationService.navigateToGraph.mockReset()
    mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Core Timing Requirements (4.2, 4.3)', () => {
    it('should display success message for 1-2 seconds before navigation', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'timing-test-123',
        graphName: 'Timing Test Graph',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Start save process
      fireEvent.click(saveButton)

      // Wait for success message to appear
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Verify navigation hasn't started yet
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward 1.4 seconds (just before 1.5s threshold)
      act(() => {
        jest.advanceTimersByTime(1400)
      })

      // Navigation should still not have started
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward the remaining 100ms to reach 1.5s
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Now navigation should be triggered
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('timing-test-123', expect.any(Object))
      })
    })

    it('should complete navigation workflow within acceptable time bounds', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'workflow-test-456',
        graphName: 'Workflow Test Graph',
      })

      // Mock fast navigation
      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Start the workflow
      fireEvent.click(saveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Fast-forward through success message timing (1.5 seconds)
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation to complete
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      // Verify the timing was within requirements
      // Success message should be displayed for ~1.5 seconds (requirement 4.2)
      // Navigation should occur within 1-2 seconds after save (requirement 4.3)
      expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('workflow-test-456', expect.any(Object))
    })

    it('should handle configurable timing settings', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'configurable-test-789',
        graphName: 'Configurable Test Graph',
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

      // Test minimum timing (1 second)
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      // Should still be showing success message
      expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Test standard timing (1.5 seconds total)
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Now navigation should be triggered
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
    })
  })

  describe('Loading State Performance', () => {
    it('should show loading states immediately without delay', async () => {
      const mockOnSave = jest.fn().mockImplementation(async () => {
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          success: true,
          graphId: 'loading-test-123',
          graphName: 'Loading Test Graph',
        }
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Click save and verify loading state appears immediately
      fireEvent.click(saveButton)

      // Loading state should appear immediately
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      // Wait for save completion
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Loading state should be cleared
      expect(screen.queryByText('💾 保存中...')).not.toBeInTheDocument()
    })

    it('should handle state transitions smoothly', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'smooth-test-456',
        graphName: 'Smooth Test Graph',
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Initial state
      expect(screen.getByText('💾 保存图谱')).toBeInTheDocument()
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

      // Navigation should be triggered
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
    })
  })

  describe('Performance Benchmarks', () => {
    it('should render modal quickly', () => {
      const startTime = performance.now()

      render(
        <AIPreviewModal
          {...defaultProps}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Modal should render quickly (within 100ms)
      expect(renderTime).toBeLessThan(100)

      // Verify modal is rendered
      expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
    })

    it('should handle rapid user interactions gracefully', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'rapid-test-789',
        graphName: 'Rapid Test Graph',
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
      fireEvent.click(saveButton) // Second click should be ignored
      fireEvent.click(saveButton) // Third click should be ignored

      // Verify only one save operation
      expect(mockOnSave).toHaveBeenCalledTimes(1)

      // Verify loading state
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })
    })

    it('should validate timing requirements are met', async () => {
      // This test validates that the timing constants meet the requirements
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'validation-test-123',
        graphName: 'Validation Test Graph',
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

      // Test that navigation occurs within the 1-2 second requirement
      // The default timing is 1.5 seconds, which meets requirement 4.2
      
      // Should not navigate before 1 second (too fast)
      act(() => {
        jest.advanceTimersByTime(900)
      })
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Should navigate by 2 seconds (within requirement 4.3)
      act(() => {
        jest.advanceTimersByTime(700) // Total: 1.6 seconds
      })

      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      // Verify timing is within 1-2 second requirement
      expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('validation-test-123', expect.any(Object))
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle navigation errors quickly', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'error-test-123',
        graphName: 'Error Test Graph',
      })

      // Mock navigation failure
      mockNavigationService.navigateToGraph.mockResolvedValue({
        success: false,
        error: 'Navigation failed',
        errorType: 'navigation_failed' as any,
        recoveryStrategy: 'fallback_ui' as any,
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

      // Fast-forward through timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation attempt and error handling
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      // Error should be handled quickly and displayed
      await waitFor(() => {
        expect(screen.getByText(/导航失败/)).toBeInTheDocument()
      })
    })

    it('should handle save errors without navigation attempts', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: false,
        error: 'Save failed',
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
        expect(screen.getByText('Save failed')).toBeInTheDocument()
      })

      // Navigation should not be attempted for failed saves
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward to ensure no delayed navigation
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
    })
  })
})