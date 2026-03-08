import * as XLSX from 'xlsx'
import jschardet from 'jschardet'
import * as iconv from 'iconv-lite'
import { DataValidator, validateAndCreateGraphData } from './data-validator'

/**
 * Normalize column name for case-insensitive matching
 * Removes BOM, invisible Unicode characters, converts to lowercase, trims whitespace
 * and replaces multiple internal spaces with single space
 *
 * @param columnName - Raw column name from CSV/Excel header
 * @returns Normalized column name for matching
 */
export function normalizeColumnName(columnName: string): string {
  return columnName
    // Remove BOM marker at the start
    .replace(/^\uFEFF/, '')
    // Remove all invisible Unicode characters (zero-width spaces)
    .replace(/[\u200B\u200C\u200D]/g, '')
    // Convert to lowercase
    .toLowerCase()
    // Trim leading and trailing whitespace
    .trim()
    // Replace multiple internal spaces with single space
    .replace(/\s+/g, ' ')
}
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
  metadata?: {
    format: 'edge-list' | 'matrix-list' | 'unknown'
    version?: string
    nodeCount: number
    edgeCount: number
  }
}

// 边列表行数据接口
export interface EdgeListRow {
  source: string
  relation?: string
  target: string
}

/**
 * 检测Excel文件格式类型
 * 返回 'edge-list'、'matrix-list' 或 'unknown'
 */
export function detectFileFormat(workbook: XLSX.WorkBook): 'edge-list' | 'matrix-list' | 'unknown' {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
  
  if (data.length === 0) return 'unknown'
  
  const headers = data[0] as string[]
  
  // 检测边列表格式：三列且标题匹配
  if (headers.length === 3) {
    const header0 = headers[0]?.toString().toLowerCase().trim()
    const header1 = headers[1]?.toString().toLowerCase().trim()
    const header2 = headers[2]?.toString().toLowerCase().trim()
    
    // 检查是否包含"源节点"、"关系"、"目标节点"关键词
    if (
      (header0.includes('源节点') || header0.includes('source')) &&
      (header1.includes('关系') || header1.includes('relation') || header1.includes('relationship')) &&
      (header2.includes('目标节点') || header2.includes('target'))
    ) {
      return 'edge-list'
    }
  }
  
  // 否则尝试矩阵列表格式
  // 矩阵列表格式通常有多列，且第一列是节点名称
  if (headers.length > 3) {
    return 'matrix-list'
  }
  
  return 'unknown'
}

/**
 * 解析边列表格式的Excel文件
 */
export function parseEdgeListExcel(workbook: XLSX.WorkBook): ParsedGraphData {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
  
  if (data.length === 0) {
    throw new Error('Excel文件为空')
  }
  
  // 跳过标题行
  const edgeRows: EdgeListRow[] = []
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const source = row[0]?.toString().trim()
    const relation = row[1]?.toString().trim()
    const target = row[2]?.toString().trim()
    
    // 跳过空行和空白行
    if (!source || !target) continue
    
    edgeRows.push({
      source,
      relation: relation || undefined,
      target
    })
  }
  
  // 从边列表提取节点和边
  return extractNodesAndEdgesFromEdgeList(edgeRows)
}

/**
 * 解析边列表格式的CSV文件
 */
export function parseEdgeListCSV(text: string): ParsedGraphData {
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim()
    return trimmed && !trimmed.startsWith('#') // 跳过空行和注释行
  })
  
  if (lines.length === 0) {
    throw new Error('CSV文件为空')
  }
  
  // 跳过标题行
  const edgeRows: EdgeListRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    
    const source = values[0]?.trim()
    const relation = values[1]?.trim()
    const target = values[2]?.trim()
    
    // 跳过空行和空白行
    if (!source || !target) continue
    
    edgeRows.push({
      source,
      relation: relation || undefined,
      target
    })
  }
  
  // 从边列表提取节点和边
  return extractNodesAndEdgesFromEdgeList(edgeRows)
}

/**
 * 解析边列表格式的JSON文件
 */
