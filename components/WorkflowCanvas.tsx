'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
}

interface Connection {
  id: string
  from: string
  to: string
  label?: string
}

export default function WorkflowCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
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
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null)  // 正在上传媒体的节点 ID

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
          
          // 计算到右侧连接点的距离
          const rightPointX = node.x + node.width
          const rightPointY = node.y + node.height / 2
          const rightDist = Math.sqrt(
            Math.pow(mouseX - rightPointX, 2) + Math.pow(mouseY - rightPointY, 2)
          )
          
          // 计算到左侧连接点的距离
          const leftPointX = node.x
          const leftPointY = node.y + node.height / 2
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
  }, [isDraggingConnection, connectingFrom, hoveredNode])

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

  // 处理媒体上传
  const handleMediaUpload = async (nodeId: string, file: File) => {
    try {
      setUploadingMedia(nodeId)
      
      // 验证文件类型
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        alert('请上传图片或视频文件')
        return
      }
      
      // 验证文件大小（图片最大 5MB，视频最大 50MB）
      const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`文件大小超过限制（${isImage ? '5MB' : '50MB'}）`)
        return
      }
      
      // 创建 FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('nodeId', nodeId)
      formData.append('type', isImage ? 'image' : 'video')
      
      // 上传到 Blob
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上传失败')
      }
      
      const data = await response.json()
      
      // 更新节点
      updateNode(nodeId, {
        [isImage ? 'imageUrl' : 'videoUrl']: data.url,
        mediaType: isImage ? 'image' : 'video',
      })
      
      console.log('✅ Media uploaded successfully:', data.url)
      
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert('上传失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setUploadingMedia(null)
    }
  }

  // 删除媒体
  const handleDeleteMedia = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const mediaUrl = node.mediaType === 'image' ? node.imageUrl : node.videoUrl
    if (!mediaUrl) return
    
    try {
      // 从 Blob 删除
      await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mediaUrl }),
      })
      
      // 更新节点
      updateNode(nodeId, {
        imageUrl: undefined,
        videoUrl: undefined,
        mediaType: null,
      })
      
      console.log('✅ Media deleted successfully')
      
    } catch (error) {
      console.error('❌ Delete failed:', error)
      alert('删除失败')
    }
  }

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

      const x1 = fromNode.x + fromNode.width
      const y1 = fromNode.y + fromNode.height / 2
      const x2 = toNode.x
      const y2 = toNode.y + toNode.height / 2

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
        const x1 = fromNode.x + fromNode.width
        const y1 = fromNode.y + fromNode.height / 2
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
        background: '#fafafa',
        userSelect: 'none',
        WebkitUserSelect: 'none',
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
          pointerEvents: 'none',
          overflow: 'visible',
        }}>
          {renderConnections()}
        </svg>

        {/* 节点 */}
        {nodes.map(node => (
          <div
            key={node.id}
            className="workflow-node"
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
              width: `${node.width}px`,
              minHeight: `${node.height}px`,
              background: selectedNode === node.id 
                ? 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
              border: selectedNode === node.id ? '2px solid #3b82f6' : '2px solid #1f2937',
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
            }}
          >
            {/* 顶部装饰条（非编辑）或拖动手柄（编辑） */}
            {!node.isEditing ? (
              <div style={{
                height: '4px',
                background: selectedNode === node.id 
                  ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)',
                borderRadius: '16px 16px 0 0',
                transition: 'all 0.3s ease',
              }} />
            ) : (
              <div 
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  height: '32px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  borderRadius: '16px 16px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'move',
                  color: 'white',
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
                  📋
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
                  🗑️
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
                            style={{
                              width: '100%',
                              height: 'auto',
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
                            style={{
                              width: '100%',
                              height: 'auto',
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
                          🗑️
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
                        <span style={{ fontSize: '16px' }}>🖼️</span>
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
                        <span style={{ fontSize: '16px' }}>🎬</span>
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
                          style={{
                            width: '100%',
                            height: 'auto',
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
                          style={{
                            width: '100%',
                            height: 'auto',
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
            {!node.isEditing && (
              <>
                {/* 右侧连接按钮 */}
                <div
                  className="connection-point"
                  data-node-id={node.id}
                  onMouseDown={(e) => handleConnectionPointMouseDown(e, node.id)}
                  style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '50%',
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
                    top: '50%',
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
            )}
          </div>
        ))}
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
                  <span style={{ fontSize: '16px' }}>🗑️</span>
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
            ✅ 编辑模式已激活 - editingConnection: {editingConnection}
          </div>
        </>
      )}
    </div>
  )
}
