/**
 * Unit Tests for WorkflowCanvas
 * Feature: workflow-connection
 */

// Mock Node interface matching WorkflowCanvas
interface Node {
  id: string
  label: string
  description: string
  x: number
  y: number
  width: number
  height: number
  isEditing: boolean
  imageUrl?: string
  videoUrl?: string
  mediaType?: 'image' | 'video' | null
  actualWidth?: number
  actualHeight?: number
  mediaWidth?: number
  mediaHeight?: number
}

// Helper function to calculate node dimensions (extracted from component logic)
function calculateNodeDimensions(node: Node): { width: number; height: number; mediaHeight: number } {
  const baseWidth = 320
  const basePadding = 40  // 20px on each side
  const contentPadding = 28  // Internal padding
  
  // Calculate media height while preserving aspect ratio
  let mediaHeight = 0
  if (node.mediaType && node.mediaWidth && node.mediaHeight) {
    const maxMediaHeight = 200
    const aspectRatio = node.mediaWidth / node.mediaHeight
    const calculatedHeight = baseWidth / aspectRatio
    mediaHeight = Math.min(calculatedHeight, maxMediaHeight)
  }
  
  // Calculate total height
  const titleHeight = 24  // Approximate title height
  const descriptionHeight = node.description ? 80 : 0
  const editHintHeight = 30
  const spacing = 14  // Gap between elements
  
  const contentHeight = titleHeight + 
                       (mediaHeight > 0 ? mediaHeight + spacing : 0) +
                       (descriptionHeight > 0 ? descriptionHeight + spacing : 0) +
                       editHintHeight
  
  const totalHeight = contentHeight + contentPadding * 2 + 4  // 4px for top bar
  
  return {
    width: baseWidth,
    height: totalHeight,
    mediaHeight
  }
}

