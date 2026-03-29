import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useGraphStore } from '@/lib/store'
import GraphPage from '@/app/graph/page'

// Mock components
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockImplementation((key) => {
      if (key === 'graphId') return 'mock-graph-id'
      if (key === 'from') return 'homepage'
      return null
    })
  })
}))
jest.mock('@/components/KnowledgeGraph', () => () => <div data-testid="knowledge-graph" />)
jest.mock('@/components/TopNavbar', () => () => <div data-testid="top-navbar" />)
jest.mock('@/components/NodeDetailPanel', () => () => <div data-testid="node-detail-panel" />)
jest.mock('@/components/FloatingAddButton', () => () => <div data-testid="floating-add-button" />)

describe('GraphPage Auto Refresh', () => {
  let mockLoadGraphById: jest.Mock

  beforeEach(() => {
    mockLoadGraphById = jest.fn().mockResolvedValue(true)
    useGraphStore.setState({
      loadGraphById: mockLoadGraphById,
      currentGraph: null,
      navigationMode: 'readonly',
      setNavigationMode: jest.fn(),
      theme: 'light',
      setTheme: jest.fn()
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch graph data on mount', async () => {
    render(<GraphPage />)
    
    await waitFor(() => {
      expect(mockLoadGraphById).toHaveBeenCalledWith('mock-graph-id')
    })
  })

  it('should auto-refresh graph data when window regains focus', async () => {
    render(<GraphPage />)
    
    // Initial fetch on mount
    await waitFor(() => {
      expect(mockLoadGraphById).toHaveBeenCalledTimes(1)
    })

    // Simulate window gaining focus (e.g. user returns from workflow tab)
    fireEvent.focus(window)

    // Should fetch again
    await waitFor(() => {
      expect(mockLoadGraphById).toHaveBeenCalledTimes(2)
    })
  })
})
