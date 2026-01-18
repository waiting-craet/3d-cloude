'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useGraphStore } from '@/lib/store'
import * as THREE from 'three'

// ==================== 配置常量 ====================

interface BillboardConfig {
  updateThreshold: number
  smoothFactor: number
}

const DEFAULT_BILLBOARD_CONFIG: BillboardConfig = {
  updateThreshold: 0.1,   // 摄像机移动0.1单位才更新
  smoothFactor: 0.15      // 平滑因子,值越小越平滑
}

// ==================== 工具函数 ====================

/**
 * 检查是否应该更新billboard
 * @param lastCameraPosition - 上次摄像机位置
 * @param currentCameraPosition - 当前摄像机位置
 * @param threshold - 距离阈值
 * @returns 是否应该更新
 */
function shouldUpdateBillboard(
  lastCameraPosition: THREE.Vector3,
  currentCameraPosition: THREE.Vector3,
  threshold: number = DEFAULT_BILLBOARD_CONFIG.updateThreshold
): boolean {
  return lastCameraPosition.distanceTo(currentCameraPosition) > threshold
}

/**
 * 更新文本旋转使其面向摄像机
 * @param textRef - 文本mesh引用
 * @param camera - 摄像机对象
 * @param nodePosition - 节点位置
 */
function updateTextRotation(
  textRef: React.RefObject<any>,
  camera: THREE.Camera,
  nodePosition: THREE.Vector3
): void {
  if (!textRef.current) return
  
  try {
    // 验证位置数据
    if (!isFinite(nodePosition.x) || !isFinite(nodePosition.y) || !isFinite(nodePosition.z)) {
      console.error('Invalid node position for billboard update')
      return
    }
    
    // 计算从文本到摄像机的方向
    const direction = new THREE.Vector3()
    direction.subVectors(camera.position, nodePosition)
    direction.y = 0 // 保持垂直方向,避免文字倒置
    direction.normalize()
    
    // 计算目标旋转角度
    const angle = Math.atan2(direction.x, direction.z)
    
    // 平滑旋转到目标角度
    const currentRotation = textRef.current.rotation.y
    const targetRotation = angle
    
    // 处理角度环绕问题
    let delta = targetRotation - currentRotation
    if (delta > Math.PI) delta -= 2 * Math.PI
    if (delta < -Math.PI) delta += 2 * Math.PI
    
    // 应用平滑插值
    textRef.current.rotation.y = currentRotation + delta * DEFAULT_BILLBOARD_CONFIG.smoothFactor
  } catch (error) {
    console.error('Billboard update failed:', error)
  }
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

// ==================== 组件 ====================

interface NodeProps {
  node: any
  onClick: (node: any, event: ThreeEvent<MouseEvent>) => void
  onDrag: (node: any, newPosition: THREE.Vector3) => void
}

function Node({ node, onClick, onDrag }: NodeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<any>(null)
  const lastCameraPos = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const dragStartPos = useRef<THREE.Vector3 | null>(null)
  const hasMoved = useRef(false)
  const isDraggingRef = useRef(false)
  const { selectedNode, setIsDragging } = useGraphStore()
  const { camera, gl } = useThree()
  const isSelected = selectedNode?.id === node.id

  useFrame(() => {
    // 更新球体缩放动画
    if (meshRef.current) {
      const targetScale = hovered ? 1.15 : isSelected ? 1.2 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
      
      // 选中时添加轻微的脉动效果
      if (isSelected) {
        const pulse = Math.sin(Date.now() * 0.003) * 0.05 + 1.15
        meshRef.current.scale.setScalar(pulse)
      }
    }
    
    // 更新billboard文本
    if (shouldUpdateBillboard(lastCameraPos.current, camera.position)) {
      updateTextRotation(
        textRef,
        camera,
        new THREE.Vector3(node.x, node.y, node.z)
      )
      lastCameraPos.current.copy(camera.position)
    }
  })

  // 全局鼠标移动和松开事件处理
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return

      // 创建一个垂直于相机视线的平面
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        cameraDirection,
        new THREE.Vector3(node.x, node.y, node.z)
      )
      
      // 从鼠标位置创建射线
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      )
      raycaster.setFromCamera(mouse, camera)
      
      // 计算射线与平面的交点
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)
      
      if (intersection) {
        onDrag(node, intersection)
        hasMoved.current = true
      }
    }

    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = 'auto'
        console.log('拖拽结束')
      }
      
      if (pressTimer.current) {
        clearTimeout(pressTimer.current)
        pressTimer.current = null
      }
      
      setIsPressed(false)
    }

    if (isPressed || isDraggingRef.current) {
      window.addEventListener('pointermove', handleGlobalPointerMove)
      window.addEventListener('pointerup', handleGlobalPointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove)
      window.removeEventListener('pointerup', handleGlobalPointerUp)
    }
  }, [isPressed, camera, node, onDrag, setIsDragging])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsPressed(true)
    hasMoved.current = false
    dragStartPos.current = new THREE.Vector3(node.x, node.y, node.z)
    
    // 设置长按定时器（100ms 后开始拖拽）
    pressTimer.current = setTimeout(() => {
      isDraggingRef.current = true
      setIsDragging(true)
      document.body.style.cursor = 'grabbing'
      console.log('拖拽模式已启动')
    }, 100)
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    
    // 清除长按定时器
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    
    // 如果是拖拽模式，在全局事件中处理
    if (isDraggingRef.current) {
      return
    }
    
    // 如果没有移动且不是拖拽模式，触发点击
    if (!hasMoved.current) {
      onClick(node, e as any)
    }
    
    setIsPressed(false)
    hasMoved.current = false
  }

  return (
    <group ref={groupRef} position={[node.x, node.y, node.z]}>
      {/* 主球体 */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          const { isDragging } = useGraphStore.getState()
          document.body.style.cursor = isDragging ? 'grabbing' : 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          const { isDragging } = useGraphStore.getState()
          if (!isDragging) {
            document.body.style.cursor = 'auto'
          }
        }}
      >
        <sphereGeometry args={[node.size || 2.0, 32, 32]} />
        <meshStandardMaterial 
          color={node.color || '#6BB6FF'} 
          transparent
          opacity={0.9}
          emissive={isSelected ? node.color || '#6BB6FF' : hovered ? node.color || '#6BB6FF' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      
      {/* 外层光晕效果 - 悬停和选中时更明显 */}
      <mesh>
        <sphereGeometry args={[(node.size || 2.0) * 1.15, 32, 32]} />
        <meshBasicMaterial 
          color={node.color || '#6BB6FF'}
          transparent
          opacity={isSelected ? 0.25 : hovered ? 0.2 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 节点名称 - Billboard效果 */}
      <Text
        ref={textRef}
        position={[0, (node.size || 2.0) + 1.2, 0]}
        fontSize={1.2}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.2}
        outlineColor="#000000"
        outlineOpacity={1}
        maxWidth={10}
        textAlign="center"
        depthOffset={-1}
      >
        {node.name || '未命名'}
      </Text>
      
      {/* 选中时的高亮圆环 - 添加旋转动画 */}
      {isSelected && (
        <group rotation={[Math.PI / 2, 0, Date.now() * 0.001]}>
          <mesh>
            <ringGeometry args={[(node.size || 2.0) * 1.3, (node.size || 2.0) * 1.4, 32]} />
            <meshBasicMaterial 
              color={node.color || '#6BB6FF'}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

export default function GraphNodes() {
  const { nodes, setSelectedNode, connectingFromNode, setConnectingFromNode, addEdge, updateNodePosition } = useGraphStore()

  // 如果没有节点，显示提示
  if (nodes.length === 0) {
    return null
  }

  const handleNodeClick = (node: any, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    // 验证节点数据
    if (!validateNodeData(node)) {
      console.error('Cannot interact with invalid node')
      return
    }
    
    // 如果正在连线模式
    if (connectingFromNode) {
      if (connectingFromNode.id !== node.id) {
        // 创建连接
        addEdge({
          fromNodeId: connectingFromNode.id,
          toNodeId: node.id,
          label: '',
          weight: 1.0,
        })
      }
      setConnectingFromNode(null)
    } else {
      // 选中节点 - 摄像机聚焦由KnowledgeGraph组件处理
      setSelectedNode(node)
    }
  }

  const handleNodeDrag = (node: any, newPosition: THREE.Vector3) => {
    // 更新节点位置
    updateNodePosition(node.id, newPosition.x, newPosition.y, newPosition.z)
  }

  return (
    <>
      {nodes.map((node) => (
        <Node 
          key={node.id} 
          node={node} 
          onClick={handleNodeClick}
          onDrag={handleNodeDrag}
        />
      ))}
    </>
  )
}
