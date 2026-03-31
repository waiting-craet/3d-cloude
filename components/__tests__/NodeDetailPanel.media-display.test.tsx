import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('NodeDetailPanel - Media Display Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Requirement 1: First-time selection renders video immediately', () => {
    it('should render video on first node selection in edit mode', async () => {
      const mockNode = {
        id: 'test-node-1',
        name: 'Test Node',
        description: 'Test Description',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: 'https://example.com/image.jpg',
        videoUrl: 'https://example.com/video.mp4',
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'full',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElements = container.querySelectorAll('video')
        expect(videoElements.length).toBeGreaterThan(0)
      })

      const videoElement = container.querySelector('video')
      expect(videoElement).toBeInTheDocument()
      expect(videoElement?.getAttribute('src')).toBe('https://example.com/video.mp4')
    })

    it('should render image on first node selection in edit mode', async () => {
      const mockNode = {
        id: 'test-node-2',
        name: 'Test Node 2',
        description: 'Test Description 2',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: 'https://example.com/image.jpg',
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'full',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const imgElements = container.querySelectorAll('img')
        expect(imgElements.length).toBeGreaterThan(0)
      })

      const imgElement = container.querySelector('img[src="https://example.com/image.jpg"]')
      expect(imgElement).toBeInTheDocument()
    })
  })

  describe('Requirement 2: Read-only mode displays media', () => {
    it('should display video in read-only mode', async () => {
      const mockNode = {
        id: 'test-node-3',
        name: 'Test Node 3',
        description: 'Test Description 3',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        videoUrl: 'https://example.com/readonly-video.mp4',
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElements = container.querySelectorAll('video')
        expect(videoElements.length).toBeGreaterThan(0)
      })

      const videoElement = container.querySelector('video')
      expect(videoElement).toBeInTheDocument()
      expect(videoElement?.getAttribute('src')).toBe('https://example.com/readonly-video.mp4')
    })

    it('should display image in read-only mode', async () => {
      const mockNode = {
        id: 'test-node-4',
        name: 'Test Node 4',
        description: 'Test Description 4',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: 'https://example.com/readonly-image.jpg',
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const imgElements = container.querySelectorAll('img')
        expect(imgElements.length).toBeGreaterThan(0)
      })

      const imgElement = container.querySelector('img[src="https://example.com/readonly-image.jpg"]')
      expect(imgElement).toBeInTheDocument()
    })

    it('should display both image and video when both exist in read-only mode', async () => {
      const mockNode = {
        id: 'test-node-5',
        name: 'Test Node 5',
        description: 'Test Description 5',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: 'https://example.com/both-image.jpg',
        videoUrl: 'https://example.com/both-video.mp4',
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElements = container.querySelectorAll('video')
        const imgElements = container.querySelectorAll('img')
        expect(videoElements.length).toBeGreaterThan(0)
        expect(imgElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Requirement 3: Unified data flow', () => {
    it('should update media display when selectedNode changes', async () => {
      const mockNode1 = {
        id: 'test-node-6',
        name: 'Node 1',
        description: 'Description 1',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        videoUrl: 'https://example.com/video1.mp4',
      }

      const mockStore1 = {
        selectedNode: mockNode1,
        navigationMode: 'full',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      const { container, rerender } = render(<NodeDetailPanel />)
      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore1)

      await waitFor(() => {
        const videoElement = container.querySelector('video')
        expect(videoElement?.getAttribute('src')).toBe('https://example.com/video1.mp4')
      })

      const mockNode2 = {
        id: 'test-node-7',
        name: 'Node 2',
        description: 'Description 2',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        videoUrl: 'https://example.com/video2.mp4',
      }

      const mockStore2 = {
        ...mockStore1,
        selectedNode: mockNode2,
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore2)
      rerender(<NodeDetailPanel />)

      await waitFor(() => {
        const videoElement = container.querySelector('video')
        expect(videoElement?.getAttribute('src')).toBe('https://example.com/video2.mp4')
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty media URLs gracefully', async () => {
      const mockNode = {
        id: 'test-node-8',
        name: 'Node Without Media',
        description: 'No media',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
        imageUrl: '',
        videoUrl: null,
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'full',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)
      mockLocalStorage.setItem('isAdmin', 'true')

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        expect(container.querySelector('video')).not.toBeInTheDocument()
        expect(container.querySelector('img[src=""]')).not.toBeInTheDocument()
      })
    })

    it('should handle missing media fields gracefully', async () => {
      const mockNode = {
        id: 'test-node-9',
        name: 'Node With Missing Fields',
        type: 'concept',
        x: 0,
        y: 0,
        z: 0,
        color: '#6BB6FF',
      }

      const mockStore = {
        selectedNode: mockNode,
        navigationMode: 'readonly',
        setSelectedNode: jest.fn(),
        deleteNode: jest.fn(),
        fetchGraph: jest.fn(),
        updateNodeLocal: jest.fn(),
        updateNode: jest.fn(),
        theme: 'light',
      }

      ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

      const { container } = render(<NodeDetailPanel />)

      await waitFor(() => {
        expect(container.querySelector('video')).not.toBeInTheDocument()
      })
    })
  })

  describe('Media format support', () => {
    const supportedVideoFormats = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
    const supportedImageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

    supportedVideoFormats.forEach((format) => {
      it(`should recognize ${format} as video format`, async () => {
        const mockNode = {
          id: `test-node-video-${format}`,
          name: 'Video Node',
          type: 'concept',
          x: 0,
          y: 0,
          z: 0,
          color: '#6BB6FF',
          imageUrl: `https://example.com/video${format}`,
        }

        const mockStore = {
          selectedNode: mockNode,
          navigationMode: 'readonly',
          setSelectedNode: jest.fn(),
          deleteNode: jest.fn(),
          fetchGraph: jest.fn(),
          updateNodeLocal: jest.fn(),
          updateNode: jest.fn(),
          theme: 'light',
        }

        ;(useGraphStore as unknown as jest.Mock).mockReturnValue(mockStore)

        const { container } = render(<NodeDetailPanel />)

        await waitFor(() => {
          const videoElement = container.querySelector('video')
          expect(videoElement).toBeInTheDocument()
        })
      })
    })
  })
})
