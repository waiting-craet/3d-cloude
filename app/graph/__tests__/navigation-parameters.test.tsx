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

// Mock components to avoid complex rendering
jest.mock('@/components/KnowledgeGraph', () => {
  return function MockKnowledgeGraph() {
    return <div data-testid="knowledge-graph">Knowledge Graph</div>
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

describe('GraphPage Navigation Parameters', () => {
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

  describe('GraphId Parameter Processing', () => {
    it('should extract graphId from URL parameters', () => {
      const mockGet = jest.fn().mockReturnValue('test-graph-123')
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      render(<GraphPage />)

      expect(mockGet).toHaveBeenCalledWith('graphId')
    })

    it('should call loadGraphById with correct graphId', async () => {
      const testGraphId = 'test-graph-456'
      const mockGet = jest.fn().mockReturnValue(testGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      render(<GraphPage />)

      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(testGraphId)
      })
    })

    it('should show error when graphId is missing', () => {
      const mockGet = jest.fn().mockReturnValue(null)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      render(<GraphPage />)

      expect(screen.getByText('请从项目列表选择一个图谱')).toBeInTheDocument()
    })
  })

  describe('Automatic Graph Loading', () => {
    it('should show loading state during graph loading', () => {
      const mockGet = jest.fn().mockReturnValue('test-graph-789')
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      render(<GraphPage />)

      expect(screen.getByText('加载图谱中...')).toBeInTheDocument()
      expect(screen.getByLabelText('loading icon')).toBeInTheDocument()
    })

    it('should skip loading if current graph matches graphId', async () => {
      const testGraphId = 'current-graph-123'
      const mockGet = jest.fn().mockReturnValue(testGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockUseGraphStore.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        loadGraphById: mockLoadGraphById,
        currentGraph: { id: testGraphId, name: 'Test Graph' },
      })

      render(<GraphPage />)

      await waitFor(() => {
        expect(mockLoadGraphById).not.toHaveBeenCalled()
      })
    })

    it('should load graph when graphId differs from current graph', async () => {
      const newGraphId = 'new-graph-456'
      const mockGet = jest.fn().mockReturnValue(newGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockUseGraphStore.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        loadGraphById: mockLoadGraphById,
        currentGraph: { id: 'old-graph-123', name: 'Old Graph' },
      })

      render(<GraphPage />)

      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(newGraphId)
      })
    })
  })

  describe('Direct URL Access', () => {
    it('should handle direct URL access with graphId parameter', async () => {
      const directGraphId = 'direct-access-789'
      const mockGet = jest.fn().mockReturnValue(directGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockLoadGraphById.mockResolvedValue(undefined)

      render(<GraphPage />)

      await waitFor(() => {
        expect(mockLoadGraphById).toHaveBeenCalledWith(directGraphId)
      })

      // Should render the main components after loading
      await waitFor(() => {
        expect(screen.getByTestId('knowledge-graph')).toBeInTheDocument()
        expect(screen.getByTestId('top-navbar')).toBeInTheDocument()
        expect(screen.getByTestId('node-detail-panel')).toBeInTheDocument()
        expect(screen.getByTestId('floating-add-button')).toBeInTheDocument()
      })
    })

    it('should handle loading errors gracefully', async () => {
      const errorGraphId = 'error-graph-404'
      const mockGet = jest.fn().mockReturnValue(errorGraphId)
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      const errorMessage = '图谱不存在或已被删除'
      mockLoadGraphById.mockRejectedValue(new Error(errorMessage))

      render(<GraphPage />)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
        expect(screen.getByLabelText('warning icon')).toBeInTheDocument()
        expect(screen.getByText('返回项目列表')).toBeInTheDocument()
      })
    })
  })

  describe('Theme Management', () => {
    it('should force light theme on page load', () => {
      const mockGet = jest.fn().mockReturnValue('test-graph-123')
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockUseGraphStore.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        loadGraphById: mockLoadGraphById,
        currentGraph: null,
      })

      render(<GraphPage />)

      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('should not change theme if already light', () => {
      const mockGet = jest.fn().mockReturnValue('test-graph-123')
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any)

      mockUseGraphStore.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        loadGraphById: mockLoadGraphById,
        currentGraph: null,
      })

      render(<GraphPage />)

      expect(mockSetTheme).not.toHaveBeenCalled()
    })
  })
})