'use client'

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
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
  imageUrl?: string
  videoUrl?: string
  mediaType?: 'image' | 'video' | null
  actualWidth?: number
  actualHeight?: number
  mediaWidth?: number
  mediaHeight?: number
}

interface Connection {
  id: string
  from: string
  to: string
  label?: string
}

export interface WorkflowCanvasRef {
  saveAndConvert: () => Promise<void>
  isConverting: boolean
  conversionError: string | null
  conversionSuccess: boolean
}

const WorkflowCanvas = forwardRef<WorkflowCanvasRef>((props, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const nodeRefsMap = useRef<Map<string, HTMLDivElement>>(new Map())

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
  const [isDraggingConnection, setIsDraggingConnection] = useState(false)
  const [dragLineEnd, setDragLineEnd] = useState({ x: 0, y: 0 })
  const [editingConnection, setEditingConnection] = useState<string | null>(null)
  const [connectionLabel, setConnectionLabel] = useState('')
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)

  const [conversionError, setConversionError] = useState<string | null>(null)
  const [conversionSuccess, setConversionSuccess] = useState(false)
  const [savingStatus, setSavingStatus] = useState<string>('')
  const [isConverting, setIsConverting] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null)

  const { currentGraph, currentProject, nodes: storeNodes, edges: storeEdges, refreshProjects } = useGraphStore()

  useEffect(() => {
    if (!currentGraph) {
      console.log('No graph selected')
      return
    }

    console.log('Loading graph data:', currentGraph.name)

    const converted2DNodes: Node[] = storeNodes.map((node, index) => ({
      id: node.id,
      label: node.name,
      description: node.description || '',
      x: node.x * 50 + 300,
      y: node.y * 50 + 300,
      width: 200,
      height: 100,
      isEditing: false,
      imageUrl: node.imageUrl,
      videoUrl: node.videoUrl,
      mediaType: node.imageUrl ? 'image' : node.videoUrl ? 'video' : null,
    }))

    const converted2DConnections: Connection[] = storeEdges.map(edge => ({
      id: edge.id,
      from: edge.fromNodeId,
      to: edge.toNodeId,
      label: edge.label,
    }))

    console.log('Loaded', converted2DNodes.length, 'nodes and', converted2DConnections.length, 'connections')

    setNodes(converted2DNodes)
    setConnections(converted2DConnections)
  }, [currentGraph, storeNodes, storeEdges])

  const handleMouseDown = (e: React.MouseEvent) => {
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

    if (isDraggingConnection && connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const mouseX = (e.clientX - rect.left - offset.x) / scale
        const mouseY = (e.clientY - rect.top - offset.y) / scale
        setDragLineEnd({ x: mouseX, y: mouseY })
      }
    }
  }, [isDragging, dragStart, draggedNode, nodeDragStart, scale, isDraggingConnection, connectingFrom, offset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedNode(null)

    if (isDraggingConnection && connectingFrom && hoveredNode) {
      setConnections(prev => {
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

    if (isDraggingConnection) {
      setIsDraggingConnection(false)
      setConnectingFrom(null)
      setHoveredNode(null)
    }
  }, [isDraggingConnection, connectingFrom, hoveredNode])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(0.1, scale * delta), 3)
    setScale(newScale)
  }

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (isDraggingConnection) return

    e.stopPropagation()
    setDraggedNode(nodeId)
    setNodeDragStart({ x: e.clientX, y: e.clientY })
    setSelectedNode(nodeId)
  }

  const handleAddNode = () => {
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

  const updateNode = (id: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node =>
      node.id === id ? { ...node, ...updates } : node
    ))
  }

  const finishEditing = (id: string) => {
    const node = nodes.find(n => n.id === id)
    if (node && !node.label.trim()) {
      deleteNode(id)
    } else {
      updateNode(id, { isEditing: false })
    }
  }

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
    setSelectedNode(null)
  }

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

  const handleConnectionPointMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    e.preventDefault()

    setIsDraggingConnection(true)
    setConnectingFrom(nodeId)

    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const initialPos = {
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale,
      }
      setDragLineEnd(initialPos)
    }
  }

  const handleConnectionDoubleClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation()
    e.preventDefault()

    const connection = connections.find(c => c.id === connectionId)
    if (connection) {
      setEditingConnection(connectionId)
      setConnectionLabel(connection.label || '')
    }
  }

  const updateConnectionLabel = () => {
    if (editingConnection) {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === editingConnection
            ? { ...conn, label: connectionLabel.trim() }
            : conn
        )
      )
      setEditingConnection(null)
      setConnectionLabel('')
    }
  }

  const cancelEditConnection = () => {
    setEditingConnection(null)
    setConnectionLabel('')
  }

  const deleteConnection = () => {
    if (editingConnection) {
      setConnections(prev => prev.filter(conn => conn.id !== editingConnection))
      setEditingConnection(null)
      setConnectionLabel('')
    }
  }

  const saveAndConvert = async () => {
    try {
      if (!currentGraph || !currentProject) {
        setConversionError('Please select a graph first')
        setTimeout(() => setConversionError(null), 3000)
        return
      }

      const validNodes = nodes.filter(n => n.label.trim() !== '')
      if (validNodes.length === 0) {
        setConversionError('Please create at least one valid node')
        setTimeout(() => setConversionError(null), 3000)
        return
      }

      const payload = {
        nodes: validNodes.map(n => ({
          id: n.id,
          label: n.label,
          description: n.description,
          x: n.x,
          y: n.y,
          imageUrl: n.imageUrl,
          videoUrl: n.videoUrl,
        })),
        connections: connections.filter(c =>
          validNodes.some(n => n.id === c.from) &&
          validNodes.some(n => n.id === c.to)
        ).map(c => ({
          id: c.id,
          from: c.from,
          to: c.to,
          label: c.label,
        })),
      }

      setSavingStatus('Saving to database...')
      setIsConverting(true)
      setConversionError(null)

      console.log('Starting sync of 2D data to graph:', currentGraph.name)
      console.log('Nodes:', payload.nodes.length, 'Connections:', payload.connections.length)

      const response = await fetch(`/api/graphs/${currentGraph.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sync failed')
      }

      const result = await response.json()

      console.log('Sync successful:', result)

      setSavingStatus('Save successful! Refreshing data...')
      console.log('Refreshing projects list...')
      try {
        await refreshProjects()
        console.log('Projects list refreshed')
      } catch (refreshError) {
        console.error('Failed to refresh projects, but continuing:', refreshError)
      }

      localStorage.setItem('currentProjectId', currentProject.id)
      localStorage.setItem('currentGraphId', currentGraph.id)

      setSavingStatus('Redirecting to 3D view...')
      setConversionSuccess(true)

      const redirectUrl = `/?projectId=${currentProject.id}&graphId=${currentGraph.id}`

      console.log('Preparing redirect to:', redirectUrl)

      setTimeout(() => {
        window.location.href = redirectUrl
      }, 1500)

    } catch (error) {
      console.error('Sync failed:', error)
      setSavingStatus('')
      setConversionError(error instanceof Error ? error.message : 'Sync failed')
      setTimeout(() => setConversionError(null), 5000)
    } finally {
      setIsConverting(false)
    }
  }

  useImperativeHandle(ref, () => ({
    saveAndConvert,
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

  const renderConnections = () => {
    const lines = []

    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from)
      const toNode = nodes.find(n => n.id === conn.to)

      if (!fromNode || !toNode) return

      const x1 = fromNode.x + fromNode.width
      const y1 = fromNode.y + fromNode.height / 2
      const x2 = toNode.x
      const y2 = toNode.y + toNode.height / 2

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2

      lines.push(
        <g key={conn.id}>
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            stroke="transparent"
            strokeWidth="30"
            fill="none"
            style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
            onMouseEnter={() => setHoveredConnection(conn.id)}
            onMouseLeave={() => setHoveredConnection(null)}
            onDoubleClick={(e) => handleConnectionDoubleClick(e as any, conn.id)}
          />
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            stroke={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
            strokeWidth={hoveredConnection === conn.id ? '4' : '2'}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
          <polygon
            points={`${x2},${y2} ${x2-8},${y2-4} ${x2-8},${y2+4}`}
            fill={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
            style={{ pointerEvents: 'none' }}
          />
          {conn.label && (
            <g>
              <rect
                x={midX - conn.label.length * 4 - 8}
                y={midY - 20}
                width={conn.label.length * 8 + 16}
                height={24}
                fill="white"
                stroke={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
                strokeWidth={hoveredConnection === conn.id ? '2' : '1'}
                rx="4"
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fill={hoveredConnection === conn.id ? '#2563eb' : '#3b82f6'}
                fontSize="12"
                fontWeight="600"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {conn.label}
              </text>
            </g>
          )}
        </g>
      )
    })

    if (isDraggingConnection && connectingFrom) {
      const fromNode = nodes.find(n => n.id === connectingFrom)
      if (fromNode) {
        const x1 = fromNode.x + fromNode.width
        const y1 = fromNode.y + fromNode.height / 2
        const x2 = dragLineEnd.x
        const y2 = dragLineEnd.y
        const midX = (x1 + x2) / 2

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
        >
          +
        </button>
      </div>

      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {renderConnections()}
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map(node => (
          <div
            key={node.id}
            className="workflow-node"
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${node.width}px`,
              minHeight: `${node.height}px`,
              background: selectedNode === node.id ? '#dbeafe' : '#f3f4f6',
              border: selectedNode === node.id ? '2px solid #3b82f6' : '2px solid #d1d5db',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'move',
              userSelect: 'none',
              boxShadow: selectedNode === node.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <input
                type="text"
                value={node.label}
                onChange={(e) => updateNode(node.id, { label: e.target.value })}
                placeholder="Node name"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '16px',
                  fontWeight: '600',
                  outline: 'none',
                  color: '#1f2937',
                }}
              />
              <button
                onClick={() => deleteNode(node.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>

            <textarea
              value={node.description}
              onChange={(e) => updateNode(node.id, { description: e.target.value })}
              placeholder="Description"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'none',
                marginBottom: '8px',
                fontFamily: 'inherit',
              }}
              rows={3}
            />

            <div
              className="connection-point"
              onMouseDown={(e) => handleConnectionPointMouseDown(e, node.id)}
              style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                background: '#3b82f6',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'crosshair',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              }}
            />
          </div>
        ))}
      </div>

      {editingConnection && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          minWidth: '300px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Edit Connection Label
          </h3>

          <input
            type="text"
            value={connectionLabel}
            onChange={(e) => setConnectionLabel(e.target.value)}
            placeholder="Enter connection label (optional)"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button
              onClick={deleteConnection}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={cancelEditConnection}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={updateConnectionLabel}
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
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
            {savingStatus || 'Converting to 3D graph...'}
          </div>
        </div>
      )}

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
          <div style={{ fontSize: '48px' }}>✓</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#10b981',
          }}>
            Conversion successful! Redirecting...
          </div>
        </div>
      )}

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
          Error: {conversionError}
        </div>
      )}

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
