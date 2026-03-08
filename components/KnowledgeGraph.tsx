'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import GraphNodes from './GraphNodes'
import GraphEdges from './GraphEdges'
import LoadingSpinner from './LoadingSpinner'
import { useGraphStore } from '@/lib/store'
import { getThemeConfig } from '@/lib/theme'
import * as THREE from 'three'
import { layoutService } from '@/lib/services/LayoutService'

interface CameraFocusConfig {
  targetScreenCoverage: number
  minDistance: number
  maxDistance: number
  shortAnimationDuration: number
  longAnimationDuration: number
  distanceThreshold: number
}

const DEFAULT_CAMERA_FOCUS_CONFIG: CameraFocusConfig = {
  targetScreenCoverage: 0.45,
  minDistance: 5,
  maxDistance: 50,
  shortAnimationDuration: 600,
  longAnimationDuration: 1000,
  distanceThreshold: 20
}

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

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function calculateOptimalDistance(
  nodeSize: number,
  camera: THREE.PerspectiveCamera,
  targetCoverage: number = DEFAULT_CAMERA_FOCUS_CONFIG.targetScreenCoverage
): number {
  const validSize = Math.max(0.5, nodeSize)
  const fov = camera.fov * (Math.PI / 180)
  const distance = (validSize * 2) / (2 * Math.tan(fov / 2) * targetCoverage)

  return Math.max(
    DEFAULT_CAMERA_FOCUS_CONFIG.minDistance,
    Math.min(DEFAULT_CAMERA_FOCUS_CONFIG.maxDistance, distance)
  )
}

