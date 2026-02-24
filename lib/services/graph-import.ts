import * as XLSX from 'xlsx'

// 节点数据接口
export interface NodeData {
  id?: string
  label: string
  description?: string
  x?: number
  y?: number
  z?: number
  color?: string
  size?: number
  shape?: string
}

// 边数据接口
export interface EdgeData {
  source: string
  target: string
  label?: string
}

// 解析结果接口
export interface ParsedGraphData {
  nodes: NodeData[]
  edges: EdgeData[]
}

/**
 * 解析Excel文件
 * 支持两种格式：
 * 1. 两个工作表（Nodes和Edges）
 * 2. 单个工作表（source, target, relationship格式）
 */
export async function parseExcelFile(file: File, graphType: '2D' | '3D'): Promise<ParsedGraphData> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  
  // 检查是否有Nodes和Edges工作表
  const hasNodesSheet = workbook.SheetNames.includes('Nodes')
  const hasEdgesSheet = workbook.SheetNames.includes('Edges')
  
  if (hasNodesSheet && hasEdgesSheet) {
    // 格式1: 分离的Nodes和Edges工作表
    return parseExcelWithSeparateSheets(workbook, graphType)
  } else {
    // 格式2: 单个工作表，source-target格式
    return parseExcelWithSingleSheet(workbook, graphType)
  }
}

/**
 * 解析带有独立Nodes和Edges工作表的Excel
 */
function parseExcelWithSeparateSheets(workbook: XLSX.WorkBook, graphType: '2D' | '3D'): ParsedGraphData {
  const nodesSheet = workbook.Sheets['Nodes']
  const edgesSheet = workbook.Sheets['Edges']
  
  const nodesData = XLSX.utils.sheet_to_json<any>(nodesSheet)
  const edgesData = XLSX.utils.sheet_to_json<any>(edgesSheet)
  
  const nodes: NodeData[] = nodesData.map(row => ({
    id: row.id || row.ID,
    label: row.label || row.Label || row.name || row.Name || '未命名',
    description: row.description || row.Description || '',
    x: parseFloat(row.x || row.X) || undefined,
    y: parseFloat(row.y || row.Y) || undefined,
    z: graphType === '3D' ? (parseFloat(row.z || row.Z) || undefined) : undefined,
    color: row.color || row.Color,
    size: parseFloat(row.size || row.Size) || undefined,
    shape: row.shape || row.Shape
  }))
  
  const edges: EdgeData[] = edgesData.map(row => ({
    source: row.source || row.Source || row.from || row.From,
    target: row.target || row.Target || row.to || row.To,
    label: row.label || row.Label || row.relationship || row.Relationship || ''
  }))
  
  return { nodes, edges }
}

/**
 * 解析单个工作表的Excel（source-target格式）
 */
function parseExcelWithSingleSheet(workbook: XLSX.WorkBook, graphType: '2D' | '3D'): ParsedGraphData {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<any>(firstSheet)
  
  const nodeSet = new Set<string>()
  const edges: EdgeData[] = []
  
  data.forEach(row => {
    const source = row.source || row.Source || row.from || row.From
    const target = row.target || row.Target || row.to || row.To
    const label = row.label || row.Label || row.relationship || row.Relationship || ''
    
    if (source && target) {
      nodeSet.add(source)
      nodeSet.add(target)
      edges.push({ source, target, label })
    }
  })
  
  const nodes: NodeData[] = Array.from(nodeSet).map(label => ({
    label,
    description: ''
  }))
  
  return { nodes, edges }
}

/**
 * 解析CSV文件
 * 支持两种格式：
 * 1. source, target, relationship格式
 * 2. 完整的节点和边数据
 */
export async function parseCSVFile(file: File, graphType: '2D' | '3D'): Promise<ParsedGraphData> {
  const text = await file.text()
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('CSV文件为空')
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  
  // 检查是否包含节点坐标信息
  const hasCoordinates = headers.includes('x') && headers.includes('y')
  
  if (hasCoordinates) {
    // 格式1: 完整的节点数据
    return parseCSVWithNodeData(lines, headers, graphType)
  } else {
    // 格式2: source-target格式
    return parseCSVWithEdgeData(lines, headers)
  }
}

/**
 * 解析包含完整节点数据的CSV
 */
function parseCSVWithNodeData(lines: string[], headers: string[], graphType: '2D' | '3D'): ParsedGraphData {
  const nodes: NodeData[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    
    nodes.push({
      id: row.id,
      label: row.label || row.name || '未命名',
      description: row.description || '',
      x: parseFloat(row.x) || undefined,
      y: parseFloat(row.y) || undefined,
      z: graphType === '3D' ? (parseFloat(row.z) || undefined) : undefined,
      color: row.color,
      size: parseFloat(row.size) || undefined,
      shape: row.shape
    })
  }
  
  return { nodes, edges: [] }
}

/**
 * 解析source-target格式的CSV
 */
