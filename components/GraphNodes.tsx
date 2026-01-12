'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useGraphStore } from '@/lib/store'
import * as THREE from 'three'

interface NodeProps {
  node: any
  onClick: (node: any, event: ThreeEvent<MouseEvent>) => void
  onDrag: (node: any, newPosition: THREE.Vector3) => void
}

function Node({ node, onClick, onDrag }: NodeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
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
    if (meshRef.current) {
      const targetScale = hovered ? 1.15 : isSelected ? 1.2 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
      
      // 选中时添加轻微的脉动效果
      if (isSelected) {
        const pulse = Math.sin(Date.now() * 0.003) * 0.05 + 1.15
        meshRef.current.scale.setScalar(pulse)
      }
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
        <sphereGeometry args={[node.size || 1.5, 32, 32]} />
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
        <sphereGeometry args={[(node.size || 1.5) * 1.15, 32, 32]} />
        <meshBasicMaterial 
          color={node.color || '#6BB6FF'}
          transparent
          opacity={isSelected ? 0.25 : hovered ? 0.2 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 节点名称 - 在球体上方 - 移除字体URL以避免加载错误 */}
      <Text
        position={[0, (node.size || 1.5) + 0.8, 0]}
        fontSize={0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.08}
        outlineColor="#000000"
        outlineOpacity={0.8}
        maxWidth={5}
        textAlign="center"
      >
        {node.name || '未命名'}
      </Text>
      
      {/* 选中时的高亮圆环 - 添加旋转动画 */}
      {isSelected && (
        <group rotation={[Math.PI / 2, 0, Date.now() * 0.001]}>
          <mesh>
            <ringGeometry args={[(node.size || 1.5) * 1.3, (node.size || 1.5) * 1.4, 32]} />
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
  const { camera } = useThree()

  // 调试：打印节点数据
  useEffect(() => {
    console.log('🎨 GraphNodes rendering with nodes:', nodes.length)
    if (nodes.length > 0) {
      console.log('First node:', nodes[0])
      console.log('All nodes:', nodes)
    }
  }, [nodes])

  // 如果没有节点，显示提示
  if (nodes.length === 0) {
    console.log('⚠️ No nodes to render')
    return null
  }

  console.log('✅ Rendering', nodes.length, 'nodes')

  const handleNodeClick = (node: any, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    // 如果正在连线模式
    if (connectingFromNode) {
      if (connectingFromNode.id !== node.id) {
        // 创建连接
        addEdge({
          fromNodeId: connectingFromNode.id,
          toNodeId: node.id,
          label: 'RELATES_TO',
          weight: 1.0,
        })
      }
      setConnectingFromNode(null)
    } else {
      setSelectedNode(node)
      
      // 优化的相机动画：平滑过渡到节点
      const nodePosition = new THREE.Vector3(node.x, node.y, node.z)
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      
      // 计算理想的相机位置（在节点前方，保持一定距离）
      const distance = 12
      const offset = cameraDirection.clone().multiplyScalar(-distance)
      const targetPosition = nodePosition.clone().add(offset)
      
      // 平滑移动相机和目标点
      const startPosition = camera.position.clone()
      const startTime = Date.now()
      const duration = 800 // 0.8秒动画，更流畅
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 使用更舒适的缓动函数 (easeInOutCubic)
        const easeProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress)
        camera.lookAt(nodePosition.x, nodePosition.y, nodePosition.z)
        
        if (progress < 1) {
          requestAnimationFrame(animateCamera)
        }
      }
      
      animateCamera()
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
