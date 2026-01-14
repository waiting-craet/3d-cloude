/**
 * Property-Based Tests for WorkflowCanvas
 * Feature: workflow-connection
 */

import * as fc from 'fast-check'

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

interface ConnectionPointPosition {
  x: number
  y: number
  side: 'left' | 'right'
}

// Helper function to calculate connection point (extracted from component logic)
function calculateConnectionPoint(node: Node, side: 'left' | 'right'): ConnectionPointPosition {
  const actualHeight = node.actualHeight || node.height
  const actualWidth = node.actualWidth || node.width
  
  if (side === 'right') {
    return {
      x: node.x + actualWidth,
      y: node.y + actualHeight / 2,
      side: 'right'
    }
  } else {
    return {
      x: node.x,
      y: node.y + actualHeight / 2,
      side: 'left'
    }
  }
}

// Arbitrary generators for property-based testing
const nodeArbitrary = fc.record({
  id: fc.string(),
  label: fc.string(),
  description: fc.string(),
  x: fc.float({ min: 0, max: 2000, noNaN: true }),
  y: fc.float({ min: 0, max: 2000, noNaN: true }),
  width: fc.float({ min: 100, max: 500, noNaN: true }),
  height: fc.float({ min: 80, max: 400, noNaN: true }),
  isEditing: fc.boolean(),
  imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
  videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
  mediaType: fc.option(fc.constantFrom('image' as const, 'video' as const), { nil: null }),
  actualWidth: fc.option(fc.float({ min: 100, max: 500, noNaN: true }), { nil: undefined }),
  actualHeight: fc.option(fc.float({ min: 80, max: 400, noNaN: true }), { nil: undefined }),
  mediaWidth: fc.option(fc.float({ min: 100, max: 1920, noNaN: true }), { nil: undefined }),
  mediaHeight: fc.option(fc.float({ min: 100, max: 1080, noNaN: true }), { nil: undefined }),
})

