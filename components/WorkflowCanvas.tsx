'use client'

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useGraphStore } from '@/lib/store'
import { getWorkflowThemeConfig } from '@/lib/theme'

interface Node {
  id: string
  label: string
  description: string
  x: number
  y: number
  width: number
  height: number
  isEditing: boolean
  imageUrl?: string  // 图片 URL
  videoUrl?: string  // 视频 URL
  mediaType?: 'image' | 'video' | null  // 媒体类型
  // NEW: Store actual rendered dimensions
  actualWidth?: number
  actualHeight?: number
  // NEW: Store media dimensions for aspect ratio preservation
  mediaWidth?: number
  mediaHeight?: number
}

interface Connection {
  id: string
  from: string
  to: string
  label?: string
  // NEW: Cache connection point positions for performance
  cachedFromPoint?: ConnectionPointPosition
  cachedToPoint?: ConnectionPointPosition
}

interface ConnectionPointPosition {
  x: number  // Absolute X coordinate in canvas space
  y: number  // Absolute Y coordinate in canvas space
  side: 'left' | 'right'  // Which side of the node
}

export interface WorkflowCanvasRef {
  saveAndConvert: () => Promise<void>
  savePositions: () => Promise<void>  // 新增：仅保存位置
  isConverting: boolean
  conversionError: string | null
  conversionSuccess: boolean
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" opacity="0.7" />
    </svg>
  )
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M9 4h6l1 2H8l1-2Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7l.7 11.1A2 2 0 0 0 9.7 20h4.6a2 2 0 0 0 1.99-1.89L17 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function ImageIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path d="M5.5 17.5 11 12.5l2.8 2.8 2.2-2.3 2.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VideoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="13" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 10 21 7.5v9L16.5 14" fill="currentColor" />
    </svg>
  )
}

