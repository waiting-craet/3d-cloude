'use client'

import { useGraphStore } from '@/lib/store'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'

export default function GraphEdges() {
  const { edges, nodes } = useGraphStore()

  return (
    <>
      {edges.map((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.fromNodeId)
        const toNode = nodes.find((n) => n.id === edge.toNodeId)

        if (!fromNode || !toNode) return null

        // 计算中点位置用于显示标签
        const midX = (fromNode.x + toNode.x) / 2
        const midY = (fromNode.y + toNode.y) / 2
        const midZ = (fromNode.z + toNode.z) / 2

        return (
          <group key={edge.id}>
            <Line
              points={[
                [fromNode.x, fromNode.y, fromNode.z],
                [toNode.x, toNode.y, toNode.z],
              ]}
              color="#666666"
              lineWidth={2}
              opacity={0.7}
              transparent
            />
            <Text
              position={[midX, midY + 1, midZ]}
              fontSize={0.4}
              color="#999999"
              anchorX="center"
              anchorY="middle"
            >
              {edge.label}
            </Text>
          </group>
        )
      })}
    </>
  )
}
