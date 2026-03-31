'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useGraphStore } from '@/lib/store'
import * as THREE from 'three'

/**
 * Throttle function to limit execution frequency
 * @param func Function to throttle
 * @param limit Time limit in milliseconds (16ms = ~60fps)
 */
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  let lastArgs: Parameters<T> | null = null
  let timeoutId: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
        // Execute with last args if there were additional calls during throttle
        if (lastArgs) {
          func.apply(this, lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      // Store the latest args to execute after throttle period
      lastArgs = args
    }
  }
}

interface BillboardConfig {
  updateThreshold: number
  smoothFactor: number
}

const DEFAULT_BILLBOARD_CONFIG: BillboardConfig = {
  updateThreshold: 0.1,
  smoothFactor: 0.1
}

function shouldUpdateBillboard(
  lastCameraPosition: THREE.Vector3,
  currentCameraPosition: THREE.Vector3,
  threshold: number = DEFAULT_BILLBOARD_CONFIG.updateThreshold
): boolean {
  return lastCameraPosition.distanceTo(currentCameraPosition) > threshold
}

function updateTextRotation(
  textRef: React.RefObject<any>,
  camera: THREE.Camera,
  nodePosition: THREE.Vector3
): void {
  if (!textRef.current) return

  try {
    if (!isFinite(nodePosition.x) || !isFinite(nodePosition.y) || !isFinite(nodePosition.z)) {
      console.error('Invalid node position for billboard update')
      return
    }

    const direction = new THREE.Vector3()
    direction.subVectors(camera.position, nodePosition)
    direction.y = 0
    direction.normalize()

    const angle = Math.atan2(direction.x, direction.z)
    textRef.current.rotation.y = angle
  } catch (error) {
    console.error('Billboard update failed:', error)
  }
}

function validateNodeData(node: any): boolean {
  if (!node || !isFinite(node.x) || !isFinite(node.y) || !isFinite(node.z)) {
    console.error(`Invalid node coordinates: ${node.id}`, node)
    return false
  }

  if (!isFinite(node.size) || node.size <= 0) {
    console.warn(`Invalid node size: ${node.id}, using default`)
    node.size = 1.5
  }

  return true
}

function getTextYPosition(shape: string, size: number): number {
  switch (shape) {
    case 'box':
    case 'rect':
      return size * 0.7 + 1.2
    case 'cylinder':
    case 'prism':
      return size * 0.9 + 1.2
    case 'cone':
    case 'pyramid':
      return size * 1.1 + 1.2
    case 'sphere':
      return size + 1.2
    case 'frustum':
      return size * 0.8 + 1.2
    case 'torus':
      // 圆环需要更高的位置，特别是大尺寸时
      // 使用二次函数确保大尺寸时有足够的间距
      return size * 1.3 + size * 0.2 + 1.8
    case 'arrow':
      // 箭头需要更高的位置，考虑箭头头部的高度
      // 使用类似圆环的计算方式确保大尺寸时有足够间距
      return size * 1.5 + size * 0.3 + 1.8
    default:
      return size + 1.2
  }
}

function createGeometry(shape: string, size: number) {
  switch (shape) {
    case 'box':
      return <boxGeometry args={[size, size, size]} />
    case 'rect':
      return <boxGeometry args={[size * 1.5, size, size * 0.8]} />
    case 'cylinder':
      return <cylinderGeometry args={[size * 0.8, size * 0.8, size * 1.5, 32]} />
    case 'cone':
      return <coneGeometry args={[size, size * 1.8, 32]} />
    case 'sphere':
      return <sphereGeometry args={[size, 32, 32]} />
    case 'prism':
      return <cylinderGeometry args={[size * 0.8, size * 0.8, size * 1.5, 6]} />
    case 'pyramid':
      return <coneGeometry args={[size, size * 1.8, 4]} />
    case 'frustum':
      return <cylinderGeometry args={[size * 0.6, size, size * 1.2, 32]} />
    case 'torus':
      return <torusGeometry args={[size * 0.8, size * 0.3, 16, 32]} />
    case 'arrow':
      // 箭头的主体部分 - 使用圆柱体作为箭杆
      return <cylinderGeometry args={[size * 0.3, size * 0.3, size * 1.2, 16]} />
    default:
      return <sphereGeometry args={[size, 32, 32]} />
  }
}

