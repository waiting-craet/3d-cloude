'use client'

import { useGraphStore } from '@/lib/store'
import { Line } from '@react-three/drei'

export default function GraphEdges() {
  const { edges, nodes } = useGraphStore()

  return (
    <>
      {edges.map((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.fromNodeId)
        const toNode = nodes.find((n) => n.id === edge.toNodeId)

        if (!fromNode || !toNode) return null

        return (
          <Line
            key={edge.id}
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
        )
      })}
    </>
  )
}
