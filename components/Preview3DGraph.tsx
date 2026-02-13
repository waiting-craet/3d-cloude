'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, Stars, Environment } from '@react-three/drei'
import { Suspense, useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'

interface Node3D {
  id: string
  name: string
  x: number
  y: number
  z: number
  size: number
  color: string
}

interface Edge3D {
  id: string
  source: string
  target: string
  label: string
  color: string
}

interface Preview3DGraphProps {
  nodes: Node3D[]
  edges: Edge3D[]
  onNodeClick?: (nodeId: string) => void
}

type LayoutType = 'force' | 'radial' | 'hierarchical' | 'grid'

// 加载指示器组件
function LoadingIndicator() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(99, 102, 241, 0.3)',
        borderTop: '3px solid rgba(99, 102, 241, 1)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div>加载3D场景...</div>
    </div>
  )
}

// 节点组件 - 增强版
function Node3DPreview({ node, onClick, isHovered, isSelected }: { 
  node: Node3D
  onClick: () => void
  isHovered: boolean
  isSelected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<any>(null)
  const [hovered, setHovered] = useState(false)

  // 增大节点尺寸
  const baseSize = node.size * 2.5 // 增大2.5倍
  const targetScale = isSelected ? 1.4 : (isHovered || hovered ? 1.2 : 1)
  const targetEmissive = isSelected ? 0.6 : (isHovered || hovered ? 0.4 : 0.2)

  // 平滑动画和文字朝向摄像机
  useFrame(({ camera }) => {
    if (meshRef.current) {
      const currentScale = meshRef.current.scale.x
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.15)
      meshRef.current.scale.setScalar(newScale)

      // 选中时的脉动效果
      if (isSelected) {
        const pulse = Math.sin(Date.now() * 0.003) * 0.08 + 1.35
        meshRef.current.scale.setScalar(pulse)
      }
    }

    // 光晕旋转效果
    if (glowRef.current && (isHovered || hovered || isSelected)) {
      glowRef.current.rotation.y += 0.01
      glowRef.current.rotation.x += 0.005
    }
    
    // 让文字始终面向摄像机（Billboard效果）
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* 主球体 - 增大尺寸 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[baseSize, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={targetEmissive}
          metalness={0.5}
          roughness={0.2}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* 外层光晕 - 多层效果 */}
      {(isHovered || hovered || isSelected) && (
        <>
          <mesh ref={glowRef} scale={1.3}>
            <sphereGeometry args={[baseSize, 32, 32]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.2}
              side={THREE.BackSide}
            />
          </mesh>
          <mesh scale={1.6}>
            <sphereGeometry args={[baseSize, 32, 32]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        </>
      )}

      {/* 节点标签 - 增大字体，始终面向摄像机 */}
      <Text
        ref={textRef}
        position={[0, baseSize + 1.5, 0]}
        fontSize={1.2} // 增大字体
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.15}
        outlineColor="#000000"
        outlineOpacity={0.9}
        maxWidth={20}
        textAlign="center"
      >
        {node.name}
      </Text>
    </group>
  )
}

// 边组件 - 增强版
function Edge3DPreview({ edge, nodes }: { edge: Edge3D; nodes: Node3D[] }) {
  const sourceNode = nodes.find(n => n.id === edge.source)
  const targetNode = nodes.find(n => n.id === edge.target)
  const edgeLabelRef = useRef<any>(null)
  const lineRef = useRef<THREE.Line>(null)

  // 使用 useMemo 优化性能
  const { start, end, midPoint, lineGeometry } = useMemo(() => {
    if (!sourceNode || !targetNode) return { start: null, end: null, midPoint: null, lineGeometry: null }

    const start = new THREE.Vector3(sourceNode.x, sourceNode.y, sourceNode.z)
    const end = new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z)
    const direction = end.clone().sub(start)
    const midPoint = start.clone().add(direction.multiplyScalar(0.5))
    const points = [start, end]
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

    return { start, end, midPoint, lineGeometry }
  }, [sourceNode, targetNode])
  
  // 让边标签始终面向摄像机
  useFrame(({ camera }) => {
    if (edgeLabelRef.current) {
      edgeLabelRef.current.quaternion.copy(camera.quaternion)
    }
    
    // 边线动画效果
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.2
    }
  })

  if (!start || !end || !midPoint || !lineGeometry) return null

  return (
    <group>
      {/* 边线 - 增强视觉效果 */}
      <primitive 
        ref={lineRef}
        object={new THREE.Line(
          lineGeometry, 
          new THREE.LineBasicMaterial({ 
            color: edge.color,
            linewidth: 3, // 增加线宽
            opacity: 0.7,
            transparent: true
          })
        )} 
      />

      {/* 边标签 - 增大字体，始终面向摄像机 */}
      {edge.label && (
        <Text
          ref={edgeLabelRef}
          position={[midPoint.x, midPoint.y, midPoint.z]}
          fontSize={0.7} // 增大字体
          color="rgba(255, 255, 255, 0.95)"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
          outlineOpacity={0.9}
          maxWidth={15}
          textAlign="center"
        >
          {edge.label}
        </Text>
      )}
    </group>
  )
}

