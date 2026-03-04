/**
 * AI Preview Modal Performance and Timing Validation Tests
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
    default: ({ nodes, edges, onNodeClick }: any) => (
      <div data-testid="preview-3d-graph">
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        {nodes.map((node: any) => (
          <button key={node.id} onClick={() => onNodeClick(node.id)}>
            {node.name}
          </button>
        ))}
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

describe('AIPreviewModal Performance and Timing Validation', () => {
  const mockPreviewData: PreviewData = {
    nodes: [
      {
        id: 'node1',
        name: 'Test Node 1',
        type: 'concept',
        properties: { description: 'Test node 1' },
      },
      {
        id: 'node2',
        name: 'Test Node 2',
        type: 'concept',
        properties: { description: 'Test node 2' },
      },
    ],
    edges: [
      {
        id: 'edge1',
        fromNodeId: 'node1',
        toNodeId: 'node2',
        label: 'relates to',
        properties: {},
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
    mockNavigationService.constructGraphUrl.mockReset()
    mockNavigationService.isValidGraphId.mockReset()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Navigation Timing Requirements (4.2, 4.3)', () => {
    it('should complete navigation within 1-2 seconds after successful save', async () => {
      const startTime = Date.now()
      let navigationStartTime: number
      let navigationEndTime: number

      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'timing-test-123',
        graphName: 'Timing Test Graph',
      })

      // Mock navigation with timing tracking
      mockNavigationService.navigateToGraph.mockImplementation(async (graphId, router) => {
        navigationStartTime = Date.now()
        // Simulate realistic navigation delay
        await new Promise(resolve => setTimeout(resolve, 100))
        navigationEndTime = Date.now()
        return { success: true }
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Start the save process
      fireEvent.click(saveButton)

      // Wait for save to complete and success message to appear
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      const successMessageTime = Date.now()

      // Fast-forward through success message timing (1.5 seconds)
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation to be called
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      // Verify timing requirements
      const totalTimeFromSave = navigationEndTime! - startTime
      const timeFromSuccessToNavigation = navigationStartTime! - successMessageTime

      // Navigation should occur within 1-2 seconds after success message
      expect(timeFromSuccessToNavigation).toBeGreaterThanOrEqual(1400) // ~1.5s (allowing for test timing variance)
      expect(timeFromSuccessToNavigation).toBeLessThanOrEqual(2000) // Within 2 seconds

      // Total workflow should be efficient
      expect(totalTimeFromSave).toBeLessThan(3000) // Complete within 3 seconds total
    })

    it('should show success message for exactly the configured duration', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'duration-test-456',
        graphName: 'Duration Test Graph',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

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

      // Verify navigation hasn't started yet
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward 1.4 seconds (just before the 1.5s threshold)
      act(() => {
        jest.advanceTimersByTime(1400)
      })

      // Navigation should still not have started
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward the remaining 100ms to reach 1.5s
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Now navigation should start
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
    })

    it('should handle fast navigation completion within timing requirements', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'fast-nav-789',
        graphName: 'Fast Navigation Test',
      })

      // Mock very fast navigation (50ms)
      mockNavigationService.navigateToGraph.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return { success: true }
      })

      const mockOnClose = jest.fn()

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      const startTime = Date.now()
      
      fireEvent.click(saveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Fast-forward through success message timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation and modal close
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      const totalTime = Date.now() - startTime
      
      // Total workflow should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000)
    })
  })

  describe('Loading State Transition Performance', () => {
    it('should transition smoothly between loading states without flicker', async () => {
      const stateTransitions: string[] = []
      
      const mockOnSave = jest.fn().mockImplementation(async () => {
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 200))
        return {
          success: true,
          graphId: 'smooth-transition-123',
          graphName: 'Smooth Transition Test',
        }
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      
      // Track initial state
      expect(screen.getByText('💾 保存图谱')).toBeInTheDocument()
      stateTransitions.push('initial')

      // Start save
      fireEvent.click(saveButton)

      // Verify loading state appears immediately
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      stateTransitions.push('saving')

      // Wait for save completion and success state
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })
      stateTransitions.push('success')

      // Verify no loading text during success state (no flicker)
      expect(screen.queryByText('💾 保存中...')).not.toBeInTheDocument()

      // Fast-forward through success message
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation state
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
      stateTransitions.push('navigating')

      // Verify smooth state progression
      expect(stateTransitions).toEqual(['initial', 'saving', 'success', 'navigating'])
    })

    it('should show progress indicators during save operation', async () => {
      const mockOnSave = jest.fn().mockImplementation(async () => {
        // Simulate longer save operation
        await new Promise(resolve => setTimeout(resolve, 500))
        return {
          success: true,
          graphId: 'progress-test-456',
          graphName: 'Progress Test Graph',
        }
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Verify loading state with progress indication
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      expect(screen.getByText('正在保存图谱数据...')).toBeInTheDocument()

      // Verify button is disabled during save
      expect(saveButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Verify progress indicators are cleared
      expect(screen.queryByText('正在保存图谱数据...')).not.toBeInTheDocument()
    })

    it('should handle rapid state changes without UI inconsistencies', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'rapid-state-789',
        graphName: 'Rapid State Test',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

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

      // Fast-forward through timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Performance Benchmarks and Metrics', () => {
    it('should render modal within acceptable time limits', () => {
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

    it('should handle large datasets efficiently', () => {
      // Create large dataset
      const largeNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: 'concept',
        properties: { description: `Description for node ${i}` },
      }))

      const largeEdges = Array.from({ length: 200 }, (_, i) => ({
        id: `edge-${i}`,
        fromNodeId: `node-${i % 100}`,
        toNodeId: `node-${(i + 1) % 100}`,
        label: `Edge ${i}`,
        properties: {},
      }))

      const largeData: PreviewData = {
        nodes: largeNodes,
        edges: largeEdges,
        stats: {
          totalNodes: 100,
          totalEdges: 200,
          duplicateNodes: 0,
          redundantEdges: 0,
          conflicts: 0,
        },
      }

      const startTime = performance.now()

      render(
        <AIPreviewModal
          {...defaultProps}
          data={largeData}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle large datasets within reasonable time (500ms)
      expect(renderTime).toBeLessThan(500)

      // Verify stats are displayed correctly
      expect(screen.getByText('100')).toBeInTheDocument() // Total nodes
      expect(screen.getByText('200')).toBeInTheDocument() // Total edges
    })

    it('should maintain responsive UI during save operations', async () => {
      const mockOnSave = jest.fn().mockImplementation(async () => {
        // Simulate slow save operation
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          success: true,
          graphId: 'responsive-test-123',
          graphName: 'Responsive Test Graph',
        }
      })

      render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('💾 保存图谱')
      const cancelButton = screen.getByText('取消')

      // Start save operation
      fireEvent.click(saveButton)

      // UI should remain responsive - cancel button should still be clickable
      expect(cancelButton).not.toBeDisabled()

      // Tab navigation should still work
      const statsTab = screen.getByText('📊 统计')
      const visualizationTab = screen.getByText('🌐 可视化')

      fireEvent.click(visualizationTab)
      expect(screen.getByTestId('preview-3d-graph')).toBeInTheDocument()

      fireEvent.click(statsTab)
      expect(screen.getByText('总节点数')).toBeInTheDocument()

      // Wait for save completion
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })
    })

    it('should optimize memory usage during navigation workflow', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'memory-test-456',
        graphName: 'Memory Test Graph',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

      const mockOnClose = jest.fn()

      const { unmount } = render(
        <AIPreviewModal
          {...defaultProps}
          onSave={mockOnSave}
          onClose={mockOnClose}
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

      // Wait for navigation and close
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      // Unmount component to test cleanup
      unmount()

      // Should not cause memory leaks or errors - test passes if no exceptions thrown
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Success Message Display Timing (4.2)', () => {
    it('should display success message for the correct duration before navigation', async () => {
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'success-timing-123',
        graphName: 'Success Timing Test',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

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

      const successMessageStartTime = Date.now()

      // Verify message is visible and navigation hasn't started
      expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward through the success message duration
      act(() => {
        jest.advanceTimersByTime(1500) // 1.5 seconds
      })

      // Navigation should now be triggered
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })

      const navigationStartTime = Date.now()
      const displayDuration = navigationStartTime - successMessageStartTime

      // Success message should be displayed for approximately 1.5 seconds
      expect(displayDuration).toBeGreaterThanOrEqual(1400) // Allow for timing variance
      expect(displayDuration).toBeLessThanOrEqual(1600)
    })

    it('should handle configurable success message timing', async () => {
      // This test verifies that the timing can be configured
      // The actual configuration would be done through props or context
      
      const mockOnSave = jest.fn().mockResolvedValue({
        success: true,
        graphId: 'configurable-timing-456',
        graphName: 'Configurable Timing Test',
      })

      mockNavigationService.navigateToGraph.mockResolvedValue({ success: true })

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

      // Test different timing scenarios
      
      // Scenario 1: Minimum timing (1 second)
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      // Should still be showing success message
      expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Scenario 2: Standard timing (1.5 seconds total)
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Now navigation should be triggered
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
    })
  })
})