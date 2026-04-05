'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { applyLayout, LayoutType, GraphAnalysis } from '@/lib/graph-layouts'
import UIIcon from './UIIcon'

interface Node {
  id: string
  name: string
  x: number
  y: number
  vx?: number
  vy?: number
  color: string
  size: number
}

interface Edge {
  id: string
  source: string
  target: string
  label: string
  color: string
}

interface Interactive2DGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (nodeId: string) => void
  onEdgeClick: (edgeId: string) => void
  layoutType?: LayoutType // 可选：指定布局类型
}

export default function Interactive2DGraph({
  nodes: initialNodes,
  edges,
  onNodeClick,
  onEdgeClick,
  layoutType,
}: Interactive2DGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [viewBox, setViewBox] = useState({ width: 800, height: 600 })
  const [graphAnalysis, setGraphAnalysis] = useState<GraphAnalysis | null>(null)
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('radial')
  const dragOffset = useRef<{ x: number; y: number } | null>(null)

  // 更新视图尺寸
  useEffect(() => {
    const updateViewBox = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setViewBox({ width: rect.width, height: rect.height })
      }
    }
    
    updateViewBox()
    window.addEventListener('resize', updateViewBox)
    return () => window.removeEventListener('resize', updateViewBox)
  }, [])

  // 应用智能布局
  useEffect(() => {
    if (initialNodes.length === 0) return

    const { nodes: layoutNodes, analysis } = applyLayout(initialNodes, edges, layoutType)
    setNodes(layoutNodes)
    setGraphAnalysis(analysis)
    setCurrentLayout(layoutType || analysis.recommendedLayout)
  }, [initialNodes, edges, layoutType])

  // 处理节点拖拽 - 使用直接更新避免延迟
  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingNode(nodeId)
    
    const node = nodes.find(n => n.id === nodeId)
    if (node && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const svgX = (e.clientX - rect.left - viewBox.width / 2) / transform.scale - transform.x
      const svgY = (e.clientY - rect.top - viewBox.height / 2) / transform.scale - transform.y
      
      dragOffset.current = {
        x: svgX - node.x,
        y: svgY - node.y
      }
    }
  }, [nodes, transform, viewBox])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()

    if (draggingNode && dragOffset.current !== null) {
      const svgX = (e.clientX - rect.left - viewBox.width / 2) / transform.scale - transform.x
      const svgY = (e.clientY - rect.top - viewBox.height / 2) / transform.scale - transform.y
      
      const offset = dragOffset.current
      
      // 直接更新节点位置，避免使用函数式更新造成的延迟
      setNodes(nodes.map(node =>
        node.id === draggingNode
          ? { ...node, x: svgX - offset.x, y: svgY - offset.y }
          : node
      ))
    } else if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx / prev.scale,
        y: prev.y + dy / prev.scale,
      }))
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [draggingNode, isPanning, panStart, transform, viewBox, nodes])

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null)
    setIsPanning(false)
    dragOffset.current = null
  }, [])

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0 && !draggingNode) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(2.5, transform.scale * delta))
    setTransform(prev => ({
      ...prev,
      scale: newScale,
    }))
  }

  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }

  const handleZoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(2.5, prev.scale * 1.2),
    }))
  }

  const handleZoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, prev.scale / 1.2),
    }))
  }

  const handleChangeLayout = (newLayout: LayoutType) => {
    const { nodes: layoutNodes } = applyLayout(initialNodes, edges, newLayout)
    setNodes(layoutNodes)
    setCurrentLayout(newLayout)
    setTransform({ x: 0, y: 0, scale: 1 }) // 重置视图
  }

  const getLayoutName = (layout: LayoutType): string => {
    const names: Record<LayoutType, string> = {
      radial: '径向布局',
      hierarchical: '层级布局',
      force: '力导向布局',
      grid: '网格布局',
      timeline: '时序布局'
    }
    return names[layout]
  }

  const getLayoutIcon = (layout: LayoutType): 'target' | 'tree' | 'globe' | 'chart' | 'timer' => {
    const icons: Record<LayoutType, 'target' | 'tree' | 'globe' | 'chart' | 'timer'> = {
      radial: 'target',
      hierarchical: 'tree',
      force: 'globe',
      grid: 'chart',
      timeline: 'timer'
    }
    return icons[layout]
  }

  if (nodes.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
      }}>
        没有节点数据
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ 
          display: 'block', 
          cursor: isPanning ? 'grabbing' : draggingNode ? 'grabbing' : 'grab',
          background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 100%)'
        }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 背景装饰 */}
        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.05)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* 节点渐变定义 - 为每个节点创建唯一的渐变 */}
          {nodes.map(node => (
            <radialGradient key={`gradient-${node.id}`} id={`nodeGradient-${node.id}`}>
              <stop offset="0%" stopColor={node.color} stopOpacity="1" />
              <stop offset="100%" stopColor={node.color} stopOpacity="0.85" />
            </radialGradient>
          ))}
        </defs>
        
        {/* 背景圆形装饰 */}
        <circle cx="50%" cy="50%" r="40%" fill="url(#bgGradient)" opacity="0.3" />
        
        <g transform={`translate(${viewBox.width / 2 + transform.x * transform.scale}, ${viewBox.height / 2 + transform.y * transform.scale}) scale(${transform.scale})`}>
          {/* 绘制边 */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source)
            const targetNode = nodes.find(n => n.id === edge.target)
            if (!sourceNode || !targetNode) return null

            const midX = (sourceNode.x + targetNode.x) / 2
            const midY = (sourceNode.y + targetNode.y) / 2

            return (
              <g key={edge.id}>
                {/* 边的外层光晕 */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.color}
                  strokeWidth={6}
                  opacity="0.1"
                  style={{ pointerEvents: 'none' }}
                />
                {/* 边主体 */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.color}
                  strokeWidth={2.5}
                  opacity="0.5"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdgeClick(edge.id)
                  }}
                />
                {/* 边标签 */}
                {transform.scale > 0.6 && edge.label && (
                  <g>
                    <rect
                      x={midX - 35}
                      y={midY - 12}
                      width={70}
                      height={24}
                      fill="rgba(0, 0, 0, 0.9)"
                      rx={6}
                      stroke="rgba(99, 102, 241, 0.3)"
                      strokeWidth={1}
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      fill="white"
                      fontSize={11}
                      fontWeight="600"
                      textAnchor="middle"
                      style={{ 
                        pointerEvents: 'none', 
                        userSelect: 'none'
                      }}
                    >
                      {edge.label.length > 7 ? edge.label.substring(0, 7) + '...' : edge.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* 绘制节点 */}
          {nodes.map((node, index) => {
            const isHovered = hoveredNode === node.id
            const isDragging = draggingNode === node.id
            const isCenterNode = index === 0 // 第一个节点是中心节点
            const nodeRadius = isCenterNode ? 35 : 30
            
            return (
              <g
                key={node.id}
                style={{ cursor: 'move' }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!draggingNode) {
                    onNodeClick(node.id)
                  }
                }}
              >
                {/* 外层光晕 */}
                {(isHovered || isDragging || isCenterNode) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius * (isCenterNode ? 2.5 : 2.2)}
                    fill={node.color}
                    opacity={isCenterNode ? 0.25 : 0.2}
                    filter="url(#glow)"
                  />
                )}
                
                {/* 节点主体外圈 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius + 3}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={isHovered || isDragging ? 2.5 : (isCenterNode ? 2 : 0)}
                  opacity={isHovered || isDragging || isCenterNode ? 0.6 : 0}
                  filter="url(#softGlow)"
                />
                
                {/* 节点主体 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={`url(#nodeGradient-${node.id})`}
                  stroke="white"
                  strokeWidth={isHovered || isDragging ? 3 : 2.5}
                  filter={isHovered || isDragging ? "url(#glow)" : "url(#softGlow)"}
                  style={{ 
                    transition: 'all 0.2s ease'
                  }}
                />
                
                {/* 中心节点特殊标记 */}
                {isCenterNode && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius - 8}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.5}
                    opacity="0.4"
                  />
                )}
                
                {/* 节点内部首字母 */}
                <text
                  x={node.x}
                  y={node.y}
                  fill="white"
                  fontSize={isCenterNode ? 20 : 17}
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ 
                    pointerEvents: 'none', 
                    userSelect: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                  }}
                >
                  {node.name.charAt(0).toUpperCase()}
                </text>
                
                {/* 节点标签 */}
                <g>
                  <rect
                    x={node.x - 60}
                    y={node.y + nodeRadius + 12}
                    width={120}
                    height={28}
                    fill="rgba(0, 0, 0, 0.9)"
                    rx={8}
                    stroke="rgba(99, 102, 241, 0.3)"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={node.x}
                    y={node.y + nodeRadius + 28}
                    fill="white"
                    fontSize={isCenterNode ? 14 : 13}
                    fontWeight="600"
                    textAnchor="middle"
                    style={{ 
                      pointerEvents: 'none', 
                      userSelect: 'none'
                    }}
                  >
                    {node.name.length > 9 ? node.name.substring(0, 9) + '...' : node.name}
                  </text>
                </g>
              </g>
            )
          })}
        </g>
      </svg>

      {/* 控制按钮 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <button
          onClick={handleZoomIn}
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)'
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          title="放大"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)'
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          title="缩小"
        >
          −
        </button>
        <button
          onClick={handleReset}
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)'
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          title="重置视图"
        >
          <UIIcon name="spinner" size={18} />
        </button>
        <div style={{
          padding: '8px 10px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1.5px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '10px',
          color: 'white',
          fontSize: '11px',
          textAlign: 'center',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          {Math.round(transform.scale * 100)}%
        </div>
      </div>

      {/* 操作提示 */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1.5px solid rgba(99, 102, 241, 0.4)',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '10px',
        maxWidth: '180px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ marginBottom: '6px', fontWeight: '700', color: 'white', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UIIcon name="spark" size={11} />
          操作提示
        </div>
        <div style={{ lineHeight: '1.8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UIIcon name="mouse" size={10} />拖拽节点移动</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UIIcon name="hand" size={10} />拖拽空白平移</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UIIcon name="search" size={10} />滚轮缩放</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UIIcon name="click" size={10} />点击查看详情</div>
        </div>
      </div>

      {/* 统计信息和布局选择器 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
      }}>
        {/* 统计信息 */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1.5px solid rgba(99, 102, 241, 0.4)',
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <UIIcon name="chart" size={11} />
            节点: {nodes.length} | 边: {edges.length}
          </span>
        </div>

        {/* 布局选择器 */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '12px 14px',
          borderRadius: '10px',
          border: '1.5px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          maxWidth: '200px',
        }}>
          <div style={{
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ display: 'inline-flex' }}><UIIcon name="palette" size={11} /></span>
            <span>布局方式</span>
          </div>
          
          {/* 当前布局显示 */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.2)',
            padding: '6px 10px',
            borderRadius: '6px',
            marginBottom: '8px',
            border: '1px solid rgba(99, 102, 241, 0.4)',
          }}>
            <div style={{
              color: 'rgba(167, 139, 250, 1)',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{ display: 'inline-flex' }}><UIIcon name={getLayoutIcon(currentLayout)} size={11} /></span>
              <span>{getLayoutName(currentLayout)}</span>
            </div>
          </div>

          {/* 图谱分析信息 */}
          {graphAnalysis && (
            <div style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '8px',
              lineHeight: '1.5',
            }}>
              <div>密度: {(graphAnalysis.density * 100).toFixed(1)}%</div>
              <div>平均度: {graphAnalysis.avgDegree.toFixed(1)}</div>
              {graphAnalysis.hasHierarchy && <div>✓ 层级结构</div>}
              {graphAnalysis.hasTimestamps && <div>✓ 时间信息</div>}
            </div>
          )}

          {/* 布局切换按钮 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {(['radial', 'hierarchical', 'force', 'grid', 'timeline'] as LayoutType[]).map((layout) => (
              <button
                key={layout}
                onClick={() => handleChangeLayout(layout)}
                disabled={currentLayout === layout}
                style={{
                  padding: '6px 10px',
                  background: currentLayout === layout 
                    ? 'rgba(99, 102, 241, 0.3)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: currentLayout === layout
                    ? '1px solid rgba(99, 102, 241, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: currentLayout === layout 
                    ? 'rgba(167, 139, 250, 1)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: currentLayout === layout ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: currentLayout === layout ? 1 : 0.8,
                }}
                onMouseEnter={(e) => {
                  if (currentLayout !== layout) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'
                    e.currentTarget.style.color = 'rgba(167, 139, 250, 1)'
                    e.currentTarget.style.opacity = '1'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLayout !== layout) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                    e.currentTarget.style.opacity = '0.8'
                  }
                }}
              >
                <span style={{ display: 'inline-flex' }}><UIIcon name={getLayoutIcon(layout)} size={10} /></span>
                <span>{getLayoutName(layout)}</span>
                {graphAnalysis?.recommendedLayout === layout && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'rgba(16, 185, 129, 1)',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontWeight: '700',
                  }}>
                    推荐
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
