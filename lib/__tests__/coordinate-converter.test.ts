/**
 * Coordinate Converter Tests
 * 
 * Basic unit tests for the coordinate conversion functionality
 */

import {
  convertTo3DCoordinates,
  convertNodesToCoordinates,
  calculateBounds,
  enforceMinimumDistance,
  calculateDistance3D,
  type Node2D,
} from '../coordinate-converter'

describe('Coordinate Converter', () => {
  describe('calculateBounds', () => {
    it('should calculate correct bounds for multiple nodes', () => {
      const nodes: Node2D[] = [
        { id: '1', label: 'A', description: '', x: 0, y: 0 },
        { id: '2', label: 'B', description: '', x: 100, y: 50 },
        { id: '3', label: 'C', description: '', x: -50, y: 75 },
      ]

      const bounds = calculateBounds(nodes)

      expect(bounds.minX).toBe(-50)
      expect(bounds.maxX).toBe(100)
      expect(bounds.minY).toBe(0)
      expect(bounds.maxY).toBe(75)
    })

    it('should handle empty array', () => {
      const bounds = calculateBounds([])
      expect(bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 })
    })
  })

  describe('convertTo3DCoordinates', () => {
    it('should convert 2D coordinates to 3D with proper scaling', () => {
      const nodes: Node2D[] = [
        { id: '1', label: 'A', description: '', x: 0, y: 0 },
        { id: '2', label: 'B', description: '', x: 100, y: 100 },
      ]

      const result = convertTo3DCoordinates(nodes[0], nodes)

      // Check that coordinates are numbers
      expect(typeof result.x3d).toBe('number')
      expect(typeof result.y3d).toBe('number')
      expect(typeof result.z3d).toBe('number')

      // Check that coordinates are finite
      expect(isFinite(result.x3d)).toBe(true)
      expect(isFinite(result.y3d)).toBe(true)
      expect(isFinite(result.z3d)).toBe(true)

      // Check that original 2D coordinates are preserved
      expect(result.x2d).toBe(0)
      expect(result.y2d).toBe(0)
    })

    it('should add Y-axis variation with heightVariation config', () => {
      const nodes: Node2D[] = [
        { id: '1', label: 'A', description: '', x: 0, y: 0 },
        { id: '2', label: 'B', description: '', x: 100, y: 0 },
        { id: '3', label: 'C', description: '', x: 200, y: 0 },
      ]

      const results = nodes.map(node =>
        convertTo3DCoordinates(node, nodes, { heightVariation: 5 })
      )

      // Check that Y coordinates vary
      const yCoords = results.map(r => r.y3d)
      const uniqueYCoords = new Set(yCoords)

      // At least 2 different Y values (some might be the same due to sine wave)
      expect(uniqueYCoords.size).toBeGreaterThanOrEqual(2)
    })

    it('should preserve relative horizontal positions', () => {
      const nodes: Node2D[] = [
        { id: '1', label: 'A', description: '', x: 0, y: 0 },
        { id: '2', label: 'B', description: '', x: 100, y: 0 },
      ]

      const result1 = convertTo3DCoordinates(nodes[0], nodes)
      const result2 = convertTo3DCoordinates(nodes[1], nodes)

      // Node B should be to the right of Node A
      expect(result2.x3d).toBeGreaterThan(result1.x3d)
    })
  })

  describe('enforceMinimumDistance', () => {
    it('should push apart nodes that are too close', () => {
      const nodes = [
        { label: 'A', description: '', x2d: 0, y2d: 0, x3d: 0, y3d: 0, z3d: 0 },
        { label: 'B', description: '', x2d: 1, y2d: 0, x3d: 0.5, y3d: 0, z3d: 0 },
      ]

      const result = enforceMinimumDistance(nodes, 2.0)

      const distance = calculateDistance3D(
        { x: result[0].x3d, y: result[0].y3d, z: result[0].z3d },
        { x: result[1].x3d, y: result[1].y3d, z: result[1].z3d }
      )

      // Distance should be at least the minimum
      expect(distance).toBeGreaterThanOrEqual(1.9) // Allow small floating point error
    })

    it('should not modify nodes that are already far apart', () => {
      const nodes = [
        { label: 'A', description: '', x2d: 0, y2d: 0, x3d: 0, y3d: 0, z3d: 0 },
        { label: 'B', description: '', x2d: 10, y2d: 0, x3d: 10, y3d: 0, z3d: 0 },
      ]

      const result = enforceMinimumDistance(nodes, 2.0)

      // Positions should remain approximately the same
      expect(Math.abs(result[0].x3d - 0)).toBeLessThan(0.1)
      expect(Math.abs(result[1].x3d - 10)).toBeLessThan(0.1)
    })
  })

  describe('convertNodesToCoordinates', () => {
    it('should convert all nodes and enforce minimum distance', () => {
      const nodes: Node2D[] = [
        { id: '1', label: 'A', description: '', x: 0, y: 0 },
        { id: '2', label: 'B', description: '', x: 10, y: 0 },
        { id: '3', label: 'C', description: '', x: 20, y: 0 },
      ]

      const results = convertNodesToCoordinates(nodes, {
        heightVariation: 5,
        minNodeDistance: 2,
      })

      expect(results).toHaveLength(3)

      // Check all pairwise distances
      for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
          const distance = calculateDistance3D(
            { x: results[i].x3d, y: results[i].y3d, z: results[i].z3d },
            { x: results[j].x3d, y: results[j].y3d, z: results[j].z3d }
          )

          // All distances should be at least the minimum
          expect(distance).toBeGreaterThanOrEqual(1.9) // Allow small floating point error
        }
      }
    })
  })

  describe('calculateDistance3D', () => {
    it('should calculate correct Euclidean distance', () => {
      const p1 = { x: 0, y: 0, z: 0 }
      const p2 = { x: 3, y: 4, z: 0 }

      const distance = calculateDistance3D(p1, p2)

      expect(distance).toBe(5) // 3-4-5 triangle
    })

    it('should handle 3D distances', () => {
      const p1 = { x: 0, y: 0, z: 0 }
      const p2 = { x: 1, y: 1, z: 1 }

      const distance = calculateDistance3D(p1, p2)

      expect(distance).toBeCloseTo(Math.sqrt(3), 5)
    })
  })
})