interface NodeProps {
  node: any
  onClick: (node: any, event: ThreeEvent<MouseEvent>) => void
  onDrag: (node: any, newPosition: THREE.Vector3) => void
}

function GlowParticles({ color, size }: { color: string; size: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 30
  const velocitiesRef = useRef<Float32Array>(new Float32Array(particleCount * 3))

  useEffect(() => {
    if (!particlesRef.current) return

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const velocities = velocitiesRef.current

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const elevation = Math.random() * Math.PI
      const radius = size * (1.2 + Math.random() * 0.5)

      positions[i * 3] = Math.sin(elevation) * Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.cos(elevation) * radius
      positions[i * 3 + 2] = Math.sin(elevation) * Math.sin(angle) * radius

      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  }, [size])

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = velocitiesRef.current

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3]
        positions[i * 3 + 1] += velocities[i * 3 + 1]
        positions[i * 3 + 2] += velocities[i * 3 + 2]

        const dist = Math.sqrt(
          positions[i * 3] ** 2 +
          positions[i * 3 + 1] ** 2 +
          positions[i * 3 + 2] ** 2
        )

        if (dist > size * 2) {
          const angle = Math.random() * Math.PI * 2
          const elevation = Math.random() * Math.PI
          const radius = size * (1.2 + Math.random() * 0.5)

          positions[i * 3] = Math.sin(elevation) * Math.cos(angle) * radius
          positions[i * 3 + 1] = Math.cos(elevation) * radius
          positions[i * 3 + 2] = Math.sin(elevation) * Math.sin(angle) * radius
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const elevation = Math.random() * Math.PI
      const radius = size * (1.2 + Math.random() * 0.5)

      positions[i * 3] = Math.sin(elevation) * Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.cos(elevation) * radius
      positions[i * 3 + 2] = Math.sin(elevation) * Math.sin(angle) * radius
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [size])

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  )
}

