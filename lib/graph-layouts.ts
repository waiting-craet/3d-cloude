/**
 * 图谱布局算法库
 * 
 * 提供多种布局算法，根据图谱特征自动选择最合适的布局
 */

export interface Node {
  id: string
  name: string
  x: number
  y: number
  vx?: number
  vy?: number
  color: string
  size: number
  [key: string]: any
}

export interface Edge {
  id: string
  source: string
  target: string
  label: string
  color: string
  [key: string]: any
}

export type LayoutType = 'radial' | 'hierarchical' | 'force' | 'grid' | 'timeline'

export interface GraphAnalysis {
  nodeCount: number
  edgeCount: number
  avgDegree: number
  maxDegree: number
  hasHierarchy: boolean
  hasCycles: boolean
  hasTimestamps: boolean
  density: number
  recommendedLayout: LayoutType
}

/**
 * 分析图谱特征
 */
export function analyzeGraph(nodes: Node[], edges: Edge[]): GraphAnalysis {
  const nodeCount = nodes.length
  const edgeCount = edges.length
  
  // 计算节点度数
  const degreeMap = new Map<string, number>()
  nodes.forEach(node => degreeMap.set(node.id, 0))
  
  edges.forEach(edge => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
  })
  
  const degrees = Array.from(degreeMap.values())
  const avgDegree = degrees.reduce((a, b) => a + b, 0) / nodeCount
  const maxDegree = Math.max(...degrees)
  
  // 检测层级结构
  const hasHierarchy = detectHierarchy(nodes, edges)
  
  // 检测环
  const hasCycles = detectCycles(nodes, edges)
  
  // 检测时间戳
  const hasTimestamps = nodes.some(node => 
    node.timestamp || node.date || node.time || node.createdAt
  )
  
  // 计算密度
  const maxEdges = nodeCount * (nodeCount - 1) / 2
  const density = maxEdges > 0 ? edgeCount / maxEdges : 0
  
  // 推荐布局
  const recommendedLayout = recommendLayout({
    nodeCount,
    edgeCount,
    avgDegree,
    maxDegree,
    hasHierarchy,
    hasCycles,
    hasTimestamps,
    density
  })
  
  return {
    nodeCount,
    edgeCount,
    avgDegree,
    maxDegree,
    hasHierarchy,
    hasCycles,
    hasTimestamps,
    density,
    recommendedLayout
  }
}

/**
 * 检测层级结构
 */
function detectHierarchy(nodes: Node[], edges: Edge[]): boolean {
  // 计算入度
  const inDegree = new Map<string, number>()
  nodes.forEach(node => inDegree.set(node.id, 0))
  
  edges.forEach(edge => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })
  
  // 如果有明显的根节点（入度为0）和叶子节点（出度为0），可能是层级结构
  const rootNodes = Array.from(inDegree.entries()).filter(([_, degree]) => degree === 0)
  
  return rootNodes.length > 0 && rootNodes.length < nodes.length * 0.3
}

/**
 * 检测环
 */
function detectCycles(nodes: Node[], edges: Edge[]): boolean {
  const adjList = new Map<string, string[]>()
  nodes.forEach(node => adjList.set(node.id, []))
  
  edges.forEach(edge => {
    const neighbors = adjList.get(edge.source) || []
    neighbors.push(edge.target)
    adjList.set(edge.source, neighbors)
  })
  
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recStack.add(nodeId)
    
    const neighbors = adjList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recStack.has(neighbor)) {
        return true
      }
    }
    
    recStack.delete(nodeId)
    return false
  }
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }
  
  return false
}

/**
 * 推荐布局算法
 */
