'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import GraphNodes from './GraphNodes'
import GraphEdges from './GraphEdges'
import { useGraphStore } from '@/lib/store'

export default function KnowledgeGraph() {
  const { fetchGraph, setSelectedNode, setConnectingFromNode, isDragging } = useGraphStore()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

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
      <Canvas onPointerMissed={handleCanvasClick}>
        <PerspectiveCamera makeDefault position={[0, 15, 35]} fov={60} />
        <OrbitControls 
          ref={controlsRef}
          enableDamping 
          dampingFactor={0.05}
          minDistance={15}
          maxDistance={80}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* 环境光照 */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#4A9EFF" />
        
        {/* 环境贴图 */}
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <GraphNodes />
          <GraphEdges />
        </Suspense>
        
        {/* 移除网格，使用纯色背景 */}
        <fog attach="fog" args={['#1a1a1a', 30, 100]} />
      </Canvas>
    </div>
  )
}
