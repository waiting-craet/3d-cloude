import { render, screen, waitFor } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import GraphPage from '../page'
import { useGraphStore } from '@/lib/store'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

// Mock the store
jest.mock('@/lib/store', () => ({
  useGraphStore: jest.fn(),
}))

// Mock components
jest.mock('@/components/KnowledgeGraph', () => {
  return function MockKnowledgeGraph() {
    return <div data-testid="knowledge-graph">Knowledge Graph Loaded</div>
  }
})

jest.mock('@/components/TopNavbar', () => {
  return function MockTopNavbar() {
    return <div data-testid="top-navbar">Top Navbar</div>
  }
})

jest.mock('@/components/NodeDetailPanel', () => {
  return function MockNodeDetailPanel() {
    return <div data-testid="node-detail-panel">Node Detail Panel</div>
  }
})

jest.mock('@/components/FloatingAddButton', () => {
  return function MockFloatingAddButton() {
    return <div data-testid="floating-add-button">Floating Add Button</div>
  }
})

describe('GraphPage Navigation Integration', () => {
  const mockLoadGraphById = jest.fn()
  const mockSetTheme = jest.fn()
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
  const mockUseGraphStore = useGraphStore as jest.MockedFunction<typeof useGraphStore>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default store state
    mockUseGraphStore.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      loadGraphById: mockLoadGraphById,
      currentGraph: null,
    })
  })

  describe('Complete Navigation Flow', () => {
    it('should handle complete navigation flow from AI preview modal', async () => {
      // Simulate navigation from AI preview modal with graphId
      const testGraphId = 'ai-generated-graph-123'
      const mockGet = jest.fn().mockReturnValue(testGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockLoadGraphById.mockResolvedValue(undefined)
      
      // Start with dark theme to test theme switching
      mockUseGraphStore.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        loadGraphById: mockLoadGraphById,
        currentGraph: null,
      })

      render(<GraphPage />)

      // Verify graphId parameter is extracted
      expect(mockGet).toHaveBeenCalledWith('graphId')

      // Verify loadGraphById is called with correct graphId
      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(testGraphId)
      })

      // Verify theme is set to light
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('should handle URL format /graph?graphId=xxx correctly', async () => {
      // Test the exact URL format that will be used by navigation
      const graphId = 'saved-graph-789'
      const mockGet = jest.fn().mockReturnValue(graphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockLoadGraphById.mockResolvedValue(undefined)

      render(<GraphPage />)

      // Verify the URL parameter is processed correctly
      expect(mockGet).toHaveBeenCalledWith('graphId')
      
      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(graphId)
      })
    })

    it('should continue to work for direct URL access', async () => {
      // Test direct browser navigation to /graph?graphId=xxx
      const directGraphId = 'direct-access-456'
      const mockGet = jest.fn().mockReturnValue(directGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockLoadGraphById.mockResolvedValue(undefined)

      render(<GraphPage />)

      // Should work exactly the same as navigation from modal
      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(directGraphId)
      })

      // Should render all components
      await waitFor(() => {
        expect(screen.getByTestId('knowledge-graph')).toBeInTheDocument()
      })
    })

    it('should handle graph loading with nodes and edges', async () => {
      const graphId = 'graph-with-data-123'
      const mockGet = jest.fn().mockReturnValue(graphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockLoadGraphById.mockResolvedValue(undefined)
      
      // Start with no current graph to ensure loading is triggered
      mockUseGraphStore.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        loadGraphById: mockLoadGraphById,
        currentGraph: null,
        nodes: [],
        edges: []
      })

      render(<GraphPage />)

      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(graphId)
      })
    })
  })

  describe('Error Scenarios', () => {
    it('should handle missing graphId parameter', () => {
      const mockGet = jest.fn().mockReturnValue(null)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      render(<GraphPage />)

      // Should show error message
      expect(screen.getByText('请从项目列表选择一个图谱')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('返回项目列表')).toBeInTheDocument()

      // Should not attempt to load graph
      expect(mockLoadGraphById).not.toHaveBeenCalled()
    })

    it('should handle graph not found error', async () => {
      const nonExistentGraphId = 'non-existent-graph-404'
      const mockGet = jest.fn().mockReturnValue(nonExistentGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      const errorMessage = '图谱不存在或已被删除'
      mockLoadGraphById.mockRejectedValue(new Error(errorMessage))

      render(<GraphPage />)

      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(nonExistentGraphId)
      })

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
        expect(screen.getByText('⚠️')).toBeInTheDocument()
        expect(screen.getByText('返回项目列表')).toBeInTheDocument()
      })
    })
  })
})