function recommendLayout(analysis: Omit<GraphAnalysis, 'recommendedLayout'>): LayoutType {
  const { nodeCount, hasHierarchy, hasCycles, hasTimestamps, density, maxDegree } = analysis
  
  // 时序布局：有时间戳
  if (hasTimestamps) {
    return 'timeline'
  }
  
  // 层级布局：有明显层级且无环
  if (hasHierarchy && !hasCycles) {
    return 'hierarchical'
  }
  
  // 网格布局：节点很多且密度低
  if (nodeCount > 30 && density < 0.1) {
    return 'grid'
  }
  
  // 径向布局：有明显中心节点
  if (maxDegree > nodeCount * 0.3) {
    return 'radial'
  }
  
  // 力导向布局：复杂关联
  if (density > 0.2) {
    return 'force'
  }
  
  // 默认：径向布局
  return 'radial'
}

/**
 * 径向布局（中心-辐射）
 */
export function radialLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return []
  
  // 找出连接最多的节点作为中心
  const connectionCount = new Map<string, number>()
  nodes.forEach(node => connectionCount.set(node.id, 0))
  
  edges.forEach(edge => {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1)
  })
  
  const sortedNodes = [...nodes].sort((a, b) => 
    (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
  )
  
  const centerNode = sortedNodes[0]
  const outerNodes = sortedNodes.slice(1)
  
  const radius = 300 + outerNodes.length * 20 // 从250+15增加到300+20
  
  const layoutNodes: Node[] = []
  
  // 中心节点
  layoutNodes.push({ ...centerNode, x: 0, y: 0 })
  
  // 外围节点
  outerNodes.forEach((node, index) => {
    const angle = (index / outerNodes.length) * 2 * Math.PI - Math.PI / 2
    layoutNodes.push({
      ...node,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    })
  })
  
  return layoutNodes
}

/**
 * 层级布局（树状结构）
 */
export function hierarchicalLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return []
  
  // 构建邻接表
  const adjList = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  nodes.forEach(node => {
    adjList.set(node.id, [])
    inDegree.set(node.id, 0)
  })
  
  edges.forEach(edge => {
    const children = adjList.get(edge.source) || []
    children.push(edge.target)
    adjList.set(edge.source, children)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })
  
  // 找根节点
  const roots = nodes.filter(node => (inDegree.get(node.id) || 0) === 0)
  if (roots.length === 0) {
    // 没有根节点，使用径向布局
    return radialLayout(nodes, edges)
  }
  
  // 分层
  const levels: string[][] = []
  const visited = new Set<string>()
  
  function bfs(startNodes: Node[]) {
    let queue = startNodes.map(n => n.id)
    
    while (queue.length > 0) {
      levels.push([...queue])
      const nextQueue: string[] = []
      
      queue.forEach(nodeId => {
        visited.add(nodeId)
        const children = adjList.get(nodeId) || []
        children.forEach(child => {
          if (!visited.has(child) && !nextQueue.includes(child)) {
            nextQueue.push(child)
          }
        })
      })
      
      queue = nextQueue
    }
  }
  
  bfs(roots)
  
  // 布局
  const layoutNodes: Node[] = []
  const levelHeight = 250 // 从200增加到250
  const nodeSpacing = 200 // 从150增加到200
  
  levels.forEach((level, levelIndex) => {
    const y = levelIndex * levelHeight - (levels.length * levelHeight) / 2
    const totalWidth = (level.length - 1) * nodeSpacing
    
    level.forEach((nodeId, nodeIndex) => {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        const x = nodeIndex * nodeSpacing - totalWidth / 2
        layoutNodes.push({ ...node, x, y })
      }
    })
  })
  
  // 添加未访问的节点
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      layoutNodes.push({
        ...node,
        x: Math.random() * 400 - 200,
        y: levels.length * levelHeight
      })
    }
  })
  
  return layoutNodes
}

/**
 * 力导向布局（复杂关联）
 */
