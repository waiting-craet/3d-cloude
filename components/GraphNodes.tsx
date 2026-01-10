'use client'

import { useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useGraphStore } from '@/lib/store'
import * as THREE from 'three'

interface NodeProps {
  node: any
  onClick: (node: any, event: ThreeEvent<MouseEvent>) => void
}

function Node({ node, onClick }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { selectedNode } = useGraphStore()
  const isSelected = selectedNode?.id === node.id

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected ? 1.3 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => onClick(node, e)}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial 
          color={node.color} 
          emissive={isSelected ? node.color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0]}
        fontSize={0.6}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
        textAlign="center"
      >
        {node.name}
      </Text>
    </group>
  )
}

export default function GraphNodes() {
  const { nodes, setSelectedNode, connectingFromNode, setConnectingFromNode, addEdge } = useGraphStore()

  const handleNodeClick = (node: any, event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    // 如果正在连线模式
    if (connectingFromNode) {
      if (connectingFromNode.id !== node.id) {
        // 创建连接
        addEdge({
          fromNodeId: connectingFromNode.id,
          toNodeId: node.id,
          label: 'PART_OF',
          weight: 1.0,
        })
      }
      setConnectingFromNode(null)
    } else {
      setSelectedNode(node)
    }
  }

  return (
    <>
      {nodes.map((node) => (
        <Node key={node.id} node={node} onClick={handleNodeClick} />
      ))}
    </>
  )
}