export function parseEdgeListJSON(data: any): ParsedGraphData {
  if (!data.edges || !Array.isArray(data.edges)) {
    throw new Error('JSON文件必须包含edges数组')
  }
  
  const edgeRows: EdgeListRow[] = data.edges.map((edge: any) => ({
    source: edge.source?.toString().trim() || '',
    relation: edge.relation?.toString().trim() || undefined,
    target: edge.target?.toString().trim() || ''
  }))
  
  // 从边列表提取节点和边
  return extractNodesAndEdgesFromEdgeList(edgeRows)
}

/**
 * 从边列表提取节点和边
 * 自动提取所有唯一节点
 */
export function extractNodesAndEdgesFromEdgeList(edgeList: EdgeListRow[]): ParsedGraphData {
  const nodeMap = new Map<string, NodeData>()
  const edges: EdgeData[] = []
  
  edgeList.forEach(edge => {
    const source = edge.source?.trim()
    const target = edge.target?.trim()
    
    // 跳过空行和空白行
    if (!source || !target) return
    
    // 提取源节点
    if (!nodeMap.has(source)) {
      nodeMap.set(source, {
        label: source,
        description: ''
      })
    }
    
    // 提取目标节点
    if (!nodeMap.has(target)) {
      nodeMap.set(target, {
        label: target,
        description: ''
      })
    }
    
    // 创建边
    edges.push({
      source,
      target,
      label: edge.relation || ''
    })
  })
  
  const nodes = Array.from(nodeMap.values())
  
  return {
    nodes,
    edges,
    metadata: {
      format: 'edge-list',
      version: '2.0',
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  }
}

/**
 * 解析Excel文件
 * 支持两种格式：
 * 1. 两个工作表（Nodes和Edges）
 * 2. 单个工作表（source, target, relationship格式）
 * 3. 边列表格式（源节点、关系、目标节点）
 * 统一处理为3D格式，自动转换2D坐标
 */
export async function parseExcelFile(file: File): Promise<ParsedGraphData> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  
  // 检测文件格式
  const format = detectFileFormat(workbook)
  
  let result: ParsedGraphData
  
  if (format === 'edge-list') {
    // 格式1: 边列表格式（新格式）
    result = parseEdgeListExcel(workbook)
  } else {
    // 检查是否有Nodes和Edges工作表
    const hasNodesSheet = workbook.SheetNames.includes('Nodes')
    const hasEdgesSheet = workbook.SheetNames.includes('Edges')
    
    if (hasNodesSheet && hasEdgesSheet) {
      // 格式2: 分离的Nodes和Edges工作表
      result = parseExcelWithSeparateSheets(workbook)
    } else {
      // 格式3: 单个工作表，source-target格式或矩阵列表格式
      result = parseExcelWithSingleSheet(workbook)
    }
  }
  
  // 确保所有节点都有必需的字段（id）
  // 不在这里生成坐标，让后续的 generateLayout 函数处理
  result.nodes = result.nodes.map((node, index) => ({
    ...node,
    id: node.id || node.label || `node-${index}`
  }))
  
  return result
}

/**
 * 解析带有独立Nodes和Edges工作表的Excel
 */