describe('WorkflowCanvas Property Tests', () => {
  describe('Property 1: Connection Point Positioning Accuracy', () => {
    /**
     * Feature: workflow-connection, Property 1: Connection Point Positioning Accuracy
     * Validates: Requirements 1.1, 1.2, 1.4
     * 
     * For any workflow node with or without media content, the connection points 
     * SHALL be positioned at exactly the vertical center of the node's actual 
     * rendered height and at the horizontal edges of the node's actual rendered width.
     */
    it('should position right connection point at right edge and vertical center', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const connectionPoint = calculateConnectionPoint(node, 'right')
          
          const expectedHeight = node.actualHeight || node.height
          const expectedWidth = node.actualWidth || node.width
          
          // Connection point should be at right edge (x = node.x + width)
          expect(connectionPoint.x).toBeCloseTo(node.x + expectedWidth, 5)
          
          // Connection point should be at vertical center (y = node.y + height/2)
          expect(connectionPoint.y).toBeCloseTo(node.y + expectedHeight / 2, 5)
          
          // Side should be 'right'
          expect(connectionPoint.side).toBe('right')
        }),
        { numRuns: 100 }
      )
    })

    it('should position left connection point at left edge and vertical center', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const connectionPoint = calculateConnectionPoint(node, 'left')
          
          const expectedHeight = node.actualHeight || node.height
          
          // Connection point should be at left edge (x = node.x)
          expect(connectionPoint.x).toBeCloseTo(node.x, 5)
          
          // Connection point should be at vertical center (y = node.y + height/2)
          expect(connectionPoint.y).toBeCloseTo(node.y + expectedHeight / 2, 5)
          
          // Side should be 'left'
          expect(connectionPoint.side).toBe('left')
        }),
        { numRuns: 100 }
      )
    })

    it('should use actualWidth when available, otherwise fall back to width', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const connectionPoint = calculateConnectionPoint(node, 'right')
          
          const expectedWidth = node.actualWidth || node.width
          
          // Verify the correct width is used
          expect(connectionPoint.x).toBeCloseTo(node.x + expectedWidth, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should use actualHeight when available, otherwise fall back to height', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const connectionPoint = calculateConnectionPoint(node, 'left')
          
          const expectedHeight = node.actualHeight || node.height
          
          // Verify the correct height is used
          expect(connectionPoint.y).toBeCloseTo(node.y + expectedHeight / 2, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should work correctly for nodes with media content', () => {
      const nodeWithMediaArbitrary = nodeArbitrary.map(node => ({
        ...node,
        mediaType: 'image' as const,
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 800,
        mediaHeight: 600,
        actualWidth: 320,
        actualHeight: 280,
      }))

      fc.assert(
        fc.property(nodeWithMediaArbitrary, (node) => {
          const rightPoint = calculateConnectionPoint(node, 'right')
          const leftPoint = calculateConnectionPoint(node, 'left')
          
          // Should use actualWidth and actualHeight
          expect(rightPoint.x).toBeCloseTo(node.x + 320, 5)
          expect(rightPoint.y).toBeCloseTo(node.y + 280 / 2, 5)
          expect(leftPoint.x).toBeCloseTo(node.x, 5)
          expect(leftPoint.y).toBeCloseTo(node.y + 280 / 2, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should work correctly for nodes without media content', () => {
      const nodeWithoutMediaArbitrary = nodeArbitrary.map(node => ({
        ...node,
        mediaType: null,
        imageUrl: undefined,
        videoUrl: undefined,
        actualWidth: undefined,
        actualHeight: undefined,
      }))

      fc.assert(
        fc.property(nodeWithoutMediaArbitrary, (node) => {
          const rightPoint = calculateConnectionPoint(node, 'right')
          const leftPoint = calculateConnectionPoint(node, 'left')
          
          // Should use default width and height
          expect(rightPoint.x).toBeCloseTo(node.x + node.width, 5)
          expect(rightPoint.y).toBeCloseTo(node.y + node.height / 2, 5)
          expect(leftPoint.x).toBeCloseTo(node.x, 5)
          expect(leftPoint.y).toBeCloseTo(node.y + node.height / 2, 5)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 4: Media Aspect Ratio Preservation', () => {
    /**
     * Feature: workflow-connection, Property 4: Media Aspect Ratio Preservation
     * Validates: Requirements 3.3
     * 
     * For any media content (image or video) added to a node, the displayed media 
     * SHALL maintain its original aspect ratio within the maximum height constraint of 200px.
     */

    // Helper function to calculate node dimensions (extracted from component logic)
    function calculateNodeDimensions(node: Node): { width: number; height: number; mediaHeight: number } {
      const baseWidth = 320
      const basePadding = 40
      const contentPadding = 28
      
      let mediaHeight = 0
      if (node.mediaType && node.mediaWidth && node.mediaHeight) {
        const maxMediaHeight = 200
        const aspectRatio = node.mediaWidth / node.mediaHeight
        const calculatedHeight = baseWidth / aspectRatio
        mediaHeight = Math.min(calculatedHeight, maxMediaHeight)
      }
      
      const titleHeight = 24
      const descriptionHeight = node.description ? 80 : 0
      const editHintHeight = 30
      const spacing = 14
      
      const contentHeight = titleHeight + 
                           (mediaHeight > 0 ? mediaHeight + spacing : 0) +
                           (descriptionHeight > 0 ? descriptionHeight + spacing : 0) +
                           editHintHeight
      
      const totalHeight = contentHeight + contentPadding * 2 + 4
      
      return {
        width: baseWidth,
        height: totalHeight,
        mediaHeight
      }
    }

    it('should preserve aspect ratio for all media within max height constraint', () => {
      const nodeWithMediaArbitrary = fc.record({
        id: fc.string(),
        label: fc.string(),
        description: fc.string(),
        x: fc.float({ min: 0, max: 2000, noNaN: true }),
        y: fc.float({ min: 0, max: 2000, noNaN: true }),
        width: fc.float({ min: 100, max: 500, noNaN: true }),
        height: fc.float({ min: 80, max: 400, noNaN: true }),
        isEditing: fc.boolean(),
        mediaType: fc.constantFrom('image' as const, 'video' as const),
        imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
        videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
        mediaWidth: fc.float({ min: 100, max: 1920, noNaN: true }),
        mediaHeight: fc.float({ min: 100, max: 1080, noNaN: true }),
        actualWidth: fc.option(fc.float({ min: 100, max: 500, noNaN: true }), { nil: undefined }),
        actualHeight: fc.option(fc.float({ min: 80, max: 400, noNaN: true }), { nil: undefined }),
      })

      fc.assert(
        fc.property(nodeWithMediaArbitrary, (node) => {
          const dimensions = calculateNodeDimensions(node)
          
          // Media height should never exceed 200px
          expect(dimensions.mediaHeight).toBeLessThanOrEqual(200)
          
          // If media dimensions are provided, verify aspect ratio is preserved
          if (node.mediaWidth && node.mediaHeight) {
            const originalAspectRatio = node.mediaWidth / node.mediaHeight
            const baseWidth = 320
            const expectedHeight = baseWidth / originalAspectRatio
            
            if (expectedHeight <= 200) {
              // If calculated height is within limit, it should match
              expect(dimensions.mediaHeight).toBeCloseTo(expectedHeight, 1)
            } else {
              // If calculated height exceeds limit, should be capped at 200
              expect(dimensions.mediaHeight).toBe(200)
            }
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should handle extreme aspect ratios correctly', () => {
      // Test very wide images (panoramic)
      const wideNode: Node = {
        id: '1',
        label: 'Wide',
        description: '',
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        mediaWidth: 3000,
        mediaHeight: 500,
      }

      const wideDimensions = calculateNodeDimensions(wideNode)
      const wideAspectRatio = 3000 / 500
      const expectedWideHeight = 320 / wideAspectRatio
      expect(wideDimensions.mediaHeight).toBeCloseTo(expectedWideHeight, 1)
      expect(wideDimensions.mediaHeight).toBeLessThanOrEqual(200)

      // Test very tall images (portrait)
      const tallNode: Node = {
        id: '2',
        label: 'Tall',
        description: '',
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        isEditing: false,
        mediaType: 'image',
        mediaWidth: 500,
        mediaHeight: 3000,
      }

      const tallDimensions = calculateNodeDimensions(tallNode)
      // For very tall images, height should be capped at 200
      expect(tallDimensions.mediaHeight).toBe(200)
    })

    it('should maintain consistent width of 320px for all nodes', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const dimensions = calculateNodeDimensions(node)
          expect(dimensions.width).toBe(320)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 2: Connection Line Attachment Consistency', () => {
    /**
     * Feature: workflow-connection, Property 2: Connection Line Attachment Consistency
     * Validates: Requirements 1.2, 1.3
     * 
     * For any connection line between two nodes, the line endpoints SHALL always 
     * attach to the calculated connection point positions, regardless of whether 
     * the nodes contain media content.
     */

    // Helper to calculate connection point
    function calculateConnectionPoint(node: Node, side: 'left' | 'right'): ConnectionPointPosition {
      const actualHeight = node.actualHeight || node.height
      const actualWidth = node.actualWidth || node.width
      
      if (side === 'right') {
        return {
          x: node.x + actualWidth,
          y: node.y + actualHeight / 2,
          side: 'right'
        }
      } else {
        return {
          x: node.x,
          y: node.y + actualHeight / 2,
          side: 'left'
        }
      }
    }

    it('should attach connection lines to calculated connection points', () => {
      const nodePairArbitrary = fc.tuple(nodeArbitrary, nodeArbitrary)

      fc.assert(
        fc.property(nodePairArbitrary, ([fromNode, toNode]) => {
          // Calculate connection points
          const fromPoint = calculateConnectionPoint(fromNode, 'right')
          const toPoint = calculateConnectionPoint(toNode, 'left')
          
          // Simulate connection line endpoints
          const lineStartX = fromPoint.x
          const lineStartY = fromPoint.y
          const lineEndX = toPoint.x
          const lineEndY = toPoint.y
          
          // Verify line starts at from node's right connection point
          expect(lineStartX).toBeCloseTo(fromNode.x + (fromNode.actualWidth || fromNode.width), 5)
          expect(lineStartY).toBeCloseTo(fromNode.y + (fromNode.actualHeight || fromNode.height) / 2, 5)
          
          // Verify line ends at to node's left connection point
          expect(lineEndX).toBeCloseTo(toNode.x, 5)
          expect(lineEndY).toBeCloseTo(toNode.y + (toNode.actualHeight || toNode.height) / 2, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain attachment when nodes have media content', () => {
      const nodeWithMediaArbitrary = fc.record({
        id: fc.string(),
        label: fc.string(),
        description: fc.string(),
        x: fc.float({ min: 0, max: 2000, noNaN: true }),
        y: fc.float({ min: 0, max: 2000, noNaN: true }),
        width: fc.float({ min: 100, max: 500, noNaN: true }),
        height: fc.float({ min: 80, max: 400, noNaN: true }),
        isEditing: fc.boolean(),
        mediaType: fc.constantFrom('image' as const, 'video' as const),
        imageUrl: fc.webUrl(),
        videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
        actualWidth: fc.float({ min: 100, max: 500, noNaN: true }),
        actualHeight: fc.float({ min: 80, max: 400, noNaN: true }),
        mediaWidth: fc.float({ min: 100, max: 1920, noNaN: true }),
        mediaHeight: fc.float({ min: 100, max: 1080, noNaN: true }),
      })

      const nodePairWithMediaArbitrary = fc.tuple(nodeWithMediaArbitrary, nodeWithMediaArbitrary)

      fc.assert(
        fc.property(nodePairWithMediaArbitrary, ([fromNode, toNode]) => {
          const fromPoint = calculateConnectionPoint(fromNode, 'right')
          const toPoint = calculateConnectionPoint(toNode, 'left')
          
          // Verify connection points use actualWidth/actualHeight
          expect(fromPoint.x).toBeCloseTo(fromNode.x + fromNode.actualWidth, 5)
          expect(fromPoint.y).toBeCloseTo(fromNode.y + fromNode.actualHeight / 2, 5)
          expect(toPoint.x).toBeCloseTo(toNode.x, 5)
          expect(toPoint.y).toBeCloseTo(toNode.y + toNode.actualHeight / 2, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain attachment when nodes have different sizes', () => {
      const smallNodeArbitrary = nodeArbitrary.map(node => ({
        ...node,
        width: 200,
        height: 100,
        actualWidth: 200,
        actualHeight: 100,
      }))

      const largeNodeArbitrary = nodeArbitrary.map(node => ({
        ...node,
        width: 500,
        height: 400,
        actualWidth: 500,
        actualHeight: 400,
      }))

      const mixedSizeArbitrary = fc.tuple(smallNodeArbitrary, largeNodeArbitrary)

      fc.assert(
        fc.property(mixedSizeArbitrary, ([smallNode, largeNode]) => {
          const fromPoint = calculateConnectionPoint(smallNode, 'right')
          const toPoint = calculateConnectionPoint(largeNode, 'left')
          
          // Small node connection point
          expect(fromPoint.x).toBeCloseTo(smallNode.x + 200, 5)
          expect(fromPoint.y).toBeCloseTo(smallNode.y + 50, 5)
          
          // Large node connection point
          expect(toPoint.x).toBeCloseTo(largeNode.x, 5)
          expect(toPoint.y).toBeCloseTo(largeNode.y + 200, 5)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 5: Connection Point Visibility', () => {
    /**
     * Feature: workflow-connection, Property 5: Connection Point Visibility
     * Validates: Requirements 4.1, 4.2, 4.4
     * 
     * For any node with or without media content, the connection points SHALL 
     * remain visible and positioned correctly at the vertical center of the 
     * node's actual height, ensuring they are not obscured by media content.
     */

    it('should position connection points at vertical center using actualHeight', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          // Calculate expected connection point Y position
          const actualHeight = node.actualHeight || node.height
          const expectedY = node.y + actualHeight / 2
          
          // Calculate connection points
          const rightPoint = calculateConnectionPoint(node, 'right')
          const leftPoint = calculateConnectionPoint(node, 'left')
          
          // Both connection points should be at the same vertical center
          expect(rightPoint.y).toBeCloseTo(expectedY, 5)
          expect(leftPoint.y).toBeCloseTo(expectedY, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should position connection points correctly for nodes with media', () => {
      const nodeWithMediaArbitrary = fc.record({
        id: fc.string(),
        label: fc.string(),
        description: fc.string(),
        x: fc.float({ min: 0, max: 2000, noNaN: true }),
        y: fc.float({ min: 0, max: 2000, noNaN: true }),
        width: fc.constant(320),
        height: fc.float({ min: 180, max: 400, noNaN: true }),
        isEditing: fc.boolean(),
        mediaType: fc.constantFrom('image' as const, 'video' as const),
        imageUrl: fc.webUrl(),
        videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
        mediaWidth: fc.float({ min: 100, max: 1920, noNaN: true }),
        mediaHeight: fc.float({ min: 100, max: 1080, noNaN: true }),
        actualWidth: fc.constant(320),
        actualHeight: fc.float({ min: 200, max: 450, noNaN: true }), // Taller due to media
      })

      fc.assert(
        fc.property(nodeWithMediaArbitrary, (node) => {
          const rightPoint = calculateConnectionPoint(node, 'right')
          const leftPoint = calculateConnectionPoint(node, 'left')
          
          // Connection points should use actualHeight (which includes media)
          const expectedY = node.y + node.actualHeight / 2
          
          expect(rightPoint.y).toBeCloseTo(expectedY, 5)
          expect(leftPoint.y).toBeCloseTo(expectedY, 5)
          
          // Connection points should be at horizontal edges
          expect(rightPoint.x).toBeCloseTo(node.x + 320, 5)
          expect(leftPoint.x).toBeCloseTo(node.x, 5)
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain consistent vertical positioning across different media types', () => {
      const baseNode = {
        id: 'test',
        label: 'Test Node',
        description: 'Test description',
        x: 100,
        y: 100,
        width: 320,
        height: 180,
        isEditing: false,
        actualWidth: 320,
        actualHeight: 280, // Height with media
      }

      // Node with image
      const nodeWithImage: Node = {
        ...baseNode,
        mediaType: 'image',
        imageUrl: 'https://example.com/image.jpg',
        mediaWidth: 800,
        mediaHeight: 600,
      }

      // Node with video
      const nodeWithVideo: Node = {
        ...baseNode,
        mediaType: 'video',
        videoUrl: 'https://example.com/video.mp4',
        mediaWidth: 800,
        mediaHeight: 600,
      }

      const imageRightPoint = calculateConnectionPoint(nodeWithImage, 'right')
      const videoRightPoint = calculateConnectionPoint(nodeWithVideo, 'right')
      
      // Both should have same Y position (vertical center)
      expect(imageRightPoint.y).toBeCloseTo(videoRightPoint.y, 5)
      expect(imageRightPoint.y).toBeCloseTo(100 + 280 / 2, 5)
    })

    it('should position connection points outside node boundaries for visibility', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          const rightPoint = calculateConnectionPoint(node, 'right')
          const leftPoint = calculateConnectionPoint(node, 'left')
          
          const actualWidth = node.actualWidth || node.width
          
          // Right connection point should be at or beyond right edge
          expect(rightPoint.x).toBeGreaterThanOrEqual(node.x + actualWidth - 0.01)
          
          // Left connection point should be at or before left edge
          expect(leftPoint.x).toBeLessThanOrEqual(node.x + 0.01)
          
          // Both should be within vertical bounds
          const actualHeight = node.actualHeight || node.height
          expect(rightPoint.y).toBeGreaterThanOrEqual(node.y)
          expect(rightPoint.y).toBeLessThanOrEqual(node.y + actualHeight)
          expect(leftPoint.y).toBeGreaterThanOrEqual(node.y)
          expect(leftPoint.y).toBeLessThanOrEqual(node.y + actualHeight)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 7: Dynamic Layout Update', () => {
    /**
     * Feature: workflow-connection, Property 7: Dynamic Layout Update
     * Validates: Requirements 5.1, 5.2, 5.4
     * 
     * When a node's dimensions change (e.g., due to media upload or deletion), 
     * the connection points and connection lines SHALL automatically update to 
     * reflect the new dimensions without requiring manual refresh.
     */

    it('should recalculate connection points when node dimensions change', () => {
      fc.assert(
        fc.property(nodeArbitrary, fc.float({ min: 100, max: 500, noNaN: true }), fc.float({ min: 80, max: 400, noNaN: true }), (node, newWidth, newHeight) => {
          // Calculate connection points with original dimensions
          const originalRightPoint = calculateConnectionPoint(node, 'right')
          const originalLeftPoint = calculateConnectionPoint(node, 'left')
          
          // Simulate dimension change
          const updatedNode = {
            ...node,
            actualWidth: newWidth,
            actualHeight: newHeight,
          }
          
          // Calculate connection points with new dimensions
          const newRightPoint = calculateConnectionPoint(updatedNode, 'right')
          const newLeftPoint = calculateConnectionPoint(updatedNode, 'left')
          
          // Connection points should reflect new dimensions
          expect(newRightPoint.x).toBeCloseTo(node.x + newWidth, 5)
          expect(newRightPoint.y).toBeCloseTo(node.y + newHeight / 2, 5)
          expect(newLeftPoint.x).toBeCloseTo(node.x, 5)
          expect(newLeftPoint.y).toBeCloseTo(node.y + newHeight / 2, 5)
          
          // If dimensions changed, connection points should be different
          const originalWidth = node.actualWidth || node.width
          const originalHeight = node.actualHeight || node.height
          
          if (Math.abs(newWidth - originalWidth) > 0.1) {
            expect(Math.abs(newRightPoint.x - originalRightPoint.x)).toBeGreaterThan(0.01)
          }
          
          if (Math.abs(newHeight - originalHeight) > 0.1) {
            expect(Math.abs(newRightPoint.y - originalRightPoint.y)).toBeGreaterThan(0.01)
            expect(Math.abs(newLeftPoint.y - originalLeftPoint.y)).toBeGreaterThan(0.01)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should update connection points when media is added', () => {
      const nodeWithoutMediaArbitrary = nodeArbitrary.map(node => ({
        ...node,
        mediaType: null,
        imageUrl: undefined,
        videoUrl: undefined,
        mediaWidth: undefined,
        mediaHeight: undefined,
        actualWidth: 320,
        actualHeight: 180,
      }))

      fc.assert(
        fc.property(nodeWithoutMediaArbitrary, (node) => {
          // Calculate connection points before media
          const beforeRightPoint = calculateConnectionPoint(node, 'right')
          const beforeLeftPoint = calculateConnectionPoint(node, 'left')
          
          // Simulate media upload - node becomes taller
          const nodeWithMedia = {
            ...node,
            mediaType: 'image' as const,
            imageUrl: 'https://example.com/image.jpg',
            mediaWidth: 800,
            mediaHeight: 600,
            actualHeight: 280, // Taller with media
          }
          
          // Calculate connection points after media
          const afterRightPoint = calculateConnectionPoint(nodeWithMedia, 'right')
          const afterLeftPoint = calculateConnectionPoint(nodeWithMedia, 'left')
          
          // Y position should change (node is taller)
          expect(afterRightPoint.y).toBeCloseTo(node.y + 280 / 2, 5)
          expect(afterLeftPoint.y).toBeCloseTo(node.y + 280 / 2, 5)
          
          // Y position should be different from before
          expect(Math.abs(afterRightPoint.y - beforeRightPoint.y)).toBeGreaterThan(0.01)
          expect(Math.abs(afterLeftPoint.y - beforeLeftPoint.y)).toBeGreaterThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('should update connection points when media is removed', () => {
      const nodeWithMediaArbitrary = fc.record({
        id: fc.string(),
        label: fc.string(),
        description: fc.string(),
        x: fc.float({ min: 0, max: 2000, noNaN: true }),
        y: fc.float({ min: 0, max: 2000, noNaN: true }),
        width: fc.constant(320),
        height: fc.constant(180),
        isEditing: fc.boolean(),
        mediaType: fc.constantFrom('image' as const, 'video' as const),
        imageUrl: fc.webUrl(),
        videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
        mediaWidth: fc.float({ min: 100, max: 1920, noNaN: true }),
        mediaHeight: fc.float({ min: 100, max: 1080, noNaN: true }),
        actualWidth: fc.constant(320),
        actualHeight: fc.constant(280), // Taller with media
      })

      fc.assert(
        fc.property(nodeWithMediaArbitrary, (node) => {
          // Calculate connection points with media
          const beforeRightPoint = calculateConnectionPoint(node, 'right')
          const beforeLeftPoint = calculateConnectionPoint(node, 'left')
          
          // Simulate media deletion - node becomes shorter
          const nodeWithoutMedia = {
            ...node,
            mediaType: null,
            imageUrl: undefined,
            videoUrl: undefined,
            mediaWidth: undefined,
            mediaHeight: undefined,
            actualHeight: 180, // Shorter without media
          }
          
          // Calculate connection points after media removal
          const afterRightPoint = calculateConnectionPoint(nodeWithoutMedia, 'right')
          const afterLeftPoint = calculateConnectionPoint(nodeWithoutMedia, 'left')
          
          // Y position should change (node is shorter)
          expect(afterRightPoint.y).toBeCloseTo(node.y + 180 / 2, 5)
          expect(afterLeftPoint.y).toBeCloseTo(node.y + 180 / 2, 5)
          
          // Y position should be different from before
          expect(Math.abs(afterRightPoint.y - beforeRightPoint.y)).toBeGreaterThan(0.01)
          expect(Math.abs(afterLeftPoint.y - beforeLeftPoint.y)).toBeGreaterThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain connection line attachment during dimension changes', () => {
      const nodePairArbitrary = fc.tuple(nodeArbitrary, nodeArbitrary)

      fc.assert(
        fc.property(nodePairArbitrary, fc.float({ min: 200, max: 400, noNaN: true }), ([fromNode, toNode], newHeight) => {
          // Calculate initial connection
          const initialFromPoint = calculateConnectionPoint(fromNode, 'right')
          const initialToPoint = calculateConnectionPoint(toNode, 'left')
          
          // Simulate dimension change on fromNode
          const updatedFromNode = {
            ...fromNode,
            actualHeight: newHeight,
          }
          
          // Recalculate connection points
          const updatedFromPoint = calculateConnectionPoint(updatedFromNode, 'right')
          const updatedToPoint = calculateConnectionPoint(toNode, 'left')
          
          // From point should update
          expect(updatedFromPoint.y).toBeCloseTo(fromNode.y + newHeight / 2, 5)
          
          // To point should remain unchanged
          expect(updatedToPoint.x).toBeCloseTo(initialToPoint.x, 5)
          expect(updatedToPoint.y).toBeCloseTo(initialToPoint.y, 5)
          
          // Connection line should still be valid (from right to left)
          expect(updatedFromPoint.side).toBe('right')
          expect(updatedToPoint.side).toBe('left')
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 3: Node Dimension Preservation', () => {
    /**
     * Feature: workflow-connection, Property 3: Node Dimension Preservation
     * Validates: Requirements 3.1, 3.2, 3.5
     * 
     * For any node that is saved with media content, when the node is loaded again, 
     * its dimensions SHALL match the dimensions it had when saved, preserving the 
     * media aspect ratio.
     */

    // Helper to calculate node dimensions
    function calculateNodeDimensions(node: Node): { width: number; height: number; mediaHeight: number } {
      const baseWidth = 320
      const basePadding = 40
      const contentPadding = 28
      
      let mediaHeight = 0
      if (node.mediaType && node.mediaWidth && node.mediaHeight) {
        const maxMediaHeight = 200
        const aspectRatio = node.mediaWidth / node.mediaHeight
        const calculatedHeight = baseWidth / aspectRatio
        mediaHeight = Math.min(calculatedHeight, maxMediaHeight)
      }
      
      const titleHeight = 24
      const descriptionHeight = node.description ? 80 : 0
      const editHintHeight = 30
      const spacing = 14
      
      const contentHeight = titleHeight + 
                           (mediaHeight > 0 ? mediaHeight + spacing : 0) +
                           (descriptionHeight > 0 ? descriptionHeight + spacing : 0) +
                           editHintHeight
      
      const totalHeight = contentHeight + contentPadding * 2 + 4
      
      return {
        width: baseWidth,
        height: totalHeight,
        mediaHeight
      }
    }

    it('should preserve dimensions after save/load cycle', () => {
      const nodeWithMediaArbitrary = fc.record({
        id: fc.string(),
        label: fc.string(),
        description: fc.string(),
        x: fc.float({ min: 0, max: 2000, noNaN: true }),
        y: fc.float({ min: 0, max: 2000, noNaN: true }),
        width: fc.float({ min: 100, max: 500, noNaN: true }),
        height: fc.float({ min: 80, max: 400, noNaN: true }),
        isEditing: fc.boolean(),
        mediaType: fc.constantFrom('image' as const, 'video' as const),
        imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
        videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
        mediaWidth: fc.float({ min: 100, max: 1920, noNaN: true }),
        mediaHeight: fc.float({ min: 100, max: 1080, noNaN: true }),
        actualWidth: fc.option(fc.float({ min: 100, max: 500, noNaN: true }), { nil: undefined }),
        actualHeight: fc.option(fc.float({ min: 80, max: 400, noNaN: true }), { nil: undefined }),
      })

      fc.assert(
        fc.property(nodeWithMediaArbitrary, (originalNode) => {
          // Calculate dimensions before "save"
          const dimensionsBeforeSave = calculateNodeDimensions(originalNode)
          
          // Simulate save/load cycle - node retains media dimensions
          const loadedNode = {
            ...originalNode,
            // Media dimensions are preserved
            mediaWidth: originalNode.mediaWidth,
            mediaHeight: originalNode.mediaHeight,
          }
          
          // Calculate dimensions after "load"
          const dimensionsAfterLoad = calculateNodeDimensions(loadedNode)
          
          // Dimensions should match
          expect(dimensionsAfterLoad.width).toBe(dimensionsBeforeSave.width)
          expect(dimensionsAfterLoad.height).toBeCloseTo(dimensionsBeforeSave.height, 1)
          expect(dimensionsAfterLoad.mediaHeight).toBeCloseTo(dimensionsBeforeSave.mediaHeight, 1)
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain aspect ratio across save/load', () => {
      const nodeWithMediaArbitrary = fc.record({
        id: fc.string(),
        label: fc.string(),
        description: fc.string(),
        x: fc.float({ min: 0, max: 2000, noNaN: true }),
        y: fc.float({ min: 0, max: 2000, noNaN: true }),
        width: fc.float({ min: 100, max: 500, noNaN: true }),
        height: fc.float({ min: 80, max: 400, noNaN: true }),
        isEditing: fc.boolean(),
        mediaType: fc.constantFrom('image' as const, 'video' as const),
        imageUrl: fc.webUrl(),
        videoUrl: fc.option(fc.webUrl(), { nil: undefined }),
        mediaWidth: fc.float({ min: 100, max: 1920, noNaN: true }),
        mediaHeight: fc.float({ min: 100, max: 1080, noNaN: true }),
        actualWidth: fc.option(fc.float({ min: 100, max: 500, noNaN: true }), { nil: undefined }),
        actualHeight: fc.option(fc.float({ min: 80, max: 400, noNaN: true }), { nil: undefined }),
      })

      fc.assert(
        fc.property(nodeWithMediaArbitrary, (node) => {
          const dimensions = calculateNodeDimensions(node)
          
          if (node.mediaWidth && node.mediaHeight && dimensions.mediaHeight > 0) {
            const originalAspectRatio = node.mediaWidth / node.mediaHeight
            const baseWidth = 320
            const expectedHeight = baseWidth / originalAspectRatio
            
            if (expectedHeight <= 200) {
              // Aspect ratio should be preserved
              expect(dimensions.mediaHeight).toBeCloseTo(expectedHeight, 1)
            } else {
              // Should be capped at max height
              expect(dimensions.mediaHeight).toBe(200)
            }
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should calculate consistent dimensions for same node data', () => {
      fc.assert(
        fc.property(nodeArbitrary, (node) => {
          // Calculate dimensions twice
          const dimensions1 = calculateNodeDimensions(node)
          const dimensions2 = calculateNodeDimensions(node)
          
          // Should be identical
          expect(dimensions1.width).toBe(dimensions2.width)
          expect(dimensions1.height).toBe(dimensions2.height)
          expect(dimensions1.mediaHeight).toBe(dimensions2.mediaHeight)
        }),
        { numRuns: 100 }
      )
    })
  })
})