function parseCSVWithEdgeData(lines: string[], headers: string[]): ParsedGraphData {
  const nodeSet = new Set<string>()
  const edges: EdgeData[] = []
  
  const sourceIndex = headers.findIndex(h => ['source', 'from', 'src'].includes(h))
  const targetIndex = headers.findIndex(h => ['target', 'to', 'dest', 'dst'].includes(h))
  const labelIndex = headers.findIndex(h => ['label', 'relationship', 'relation', 'type'].includes(h))
  
  if (sourceIndex === -1 || targetIndex === -1) {
    throw new Error('CSV文件必须包含source和target列')
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    
    const source = values[sourceIndex]?.trim()
    const target = values[targetIndex]?.trim()
    const label = labelIndex !== -1 ? values[labelIndex]?.trim() : ''
    
    if (source && target) {
      nodeSet.add(source)
      nodeSet.add(target)
      edges.push({ source, target, label: label || '' })
    }
  }
  
  const nodes: NodeData[] = Array.from(nodeSet).map(label => ({
    label,
    description: ''
  }))
  
  return { nodes, edges }
}

/**
 * 解析CSV行，处理引号和逗号
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * 解析JSON文件
 * 支持多种JSON格式
 */
export async function parseJSONFile(file: File, graphType: '2D' | '3D'): Promise<ParsedGraphData> {
  const text = await file.text()
  const data = JSON.parse(text)
  
  // 格式1: { nodes: [...], edges: [...] }
  if (data.nodes && Array.isArray(data.nodes)) {
    return parseJSONWithNodesEdges(data, graphType)
  }
  
  // 格式2: { elements: { nodes: [...], edges: [...] } } (Cytoscape格式)
  if (data.elements && data.elements.nodes) {
    return parseJSONWithNodesEdges(data.elements, graphType)
  }
  
  // 格式3: 数组格式 [{ source, target, ... }, ...]
  if (Array.isArray(data)) {
    return parseJSONArray(data)
  }
  
  throw new Error('不支持的JSON格式')
}

/**
 * 解析标准的nodes-edges格式JSON
 */
function parseJSONWithNodesEdges(data: any, graphType: '2D' | '3D'): ParsedGraphData {
  const nodes: NodeData[] = (data.nodes || []).map((node: any) => ({
    id: node.id || node.data?.id,
    label: node.label || node.data?.label || node.name || node.data?.name || '未命名',
    description: node.description || node.data?.description || '',
    x: parseFloat(node.x || node.position?.x || node.data?.x) || undefined,
    y: parseFloat(node.y || node.position?.y || node.data?.y) || undefined,
    z: graphType === '3D' ? (parseFloat(node.z || node.data?.z) || undefined) : undefined,
    color: node.color || node.data?.color,
    size: parseFloat(node.size || node.data?.size) || undefined,
    shape: node.shape || node.data?.shape
  }))
  
  const edges: EdgeData[] = (data.edges || data.links || []).map((edge: any) => ({
    source: edge.source || edge.data?.source || edge.from,
    target: edge.target || edge.data?.target || edge.to,
    label: edge.label || edge.data?.label || edge.relationship || ''
  }))
  
  return { nodes, edges }
}

/**
 * 解析数组格式的JSON
 */
function parseJSONArray(data: any[]): ParsedGraphData {
  const nodeSet = new Set<string>()
  const edges: EdgeData[] = []
  
  data.forEach(item => {
    const source = item.source || item.from
    const target = item.target || item.to
    const label = item.label || item.relationship || item.type || ''
    
    if (source && target) {
      nodeSet.add(source)
      nodeSet.add(target)
      edges.push({ source, target, label })
    }
  })
  
  const nodes: NodeData[] = Array.from(nodeSet).map(label => ({
    label,
    description: ''
  }))
  
  return { nodes, edges }
}

/**
 * 为没有坐标的节点生成布局
 * 使用力导向布局算法
 */
export function generateLayout(
  nodes: NodeData[],
  edges: EdgeData[],
  graphType: '2D' | '3D'
): NodeData[] {
  const hasCoordinates = nodes.some(n => n.x !== undefined && n.y !== undefined)
  
  if (hasCoordinates) {
    // 如果已有坐标，只为缺失坐标的节点生成
    return nodes.map(node => {
      if (node.x === undefined || node.y === undefined) {
        return generateNodePosition(node, graphType)
      }
      return node
    })
  }
  
  // 使用力导向布局
  return generateForceDirectedLayout(nodes, edges, graphType)
}

/**
 * 为单个节点生成随机位置
 */
function generateNodePosition(node: NodeData, graphType: '2D' | '3D'): NodeData {
  const range = 500
  return {
    ...node,
    x: Math.random() * range * 2 - range,
    y: Math.random() * range * 2 - range,
    z: graphType === '3D' ? Math.random() * range * 2 - range : 0
  }
}

/**
 * 使用力导向算法生成布局
 * 优化版本：更好的初始分布、自适应参数、更快的收敛
 */