function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.5l2.6 2.6L16.3 9.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5.2M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const WorkflowCanvas = forwardRef<WorkflowCanvasRef>((props, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  // NEW: Ref map to track node DOM elements
  const nodeRefsMap = useRef<Map<string, HTMLDivElement>>(new Map())
  
  // 从store获取主题
  const { theme } = useGraphStore()
  const workflowThemeConfig = getWorkflowThemeConfig(theme)
  
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 400, y: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 })
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredButtons, setHoveredButtons] = useState<string | null>(null)
  const [isDraggingConnection, setIsDraggingConnection] = useState(false)
  const [dragLineEnd, setDragLineEnd] = useState({ x: 0, y: 0 })
  const [editingConnection, setEditingConnection] = useState<string | null>(null)
  const [connectionLabel, setConnectionLabel] = useState('')
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)

  // 转换相关状态
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  const [conversionSuccess, setConversionSuccess] = useState(false)
  const [savingStatus, setSavingStatus] = useState<string>('')

  // 媒体上传状态
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null)

  // 跟踪上次保存的位置（用于增量更新）
  const lastSavedPositions = useRef<Map<string, { x: number; y: number }>>(new Map())

  // 从store获取当前图谱
  const { currentGraph, currentProject, nodes: storeNodes, edges: storeEdges, refreshProjects } = useGraphStore()

  // 计算连接点位置
  const calculateConnectionPoint = (node: Node, side: 'left' | 'right'): ConnectionPointPosition => {
    // Use actual rendered dimensions if available, otherwise fall back to default dimensions
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

  // 计算节点尺寸
  const calculateNodeDimensions = (node: Node): { width: number; height: number; mediaHeight: number } => {
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

  // 恢复节点位置
  const restorePositions = useCallback((savedPositions: any) => {
    if (!savedPositions || !savedPositions.nodes || savedPositions.nodes.length === 0) {
      return
    }

    const positionMap = new Map(
      savedPositions.nodes.map((n: any) => [n.id, { x: n.x, y: n.y }])
    )

    setNodes(prevNodes => 
      prevNodes.map(node => {
        const savedPos = positionMap.get(node.id)
        return savedPos ? { ...node, ...savedPos } : node
      })
    )

    if (savedPositions.metadata) {
      if (savedPositions.metadata.scale) {
        setScale(savedPositions.metadata.scale)
      }
      if (savedPositions.metadata.offset) {
        setOffset(savedPositions.metadata.offset)
      }
    }
  }, [])

  // 跟踪上次加载的 store 数据引用，防止更新 settings 时重置本地画布状态（幽灵现象）
  const lastLoadedDataRef = useRef<{ nodes: any, edges: any, graphId: string } | null>(null)

  // 加载当前图谱的数据
  useEffect(() => {
    if (!currentGraph) {
      console.log('⚠️ 2D视图: 没有选择图谱')
      return
    }

    // 检查是否已经加载过这批确切的数据。
    // 如果仅仅是 currentGraph.settings 被 savePositions 更新了，不应该重置本地的 nodes 和 connections 状态，否则会导致卡片幽灵复位
    if (
      lastLoadedDataRef.current?.nodes === storeNodes &&
      lastLoadedDataRef.current?.edges === storeEdges &&
      lastLoadedDataRef.current?.graphId === currentGraph.id
    ) {
      return
    }

    console.log('🔄 2D视图: 加载图谱数据:', currentGraph.name)
    lastLoadedDataRef.current = { nodes: storeNodes, edges: storeEdges, graphId: currentGraph.id }
    console.log('📊 currentGraph.settings:', currentGraph.settings)

    // 检查是否有保存的位置数据
    let savedPositionsMap: Map<string, { x: number; y: number }> | null = null
    let savedMetadata: { scale?: number; offset?: { x: number; y: number } } | null = null
    
    if (currentGraph.settings) {
      try {
        const settings = typeof currentGraph.settings === 'string'
          ? JSON.parse(currentGraph.settings)
          : currentGraph.settings
        
        console.log('📊 解析后的settings:', settings)
        
        if (settings.workflowPositions && settings.workflowPositions.nodes) {
          console.log('🔄 发现保存的位置数据，节点数量:', settings.workflowPositions.nodes.length)
          savedPositionsMap = new Map(
            settings.workflowPositions.nodes.map((n: any) => [n.id, { x: n.x, y: n.y }])
          )
          savedMetadata = settings.workflowPositions.metadata
          console.log('📊 保存的位置映射:', Array.from(savedPositionsMap.entries()))
        } else {
          console.log('⚠️ settings中没有workflowPositions数据')
        }
      } catch (error) {
        console.error('解析保存的位置失败:', error)
      }
    } else {
      console.log('⚠️ currentGraph.settings为null')
    }

    // 将3D节点转换为2D节点
    const converted2DNodes: Node[] = storeNodes.map((node, index) => {
      // 如果有保存的位置，使用保存的位置；否则使用转换后的位置
      const savedPos = savedPositionsMap?.get(node.id)
      
      const nodeData = {
        id: node.id,
        label: node.name,
        description: node.description || '',
        x: savedPos ? savedPos.x : (node.x || 0) * 15 + 300, // 优先使用保存的位置；否则将3D X轴映射到2D X轴，缩放15倍使排布更合理
        y: savedPos ? savedPos.y : (node.z !== undefined && node.z !== null && node.z !== 0 ? node.z : node.y || 0) * 15 + 300, // 将3D图谱的Z轴（纵深平面）映射到2D画板的Y轴
        width: 200,
        height: 100,
        isEditing: false,
        imageUrl: node.imageUrl,
        videoUrl: node.videoUrl,
        mediaType: node.imageUrl ? 'image' : node.videoUrl ? 'video' : null,
      }
      
      if (savedPos) {
        console.log(`  ✅ 节点 ${node.id} 使用保存的位置: (${savedPos.x}, ${savedPos.y})`)
      }
      
      return nodeData
    })

    // 将3D边转换为2D连接
    const converted2DConnections: Connection[] = storeEdges.map(edge => ({
      id: edge.id,
      from: edge.fromNodeId,
      to: edge.toNodeId,
      label: edge.label,
    }))

    console.log('✅ 2D视图: 加载了', converted2DNodes.length, '个节点和', converted2DConnections.length, '条连接')
    
    if (savedPositionsMap) {
      console.log('✅ 已应用保存的节点位置')
    }

    setNodes(converted2DNodes)
    setConnections(converted2DConnections)

    // 恢复保存的画布metadata（scale和offset）
    if (savedMetadata) {
      if (savedMetadata.scale) {
        setScale(savedMetadata.scale)
        console.log('✅ 已恢复画布缩放:', savedMetadata.scale)
      }
      if (savedMetadata.offset) {
        setOffset(savedMetadata.offset)
        console.log('✅ 已恢复画布偏移:', savedMetadata.offset)
      }
    }
  }, [currentGraph, storeNodes, storeEdges])

  // NEW: ResizeObserver to track node dimension changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const nodeElement = entry.target as HTMLDivElement
        const nodeId = nodeElement.dataset.nodeId
        
        if (nodeId) {
          const { width, height } = entry.contentRect
          
          // Update node state with actual dimensions
          updateNodeDimensions(nodeId, {
            actualWidth: width,
            actualHeight: height
          })
        }
      })
    })

    // Observe all node elements
    nodeRefsMap.current.forEach((element, nodeId) => {
      if (element) {
        resizeObserver.observe(element)
      }
    })

    // Cleanup observer on unmount
    return () => {
      resizeObserver.disconnect()
    }
  }, [nodes]) // Re-run when nodes change

  // NEW: Effect to update connections when node dimensions change (Task 9.1)
  useEffect(() => {
    // Force connection re-render by invalidating all connection caches
    // This ensures connections update when node dimensions change
    setConnections(prev => prev.map(conn => ({
      ...conn,
      cachedFromPoint: undefined,
      cachedToPoint: undefined,
    })))
  }, [nodes.map(n => `${n.id}-${n.actualWidth}-${n.actualHeight}`).join(',')]) // Depend on node dimensions

  // 处理画布拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果正在拖拽连线，不处理画布拖动
    if (isDraggingConnection) return
    if ((e.target as HTMLElement).closest('.workflow-node')) return
    if ((e.target as HTMLElement).closest('.connection-point')) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }

    if (draggedNode) {
      const dx = (e.clientX - nodeDragStart.x) / scale
      const dy = (e.clientY - nodeDragStart.y) / scale
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode
          ? { ...node, x: node.x + dx, y: node.y + dy }
          : node
      ))
      
      setNodeDragStart({ x: e.clientX, y: e.clientY })
    }

    // 拖拽连线时更新线的终点位置
    if (isDraggingConnection && connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const mouseX = (e.clientX - rect.left - offset.x) / scale
        const mouseY = (e.clientY - rect.top - offset.y) / scale
        
        setDragLineEnd({ x: mouseX, y: mouseY })
        
        // 使用距离检测而不是 elementFromPoint
        // 检测鼠标是否接近任何节点的连接点
        let closestNode: string | null = null
        let minDistance = 30 // 30px 的检测范围
        
        nodes.forEach(node => {
          if (node.id === connectingFrom) return // 跳过起点节点
          
          // 使用实际渲染尺寸计算连接点位置
          const actualWidth = node.actualWidth || node.width
          const actualHeight = node.actualHeight || node.height
          
          // 计算到右侧连接点的距离
          const rightPointX = node.x + actualWidth
          const rightPointY = node.y + actualHeight / 2
          const rightDist = Math.sqrt(
            Math.pow(mouseX - rightPointX, 2) + Math.pow(mouseY - rightPointY, 2)
          )
          
          // 计算到左侧连接点的距离
          const leftPointX = node.x
          const leftPointY = node.y + actualHeight / 2
          const leftDist = Math.sqrt(
            Math.pow(mouseX - leftPointX, 2) + Math.pow(mouseY - leftPointY, 2)
          )
          
          // 取最近的距离
          const dist = Math.min(rightDist, leftDist)
          
          if (dist < minDistance) {
            minDistance = dist
            closestNode = node.id
          }
        })
        
        // 更新悬停状态
        setHoveredNode(closestNode)
      }
    }
  }, [isDragging, dragStart, draggedNode, nodeDragStart, scale, isDraggingConnection, connectingFrom, offset, nodes])

  const handleMouseUp = useCallback(() => {
    const wasDraggingNode = draggedNode !== null
    
    setIsDragging(false)
    setDraggedNode(null)
    
    // 结束拖拽连线 - 如果鼠标在某个节点上，创建连接
    if (isDraggingConnection && connectingFrom && hoveredNode && hoveredNode !== connectingFrom) {
      setConnections(prev => {
        // 避免重复连接
        const exists = prev.some(c => 
          (c.from === connectingFrom && c.to === hoveredNode) ||
          (c.from === hoveredNode && c.to === connectingFrom)
        )
        
        if (exists) {
          return prev
        }
        
        const newConnection: Connection = {
          id: `${connectingFrom}-${hoveredNode}-${Date.now()}`,
          from: connectingFrom,
          to: hoveredNode,
        }
        return [...prev, newConnection]
      })
    }
    
    // 重置连线状态
    if (isDraggingConnection) {
      setIsDraggingConnection(false)
      setConnectingFrom(null)
      setHoveredNode(null)
    }
  }, [isDraggingConnection, connectingFrom, hoveredNode, draggedNode])

  // 处理缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(0.1, scale * delta), 3)
    setScale(newScale)
  }

  // 处理节点拖动
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // 如果正在拖拽连线，不处理节点拖动
    if (isDraggingConnection) return
    
    e.stopPropagation()
    setDraggedNode(nodeId)
    setNodeDragStart({ x: e.clientX, y: e.clientY })
    setSelectedNode(nodeId)
  }

  // 直接添加新节点到画布
  const handleAddNode = () => {
    // 计算新节点的位置，避免重叠
    const baseX = 300
    const baseY = 300
    const offsetX = (nodes.length * 50) % 400
    const offsetY = Math.floor(nodes.length / 8) * 50
    
    const newNode: Node = {
      id: Date.now().toString(),
      label: '',
      description: '',
      x: baseX + offsetX,
      y: baseY + offsetY,
      width: 320,
      height: 180,
      isEditing: true,
    }

    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode.id)
  }

  // 更新节点内容
  const updateNode = (id: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ))
  }

  // 更新节点尺寸
  const updateNodeDimensions = (nodeId: string, dimensions: { actualWidth?: number; actualHeight?: number; mediaWidth?: number; mediaHeight?: number }) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, ...dimensions }
        : node
    ))
    
    // NEW: Invalidate connection cache when node dimensions change
    setConnections(prev => prev.map(conn => {
      if (conn.from === nodeId || conn.to === nodeId) {
        return {
          ...conn,
          cachedFromPoint: undefined,
          cachedToPoint: undefined
        }
      }
      return conn
    }))
  }

  // 完成编辑
  const finishEditing = (id: string) => {
    const node = nodes.find(n => n.id === id)
    if (node && !node.label.trim()) {
      // 只有标题为空时才删除节点
      deleteNode(id)
    } else {
      // 标题不为空，保存编辑
      updateNode(id, { isEditing: false })
    }
  }

  // 删除节点
  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
    setSelectedNode(null)
  }

  // 复制节点
  const duplicateNode = (id: string) => {
    const node = nodes.find(n => n.id === id)
    if (node) {
      const newNode: Node = {
        ...node,
        id: Date.now().toString(),
        x: node.x + 30,
        y: node.y + 30,
        isEditing: false,
      }
      setNodes(prev => [...prev, newNode])
    }
  }

  // 处理媒体上传
  const handleMediaUpload = async (nodeId: string, file: File) => {
    try {
      // 验证文件大小
      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 50 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`文件太大！${file.type.startsWith('image/') ? '图片' : '视频'}最大${file.type.startsWith('image/') ? '5MB' : '50MB'}`)
        return
      }

      setUploadingMedia(nodeId)

      // NEW: Extract media dimensions before upload
      let mediaWidth: number | undefined
      let mediaHeight: number | undefined

      if (file.type.startsWith('image/')) {
        // Extract image dimensions
        const img = new Image()
        const imageUrl = URL.createObjectURL(file)
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            mediaWidth = img.naturalWidth
            mediaHeight = img.naturalHeight
            URL.revokeObjectURL(imageUrl)
            resolve()
          }
          img.onerror = () => {
            URL.revokeObjectURL(imageUrl)
            reject(new Error('Failed to load image'))
          }
          img.src = imageUrl
        })
      } else if (file.type.startsWith('video/')) {
        // Extract video dimensions
        const video = document.createElement('video')
        const videoUrl = URL.createObjectURL(file)
        
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            mediaWidth = video.videoWidth
            mediaHeight = video.videoHeight
            URL.revokeObjectURL(videoUrl)
            resolve()
          }
          video.onerror = () => {
            URL.revokeObjectURL(videoUrl)
            reject(new Error('Failed to load video'))
          }
          video.src = videoUrl
        })
      }

      // 创建 FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('nodeId', nodeId)
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'video')

      // 上传到 API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // 显示详细的错误信息
        const errorMsg = data.message || data.error || '上传失败'
        throw new Error(errorMsg)
      }

      // NEW: Include media dimensions and explicitly call updateNodeLocal
      const updates = {
        imageUrl: data.mediaType === 'image' ? data.url : undefined,
        videoUrl: data.mediaType === 'video' ? data.url : undefined,
        mediaType: data.mediaType,
        mediaWidth,
        mediaHeight,
      }
      updateNode(nodeId, updates)
      
      // Also update the backend immediately to persist the change for 3d-editor
      try {
        await fetch(`/api/nodes/${nodeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      } catch (e) {
        console.error('Failed to sync media update to backend:', e)
      }
      
      // NEW: Trigger dimension recalculation by clearing actual dimensions
      // This allows ResizeObserver to measure the new dimensions
      setTimeout(() => {
        updateNodeDimensions(nodeId, {
          actualWidth: undefined,
          actualHeight: undefined,
        })
      }, 0)

    } catch (error) {
      console.error('上传失败:', error)
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试'
      alert(errorMessage)
    } finally {
      setUploadingMedia(null)
    }
  }

  // 删除媒体
  const handleDeleteMedia = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const mediaUrl = node.imageUrl || node.videoUrl
    if (!mediaUrl) return

    try {
      // 调用删除 API
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mediaUrl }),
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 更新节点
      updateNode(nodeId, {
        imageUrl: undefined,
        videoUrl: undefined,
        mediaType: null,
        mediaWidth: undefined,
        mediaHeight: undefined,
      })
      
      // NEW: Trigger dimension recalculation by clearing actual dimensions
      // This allows ResizeObserver to measure the new dimensions
      setTimeout(() => {
        updateNodeDimensions(nodeId, {
          actualWidth: undefined,
          actualHeight: undefined,
        })
      }, 0)

    } catch (error) {
      console.error('删除媒体失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 处理连接点按下（开始拖拽连线）
  const handleConnectionPointMouseDown = (e: React.MouseEvent, nodeId: string) => {
    console.log('🟢 Connection point clicked:', nodeId)
    e.stopPropagation()
    e.preventDefault()
    
    // 开始拖拽连线
    setConnectingFrom(nodeId)
    setIsDraggingConnection(true)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const initialPos = {
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
      }
      console.log('  - Initial dragLineEnd:', initialPos)
      setDragLineEnd(initialPos)
    }
    console.log('  - isDraggingConnection set to true')
  }

  // 处理连线双击
  const handleConnectionDoubleClick = (e: React.MouseEvent, connectionId: string) => {
    console.log('🔴 Connection double clicked!', connectionId)
    e.stopPropagation()
    e.preventDefault()
    
    const connection = connections.find(c => c.id === connectionId)
    console.log('  - Found connection:', connection)
    
    if (connection) {
      console.log('  - Opening edit modal for connection:', connectionId)
      console.log('  - Current label:', connection.label)
      setEditingConnection(connectionId)
      setConnectionLabel(connection.label || '')
    } else {
      console.log('  - ❌ Connection not found!')
    }
  }

  // 更新连线标签
  const updateConnectionLabel = () => {
    console.log('💾 Updating connection label')
    console.log('  - editingConnection:', editingConnection)
    console.log('  - connectionLabel:', connectionLabel)
    
    if (editingConnection) {
      setConnections(prev => {
        const updated = prev.map(conn => 
          conn.id === editingConnection 
            ? { ...conn, label: connectionLabel.trim() }
            : conn
        )
        console.log('  - Updated connections:', updated)
        return updated
      })
      setEditingConnection(null)
      setConnectionLabel('')
      console.log('  - ✅ Label updated successfully')
    }
  }

  // 取消编辑
  const cancelEditConnection = () => {
    console.log('❌ Canceling connection edit')
    setEditingConnection(null)
    setConnectionLabel('')
  }

  // 删除连线
  const deleteConnection = () => {
    console.log('🗑️ Deleting connection:', editingConnection)
    if (editingConnection) {
      setConnections(prev => prev.filter(conn => conn.id !== editingConnection))
      setEditingConnection(null)
      setConnectionLabel('')
      console.log('  - ✅ Connection deleted successfully')
    }
  }

  // 保存节点位置
  const savePositions = useCallback(async () => {
    if (!currentGraph) {
      console.warn('未选择图谱，跳过位置保存')
      return
    }

    try {
      // 检查是否有位置变化（增量更新优化）
      const changedNodes = nodes.filter(node => {
        const last = lastSavedPositions.current.get(node.id)
        return !last || last.x !== node.x || last.y !== node.y
      })

      if (changedNodes.length === 0) {
        console.log('⏭️ 节点位置无变化，跳过保存')
        return
      }

      console.log('💾 准备保存位置，变化的节点数:', changedNodes.length)
      setSavingStatus('正在保存位置...')
      
      const positionData = nodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y
      }))

      console.log('📤 发送位置数据:', {
        graphId: currentGraph.id,
        nodeCount: positionData.length,
        positions: positionData
      })

      const response = await fetch('/api/graphs/save-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphId: currentGraph.id,
          nodes: positionData,
          metadata: {
            scale,
            offset
          }
        })
      })

      console.log('📥 API响应状态:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API返回错误:', errorData)
        throw new Error(errorData.error || '保存位置失败')
      }

      const result = await response.json()
      console.log('📥 API响应数据:', result)

      // 更新跟踪记录
      nodes.forEach(node => {
        lastSavedPositions.current.set(node.id, { x: node.x, y: node.y })
      })

      // 刷新currentGraph以包含更新后的settings
      if (result.graph && result.graph.settings) {
        console.log('🔄 更新currentGraph的settings字段')
        useGraphStore.setState(state => ({
          currentGraph: state.currentGraph ? {
            ...state.currentGraph,
            settings: result.graph.settings
          } : null
        }))
      }

      setSavingStatus('位置保存成功')
      console.log('✅ 节点位置已保存')
      
      // 2秒后清除成功消息
      setTimeout(() => {
        setSavingStatus('')
      }, 2000)
    } catch (error) {
      console.error('保存位置失败:', error)
      const errorMessage = error instanceof Error ? error.message : '保存位置失败'
      setSavingStatus(`位置保存失败: ${errorMessage}`)
      
      // 5秒后清除错误消息
      setTimeout(() => {
        setSavingStatus('')
      }, 5000)
    }
  }, [currentGraph, nodes, scale, offset])

  // 创建防抖版本的保存函数（用于拖拽时自动保存）
  const debouncedSavePositions = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        savePositions()
      }, 1000) // 1秒延迟
    }
  }, [savePositions])

  // 保存并转换为三维图谱
  const saveAndConvert = async () => {
    try {
      // 0. 先保存位置
      await savePositions()
      
      // 1. 检查是否选择了图谱
      if (!currentGraph || !currentProject) {
        setConversionError('请先选择一个图谱')
        setTimeout(() => setConversionError(null), 3000)
        return
      }

      // 1. 验证数据
      const validNodes = nodes.filter(n => n.label.trim() !== '')
      if (validNodes.length === 0) {
        setConversionError('请至少创建一个有效节点')
        setTimeout(() => setConversionError(null), 3000)
        return
      }

      // 2. 准备数据
      const payload = {
        nodes: validNodes.map(n => {
          // 查找原有的3D节点，以保留其高度（y3d）
          const storeNode = storeNodes.find(sn => sn.id === n.id)
          return {
            id: n.id,  // 保留数据库ID（如果存在）
            label: n.label,
            description: n.description,
            // 2D_x = 3D_x * 15 + 300  =>  3D_x = (2D_x - 300) / 15
            x: (n.x - 300) / 15,
            // 2D_y = 3D_z * 15 + 300  =>  3D_z = (2D_y - 300) / 15
            z: (n.y - 300) / 15,
            // 如果存在原节点，保留其高度，否则稍微错落分布
            y: storeNode && storeNode.y !== undefined ? storeNode.y : (Math.random() * 20 - 10),
            imageUrl: n.imageUrl,
            videoUrl: n.videoUrl,
          }
        }),
        connections: connections.filter(c => 
          validNodes.some(n => n.id === c.from) &&
          validNodes.some(n => n.id === c.to)
        ).map(c => ({
          id: c.id,  // 保留数据库ID（如果存在）
          from: c.from,
          to: c.to,
          label: c.label,
        })),
      }

      // 3. 调用同步API
      setSavingStatus('正在保存到数据库...')
      setIsConverting(true)
      setConversionError(null)
      
      console.log('🔄 开始同步2D数据到图谱:', currentGraph.name)
      console.log('📊 节点数:', payload.nodes.length, '连接数:', payload.connections.length)
      
      const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '同步失败')
      }

      const result = await response.json()
      
      console.log('✅ 同步成功:', result)
      console.log('📊 统计:', result.stats)

      // 注意：已移除调用完整的 3D 转换算法以避免覆盖用户手动摆放的二维坐标。
      // 因为 convert-to-3d 会重新计算 x/y/z 坐标，导致工作流中卡片位置丢失和错乱。
      
      // 4. 等待刷新项目列表完成
      setSavingStatus('保存成功！正在刷新数据...')
      console.log('🔄 刷新项目列表...')
      try {
        await refreshProjects()
        console.log('✅ 项目列表刷新成功')
      } catch (refreshError) {
        console.error('⚠️ 刷新项目列表失败，但仍然继续跳转:', refreshError)
        // 即使刷新失败，也继续跳转，因为数据已经保存到数据库
      }
      
      // 5. 显示成功并跳转到3D编辑器页面
      setSavingStatus('即将跳转到3D视图...')
      setConversionSuccess(true)
      
      // 跳转到3D编辑器页面，同时传递 projectId 和 graphId
      const redirectUrl = `/3d-editor?projectId=${currentProject.id}&graphId=${currentGraph.id}`
      console.log('🔄 准备跳转到:', redirectUrl)
      
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 1500)
      
    } catch (error) {
      console.error('❌ 同步失败:', error)
      setSavingStatus('')
      setConversionError(error instanceof Error ? error.message : '同步失败')
      setTimeout(() => setConversionError(null), 5000)
    } finally {
      setIsConverting(false)
    }
  }

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    saveAndConvert,
    savePositions,  // 新增
    isConverting,
    conversionError,
    conversionSuccess,
  }))

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // 绘制连接线
  const renderConnections = () => {
    const lines = []
    
    console.log('🔵 renderConnections called')
    console.log('  - connections.length:', connections.length)
    console.log('  - isDraggingConnection:', isDraggingConnection)
    console.log('  - connectingFrom:', connectingFrom)
    console.log('  - dragLineEnd:', dragLineEnd)
    
    // 绘制已完成的连接线
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from)
      const toNode = nodes.find(n => n.id === conn.to)
      
      console.log('  - Processing connection:', conn.id, 'from:', fromNode?.id, 'to:', toNode?.id)
      
      if (!fromNode || !toNode) {
        console.log('  ❌ Missing node, skipping')
        return
      }

      // NEW: Use cached connection points if available, otherwise calculate
      const fromPoint = conn.cachedFromPoint || calculateConnectionPoint(fromNode, 'right')
      const toPoint = conn.cachedToPoint || calculateConnectionPoint(toNode, 'left')
      
      // Cache the calculated points for next render
      if (!conn.cachedFromPoint || !conn.cachedToPoint) {
        conn.cachedFromPoint = fromPoint
        conn.cachedToPoint = toPoint
      }
      
      const x1 = fromPoint.x
      const y1 = fromPoint.y
      const x2 = toPoint.x
      const y2 = toPoint.y

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      console.log('  ✅ Drawing connection line:', { x1, y1, x2, y2, midX })

      lines.push(
        <g key={conn.id}>
          {/* 不可见的宽线条用于捕获鼠标事件 */}
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            stroke="transparent"
            strokeWidth="30"
            fill="none"
            style={{ 
              cursor: 'pointer',
              pointerEvents: 'stroke',
            }}
            onMouseEnter={() => {
              console.log('🖱️ Mouse entered connection:', conn.id)
              setHoveredConnection(conn.id)
            }}
            onMouseLeave={() => {
              console.log('🖱️ Mouse left connection:', conn.id)
              setHoveredConnection(null)
            }}
            onClick={(e) => {
              console.log('🖱️ Connection clicked:', conn.id)
              e.stopPropagation()
            }}
            onDoubleClick={(e) => {
              console.log('🖱️ Connection double clicked:', conn.id)
              e.stopPropagation()
              handleConnectionDoubleClick(e as any, conn.id)
            }}
          />
          {/* 可见的连接线 - 悬停时加粗 */}
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            stroke={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
            strokeWidth={hoveredConnection === conn.id ? '4' : '2'}
            fill="none"
            style={{ 
              pointerEvents: 'none',
            }}
          />
          {/* 箭头 */}
          <polygon
            points={`${x2},${y2} ${x2-8},${y2-4} ${x2-8},${y2+4}`}
            fill={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
            style={{ 
              pointerEvents: 'none',
            }}
          />
          {/* 连线标签 */}
          {conn.label && (
            <g>
              {/* 标签背景 */}
              <rect
                x={midX - conn.label.length * 4 - 8}
                y={midY - 20}
                width={conn.label.length * 8 + 16}
                height={24}
                fill="white"
                stroke={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
                strokeWidth={hoveredConnection === conn.id ? '2' : '1'}
                rx="4"
                style={{ 
                  pointerEvents: 'none',
                }}
              />
              {/* 标签文字 */}
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fill={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
                fontSize="12"
                fontWeight="600"
                style={{ 
                  pointerEvents: 'none', 
                  userSelect: 'none',
                }}
              >
                {conn.label}
              </text>
            </g>
          )}
        </g>
      )
    })
    
    // 绘制正在拖拽的连接线
    if (isDraggingConnection && connectingFrom) {
      const fromNode = nodes.find(n => n.id === connectingFrom)
      console.log('  - Preview line fromNode:', fromNode?.id)
      if (fromNode) {
        // NEW: Use calculateConnectionPoint for accurate positioning
        const fromPoint = calculateConnectionPoint(fromNode, 'right')
        const x1 = fromPoint.x
        const y1 = fromPoint.y
        const x2 = dragLineEnd.x
        const y2 = dragLineEnd.y
        const midX = (x1 + x2) / 2

        console.log('  ✅ Drawing preview line:', { x1, y1, x2, y2, midX })

        lines.push(
          <g key="dragging-line">
            <path
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          </g>
        )
      }
    }
    
    console.log('  - Total lines to render:', lines.length)
    return lines
  }

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: workflowThemeConfig.canvasBackground,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background 0.3s ease',
      }}
    >
      {/* 左上角添加节点按钮 */}
      <div style={{
        position: 'absolute',
        left: '20px',
        top: '20px',
        zIndex: 10,
      }}>
        <button
          onClick={handleAddNode}
          style={{
            width: '44px',
            height: '44px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
        >
          +
        </button>
      </div>

      {/* 画布内容 */}
      <div style={{
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        transformOrigin: '0 0',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}>
        {/* 点状网格背景 */}
        <svg style={{
          position: 'absolute',
          top: '-2000px',
          left: '-2000px',
          width: '8000px',
          height: '8000px',
          pointerEvents: 'none',
        }}>
          <defs>
            <pattern
              id="dot-pattern"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1.5" fill="#9ca3af" opacity="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>

        {/* SVG 连接线 */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',  // 修复：允许SVG接收鼠标事件
          overflow: 'visible',
        }}>
          {renderConnections()}
        </svg>

        {/* 节点 */}
        {nodes.map(node => {
          // NEW: Calculate dimensions for each node
          const calculatedDimensions = calculateNodeDimensions(node)
          
          return (
          <div
            key={node.id}
            className="workflow-node"
            data-node-id={node.id}
            ref={(el) => {
              if (el) {
                nodeRefsMap.current.set(node.id, el)
              } else {
                nodeRefsMap.current.delete(node.id)
              }
            }}
            onMouseDown={(e) => {
              // 非编辑模式：整个卡片可拖动
              if (!node.isEditing) {
                handleNodeMouseDown(e, node.id)
              }
            }}
            onMouseEnter={() => {
              if (!isDraggingConnection) {
                setHoveredNode(node.id)
                setHoveredButtons(node.id)
              }
            }}
            onMouseLeave={() => {
              if (!isDraggingConnection) {
                setHoveredNode(null)
                // 延迟隐藏按钮，给用户时间移动到按钮上
                setTimeout(() => {
                  setHoveredButtons(prev => prev === node.id ? null : prev)
                }, 200)
              }
            }}
            onClick={() => {
              if (!node.isEditing) {
                setSelectedNode(node.id)
              }
            }}
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${calculatedDimensions.width}px`,
              minHeight: `${calculatedDimensions.height}px`,
              background: selectedNode === node.id 
                ? workflowThemeConfig.nodeBackgroundSelected
                : workflowThemeConfig.nodeBackground,
              border: selectedNode === node.id 
                ? `2px solid ${workflowThemeConfig.nodeBorderSelected}` 
                : `2px solid ${workflowThemeConfig.nodeBorder}`,
              borderRadius: '16px',
              cursor: node.isEditing ? 'default' : 'move',
              boxShadow: selectedNode === node.id 
                ? '0 12px 32px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)' 
                : '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible',
              transition: draggedNode === node.id ? 'none' : 'all 0.3s cubic-bezier(0, 0, 0.2, 1)',
              transform: selectedNode === node.id ? 'translateY(-2px)' : 'translateY(0)',
              color: workflowThemeConfig.nodeText,
            }}
          >
            {/* 顶部装饰条（非编辑）或拖动手柄（编辑） */}
            {!node.isEditing ? (
              <div style={{
                height: '4px',
                background: selectedNode === node.id 
                  ? workflowThemeConfig.nodeTopBarSelected
                  : workflowThemeConfig.nodeTopBar,
                borderRadius: '16px 16px 0 0',
                transition: 'all 0.3s ease',
              }} />
            ) : (
              <div 
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  height: '32px',
                  background: workflowThemeConfig.dragHandleBackground,
                  borderRadius: '16px 16px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'move',
                  color: workflowThemeConfig.dragHandleText,
                  fontSize: '12px',
                  fontWeight: '600',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '14px' }}>⋮⋮</span>
                拖动移动
              </div>
            )}

            {/* 悬停时显示的操作按钮 */}
            {(hoveredButtons === node.id || hoveredNode === node.id) && !node.isEditing && !isDraggingConnection && (
              <div 
                onMouseEnter={() => setHoveredButtons(node.id)}
                onMouseLeave={() => setHoveredButtons(null)}
                style={{
                  position: 'absolute',
                  right: '-48px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  zIndex: 1000,
                  pointerEvents: 'auto',
                }}
              >
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicateNode(node.id)
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="复制"
                >
                  <CopyIcon size={18} />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNode(node.id)
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.borderColor = '#ef4444'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="删除"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            )}

            {/* 顶部装饰条 */}
            {!node.isEditing && (
              <div style={{
                height: '4px',
                background: selectedNode === node.id 
                  ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)',
                borderRadius: '16px 16px 0 0',
                transition: 'all 0.3s ease',
              }} />
            )}

            {/* 节点内容 */}
            <div style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flex: 1,
            }}>
              {node.isEditing ? (
                <>
                  {/* 编辑模式 */}
                  <input
                    type="text"
                    value={node.label}
                    onChange={(e) => updateNode(node.id, { label: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        finishEditing(node.id)
                      }
                    }}
                    placeholder="节点名称"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #3b82f6',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <textarea
                    value={node.description}
                    onChange={(e) => updateNode(node.id, { description: e.target.value })}
                    placeholder="节点简述（可选）"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      color: '#4b5563',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                      transition: 'all 0.2s ease',
                      lineHeight: '1.6',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  
                  {/* 媒体上传区域 */}
                  <div style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: '10px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                  }}>
                    {/* 媒体预览 */}
                    {(node.imageUrl || node.videoUrl) && (
                      <div style={{
                        position: 'relative',
                        marginBottom: '12px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}>
                        {node.mediaType === 'image' && node.imageUrl && (
                          <img
                            src={node.imageUrl}
                            alt="节点图片"
                            onLoad={(e) => {
                              // NEW: Track media dimensions on load
                              const img = e.currentTarget
                              if (!node.mediaWidth || !node.mediaHeight) {
                                updateNode(node.id, {
                                  mediaWidth: img.naturalWidth,
                                  mediaHeight: img.naturalHeight,
                                })
                              }
                            }}
                            style={{
                              width: '100%',
                              height: calculatedDimensions.mediaHeight > 0 ? `${calculatedDimensions.mediaHeight}px` : 'auto',
                              maxHeight: '200px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        )}
                        {node.mediaType === 'video' && node.videoUrl && (
                          <video
                            src={node.videoUrl}
                            controls
                            onLoadedMetadata={(e) => {
                              // NEW: Track media dimensions on load
                              const video = e.currentTarget
                              if (!node.mediaWidth || !node.mediaHeight) {
                                updateNode(node.id, {
                                  mediaWidth: video.videoWidth,
                                  mediaHeight: video.videoHeight,
                                })
                              }
                            }}
                            style={{
                              width: '100%',
                              height: calculatedDimensions.mediaHeight > 0 ? `${calculatedDimensions.mediaHeight}px` : 'auto',
                              maxHeight: '200px',
                              display: 'block',
                            }}
                          />
                        )}
                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleDeleteMedia(node.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '32px',
                            height: '32px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 1)'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                    
                    {/* 上传按钮 */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'center',
                    }}>
                      <label style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: uploadingMedia === node.id ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: uploadingMedia === node.id ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (uploadingMedia !== node.id) {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                      >
                        <ImageIcon />
                        {uploadingMedia === node.id ? '上传中...' : '上传图片'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingMedia === node.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleMediaUpload(node.id, file)
                            }
                            e.target.value = ''
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                      
                      <label style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: uploadingMedia === node.id ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: uploadingMedia === node.id ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (uploadingMedia !== node.id) {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'
                      }}
                      >
                        <VideoIcon />
                        {uploadingMedia === node.id ? '上传中...' : '上传视频'}
                        <input
                          type="file"
                          accept="video/*"
                          disabled={uploadingMedia === node.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleMediaUpload(node.id, file)
                            }
                            e.target.value = ''
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    
                    <div style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#9ca3af',
                      textAlign: 'center',
                    }}>
                      图片最大 5MB，视频最大 50MB
                    </div>
                  </div>
                  
                  <button
                    onClick={() => finishEditing(node.id)}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      alignSelf: 'flex-end',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    完成
                  </button>
                </>
              ) : (
                <>
                  {/* 显示模式 */}
                  <div style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#111827',
                    lineHeight: '1.4',
                    letterSpacing: '-0.01em',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}>
                    {node.label || '未命名节点'}
                  </div>
                  
                  {/* 媒体预览 */}
                  {(node.imageUrl || node.videoUrl) && (
                    <div style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginTop: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}>
                      {node.mediaType === 'image' && node.imageUrl && (
                        <img
                          src={node.imageUrl}
                          alt={node.label}
                          onLoad={(e) => {
                            // NEW: Track media dimensions on load
                            const img = e.currentTarget
                            if (!node.mediaWidth || !node.mediaHeight) {
                              updateNode(node.id, {
                                mediaWidth: img.naturalWidth,
                                mediaHeight: img.naturalHeight,
                              })
                            }
                          }}
                          style={{
                            width: '100%',
                            height: calculatedDimensions.mediaHeight > 0 ? `${calculatedDimensions.mediaHeight}px` : 'auto',
                            maxHeight: '180px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      )}
                      {node.mediaType === 'video' && node.videoUrl && (
                        <video
                          src={node.videoUrl}
                          controls
                          onLoadedMetadata={(e) => {
                            // NEW: Track media dimensions on load
                            const video = e.currentTarget
                            if (!node.mediaWidth || !node.mediaHeight) {
                              updateNode(node.id, {
                                mediaWidth: video.videoWidth,
                                mediaHeight: video.videoHeight,
                              })
                            }
                          }}
                          style={{
                            width: '100%',
                            height: calculatedDimensions.mediaHeight > 0 ? `${calculatedDimensions.mediaHeight}px` : 'auto',
                            maxHeight: '180px',
                            display: 'block',
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {node.description && (
                    <div style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.7',
                      flex: 1,
                      padding: '8px 12px',
                      background: 'rgba(249, 250, 251, 0.8)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e5e7eb',
                    }}>
                      {node.description}
                    </div>
                  )}
                  {/* 双击编辑提示 */}
                  <div
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      updateNode(node.id, { isEditing: true })
                    }}
                    style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      textAlign: 'center',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      background: 'rgba(243, 244, 246, 0.5)',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(229, 231, 235, 0.8)'
                      e.currentTarget.style.color = '#6b7280'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(243, 244, 246, 0.5)'
                      e.currentTarget.style.color = '#9ca3af'
                    }}
                  >
                    双击编辑
                  </div>
                </>
              )}
            </div>

            {/* 连接点 - 只在非编辑模式显示 */}
            {!node.isEditing && (() => {
              // Calculate connection point position using actual dimensions
              const actualHeight = node.actualHeight || calculatedDimensions.height
              const connectionPointY = actualHeight / 2
              
              return (
              <>
                {/* 右侧连接按钮 */}
                <div
                  className="connection-point"
                  data-node-id={node.id}
                  onMouseDown={(e) => handleConnectionPointMouseDown(e, node.id)}
                  style={{
                    position: 'absolute',
                    right: '-12px',
                    top: `${connectionPointY}px`,
                    transform: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? 'translateY(-50%) scale(1.3)'
                      : 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? '#10b981'
                      : connectingFrom === node.id 
                      ? '#3b82f6' 
                      : 'white',
                    border: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? '2px solid #10b981'
                      : '2px solid #3b82f6',
                    cursor: isDraggingConnection ? 'crosshair' : 'pointer',
                    boxShadow: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? '0 0 20px rgba(16, 185, 129, 0.6)'
                      : '0 2px 6px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? 'white'
                      : connectingFrom === node.id 
                      ? 'white' 
                      : '#3b82f6',
                    pointerEvents: 'auto',
                  }}
                  onMouseOver={(e) => {
                    if (!isDraggingConnection) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDraggingConnection) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)'
                    }
                  }}
                >
                  ⊕
                </div>
                
                {/* 左侧连接按钮 */}
                <div
                  className="connection-point"
                  data-node-id={node.id}
                  onMouseDown={(e) => handleConnectionPointMouseDown(e, node.id)}
                  style={{
                    position: 'absolute',
                    left: '-12px',
                    top: `${connectionPointY}px`,
                    transform: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? 'translateY(-50%) scale(1.3)'
                      : 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? '#10b981'
                      : connectingFrom === node.id 
                      ? '#3b82f6' 
                      : 'white',
                    border: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? '2px solid #10b981'
                      : '2px solid #3b82f6',
                    cursor: isDraggingConnection ? 'crosshair' : 'pointer',
                    boxShadow: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? '0 0 20px rgba(16, 185, 129, 0.6)'
                      : '0 2px 6px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: hoveredNode === node.id && isDraggingConnection && connectingFrom !== node.id
                      ? 'white'
                      : connectingFrom === node.id 
                      ? 'white' 
                      : '#3b82f6',
                    pointerEvents: 'auto',
                  }}
                  onMouseOver={(e) => {
                    if (!isDraggingConnection) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDraggingConnection) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)'
                    }
                  }}
                >
                  ⊕
                </div>
              </>
              )
            })()}
          </div>
          )
        })}
      </div>

      {/* 底部缩放控制 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        color: '#6b7280',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => setScale(s => Math.max(s * 0.8, 0.1))}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            color: '#6b7280',
          }}
        >
          −
        </button>
        <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '500' }}>
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(s * 1.2, 3))}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            color: '#6b7280',
          }}
        >
          +
        </button>
      </div>

      {/* 连接提示 */}
      {isDraggingConnection && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#3b82f6',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          zIndex: 100,
        }}>
          拖动到另一个节点的连接点完成连接
        </div>
      )}

      {/* 连线标签编辑弹窗 */}
      {editingConnection && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={(e) => {
            console.log('🖱️ Modal background clicked')
            cancelEditConnection()
          }}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
              onClick={(e) => {
                console.log('🖱️ Modal content clicked (stopping propagation)')
                e.stopPropagation()
              }}
            >
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
              }}>
                编辑连线标签
              </h2>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#4b5563',
                }}>
                  连线名称
                </label>
                <input
                  type="text"
                  value={connectionLabel}
                  onChange={(e) => {
                    console.log('📝 Label input changed:', e.target.value)
                    setConnectionLabel(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    console.log('⌨️ Key pressed:', e.key)
                    if (e.key === 'Enter') {
                      updateConnectionLabel()
                    } else if (e.key === 'Escape') {
                      cancelEditConnection()
                    }
                  }}
                  placeholder="输入连线名称（可选）"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'space-between',
              }}>
                <button
                  onClick={() => {
                    console.log('🖱️ Delete button clicked')
                    deleteConnection()
                  }}
                  style={{
                    padding: '10px 24px',
                    background: 'transparent',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ef4444'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                >
                  <TrashIcon />
                  删除连线
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      console.log('🖱️ Cancel button clicked')
                      cancelEditConnection()
                    }}
                    style={{
                      padding: '10px 24px',
                      background: 'transparent',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f3f4f6'
                      e.currentTarget.style.borderColor = '#d1d5db'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      console.log('🖱️ Confirm button clicked')
                      updateConnectionLabel()
                    }}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#10b981',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            zIndex: 10001,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleIcon size={16} />
              编辑模式已激活 - editingConnection: {editingConnection}
            </span>
          </div>
        </>
      )}

      {/* 转换状态提示 */}
      {(isConverting || savingStatus) && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '32px 48px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10002,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
          }}>
            {savingStatus || '正在转换为三维图谱...'}
          </div>
        </div>
      )}

      {/* 转换成功提示 */}
      {conversionSuccess && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '32px 48px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10002,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircleIcon size={48} />
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#10b981',
          }}>
            转换成功！正在跳转...
          </div>
        </div>
      )}

      {/* 转换错误提示 */}
      {conversionError && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          zIndex: 10001,
          maxWidth: '500px',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ErrorCircleIcon size={16} />
            {conversionError}
          </span>
        </div>
      )}

      {/* 保存状态提示 */}
      {savingStatus && !isConverting && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: savingStatus.includes('失败') ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: savingStatus.includes('失败') 
            ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
            : '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 10001,
          maxWidth: '400px',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {savingStatus.includes('失败') ? <ErrorCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
            {savingStatus}
          </span>
        </div>
      )}

      {/* 添加旋转动画 */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
})

WorkflowCanvas.displayName = 'WorkflowCanvas'

export default WorkflowCanvas
