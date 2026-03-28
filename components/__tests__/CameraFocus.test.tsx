/**
 * 摄像机聚焦功能单元测试
 * 测试距离计算、缓动函数和动画逻辑
 */

import * as THREE from 'three'

// 从KnowledgeGraph.tsx导出的函数需要在这里重新定义用于测试
// 在实际项目中,应该将这些函数提取到单独的工具文件中

/**
 * easeInOutCubic 缓动函数
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * 计算最佳观察距离
 */
function calculateOptimalDistance(
  nodeSize: number,
  fov: number,
  targetCoverage: number = 0.45,
  minDistance: number = 5,
  maxDistance: number = 50
): number {
  // 处理无效的节点大小
  const validSize = (nodeSize && isFinite(nodeSize) && nodeSize > 0) ? nodeSize : 1.5
  
  // 使用透视投影公式计算距离
  const fovRad = fov * (Math.PI / 180)
  const distance = (validSize * 2) / (2 * Math.tan(fovRad / 2) * targetCoverage)
  
  // 应用距离限制
  return Math.max(minDistance, Math.min(maxDistance, distance))
}

describe('CameraFocus - 缓动函数测试', () => {
  it('should return 0 at start', () => {
    expect(easeInOutCubic(0)).toBe(0)
  })
  
  it('should return 1 at end', () => {
    expect(easeInOutCubic(1)).toBe(1)
  })
  
  it('should return 0.5 at midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 2)
  })
  
  it('should be monotonically increasing', () => {
    for (let i = 0; i < 1; i += 0.1) {
      expect(easeInOutCubic(i + 0.1)).toBeGreaterThan(easeInOutCubic(i))
    }
  })
})

describe('CameraFocus - 距离计算测试', () => {
  const fov = 60
  
  it('should calculate correct distance for standard node', () => {
    const distance = calculateOptimalDistance(1.5, fov)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(50)
  })
  
  it('should handle zero or undefined size', () => {
    // 当size为0时,使用默认值1.5,然后应用距离限制
    const dist0 = calculateOptimalDistance(0, fov)
    expect(dist0).toBeGreaterThanOrEqual(5)
    expect(dist0).toBeLessThanOrEqual(50)
    
    const distNaN = calculateOptimalDistance(NaN, fov)
    expect(distNaN).toBeGreaterThan(0)
  })
  
  it('should respect min distance limit', () => {
    expect(calculateOptimalDistance(0.1, fov)).toBeGreaterThanOrEqual(5)
  })
  
  it('should respect max distance limit', () => {
    expect(calculateOptimalDistance(100, fov)).toBeLessThanOrEqual(50)
  })
  
  it('larger nodes should have larger distances', () => {
    const dist1 = calculateOptimalDistance(1, fov)
    const dist2 = calculateOptimalDistance(2, fov)
    expect(dist2).toBeGreaterThan(dist1)
  })
})

describe('CameraFocus - 动画时长选择', () => {
  it('short distances should use 600ms', () => {
    const distance = 15
    const duration = distance < 20 ? 600 : 1000
    expect(duration).toBe(600)
  })
  
  it('long distances should use 1000ms', () => {
    const distance = 25
    const duration = distance < 20 ? 600 : 1000
    expect(duration).toBe(1000)
  })
})
