'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import GraphNodes from './GraphNodes'
import GraphEdges from './GraphEdges'
import { useGraphStore } from '@/lib/store'

export default function KnowledgeGraph() {
  const { fetchGraph, setSelectedNode, setConnectingFromNode, isDragging, nodes, edges, currentGraph } = useGraphStore()
  const controlsRef = useRef<any>(null)

  // 监听当前图谱的变化，重新加载数据
  useEffect(() => {
    console.log('🔍 当前图谱变化，重新加载数据:', currentGraph?.name || '无')
    fetchGraph()
  }, [currentGraph, fetchGraph])

  useEffect(() => {
    console.log('📊 当前显示 - 节点:', nodes.length, '边:', edges.length)
  }, [nodes, edges])

  useEffect(() => {
    // 根据拖拽状态启用/禁用 OrbitControls
    if (controlsRef.current) {
      controlsRef.current.enabled = !isDragging
      console.log('OrbitControls enabled:', !isDragging)  // 调试日志
    }
  }, [isDragging])

  const handleCanvasClick = (e: any) => {
    // 只有当点击的不是节点时才取消选择
    if (e.eventObject === e.object) {
      setSelectedNode(null)
      setConnectingFromNode(null)
    }
  }

  return (
    <div id="canvas-container">
      {/* Debug indicator */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '10px',
        color: 'white',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 100,
        fontSize: '12px',
      }}>
        Canvas Container Loaded
        <br />
        Nodes: {nodes.length} | Edges: {edges.length}
      </div>
      
      <Canvas onPointerMissed={handleCanvasClick}>
        <PerspectiveCamera makeDefault position={[-20, 8, 25]} fov={60} />
        <OrbitControls 
          ref={controlsRef}
          enableDamping 
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI / 1.5}
          target={[0, 0, 0]}
        />
        
        {/* 优化的光照系统 */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.6} />
        <pointLight position={[0, 15, 0]} intensity={1.2} color="#6BB6FF" distance={50} />
        <pointLight position={[15, 5, 15]} intensity={0.8} color="#8EC5FF" distance={40} />
        <pointLight position={[-15, 5, -15]} intensity={0.8} color="#4A9EFF" distance={40} />
        
        {/* 半球光提供环境色 */}
        <hemisphereLight args={['#87CEEB', '#1a1a1a', 0.4]} />
        
        <Suspense fallback={null}>
          <GraphNodes />
          <GraphEdges />
        </Suspense>
        
        {/* 优化的雾效 */}
        <fog attach="fog" args={['#1a1a1a', 40, 100]} />
      </Canvas>
    </div>
  )
}
