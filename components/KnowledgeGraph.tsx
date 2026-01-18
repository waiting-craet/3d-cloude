'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import GraphNodes from './GraphNodes'
import GraphEdges from './GraphEdges'
import LoadingSpinner from './LoadingSpinner'
import { useGraphStore } from '@/lib/store'
import * as THREE from 'three'

// ==================== 配置常量 ====================

interface CameraFocusConfig {
  targetScreenCoverage: number
  minDistance: number
  maxDistance: number
  shortAnimationDuration: number
  longAnimationDuration: number
  distanceThreshold: number
}

const DEFAULT_CAMERA_FOCUS_CONFIG: CameraFocusConfig = {
  targetScreenCoverage: 0.45,      // 节点占屏幕高度45%
  minDistance: 5,                   // 最小5单位
  maxDistance: 50,                  // 最大50单位
  shortAnimationDuration: 600,      // 短距离600ms
  longAnimationDuration: 1000,      // 长距离1000ms
  distanceThreshold: 20             // 20单位为阈值
}

// ==================== 动画状态 ====================

interface AnimationState {
  isAnimating: boolean
  startTime: number
  duration: number
  startPosition: THREE.Vector3
  targetPosition: THREE.Vector3
  startTarget: THREE.Vector3
  targetTarget: THREE.Vector3
  animationFrameId: number | null
}

let animationState: AnimationState = {
  isAnimating: false,
  startTime: 0,
  duration: 0,
  startPosition: new THREE.Vector3(),
  targetPosition: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  targetTarget: new THREE.Vector3(),
  animationFrameId: null
}

// ==================== 工具函数 ====================

/**
 * easeInOutCubic 缓动函数
 * @param t - 进度值 [0, 1]
 * @returns 缓动后的值 [0, 1]
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * 计算最佳观察距离
 * @param nodeSize - 节点大小
 * @param camera - 透视相机
 * @param targetCoverage - 目标屏幕覆盖率
 * @returns 最佳观察距离
 */
function calculateOptimalDistance(
  nodeSize: number,
  camera: THREE.PerspectiveCamera,
  targetCoverage: number = DEFAULT_CAMERA_FOCUS_CONFIG.targetScreenCoverage
): number {
  // 处理无效的节点大小
  const validSize = (nodeSize && isFinite(nodeSize) && nodeSize > 0) ? nodeSize : 1.5
  
  // 使用透视投影公式计算距离
  // distance = (nodeSize * 2) / (2 * tan(fov/2) * targetCoverage)
  const fov = camera.fov * (Math.PI / 180)
  const distance = (validSize * 2) / (2 * Math.tan(fov / 2) * targetCoverage)
  
  // 应用距离限制
  return Math.max(
    DEFAULT_CAMERA_FOCUS_CONFIG.minDistance,
    Math.min(DEFAULT_CAMERA_FOCUS_CONFIG.maxDistance, distance)
  )
}

/**
 * 取消当前动画
 */
function cancelCurrentAnimation(): void {
  if (animationState.animationFrameId !== null) {
    cancelAnimationFrame(animationState.animationFrameId)
    animationState.animationFrameId = null
  }
  animationState.isAnimating = false
}

/**
 * 验证节点数据
 * @param node - 节点对象
 * @returns 是否有效
 */
function validateNodeData(node: any): boolean {
  // 检查节点坐标
  if (!isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)) {
    console.error(`Invalid node coordinates: ${node.id}`, node)
    return false
  }
  
  // 检查节点大小
  if (node.size !== undefined && (!isFinite(node.size) || node.size < 0)) {
    console.warn(`Invalid node size: ${node.id}, using default`)
    node.size = 1.5
  }
  
  return true
}

/**
 * 启动摄像机聚焦动画
 * @param node - 目标节点
 * @param camera - 相机对象
 * @param controls - 控制器对象
 */