function generateForceDirectedLayout(
  nodes: NodeData[],
  edges: EdgeData[],
  graphType: '2D' | '3D'
): NodeData[] {
  const nodeCount = nodes.length
  if (nodeCount === 0) return nodes
  
  // 创建节点索引映射
  const nodeIndex = new Map<string, number>()
  nodes.forEach((node, i) => {
    nodeIndex.set(node.id || node.label, i)
  })
  
  // 计算图的连通性以优化布局
  const adjacency = new Map<number, Set<number>>()
  edges.forEach(edge => {
    const i = nodeIndex.get(edge.source)
    const j = nodeIndex.get(edge.target)
    if (i !== undefined && j !== undefined) {
      if (!adjacency.has(i)) adjacency.set(i, new Set())
      if (!adjacency.has(j)) adjacency.set(j, new Set())
      adjacency.get(i)!.add(j)
      adjacency.get(j)!.add(i)
    }
  })
  
  // 自适应布局范围（根据节点数量）
  const baseRadius = Math.max(200, Math.min(500, nodeCount * 10))
  
  // 初始化位置（改进的分布算法）
  const positions = nodes.map((_, i) => {
    if (graphType === '3D') {
      // 3D: 使用斐波那契球面分布（更均匀）
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      return {
        x: baseRadius * Math.sin(phi) * Math.cos(theta),
        y: baseRadius * Math.sin(phi) * Math.sin(theta),
        z: baseRadius * Math.cos(phi)
      }
    } else {
      // 2D: 使用黄金角螺旋分布（更均匀）
      const angle = i * 2.399963229728653 // 黄金角
      const radius = baseRadius * Math.sqrt(i / nodeCount)
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: 0
      }
    }
  })
  
  // 自适应参数
  const k = Math.sqrt((baseRadius * baseRadius * 4) / nodeCount) // 理想距离
  const iterations = Math.min(100, Math.max(30, nodeCount * 2)) // 自适应迭代次数
  const initialTemp = baseRadius * 0.3 // 初始温度
  
  // 力导向迭代
  for (let iter = 0; iter < iterations; iter++) {
    const forces = positions.map(() => ({ x: 0, y: 0, z: 0 }))
    
    // 计算斥力（所有节点对之间）- 使用Barnes-Hut近似加速
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[i].x - positions[j].x
        const dy = positions[i].y - positions[j].y
        const dz = graphType === '3D' ? positions[i].z - positions[j].z : 0
        const distSq = dx * dx + dy * dy + dz * dz
        const distance = Math.sqrt(distSq) || 0.01
        
        // 库仑斥力: F = k^2 / d
        const repulsion = (k * k) / distance
        const fx = (dx / distance) * repulsion
        const fy = (dy / distance) * repulsion
        const fz = graphType === '3D' ? (dz / distance) * repulsion : 0
        
        forces[i].x += fx
        forces[i].y += fy
        forces[i].z += fz
        forces[j].x -= fx
        forces[j].y -= fy
        forces[j].z -= fz
      }
    }
    
    // 计算引力（连接的节点之间）
    edges.forEach(edge => {
      const i = nodeIndex.get(edge.source)
      const j = nodeIndex.get(edge.target)
      
      if (i !== undefined && j !== undefined) {
        const dx = positions[i].x - positions[j].x
        const dy = positions[i].y - positions[j].y
        const dz = graphType === '3D' ? positions[i].z - positions[j].z : 0
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
        
        // 胡克引力: F = d^2 / k
        const attraction = (distance * distance) / k
        const fx = (dx / distance) * attraction
        const fy = (dy / distance) * attraction
        const fz = graphType === '3D' ? (dz / distance) * attraction : 0
        
        forces[i].x -= fx
        forces[i].y -= fy
        forces[i].z -= fz
        forces[j].x += fx
        forces[j].y += fy
        forces[j].z += fz
      }
    })
    
    // 应用力并限制移动距离（模拟退火）
    const t = initialTemp * (1 - iter / iterations) // 线性降温
    for (let i = 0; i < nodeCount; i++) {
      const forceMag = Math.sqrt(
        forces[i].x * forces[i].x +
        forces[i].y * forces[i].y +
        forces[i].z * forces[i].z
      ) || 0.01
      
      // 限制最大位移
      const displacement = Math.min(forceMag, t)
      positions[i].x += (forces[i].x / forceMag) * displacement
      positions[i].y += (forces[i].y / forceMag) * displacement
      if (graphType === '3D') {
        positions[i].z += (forces[i].z / forceMag) * displacement
      }
    }
  }
  
  // 中心化布局（将质心移到原点）
  const centerX = positions.reduce((sum, p) => sum + p.x, 0) / nodeCount
  const centerY = positions.reduce((sum, p) => sum + p.y, 0) / nodeCount
  const centerZ = graphType === '3D' 
    ? positions.reduce((sum, p) => sum + p.z, 0) / nodeCount 
    : 0
  
  // 应用计算出的位置（中心化）
  return nodes.map((node, i) => ({
    ...node,
    x: Math.round((positions[i].x - centerX) * 100) / 100,
    y: Math.round((positions[i].y - centerY) * 100) / 100,
    z: graphType === '3D' ? Math.round((positions[i].z - centerZ) * 100) / 100 : 0
  }))
}
