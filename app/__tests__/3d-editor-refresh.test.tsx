import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useGraphStore } from '@/lib/store'
import ThreeDEditorPage from '@/app/3d-editor/page'

// Mock components
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue('mock-graph-id')
  })
}))
jest.mock('@/components/KnowledgeGraph', () => () => <div data-testid="knowledge-graph" />)
jest.mock('@/components/TopNavbar', () => () => <div data-testid="top-navbar" />)
jest.mock('@/components/NodeDetailPanel', () => () => <div data-testid="node-detail-panel" />)
jest.mock('@/components/FloatingAddButton', () => () => <div data-testid="floating-add-button" />)

describe('3DEditorPage Auto Refresh', () => {
  let mockSetCurrentGraph: jest.Mock
  let mockSetCurrentProject: jest.Mock
  let globalFetch: jest.Mock

  beforeEach(() => {
    mockSetCurrentGraph = jest.fn()
    mockSetCurrentProject = jest.fn()
    useGraphStore.setState({
      setCurrentGraph: mockSetCurrentGraph,
      setCurrentProject: mockSetCurrentProject,
      setProjects: jest.fn()
    })

    globalFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        graph: { id: 'mock-graph-id', name: 'Mock Graph', projectId: 'mock-project' },
        project: { id: 'mock-project', name: 'Mock Project' }
      })
    })
    global.fetch = globalFetch
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch graph data on mount', async () => {
    render(<ThreeDEditorPage />)
    
    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalledWith('/api/graphs/mock-graph-id')
    })
  })

  it('should auto-refresh graph data when window regains focus', async () => {
    render(<ThreeDEditorPage />)
    
    // Initial fetch on mount
    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalledTimes(2) // Once for graph, once for project
    })

    // Simulate window gaining focus (e.g. user returns from another tab/workflow)
    fireEvent.focus(window)

    // Should fetch again
    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalledTimes(4)
    })
  })
})