function animateCameraToNode(
  node: any,
  camera: THREE.PerspectiveCamera,
  controls: any
): void {
  // 验证节点数据
  if (!validateNodeData(node)) {
    console.error('Cannot focus on invalid node')
    return
  }
  
  // 取消当前动画
  cancelCurrentAnimation()
  
  // 计算目标位置
  const nodePosition = new THREE.Vector3(node.x, node.y, node.z)
  const optimalDistance = calculateOptimalDistance(node.size || 1.5, camera)
  
  // 保持当前观察方向
  const currentDirection = new THREE.Vector3()
  camera.getWorldDirection(currentDirection)
  currentDirection.normalize()
  
  // 计算目标摄像机位置
  const targetCameraPosition = nodePosition.clone()
    .sub(currentDirection.multiplyScalar(optimalDistance))
  
  // 计算移动距离以确定动画时长
  const moveDistance = camera.position.distanceTo(targetCameraPosition)
  const duration = moveDistance < DEFAULT_CAMERA_FOCUS_CONFIG.distanceThreshold
    ? DEFAULT_CAMERA_FOCUS_CONFIG.shortAnimationDuration
    : DEFAULT_CAMERA_FOCUS_CONFIG.longAnimationDuration
  
  // 初始化动画状态
  animationState = {
    isAnimating: true,
    startTime: Date.now(),
    duration,
    startPosition: camera.position.clone(),
    targetPosition: targetCameraPosition,
    startTarget: controls.target.clone(),
    targetTarget: nodePosition,
    animationFrameId: null
  }
  
  // 启动动画循环
  const animate = () => {
    if (!animationState.isAnimating) return
    
    const elapsed = Date.now() - animationState.startTime
    const progress = Math.min(elapsed / animationState.duration, 1)
    
    // 应用缓动函数
    const easeProgress = easeInOutCubic(progress)
    
    // 更新摄像机位置
    camera.position.lerpVectors(
      animationState.startPosition,
      animationState.targetPosition,
      easeProgress
    )
    
    // 更新控制器目标
    controls.target.lerpVectors(
      animationState.startTarget,
      animationState.targetTarget,
      easeProgress
    )
    
    controls.update()
    
    // 继续动画或结束
    if (progress < 1) {
      animationState.animationFrameId = requestAnimationFrame(animate)
    } else {
      animationState.isAnimating = false
      animationState.animationFrameId = null
    }
  }
  
  animate()
}

/**
 * 安全的摄像机聚焦动画包装函数
 */
function safeAnimateCameraToNode(
  node: any,
  camera: THREE.PerspectiveCamera,
  controls: any
): void {
  try {
    animateCameraToNode(node, camera, controls)
  } catch (error) {
    console.error('Camera animation failed:', error)
    
    // 回退到默认位置
    camera.position.set(-20, 8, 25)
    controls.target.set(0, 0, 0)
    controls.update()
  }
}

// ==================== 组件 ====================

export default function KnowledgeGraph() {
  const { fetchGraph, setSelectedNode, setConnectingFromNode, isDragging, nodes, edges, currentGraph, selectedNode, isLoading } = useGraphStore()
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
    }
  }, [isDragging])

  // 当选中节点时，使用新的聚焦动画
  useEffect(() => {
    if (selectedNode && controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera
      safeAnimateCameraToNode(selectedNode, camera, controlsRef.current)
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
      {/* 加载提示 */}
      {isLoading && (
        <LoadingSpinner 
          message="正在加载知识图谱..." 
          submessage={currentGraph?.name || '加载中'}
        />
      )}

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
        <PerspectiveCamera makeDefault position={[-40, 20, 50]} fov={80} />
        <OrbitControls 
          ref={controlsRef}
          enableDamping 
          dampingFactor={0.05}
          minDistance={20}
          maxDistance={200}
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
        
        {/* 优化的雾效 - 适应更大的场景 */}
        <fog attach="fog" args={['#1a1a1a', 80, 200]} />
      </Canvas>
    </div>
  )
}