function Node({ node, onClick, onDrag }: NodeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<any>(null)
  const lastCameraPos = useRef(new THREE.Vector3())
  const [hovered, setHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [showText, setShowText] = useState(false) // 初始化为 false，通过距离判断是否显示
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const dragStartPos = useRef<THREE.Vector3 | null>(null)
  const hasMoved = useRef(false)
  const isDraggingRef = useRef(false)
  const { selectedNode, setIsDragging } = useGraphStore()
  const { camera, gl } = useThree()
  const isSelected = selectedNode?.id === node.id
  const shape = node.shape || 'sphere'

  // Create throttled drag handler (16ms = ~60fps)
  const throttledOnDrag = useCallback(
    throttle((node: any, position: THREE.Vector3) => {
      onDrag(node, position)
    }, 16),
    [onDrag]
  )

  // 初始检查文本是否应该显示
  useEffect(() => {
    const nodePos = new THREE.Vector3(node.x, node.y, node.z)
    const dist = camera.position.distanceTo(nodePos)
    // 距离小于 400 才显示文本（大幅提高阈值，仅隐藏超远距离的节点名称）
    if (dist < 400) {
      setShowText(true)
    }
  }, [camera, node.x, node.y, node.z])

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.15 : isSelected ? 1.2 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)

      if (isSelected) {
        const pulse = Math.sin(Date.now() * 0.003) * 0.05 + 1.15
        meshRef.current.scale.setScalar(pulse)
      }
    }

    if (shouldUpdateBillboard(lastCameraPos.current, camera.position)) {
      const nodePos = new THREE.Vector3(node.x, node.y, node.z)
      
      if (showText) {
        updateTextRotation(textRef, camera, nodePos)
      }
      
      // 动态更新文本可见性：选中、悬停、或者距离小于 400 时显示
      const dist = camera.position.distanceTo(nodePos)
      const shouldShow = dist < 400 || isSelected || hovered
      if (showText !== shouldShow) {
        setShowText(shouldShow)
      }

      lastCameraPos.current.copy(camera.position)
    }
  })

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return

      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        cameraDirection,
        new THREE.Vector3(node.x, node.y, node.z)
      )

      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)

      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)

      if (intersection) {
        // Use throttled drag handler to limit updates to ~60fps
        throttledOnDrag(node, intersection)
        hasMoved.current = true
      }
    }

    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = 'auto'
        console.log('Drag ended')
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
  }, [isPressed, camera, node, throttledOnDrag, setIsDragging])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsPressed(true)
    hasMoved.current = false
    dragStartPos.current = new THREE.Vector3(node.x, node.y, node.z)

    pressTimer.current = setTimeout(() => {
      isDraggingRef.current = true
      setIsDragging(true)
      document.body.style.cursor = 'grabbing'
      console.log('Drag mode activated')
    }, 100)
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()

    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }

    if (hasMoved.current) {
      return
    }

    if (!hasMoved.current) {
      onClick(node, e as any)
    }

    setIsPressed(false)
    hasMoved.current = false
  }

  const sizeMultiplier = node.size || 1
  const size = 2.5 * sizeMultiplier

  return (
    <group ref={groupRef} position={[node.x, node.y, node.z]}>
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
        {createGeometry(shape, size)}
        <meshStandardMaterial
          color={node.color || '#6BB6FF'}
          transparent
          opacity={0.9}
          emissive={node.isGlowing ? node.color || '#6BB6FF' : isSelected ? node.color || '#6BB6FF' : hovered ? node.color || '#6BB6FF' : '#000000'}
          emissiveIntensity={node.isGlowing ? 2.0 : isSelected ? 0.5 : hovered ? 0.3 : 0}
          roughness={node.isGlowing ? 0.2 : 0.3}
          metalness={node.isGlowing ? 0.7 : 0.5}
          toneMapped={true}
        />
      </mesh>

      {shape === 'arrow' && (
        <mesh position={[0, size * 0.6 + size * 0.4, 0]}>
          <coneGeometry args={[size * 0.6, size * 0.8, 16]} />
          <meshStandardMaterial
            color={node.color || '#6BB6FF'}
            transparent
            opacity={0.9}
            emissive={node.isGlowing ? node.color || '#6BB6FF' : isSelected ? node.color || '#6BB6FF' : hovered ? node.color || '#6BB6FF' : '#000000'}
            emissiveIntensity={node.isGlowing ? 2.0 : isSelected ? 0.5 : hovered ? 0.3 : 0}
            roughness={node.isGlowing ? 0.2 : 0.3}
            metalness={node.isGlowing ? 0.7 : 0.5}
            toneMapped={true}
          />
        </mesh>
      )}

      <mesh>
        {createGeometry(shape, size * 1.15)}
        <meshBasicMaterial
          color={node.color || '#6BB6FF'}
          transparent
          opacity={isSelected ? 0.25 : hovered ? 0.2 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {node.isGlowing && <GlowParticles color={node.color || '#6BB6FF'} size={size} />}

      {showText && (
        <Text
          ref={textRef}
          position={[0, getTextYPosition(shape, size), 0]}
          fontSize={2.5}
          color={node.textColor || '#FFFFFF'}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.3}
          outlineColor="#000000"
          outlineOpacity={1}
          maxWidth={15}
          textAlign="center"
          depthOffset={-1}
        >
          {node.name || 'Unnamed'}
        </Text>
      )}

      {isSelected && (
        <group rotation={[Math.PI / 2, 0, Date.now() * 0.001]}>
          <mesh>
            <ringGeometry args={[size * 1.3, size * 1.4, 32]} />
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

  if (!nodes || nodes.length === 0) {
    return null
  }

  const handleNodeClick = async (node: any, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (!validateNodeData(node)) {
      console.error('Cannot interact with invalid node')
      return
    }

    if (connectingFromNode) {
      if (connectingFromNode.id !== node.id) {
        addEdge({
          fromNodeId: connectingFromNode.id,
          toNodeId: node.id,
          label: '',
          weight: 1.0,
        })
      }
      setConnectingFromNode(null)
    } else {
      try {
        console.log('🔄 [GraphNodes] 获取节点最新数据:', node.id)
        const response = await fetch(`/api/nodes/${node.id}`)
        if (response.ok) {
          const data = await response.json()
          const latestNode = data.node || data
          console.log('✅ [GraphNodes] 节点数据获取成功:', {
            id: latestNode.id,
            name: latestNode.name,
            imageUrl: latestNode.imageUrl,
            videoUrl: latestNode.videoUrl
          })
          setSelectedNode(latestNode)
        } else {
          console.warn('⚠️ [GraphNodes] 获取节点数据失败，使用本地数据')
          setSelectedNode(node)
        }
      } catch (error) {
        console.error('❌ [GraphNodes] 获取节点数据出错:', error)
        setSelectedNode(node)
      }
    }
  }

  const handleNodeDrag = (node: any, newPosition: THREE.Vector3) => {
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
