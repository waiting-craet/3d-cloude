'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import GraphNodes from './GraphNodes'
import GraphEdges from './GraphEdges'
import { useGraphStore } from '@/lib/store'

export default function KnowledgeGraph() {
  const { fetchGraph, setSelectedNode, setConnectingFromNode, isDragging, nodes, edges, currentGraph, selectedNode } = useGraphStore()
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

  // 当选中节点时，相机聚焦到该节点
  useEffect(() => {
    if (selectedNode && controlsRef.current) {
      const { x, y, z } = selectedNode
      const controls = controlsRef.current
      
      // 计算相机应该移动到的位置（在节点前方一定距离）
      const distance = 15
      const cameraX = x + distance * 0.7
      const cameraY = y + distance * 0.5
      const cameraZ = z + distance * 0.7
      
      // 平滑移动相机
      const camera = controls.object
      const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
      const startTarget = { x: controls.target.x, y: controls.target.y, z: controls.target.z }
      const duration = 800 // 动画持续时间（毫秒）
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 使用缓动函数使动画更平滑
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        // 更新相机位置
        camera.position.x = startPos.x + (cameraX - startPos.x) * easeProgress
        camera.position.y = startPos.y + (cameraY - startPos.y) * easeProgress
        camera.position.z = startPos.z + (cameraZ - startPos.z) * easeProgress
        
        // 更新控制器目标（聚焦到节点）
        controls.target.x = startTarget.x + (x - startTarget.x) * easeProgress
        controls.target.y = startTarget.y + (y - startTarget.y) * easeProgress
        controls.target.z = startTarget.z + (z - startTarget.z) * easeProgress
        
        controls.update()
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      animate()
    }
  }, [selectedNode])

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
