'use client'

import { useGraphStore } from '@/lib/store'
import { Line, Text, Billboard } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'

// Utility function to calculate midpoint between two nodes
function calculateMidpoint(
  fromNode: { x: number; y: number; z: number },
  toNode: { x: number; y: number; z: number }
): [number, number, number] {
  return [
    (fromNode.x + toNode.x) / 2,
    (fromNode.y + toNode.y) / 2,
    (fromNode.z + toNode.z) / 2,
  ]
}

// Utility function to validate if a label should be displayed
function isValidLabel(label: string | null | undefined): boolean {
  return label != null && label.trim().length > 0
}

function EdgeWithLabel({ edge, fromNode, toNode }: { edge: any, fromNode: any, toNode: any }) {
  const { camera } = useThree()
  const [showLabel, setShowLabel] = useState(false)
  const lastCameraPos = useRef(new THREE.Vector3())
  
  const midpoint = calculateMidpoint(fromNode, toNode)
  const labelPosition: [number, number, number] = [
    midpoint[0],
    midpoint[1] + 0.2,
    midpoint[2],
  ]

  // 初始检查距离
  useEffect(() => {
    const midPos = new THREE.Vector3(...midpoint)
    if (camera.position.distanceTo(midPos) < 300) {
      setShowLabel(true)
    }
  }, [camera, midpoint])

  useFrame(() => {
    if (lastCameraPos.current.distanceTo(camera.position) > 0.5) {
      const midPos = new THREE.Vector3(...midpoint)
      const dist = camera.position.distanceTo(midPos)
      const shouldShow = dist < 300
      if (showLabel !== shouldShow) {
        setShowLabel(shouldShow)
      }
      lastCameraPos.current.copy(camera.position)
    }
  })

  const hasLabel = isValidLabel(edge.label)

  return (
    <group>
      <Line
        points={[
          [fromNode.x, fromNode.y, fromNode.z],
          [toNode.x, toNode.y, toNode.z],
        ]}
        color="#888888"
        lineWidth={1.5}
        opacity={0.6}
        transparent
        dashed={false}
      />
      
      {hasLabel && showLabel && (
        <Billboard
          position={labelPosition}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            fontSize={1.8}
            fontWeight={700}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.08}
            outlineColor="#000000"
            outlineOpacity={0.9}
            sdfGlyphSize={128}
            maxWidth={10}
            depthTest={false} // 禁用深度测试，让文字始终显示在最上层
            renderOrder={1} // 提高渲染层级
          >
            {edge.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

export default function GraphEdges() {
  const { edges, nodes } = useGraphStore()

  return (
    <>
      {edges.map((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.fromNodeId)
        const toNode = nodes.find((n) => n.id === edge.toNodeId)

        if (!fromNode || !toNode) return null

        return (
          <EdgeWithLabel 
            key={edge.id} 
            edge={edge} 
            fromNode={fromNode} 
            toNode={toNode} 
          />
        )
      })}
    </>
  )
}
