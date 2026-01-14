'use client'

import { useGraphStore } from '@/lib/store'
import { Line, Text, Billboard } from '@react-three/drei'

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

export default function GraphEdges() {
  const { edges, nodes } = useGraphStore()

  return (
    <>
      {edges.map((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.fromNodeId)
        const toNode = nodes.find((n) => n.id === edge.toNodeId)

        if (!fromNode || !toNode) return null

        // Calculate midpoint for label positioning
        const midpoint = calculateMidpoint(fromNode, toNode)
        // Add Y-axis offset to prevent overlap with edge line
        const labelPosition: [number, number, number] = [
          midpoint[0],
          midpoint[1] + 0.2,
          midpoint[2],
        ]

        return (
          <group key={edge.id}>
            {/* Render the edge line */}
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
            
            {/* Render label if valid */}
            {isValidLabel(edge.label) && (
              <Billboard
                position={labelPosition}
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
              >
                <Text
                  fontSize={0.4}
                  color="#cccccc"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.04}
                  outlineColor="#000000"
                  outlineOpacity={0.7}
                >
                  {edge.label}
                </Text>
              </Billboard>
            )}
          </group>
        )
      })}
    </>
  )
}