// 性能统计组件
function PerformanceStats() {
  const [fps, setFps] = useState(60)
  const frameCount = useRef(0)
  const lastTime = useRef(Date.now())

  useFrame(() => {
    frameCount.current++
    const currentTime = Date.now()
    if (currentTime - lastTime.current >= 1000) {
      setFps(frameCount.current)
      frameCount.current = 0
      lastTime.current = currentTime
    }
  })

  return null
}

// 相机控制组件 - 处理相机聚焦动画
function CameraController({ targetPosition, enabled }: { targetPosition: [number, number, number] | null; enabled: boolean }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useFrame(() => {
    if (!enabled || !targetPosition || !controlsRef.current) return

    // 计算目标相机位置（在节点前方一定距离）
    const [x, y, z] = targetPosition
    const distance = 12 // 相机距离节点的距离（从25减少到12，更近）
    
    // 计算从节点到当前相机的方向向量
    const currentPos = camera.position.clone()
    const nodePos = new THREE.Vector3(x, y, z)
    const direction = currentPos.sub(nodePos).normalize()
    
    // 在该方向上放置相机，距离节点指定距离
    const targetCameraPos = new THREE.Vector3(
      x + direction.x * distance,
      y + direction.y * distance * 0.8, // 稍微从上方观察
      z + direction.z * distance
    )
    
    // 使用更快的插值速度，让动画更流畅（从0.05提升到0.08）
    camera.position.lerp(targetCameraPos, 0.08)
    
    // 平滑移动控制器目标点
    const targetLookAt = new THREE.Vector3(x, y, z)
    const currentTarget = controlsRef.current.target
    currentTarget.lerp(targetLookAt, 0.08)
    
    controlsRef.current.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={200}
      maxPolarAngle={Math.PI / 1.5}
    />
  )
}

// 主组件 - 增强版
export default function Preview3DGraph({ nodes, edges, onNodeClick }: Preview3DGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [layoutType, setLayoutType] = useState<LayoutType>('force')
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  const [cameraAnimationEnabled, setCameraAnimationEnabled] = useState(false)

  // 根据选择的布局类型重新计算节点位置
  const layoutedNodes = useMemo(() => {
    if (nodes.length === 0) return nodes

    // 导入布局算法
    const { applyLayout } = require('@/lib/graph-layouts')
    
    try {
      // 应用选择的布局算法
      const { nodes: newNodes } = applyLayout(nodes, edges, layoutType)
      
      // 计算节点大小（考虑放大系数）
      const nodeRadius = 2.5 * 2.5 // baseSize * multiplier
      const minDistance = nodeRadius * 3 // 节点之间的最小距离
      
      // 转换为3D坐标，使用更大的缩放系数避免重叠
      const scaleFactor = layoutType === 'force' ? 1.5 : 0.8 // 力导向布局使用更大的缩放
      const layouted3D = newNodes.map((node: Node3D) => ({
        ...node,
        x: node.x * scaleFactor,
        y: node.y * scaleFactor,
        z: (Math.random() - 0.5) * 20,
      }))
      
      // 碰撞检测和位置调整，确保节点不重叠
      for (let i = 0; i < layouted3D.length; i++) {
        for (let j = i + 1; j < layouted3D.length; j++) {
          const dx = layouted3D[j].x - layouted3D[i].x
          const dy = layouted3D[j].y - layouted3D[i].y
          const dz = layouted3D[j].z - layouted3D[i].z
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
          
          // 如果距离小于最小距离，推开节点
          if (distance < minDistance && distance > 0) {
            const pushDistance = (minDistance - distance) / 2
            const ratio = pushDistance / distance
            
            layouted3D[i].x -= dx * ratio
            layouted3D[i].y -= dy * ratio
            layouted3D[i].z -= dz * ratio
            
            layouted3D[j].x += dx * ratio
            layouted3D[j].y += dy * ratio
            layouted3D[j].z += dz * ratio
          }
        }
      }
      
      return layouted3D
    } catch (error) {
      console.error('Layout error:', error)
      return nodes
    }
  }, [nodes, edges, layoutType])

  // 自动隐藏控制说明
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    onNodeClick?.(nodeId)
    
    // 启动相机聚焦动画
    const node = layoutedNodes.find((n: Node3D) => n.id === nodeId)
    if (node) {
      setCameraTarget([node.x, node.y, node.z])
      setCameraAnimationEnabled(true)
      
      // 2秒后停止动画（从3秒减少到2秒，更快响应）
      setTimeout(() => {
        setCameraAnimationEnabled(false)
      }, 2000)
    }
  }

  const handleCanvasClick = () => {
    setSelectedNodeId(null)
    setCameraTarget(null)
    setCameraAnimationEnabled(false)
  }

  // 计算场景中心和范围 - 增大范围
  const sceneInfo = useMemo(() => {
    if (layoutedNodes.length === 0) return { center: [0, 0, 0], radius: 30 }

    const positions = layoutedNodes.map((n: Node3D) => [n.x, n.y, n.z])
    const center = [
      positions.reduce((sum: number, p: number[]) => sum + p[0], 0) / layoutedNodes.length,
      positions.reduce((sum: number, p: number[]) => sum + p[1], 0) / layoutedNodes.length,
      positions.reduce((sum: number, p: number[]) => sum + p[2], 0) / layoutedNodes.length,
    ]

    const maxDist = Math.max(...positions.map((p: number[]) => 
      Math.sqrt(
        Math.pow(p[0] - center[0], 2) + 
        Math.pow(p[1] - center[1], 2) + 
        Math.pow(p[2] - center[2], 2)
      )
    ))

    return { center, radius: Math.max(maxDist * 2.5, 30) } // 增大范围
  }, [layoutedNodes])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && <LoadingIndicator />}
      
      <Canvas 
        onClick={handleCanvasClick}
        onCreated={() => setIsLoading(false)}
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <PerspectiveCamera 
          makeDefault 
          position={[-sceneInfo.radius * 0.8, sceneInfo.radius * 0.4, sceneInfo.radius]} 
          fov={60} // 调整视野
        />
        <CameraController 
          targetPosition={cameraTarget} 
          enabled={cameraAnimationEnabled}
        />

        {/* 环境光照 - 增强亮度 */}
        <Environment preset="city" />
        
        {/* 主光照系统 - 增强照明 */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={2} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 10, -10]} intensity={1} />
        <pointLight position={[0, 15, 0]} intensity={1.5} color="#6BB6FF" distance={80} decay={2} />
        <pointLight position={[15, 5, 15]} intensity={1.2} color="#8EC5FF" distance={70} decay={2} />
        <hemisphereLight args={['#87CEEB', '#1a1a1a', 0.8]} />

        {/* 星空背景 */}
        <Stars radius={120} depth={60} count={1500} factor={4} saturation={0} fade speed={0.5} />

        <Suspense fallback={null}>
          {/* 渲染边 */}
          {edges.map(edge => (
            <Edge3DPreview key={edge.id} edge={edge} nodes={layoutedNodes} />
          ))}

          {/* 渲染节点 */}
          {layoutedNodes.map((node: Node3D) => (
            <Node3DPreview
              key={node.id}
              node={node}
              onClick={() => handleNodeClick(node.id)}
              isHovered={hoveredNodeId === node.id}
              isSelected={selectedNodeId === node.id}
            />
          ))}

          {/* 性能统计 */}
          <PerformanceStats />
        </Suspense>

        {/* 优化的雾效 */}
        <fog attach="fog" args={['#1a1a1a', sceneInfo.radius * 1.5, sceneInfo.radius * 3]} />
      </Canvas>

      {/* 布局选择器 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.5)',
        zIndex: 10,
      }}>
        <div style={{ 
          color: '#a78bfa',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '10px',
        }}>
          布局算法
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { value: 'force', label: '力导向', icon: '🌐', desc: '复杂关联' },
            { value: 'radial', label: '径向', icon: '⭐', desc: '中心辐射' },
            { value: 'hierarchical', label: '层级', icon: '🌳', desc: '树状结构' },
            { value: 'grid', label: '网格', icon: '📊', desc: '规整排列' },
          ].map((layout) => (
            <button
              key={layout.value}
              onClick={() => setLayoutType(layout.value as LayoutType)}
              style={{
                padding: '8px 12px',
                background: layoutType === layout.value 
                  ? 'rgba(99, 102, 241, 0.3)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: layoutType === layout.value
                  ? '1px solid rgba(99, 102, 241, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: layoutType === layout.value ? '#a78bfa' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (layoutType !== layout.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (layoutType !== layout.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{layout.icon}</span>
              <div style={{ flex: 1 }}>
                <div>{layout.label}</div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.7,
                  marginTop: '2px'
                }}>
                  {layout.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 节点信息面板 */}
      {selectedNodeId && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          color: 'white',
          fontSize: '13px',
          zIndex: 10,
          minWidth: '200px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{ 
            fontWeight: '700', 
            marginBottom: '8px',
            fontSize: '15px',
            color: '#a78bfa'
          }}>
            选中节点
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {layoutedNodes.find((n: Node3D) => n.id === selectedNodeId)?.name || '未知节点'}
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '6px',
              color: '#a78bfa',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'
            }}
          >
            取消选中
          </button>
        </div>
      )}

      {/* 控制提示 - 可折叠 */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 10,
      }}>
        {showControls ? (
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{ fontWeight: '600' }}>控制说明</span>
              <button
                onClick={() => setShowControls(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
              🖱️ 左键拖动：旋转视角<br />
              🖱️ 右键拖动：平移视角<br />
              🖱️ 滚轮：缩放视角<br />
              🖱️ 点击节点：聚焦节点
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowControls(true)}
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
            }}
          >
            💡 显示控制说明
          </button>
        )}
      </div>

      {/* 统计信息 */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontSize: '11px',
        zIndex: 10,
      }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          节点: {layoutedNodes.length} | 边: {edges.length}
        </div>
      </div>
    </div>
  )
}