function cancelCurrentAnimation(): void {
  if (animationState.animationFrameId !== null) {
    cancelAnimationFrame(animationState.animationFrameId)
    animationState.animationFrameId = null
  }
  animationState.isAnimating = false
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

function animateCameraToNode(
  node: any,
  camera: THREE.PerspectiveCamera,
  controls: any
): void {
  if (!validateNodeData(node)) {
    console.error('Cannot focus on invalid node')
    return
  }

  cancelCurrentAnimation()

  const nodePosition = new THREE.Vector3(node.x, node.y, node.z)
  const optimalDistance = calculateOptimalDistance(node.size || 1.5, camera)

  const currentDirection = new THREE.Vector3()
  camera.getWorldDirection(currentDirection)
  currentDirection.normalize()

  const targetCameraPosition = nodePosition.clone()
    .sub(currentDirection.multiplyScalar(optimalDistance))

  const moveDistance = camera.position.distanceTo(targetCameraPosition)
  const duration = moveDistance < DEFAULT_CAMERA_FOCUS_CONFIG.distanceThreshold
    ? DEFAULT_CAMERA_FOCUS_CONFIG.shortAnimationDuration
    : DEFAULT_CAMERA_FOCUS_CONFIG.longAnimationDuration

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

  const animate = () => {
    if (!animationState.isAnimating) return

    const elapsed = Date.now() - animationState.startTime
    const progress = Math.min(elapsed / animationState.duration, 1)

    const easeProgress = easeInOutCubic(progress)

    camera.position.lerpVectors(
      animationState.startPosition,
      animationState.targetPosition,
      easeProgress
    )

    controls.target.lerpVectors(
      animationState.startTarget,
      animationState.targetTarget,
      easeProgress
    )

    controls.update()

    if (progress < 1) {
      animationState.animationFrameId = requestAnimationFrame(animate)
    } else {
      animationState.isAnimating = false
      animationState.animationFrameId = null
    }
  }

  animate()
}

function safeAnimateCameraToNode(
  node: any,
  camera: THREE.PerspectiveCamera,
  controls: any
): void {
  try {
    animateCameraToNode(node, camera, controls)
  } catch (error) {
    console.error('Camera animation failed:', error)
    controls.target.set(0, 0, 0)
    controls.update()
  }
}

export default function KnowledgeGraph() {
  const { fetchGraph, setSelectedNode, setConnectingFromNode, isDragging, nodes, edges, currentGraph, selectedNode, isLoading, theme, setNodes } = useGraphStore()
  const controlsRef = useRef<any>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState<string>('')

  const themeConfig = getThemeConfig(theme)

  useEffect(() => {
    console.log('Graph changed, reloading data:', currentGraph?.name || 'none')
    fetchGraph()
  }, [currentGraph, fetchGraph])

  // Auto-conversion: Check if 3D coordinates exist and convert if needed
  useEffect(() => {
    const checkAndConvert3D = async () => {
      // Skip if no graph or no nodes
      if (!currentGraph || !nodes || nodes.length === 0) {
        return
      }

      // Check if 3D coordinates exist (z !== null && z !== 0)
      const has3DCoordinates = nodes.some(node => 
        node.z !== null && node.z !== undefined && node.z !== 0
      )

      // If 3D coordinates are missing, automatically convert
      if (!has3DCoordinates) {
        console.log('🔄 3D coordinates missing, starting auto-conversion...')
        setIsConverting(true)
        setConversionProgress('Analyzing graph structure...')

        try {
          // Call the layout service to convert to 3D
          const result = await layoutService.convertTo3D(currentGraph.id)

          console.log('✅ 3D conversion completed:', {
            nodeCount: result.nodes.length,
            strategy: result.strategy,
            qualityScore: result.metrics.qualityScore,
            processingTime: result.processingTime
          })

          // Update nodes with 3D coordinates
          setConversionProgress('Updating node positions...')
          const updatedNodes = nodes.map(node => {
            const converted = result.nodes.find(n => n.id === node.id)
            if (converted) {
              return {
                ...node,
                x: converted.x3d,
                y: converted.y3d,
                z: converted.z3d
              }
            }
            return node
          })

          setNodes(updatedNodes)

          console.log('✅ 3D coordinates updated successfully')

        } catch (error) {
          console.error('❌ 3D conversion failed:', error)
          setConversionProgress('Conversion failed. Using default layout.')
          
          // Show error for 3 seconds
          setTimeout(() => {
            setIsConverting(false)
            setConversionProgress('')
          }, 3000)
        } finally {
          setIsConverting(false)
          setConversionProgress('')
        }
      }
    }

    checkAndConvert3D()
  }, [currentGraph, nodes, setNodes])

  useEffect(() => {
    console.log('Display - Nodes:', nodes.length, 'Edges:', edges.length)
  }, [nodes, edges])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isDragging
    }
  }, [isDragging])

  useEffect(() => {
    if (selectedNode && controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera
      safeAnimateCameraToNode(selectedNode, camera, controlsRef.current)
    }
  }, [selectedNode])

  const handleCanvasClick = (e: any) => {
    if (e.eventObject === e.object) {
      setSelectedNode(null)
      setConnectingFromNode(null)
    }
  }

  return (
    <div id="canvas-container" style={{
      width: '100%',
      height: '100%',
      background: themeConfig.canvasBackground,
      transition: 'background 0.3s ease',
    }}>
      {isLoading && (
        <LoadingSpinner 
          message="Loading knowledge graph..." 
          submessage={currentGraph?.name || 'Loading'}
        />
      )}

      {/* Conversion Progress Indicator */}
      {isConverting && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '24px 32px',
          borderRadius: '12px',
          zIndex: 1000,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderTop: '4px solid #6BB6FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            Converting to 3D Layout
          </div>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            {conversionProgress}
          </div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}


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
        />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.6} />
        <pointLight position={[0, 15, 0]} intensity={1.2} color="#6BB6FF" distance={50} />
        <pointLight position={[15, 5, 15]} intensity={0.8} color="#8EC5FF" distance={40} />
        <pointLight position={[-15, 5, -15]} intensity={0.8} color="#4A9EFF" distance={40} />

        <hemisphereLight args={['#87CEEB', '#1a1a1a', 0.4]} />

        <Suspense fallback={null}>
          <GraphNodes />
          <GraphEdges />
        </Suspense>

        <fog attach="fog" args={['#1a1a1a', 80, 200]} />
      </Canvas>
    </div>
  )
}