export function forceLayout(nodes: Node[], edges: Edge[], iterations: number = 500): Node[] {
  if (nodes.length === 0) return []
  
  // 初始化随机位置，使用更大的初始范围
  const layoutNodes = nodes.map(node => ({
    ...node,
    x: Math.random() * 800 - 400,
    y: Math.random() * 800 - 400,
    vx: 0,
    vy: 0
  }))
  
  // 力模拟
  for (let iter = 0; iter < iterations; iter++) {
    // 斥力 - 增强斥力强度
    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const dx = layoutNodes[j].x - layoutNodes[i].x
        const dy = layoutNodes[j].y - layoutNodes[i].y
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.1
        const repulsion = 500 / (distance * distance) // 从100增加到500
        const fx = (dx / distance) * repulsion
        const fy = (dy / distance) * repulsion
        
        layoutNodes[i].vx! -= fx
        layoutNodes[i].vy! -= fy
        layoutNodes[j].vx! += fx
        layoutNodes[j].vy! += fy
      }
    }
    
    // 引力 - 调整引力系数
    edges.forEach(edge => {
      const source = layoutNodes.find(n => n.id === edge.source)
      const target = layoutNodes.find(n => n.id === edge.target)
      if (!source || !target) return
      
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.1
      const attraction = distance * 0.005 // 从0.01减少到0.005，减弱引力
      const fx = (dx / distance) * attraction
      const fy = (dy / distance) * attraction
      
      source.vx! += fx
      source.vy! += fy
      target.vx! -= fx
      target.vy! -= fy
    })
    
    // 更新位置
    layoutNodes.forEach(node => {
      node.vx! *= 0.85 // 从0.9减少到0.85，增加阻尼
      node.vy! *= 0.85
      node.x += node.vx!
      node.y += node.vy!
    })
  }
  
  return layoutNodes
}

/**
 * 网格布局（大量节点）
 */
export function gridLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return []
  
  const cols = Math.ceil(Math.sqrt(nodes.length))
  const spacing = 220 // 从180增加到220
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const totalRows = Math.ceil(nodes.length / cols)
    
    return {
      ...node,
      x: col * spacing - (cols * spacing) / 2 + spacing / 2,
      y: row * spacing - (totalRows * spacing) / 2 + spacing / 2
    }
  })
}

/**
 * 时序布局（时间线）
 */
export function timelineLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return []
  
  // 提取时间戳
  const nodesWithTime = nodes.map(node => {
    const timestamp = 
      node.timestamp || 
      node.date || 
      node.time || 
      node.createdAt ||
      Date.now()
    
    return {
      ...node,
      _timestamp: typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
    }
  })
  
  // 按时间排序
  nodesWithTime.sort((a, b) => a._timestamp - b._timestamp)
  
  // 布局
  const timeSpan = nodesWithTime[nodesWithTime.length - 1]._timestamp - nodesWithTime[0]._timestamp
  const xRange = 800
  const lanes = 3 // 3条泳道
  const laneHeight = 200
  
  return nodesWithTime.map((node, index) => {
    const progress = timeSpan > 0 
      ? (node._timestamp - nodesWithTime[0]._timestamp) / timeSpan 
      : index / nodesWithTime.length
    
    const x = progress * xRange - xRange / 2
    const lane = index % lanes
    const y = lane * laneHeight - laneHeight
    
    const { _timestamp, ...originalNode } = node
    return { ...originalNode, x, y }
  })
}

/**
 * 应用布局
 */
export function applyLayout(
  nodes: Node[], 
  edges: Edge[], 
  layoutType?: LayoutType
): { nodes: Node[]; analysis: GraphAnalysis } {
  const analysis = analyzeGraph(nodes, edges)
  const selectedLayout = layoutType || analysis.recommendedLayout
  
  let layoutNodes: Node[]
  
  switch (selectedLayout) {
    case 'hierarchical':
      layoutNodes = hierarchicalLayout(nodes, edges)
      break
    case 'force':
      layoutNodes = forceLayout(nodes, edges)
      break
    case 'grid':
      layoutNodes = gridLayout(nodes, edges)
      break
    case 'timeline':
      layoutNodes = timelineLayout(nodes, edges)
      break
    case 'radial':
    default:
      layoutNodes = radialLayout(nodes, edges)
      break
  }
  
  return { nodes: layoutNodes, analysis }
}