function parseExcelWithSeparateSheets(workbook: XLSX.WorkBook): ParsedGraphData {
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
    z: parseFloat(row.z || row.Z) || undefined, // 支持3D坐标，如果存在的话
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
function parseExcelWithSingleSheet(workbook: XLSX.WorkBook): ParsedGraphData {
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
 * 统一处理为3D格式，自动转换2D坐标
 * 自动检测文件编码（支持GBK、GB2312、UTF-8等）
 */
export async function parseCSVFile(file: File): Promise<ParsedGraphData> {
  // 读取原始字节数据
  const buffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(buffer)
  
  // 检测文件编码 - jschardet需要Buffer类型
  const detected = jschardet.detect(Buffer.from(uint8Array))
  let encoding = detected.encoding || 'UTF-8'
  
  // 映射jschardet的编码名称到iconv-lite支持的名称
  const encodingMap: { [key: string]: string } = {
    'GB2312': 'GBK',  // iconv-lite uses GBK for GB2312
    'GB18030': 'GBK', // iconv-lite uses GBK for GB18030
    'BIG5': 'Big5',
    'UTF-8': 'UTF-8',
    'UTF-16LE': 'UTF-16LE',
    'UTF-16BE': 'UTF-16BE',
    'ISO-8859-1': 'ISO-8859-1',
    'windows-1252': 'windows-1252',
    'Shift_JIS': 'Shift_JIS',
    'EUC-JP': 'EUC-JP',
    'EUC-KR': 'EUC-KR'
  }
  
  // 使用映射后的编码名称，如果没有映射则使用原始名称
  encoding = encodingMap[encoding] || encoding
  
  // 特殊处理：如果检测为windows-1252或ISO-8859-1但包含高字节字符（可能是中文编码误检测）
  // 尝试用GBK和Big5解码，选择包含最多有效中文字符的结果
  if (encoding === 'windows-1252' || encoding === 'ISO-8859-1') {
    // 检查是否包含高字节字符（>0x7F）
    const hasHighBytes = Array.from(uint8Array).some(byte => byte > 0x7F)
    if (hasHighBytes) {
      let bestEncoding = encoding
      let maxChineseChars = 0
      
      // 尝试GBK
      try {
        const gbkText = iconv.decode(Buffer.from(uint8Array), 'GBK')
        const chineseChars = (gbkText.match(/[\u4e00-\u9fa5]/g) || []).length
        if (chineseChars > maxChineseChars) {
          maxChineseChars = chineseChars
          bestEncoding = 'GBK'
        }
      } catch (e) {
        // GBK解码失败
      }
      
      // 尝试Big5
      try {
        const big5Text = iconv.decode(Buffer.from(uint8Array), 'Big5')
        const chineseChars = (big5Text.match(/[\u4e00-\u9fa5]/g) || []).length
        if (chineseChars > maxChineseChars) {
          maxChineseChars = chineseChars
          bestEncoding = 'Big5'
        }
      } catch (e) {
        // Big5解码失败
      }
      
      // 如果找到了包含中文字符的编码，使用它
      if (maxChineseChars > 0) {
        encoding = bestEncoding
      }
    }
  }
  
  // 使用iconv-lite解码文件（支持更多编码格式）
  const text = iconv.decode(Buffer.from(uint8Array), encoding)
  
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('CSV文件为空')
  }
  
  const headers = lines[0].split(',').map(h => normalizeColumnName(h))
  
  // 检查是否包含节点坐标信息
  const hasCoordinates = headers.includes('x') && headers.includes('y')
  
  let result: ParsedGraphData
  if (hasCoordinates) {
    // 格式1: 完整的节点数据
    result = parseCSVWithNodeData(lines, headers)
  } else {
    // 格式2: source-target格式
    result = parseCSVWithEdgeData(lines, headers)
  }
  
  // 确保所有节点都有必需的字段（id）
  // 不在这里生成坐标，让后续的 generateLayout 函数处理
  result.nodes = result.nodes.map((node, index) => ({
    ...node,
    id: node.id || node.label || `node-${index}`
  }))
  
  return result
}

/**
 * 解析包含完整节点数据的CSV
 */
function parseCSVWithNodeData(lines: string[], headers: string[]): ParsedGraphData {
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
      z: parseFloat(row.z) || undefined, // 支持3D坐标，如果存在的话
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
  
  const sourceIndex = headers.findIndex(h => ['source', 'from', 'src', '源节点', '起点', '来源'].includes(h))
  const targetIndex = headers.findIndex(h => ['target', 'to', 'dest', 'dst', '目标节点', '终点', '目的地'].includes(h))
  const labelIndex = headers.findIndex(h => ['label', 'relationship', 'relation', 'type', '关系', '关系类型', '边类型', '连接类型'].includes(h))
  
  if (sourceIndex === -1 || targetIndex === -1) {
    throw new Error(`CSV文件必须包含source和target列。找到的列：${headers.join(', ')}`)
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
 * 统一处理为3D格式，自动转换2D坐标
 */
export async function parseJSONFile(file: File): Promise<ParsedGraphData> {
  const text = await file.text()
  const data = JSON.parse(text)
  
  let result: ParsedGraphData
  
  // 格式1: { edges: [...] } (边列表格式)
  if (data.edges && Array.isArray(data.edges) && !data.nodes) {
    result = parseEdgeListJSON(data)
  }
  // 格式2: { nodes: [...], edges: [...] }
  else if (data.nodes && Array.isArray(data.nodes)) {
    result = parseJSONWithNodesEdges(data)
  }
  // 格式3: { elements: { nodes: [...], edges: [...] } } (Cytoscape格式)
  else if (data.elements && data.elements.nodes) {
    result = parseJSONWithNodesEdges(data.elements)
  }
  // 格式4: 数组格式 [{ source, target, ... }, ...]
  else if (Array.isArray(data)) {
    result = parseJSONArray(data)
  }
  else {
    throw new Error('不支持的JSON格式')
  }
  
  // 确保所有节点都有必需的字段（id）
  // 不在这里生成坐标，让后续的 generateLayout 函数处理
  result.nodes = result.nodes.map((node, index) => ({
    ...node,
    id: node.id || node.label || `node-${index}`
  }))
  
  return result
}

/**
 * 解析标准的nodes-edges格式JSON
 */
function parseJSONWithNodesEdges(data: any): ParsedGraphData {
  const nodes: NodeData[] = (data.nodes || []).map((node: any) => ({
    id: node.id || node.data?.id,
    label: node.label || node.data?.label || node.name || node.data?.name || '未命名',
    description: node.description || node.data?.description || '',
    x: parseFloat(node.x || node.position?.x || node.data?.x) || undefined,
    y: parseFloat(node.y || node.position?.y || node.data?.y) || undefined,
    z: parseFloat(node.z || node.data?.z) || undefined, // 支持3D坐标，如果存在的话
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
 * 使用力导向布局算法，统一生成3D坐标
 */
export function generateLayout(
  nodes: NodeData[],
  edges: EdgeData[]
): NodeData[] {
  // 检查是否有有效的坐标（不是undefined且不全为0）
  const hasValidCoordinates = nodes.some(n => 
    n.x !== undefined && n.y !== undefined && 
    (n.x !== 0 || n.y !== 0 || (n.z !== undefined && n.z !== 0))
  )
  
  if (hasValidCoordinates) {
    // 如果已有有效坐标，只为缺失坐标的节点生成
    return nodes.map(node => {
      if (node.x === undefined || node.y === undefined) {
        return generateNodePosition(node)
      }
      return node
    })
  }
  
  // 使用力导向布局
  return generateForceDirectedLayout(nodes, edges)
}

/**
 * 为单个节点生成随机位置（3D坐标）
 */
function generateNodePosition(node: NodeData): NodeData {
  const range = 500
  return {
    ...node,
    x: Math.random() * range * 2 - range,
    y: Math.random() * range * 2 - range,
    z: Math.random() * range * 2 - range
  }
}

/**
 * 使用力导向算法生成布局
 * 优化版本：更好的3D空间分布、合理的节点间距
 * 统一生成3D坐标
 */
function generateForceDirectedLayout(
  nodes: NodeData[],
  edges: EdgeData[]
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
  
  // 自适应布局范围 - 大幅缩小，让节点更紧凑
  const baseRadius = Math.max(30, Math.min(80, nodeCount * 5))
  
  // 初始化位置 - 使用真正的随机3D球体分布
  const positions = nodes.map(() => {
    // 使用均匀随机分布在球体内
    const u = Math.random()
    const v = Math.random()
    const w = Math.random()
    const theta = 2 * Math.PI * u // 方位角 [0, 2π]
    const phi = Math.acos(2 * v - 1) // 极角 [0, π]
    const r = baseRadius * Math.cbrt(w) // 立方根保证球体内均匀分布
    
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi)
    }
  })
  
  // 自适应参数 - 调整力的平衡以获得更紧凑的布局
  const k = Math.sqrt((baseRadius * baseRadius * 4) / nodeCount) * 0.8 // 减小理想距离
  const iterations = Math.min(100, Math.max(40, nodeCount * 3)) // 增加迭代次数以获得更稳定的布局
  const initialTemp = baseRadius * 0.5
  
  // 力导向迭代
  for (let iter = 0; iter < iterations; iter++) {
    const forces = positions.map(() => ({ x: 0, y: 0, z: 0 }))
    
    // 计算斥力（所有节点对之间）- 适度斥力保持间距
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[i].x - positions[j].x
        const dy = positions[i].y - positions[j].y
        const dz = positions[i].z - positions[j].z
        const distSq = dx * dx + dy * dy + dz * dz
        const distance = Math.sqrt(distSq) || 0.01
        
        // 库仑斥力: F = k^2 / d，适度斥力
        const repulsion = (k * k * 2.0) / distance
        const fx = (dx / distance) * repulsion
        const fy = (dy / distance) * repulsion
        const fz = (dz / distance) * repulsion
        
        forces[i].x += fx
        forces[i].y += fy
        forces[i].z += fz
        forces[j].x -= fx
        forces[j].y -= fy
        forces[j].z -= fz
      }
    }
    
    // 计算引力（连接的节点之间）- 适度引力保持连接
    edges.forEach(edge => {
      const i = nodeIndex.get(edge.source)
      const j = nodeIndex.get(edge.target)
      
      if (i !== undefined && j !== undefined) {
        const dx = positions[i].x - positions[j].x
        const dy = positions[i].y - positions[j].y
        const dz = positions[i].z - positions[j].z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
        
        // 胡克引力: F = d^2 / k，适度引力
        const attraction = (distance * distance) / (k * 2.0)
        const fx = (dx / distance) * attraction
        const fy = (dy / distance) * attraction
        const fz = (dz / distance) * attraction
        
        forces[i].x -= fx
        forces[i].y -= fy
        forces[i].z -= fz
        forces[j].x += fx
        forces[j].y += fy
        forces[j].z += fz
      }
    })
    
    // 应用力并限制移动距离（模拟退火）
    const t = initialTemp * (1 - iter / iterations)
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
      positions[i].z += (forces[i].z / forceMag) * displacement
    }
  }
  
  // 中心化布局（将质心移到原点）
  const centerX = positions.reduce((sum, p) => sum + p.x, 0) / nodeCount
  const centerY = positions.reduce((sum, p) => sum + p.y, 0) / nodeCount
  const centerZ = positions.reduce((sum, p) => sum + p.z, 0) / nodeCount
  
  // 应用计算出的位置（中心化并四舍五入）
  return nodes.map((node, i) => ({
    ...node,
    x: Math.round((positions[i].x - centerX) * 100) / 100,
    y: Math.round((positions[i].y - centerY) * 100) / 100,
    z: Math.round((positions[i].z - centerZ) * 100) / 100
  }))
}

/**
 * 统一的数据导入和验证函数
 * 集成文件解析、坐标转换和数据验证
 */
export async function importAndValidateGraphData(file: File): Promise<{
  success: boolean
  data?: ParsedGraphData
  validatedData?: any
  errors?: string[]
  warnings?: string[]
}> {
  try {
    // 1. 验证文件格式
    const fileValidation = DataValidator.validateFileFormat(file)
    if (!fileValidation.isValid) {
      return {
        success: false,
        errors: fileValidation.errors.map(e => e.message)
      }
    }

    // 2. 解析文件数据
    let parsedData: ParsedGraphData
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      parsedData = await parseExcelFile(file)
    } else if (fileName.endsWith('.csv')) {
      parsedData = await parseCSVFile(file)
    } else if (fileName.endsWith('.json')) {
      parsedData = await parseJSONFile(file)
    } else {
      return {
        success: false,
        errors: ['不支持的文件格式']
      }
    }

    // 3. 验证数据并创建验证后的图谱数据
    const { result, validatedData } = validateAndCreateGraphData(parsedData)
    
    return {
      success: result.isValid,
      data: parsedData,
      validatedData,
      errors: result.errors.map(e => e.message),
      warnings: result.warnings.map(w => w.message)
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : '导入过程中发生未知错误']
    }
  }
}