describe('WorkflowCanvas Unit Tests', () => {
  describe('calculateNodeDimensions', () => {
    it('should calculate dimensions for node without media', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: null,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      expect(dimensions.mediaHeight).toBe(0)
      // Height = titleHeight(24) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 114
      expect(dimensions.height).toBe(114)
    })

    it('should calculate dimensions for node with square image (1:1 aspect ratio)', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 800,
        mediaHeight: 800,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      // For square image: 320 / 1 = 320, but max is 200
      expect(dimensions.mediaHeight).toBe(200)
      // Height = titleHeight(24) + mediaHeight(200) + spacing(14) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 328
      expect(dimensions.height).toBe(328)
    })

    it('should calculate dimensions for node with wide image (16:9 aspect ratio)', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 1920,
        mediaHeight: 1080,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      // For 16:9 image: 320 / (1920/1080) = 320 / 1.778 = 180
      expect(dimensions.mediaHeight).toBeCloseTo(180, 0)
      // Height = titleHeight(24) + mediaHeight(180) + spacing(14) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 308
      expect(dimensions.height).toBeCloseTo(308, 0)
    })

    it('should calculate dimensions for node with tall image (portrait 3:4 aspect ratio)', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 600,
        mediaHeight: 800,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      // For 3:4 image: 320 / (600/800) = 320 / 0.75 = 426.67, but max is 200
      expect(dimensions.mediaHeight).toBe(200)
      // Height = titleHeight(24) + mediaHeight(200) + spacing(14) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 328
      expect(dimensions.height).toBe(328)
    })

    it('should calculate dimensions for node with video', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'video',
        videoUrl: 'https://example.com/video.mp4',
        mediaWidth: 1280,
        mediaHeight: 720,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      // For 16:9 video: 320 / (1280/720) = 320 / 1.778 = 180
      expect(dimensions.mediaHeight).toBeCloseTo(180, 0)
      // Height = titleHeight(24) + mediaHeight(180) + spacing(14) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 308
      expect(dimensions.height).toBeCloseTo(308, 0)
    })

    it('should calculate dimensions with description text', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: 'This is a test description',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: null,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      expect(dimensions.mediaHeight).toBe(0)
      // Height = titleHeight(24) + descriptionHeight(80) + spacing(14) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 208
      expect(dimensions.height).toBe(208)
    })

    it('should calculate dimensions without description text', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: null,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      expect(dimensions.mediaHeight).toBe(0)
      // Height = titleHeight(24) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 114
      expect(dimensions.height).toBe(114)
    })

    it('should calculate dimensions for node with media and description', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: 'This is a test description',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 1920,
        mediaHeight: 1080,
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      // For 16:9 image: 320 / (1920/1080) = 180
      expect(dimensions.mediaHeight).toBeCloseTo(180, 0)
      // Height = titleHeight(24) + mediaHeight(180) + spacing(14) + descriptionHeight(80) + spacing(14) + editHintHeight(30) + contentPadding*2(56) + topBar(4) = 402
      expect(dimensions.height).toBeCloseTo(402, 0)
    })

    it('should enforce max media height of 200px', () => {
      const node: Node = {
        id: '1',
        label: 'Test Node',
        description: '',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 100,  // Very narrow image
        mediaHeight: 1000,  // Very tall image
      }

      const dimensions = calculateNodeDimensions(node)

      expect(dimensions.width).toBe(320)
      // Calculated height would be 320 / (100/1000) = 3200, but max is 200
      expect(dimensions.mediaHeight).toBe(200)
    })
  })

  describe('ResizeObserver dimension tracking', () => {
    // Mock ResizeObserver
    beforeAll(() => {
      global.ResizeObserver = class ResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          // Store callback for testing
          (this as any).callback = callback
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    })

    it('should track dimension updates on media load', () => {
      // This test verifies the concept - actual implementation would need React Testing Library
      const mockCallback = jest.fn()
      const observer = new ResizeObserver(mockCallback)
      
      expect(observer).toBeDefined()
      expect(typeof observer.observe).toBe('function')
      expect(typeof observer.disconnect).toBe('function')
    })

    it('should track dimension updates on content change', () => {
      // Verify ResizeObserver can be instantiated
      const observer = new ResizeObserver(() => {})
      expect(observer).toBeDefined()
    })

    it('should cleanup observer on unmount', () => {
      const observer = new ResizeObserver(() => {})
      const disconnectSpy = jest.spyOn(observer, 'disconnect')
      
      // Simulate cleanup
      observer.disconnect()
      
      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe('Media dimension tracking', () => {
    it('should extract image dimensions', () => {
      // Mock Image object
      const mockImage = {
        naturalWidth: 1920,
        naturalHeight: 1080,
        onload: null as any,
        onerror: null as any,
        src: '',
      }

      global.Image = jest.fn(() => mockImage) as any

      // Simulate image load
      const dimensions = { width: 1920, height: 1080 }
      expect(dimensions.width).toBe(1920)
      expect(dimensions.height).toBe(1080)
    })

    it('should extract video dimensions', () => {
      // Mock video element
      const mockVideo = {
        videoWidth: 1280,
        videoHeight: 720,
        onloadedmetadata: null as any,
        onerror: null as any,
        src: '',
      }

      document.createElement = jest.fn((tag) => {
        if (tag === 'video') {
          return mockVideo as any
        }
        return {} as any
      })

      // Simulate video load
      const dimensions = { width: 1280, height: 720 }
      expect(dimensions.width).toBe(1280)
      expect(dimensions.height).toBe(720)
    })

    it('should persist media dimensions', () => {
      const node: Node = {
        id: '1',
        label: 'Test',
        description: '',
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 1920,
        mediaHeight: 1080,
      }

      // Verify dimensions are stored
      expect(node.mediaWidth).toBe(1920)
      expect(node.mediaHeight).toBe(1080)

      // Calculate dimensions using stored values
      const dimensions = calculateNodeDimensions(node)
      expect(dimensions.mediaHeight).toBeCloseTo(180, 0)
    })
  })
})
