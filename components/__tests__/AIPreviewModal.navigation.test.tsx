/**
 * Test for AIPreviewModal navigation integration (Task 2.2)
 * 
 * Tests the integration of NavigationService into the save workflow
 * and verifies proper navigation behavior after successful saves.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('AIPreviewModal Navigation Integration (Task 2.2)', () => {
  const mockPreviewData: PreviewData = {
    nodes: [
      {
        id: 'node1',
        name: 'Test Node',
        type: 'entity',
        properties: {},
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
  })

  it('should navigate to graph page after successful save with graphId', async () => {
    // Mock successful save with graphId
    const mockOnSave = jest.fn().mockResolvedValue({
      success: true,
      graphId: 'test-graph-id',
      graphName: 'Test Graph',
    })

    // Mock successful navigation
    mockNavigationService.navigateToGraph.mockResolvedValue({
      success: true,
    })

    render(
      <AIPreviewModal
        {...defaultProps}
        onSave={mockOnSave}
      />
    )

    // Click save button
    const saveButton = screen.getByText('💾 保存图谱')
    fireEvent.click(saveButton)

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('图谱保存成功！正在跳转到3D可视化页面...')).toBeInTheDocument()
    })

    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('test-graph-id', expect.any(Object))
    }, { timeout: 2000 })

    // Verify onClose is called after navigation
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should show error when save succeeds but graphId is missing', async () => {
    // Mock successful save without graphId
    const mockOnSave = jest.fn().mockResolvedValue({
      success: true,
      // graphId is missing
    })

    render(
      <AIPreviewModal
        {...defaultProps}
        onSave={mockOnSave}
      />
    )

    // Click save button
    const saveButton = screen.getByText('💾 保存图谱')
    fireEvent.click(saveButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/图谱保存成功，但缺少图谱ID，无法自动跳转/)).toBeInTheDocument()
    })

    // Verify navigation is not called
    expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
  })

  it('should show error when navigation fails', async () => {
    // Mock successful save with graphId
    const mockOnSave = jest.fn().mockResolvedValue({
      success: true,
      graphId: 'test-graph-id',
      graphName: 'Test Graph',
    })

    // Mock failed navigation
    mockNavigationService.navigateToGraph.mockResolvedValue({
      success: false,
      error: 'Navigation failed',
    })

    render(
      <AIPreviewModal
        {...defaultProps}
        onSave={mockOnSave}
      />
    )

    // Click save button
    const saveButton = screen.getByText('💾 保存图谱')
    fireEvent.click(saveButton)

    // Wait for navigation error message (should show the error from NavigationService)
    await waitFor(() => {
      expect(screen.getByText('Navigation failed')).toBeInTheDocument()
    }, { timeout: 2500 })

    // Verify navigation was attempted
    expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith('test-graph-id', expect.any(Object))
  })

  it('should not attempt navigation when enableAutoNavigation is false', async () => {
    // Mock successful save with graphId
    const mockOnSave = jest.fn().mockResolvedValue({
      success: true,
      graphId: 'test-graph-id',
      graphName: 'Test Graph',
    })

    render(
      <AIPreviewModal
        {...defaultProps}
        onSave={mockOnSave}
        enableAutoNavigation={false}
      />
    )

    // Click save button
    const saveButton = screen.getByText('💾 保存图谱')
    fireEvent.click(saveButton)

    // Wait for modal to close
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    // Verify navigation is not called
    expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
  })

  it('should not attempt navigation when save fails', async () => {
    // Mock failed save
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

    // Click save button
    const saveButton = screen.getByText('💾 保存图谱')
    fireEvent.click(saveButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument()
    })

    // Verify navigation is not called
    expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()
  })
})