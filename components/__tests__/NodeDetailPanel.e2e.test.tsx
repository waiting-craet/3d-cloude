import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import GraphNodes from '../GraphNodes'
import NodeDetailPanel from '../NodeDetailPanel'
import { useGraphStore } from '@/lib/store'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

jest.mock('@/lib/store', () => {
  const actualStore = jest.requireActual('@/lib/store')
  return {
    ...actualStore,
    useGraphStore: jest.fn(),
  }
})

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('End-to-End: Node Selection and Media Display', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Scenario 1: First-time node selection in edit mode', () => {
    it('should fetch node data and display video on first selection', async () => {
      const mockNode = {
        id: 'node-1',
        name: 'Video Node',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
      }

      const mockNodeWithMedia = {
        id: 'node-1',
        name: 'Video Node',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: 'https://example.com/image.jpg',
        videoUrl: 'https://example.com/video.mp4',
      }

      const mockSetSelectedNode = jest.fn()

      const mockStore = {
        nodes: [mockNode],
        selectedNode: null,
        navigationMode: 'full',
        setSelectedNode: mockSetSelectedNode,
        connectingFromNode: null,
        setConnectingFromNode: jest.fn(),
        addEdge: jest.fn(),
        updateNodePosition: jest.fn(),
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ node: mockNodeWithMedia }),
      })

      const { container } = render(<GraphNodes />)

      const nodeElement = container.querySelector('[position="0,0,0"]')
      if (nodeElement) {
        await act(async () => {
          fireEvent.click(nodeElement)
        })
      }

      expect(mockFetch).toHaveBeenCalledWith('/api/nodes/node-1')
      expect(mockSetSelectedNode).toHaveBeenCalledWith(mockNodeWithMedia)
    })
  })

  describe('Scenario 2: Mode switching preserves media display', () => {
    it('should display media when switching from full to readonly mode', async () => {
      const mockNode = {
        id: 'node-2',
        name: 'Test Node',
        description: 'Test Description',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: 'https://example.com/mode-switch-image.jpg',
        videoUrl: 'https://example.com/mode-switch-video.mp4',
      }

      const mockStoreFull = {
        selectedNode: mockNode,
        navigationMode: 'full',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStoreFull)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container, rerender } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElement = container.querySelector('video')
        expect(videoElement).toBeInTheDocument()
      })

      const mockStoreReadonly = {
        ...mockStoreFull,
        navigationMode: 'readonly',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStoreReadonly)
      rerender(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElement = container.querySelector('video')
        expect(videoElement).toBeInTheDocument()
        expect(videoElement?.getAttribute('src')).toBe('https://example.com/mode-switch-video.mp4')
      })
    })
  })

  describe('Scenario 3: Second click on same node', () => {
    it('should still display media on second selection of same node', async () => {
      const mockNode = {
        id: 'node-3',
        name: 'Double Click Node',
        description: 'Test Description',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        videoUrl: 'https://example.com/double-click.mp4',
      }

      const mockSetSelectedNode = jest.fn()

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'full',
        setSelectedNode: mockSetSelectedNode,
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container, rerender } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElement = container.querySelector('video')
        expect(videoElement).toBeInTheDocument()
      })

      mockSetSelectedNode.mockClear()
      ;(useGraphStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNode: null,
      })
      rerender(<NodeDetailPanel />)

      await waitFor(() => {
        expect(container.querySelector('video')).not.toBeInTheDocument()
      })

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      rerender(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElement = container.querySelector('video')
        expect(videoElement).toBeInTheDocument()
        expect(videoElement?.getAttribute('src')).toBe('https://example.com/double-click.mp4')
      })
    })
  })

  describe('Scenario 4: Error handling', () => {
    it('should handle API failure gracefully and use local data', async () => {
      const mockNode = {
        id: 'node-4',
        name: 'Error Node',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        videoUrl: 'https://example.com/local-video.mp4',
      }

      const mockSetSelectedNode = jest.fn()

      const mockStore = {
        nodes: [mockNode],
        selectedNode: null,
        navigationMode: 'full',
        setSelectedNode: mockSetSelectedNode,
        connectingFromNode: null,
        setConnectingFromNode: jest.fn(),
        addEdge: jest.fn(),
        updateNodePosition: jest.fn(),
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<GraphNodes />)

      const nodeElement = container.querySelector('[position="0,0,0"]')
      if (nodeElement) {
        await act(async () => {
          fireEvent.click(nodeElement)
        })
      }

      await waitFor(() => {
        expect(mockSetSelectedNode).toHaveBeenCalledWith(mockNode)
      })
    })

    it('should handle 404 response gracefully', async () => {
      const mockNode = {
        id: 'node-5',
        name: '404 Node',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
      }

      const mockSetSelectedNode = jest.fn()

      const mockStore = {
        nodes: [mockNode],
        selectedNode: null,
        navigationMode: 'full',
        setSelectedNode: mockSetSelectedNode,
        connectingFromNode: null,
        setConnectingFromNode: jest.fn(),
        addEdge: jest.fn(),
        updateNodePosition: jest.fn(),
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const { container } = render(<GraphNodes />)

      const nodeElement = container.querySelector('[position="0,0,0"]')
      if (nodeElement) {
        await act(async () => {
          fireEvent.click(nodeElement)
        })
      }

      await waitFor(() => {
        expect(mockSetSelectedNode).toHaveBeenCalledWith(mockNode)
      })
    })
  })

  describe('Scenario 5: No memory leaks or duplicate requests', () => {
    it('should not make duplicate API calls for same node', async () => {
      const mockNode = {
        id: 'node-6',
        name: 'No Duplicate Node',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
      }

      const mockNodeWithMedia = {
        ...mockNode,
        videoUrl: 'https://example.com/no-duplicate.mp4',
      }

      const mockSetSelectedNode = jest.fn()

      const mockStore = {
        nodes: [mockNode],
        selectedNode: null,
        navigationMode: 'full',
        setSelectedNode: mockSetSelectedNode,
        connectingFromNode: null,
        setConnectingFromNode: jest.fn(),
        addEdge: jest.fn(),
        updateNodePosition: jest.fn(),
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ node: mockNodeWithMedia }),
      })

      const { container } = render(<GraphNodes />)

      const nodeElement = container.querySelector('[position="0,0,0"]')
      if (nodeElement) {
        await act(async () => {
          fireEvent.click(nodeElement)
        })
      }

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
