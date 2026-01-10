'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import GraphNodes from './GraphNodes'
import GraphEdges from './GraphEdges'
import { useGraphStore } from '@/lib/store'

export default function KnowledgeGraph() {
  const { fetchGraph, setSelectedNode, setConnectingFromNode } = useGraphStore()

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  const handleCanvasClick = () => {
    // 点击空白处取消选择
    setSelectedNode(null)
    setConnectingFromNode(null)
  }

  return (
    <div id="canvas-container">
      <Canvas onClick={handleCanvasClick}>
        <PerspectiveCamera makeDefault position={[0, 10, 40]} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={100}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        <Suspense fallback={null}>
          <GraphNodes />
          <GraphEdges />
        </Suspense>
        
        <gridHelper args={[100, 20, '#333333', '#1a1a1a']} />
      </Canvas>
    </div>
  )
}
