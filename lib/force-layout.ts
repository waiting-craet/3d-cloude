/**
 * 力导向布局算法
 * 
 * 基于物理模拟的图谱布局算法，使图谱更有组织性和美观性
 */

export interface Node3DPosition {
  id: string
  x: number
  y: number
  z: number
}

export interface Edge {
  from: string
  to: string
}

export interface ForceLayoutConfig {
  iterations?: number          // 迭代次数 (default: 100)
  springLength?: number        // 弹簧长度 (default: 30)
  springStrength?: number      // 弹簧强度 (default: 0.1)
  repulsionStrength?: number   // 排斥力强度 (default: 1000)
  damping?: number            // 阻尼系数 (default: 0.9)
  minDistance?: number        // 最小距离 (default: 20)
}

const DEFAULT_CONFIG: Required<ForceLayoutConfig> = {
  iterations: 80,
  springLength: 18,
  springStrength: 0.1,
  repulsionStrength: 900,
  damping: 0.9,
  minDistance: 10,
}

/**
 * 应用力导向布局算法
 * 
 * @param nodes 节点位置数组
 * @param edges 边连接数组
 * @param config 配置参数
 * @returns 优化后的节点位置
 */
export function applyForceLayout(
  nodes: Node3DPosition[],
  edges: Edge[],
  config: ForceLayoutConfig = {}
): Node3DPosition[] {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  console.log(`🎯 开始力导向布局: ${nodes.length} 个节点, ${edges.length} 条边`)
  console.log(`   配置: 迭代=${cfg.iterations}, 弹簧长度=${cfg.springLength}, 排斥力=${cfg.repulsionStrength}`)
  
  // 创建节点位置和速度的副本
  const positions = nodes.map(n => ({ ...n }))
  const velocities = nodes.map(() => ({ x: 0, y: 0, z: 0 }))
  
  // 创建节点ID到索引的映射
  const nodeIndexMap = new Map<string, number>()
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.id, index)
  })
  
  // 迭代模拟
  for (let iter = 0; iter < cfg.iterations; iter++) {
    // 重置力
    const forces = positions.map(() => ({ x: 0, y: 0, z: 0 }))
    
    // 1. 计算排斥力（所有节点对之间）
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i]
        const pos2 = positions[j]
        
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dz = pos2.z - pos1.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (distance > 0.1) {
          // 库仑排斥力: F = k / r^2
          const force = cfg.repulsionStrength / (distance * distance)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          const fz = (dz / distance) * force
          
          forces[i].x -= fx
          forces[i].y -= fy
          forces[i].z -= fz
          
          forces[j].x += fx
          forces[j].y += fy
          forces[j].z += fz
        }
      }
    }
    
    // 2. 计算弹簧力（有连接的节点之间）
    for (const edge of edges) {
      const i = nodeIndexMap.get(edge.from)
      const j = nodeIndexMap.get(edge.to)
      
      if (i === undefined || j === undefined) continue
      
      const pos1 = positions[i]
      const pos2 = positions[j]
      
      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const dz = pos2.z - pos1.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      if (distance > 0.1) {
        // 胡克弹簧力: F = k * (r - r0)
        const displacement = distance - cfg.springLength
        const force = cfg.springStrength * displacement
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        const fz = (dz / distance) * force
        
        forces[i].x += fx
        forces[i].y += fy
        forces[i].z += fz
        
        forces[j].x -= fx
        forces[j].y -= fy
        forces[j].z -= fz
      }
    }
    
    // 3. 更新速度和位置
    for (let i = 0; i < positions.length; i++) {
      // 更新速度（加上力，应用阻尼）
      velocities[i].x = (velocities[i].x + forces[i].x) * cfg.damping
      velocities[i].y = (velocities[i].y + forces[i].y) * cfg.damping
      velocities[i].z = (velocities[i].z + forces[i].z) * cfg.damping
      
      // 更新位置
      positions[i].x += velocities[i].x
      positions[i].y += velocities[i].y
      positions[i].z += velocities[i].z
    }
    
    // 4. 强制最小距离
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i]
        const pos2 = positions[j]
        
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dz = pos2.z - pos1.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (distance < cfg.minDistance && distance > 0.1) {
          const pushDistance = (cfg.minDistance - distance) / 2
          const factor = pushDistance / distance
          
          pos1.x -= dx * factor
          pos1.y -= dy * factor
          pos1.z -= dz * factor
          
          pos2.x += dx * factor
          pos2.y += dy * factor
          pos2.z += dz * factor
        }
      }
    }
    
    // 每 20 次迭代输出一次日志
    if (iter % 20 === 0 || iter === cfg.iterations - 1) {
      const totalEnergy = velocities.reduce((sum, v) => 
        sum + Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z), 0
      )
      console.log(`   迭代 ${iter}: 总能量 = ${totalEnergy.toFixed(2)}`)
    }
  }
  
  console.log(`✅ 力导向布局完成`)
  
  return positions
}

/**
 * 居中布局
 * 
 * 将所有节点居中到原点
 */
export function centerLayout(nodes: Node3DPosition[]): Node3DPosition[] {
  if (nodes.length === 0) return nodes
  
  // 计算中心点
  const center = {
    x: nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length,
    y: nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length,
    z: nodes.reduce((sum, n) => sum + n.z, 0) / nodes.length,
  }
  
  // 移动所有节点
  return nodes.map(n => ({
    ...n,
    x: n.x - center.x,
    y: n.y - center.y,
    z: n.z - center.z,
  }))
}
