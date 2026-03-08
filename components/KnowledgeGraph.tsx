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
import type { LayoutQualityMetrics } from '@/lib/layout/types'

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
  const [qualityMetrics, setQualityMetrics] = useState<LayoutQualityMetrics | null>(null)
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('auto')
  const [showLayoutPanel, setShowLayoutPanel] = useState(false)

  const themeConfig = getThemeConfig(theme)

  // Handler for re-layout button
  const handleReLayout = async () => {
    if (!currentGraph || nodes.length === 0) {
      console.warn('No graph or nodes to re-layout')
      return
    }

    console.log('🔄 Re-layout triggered with strategy:', selectedStrategy)
    setIsConverting(true)
    setConversionProgress('Re-calculating layout...')

    try {
      const strategy = selectedStrategy === 'auto' ? undefined : selectedStrategy as any
      const result = await layoutService.resetLayout(currentGraph.id, strategy)

      console.log('✅ Re-layout completed:', {
        nodeCount: result.nodes.length,
        strategy: result.strategy,
        qualityScore: result.metrics.qualityScore
      })

      // Update nodes with new 3D coordinates
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
      setQualityMetrics(result.metrics)
      setShowQualityToast(true)

      setTimeout(() => setShowQualityToast(false), 5000)

    } catch (error) {
      console.error('❌ Re-layout failed:', error)
      setConversionProgress('Re-layout failed.')
      setTimeout(() => {
        setIsConverting(false)
        setConversionProgress('')
      }, 3000)
    } finally {
      setIsConverting(false)
      setConversionProgress('')
    }
  }

  // Get quality score color
  const getQualityColor = (score: number) => {
    if (score >= 70) return '#22c55e' // green
    if (score >= 50) return '#eab308' // yellow
    return '#ef4444' // red
  }

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
          setQualityMetrics(result.metrics)
          setShowQualityToast(true)

          // Hide quality toast after 5 seconds
          setTimeout(() => setShowQualityToast(false), 5000)

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

      {/* Quality Metrics Toast */}
      {showQualityToast && qualityMetrics && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: qualityMetrics.qualityScore >= 70 
            ? 'rgba(34, 197, 94, 0.95)' 
            : qualityMetrics.qualityScore >= 50 
            ? 'rgba(234, 179, 8, 0.95)' 
            : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          zIndex: 999,
          minWidth: '280px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            ✓ 3D Layout Generated
          </div>
          <div style={{ fontSize: '12px', opacity: 0.95 }}>
            Quality Score: {qualityMetrics.qualityScore.toFixed(1)}/100
          </div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>
            {qualityMetrics.overlapCount === 0 
              ? '✓ No overlapping nodes' 
              : `⚠ ${qualityMetrics.overlapCount} overlaps detected`}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>
            Space utilization: {(qualityMetrics.spaceUtilization * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Layout Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.75)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        zIndex: 998,
        minWidth: '220px',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Layout Controls</span>
          <button
            onClick={() => setShowLayoutPanel(!showLayoutPanel)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 4px',
            }}
          >
            {showLayoutPanel ? '▼' : '▶'}
          </button>
        </div>

        {showLayoutPanel && (
          <>
            {/* Strategy Selector */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                fontSize: '12px', 
                display: 'block', 
                marginBottom: '6px',
                color: '#aaa'
              }}>
                Layout Strategy
              </label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                disabled={isConverting}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  background: '#222',
                  color: 'white',
                  fontSize: '12px',
                  cursor: isConverting ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="force_directed">Force Directed</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="radial">Radial</option>
                <option value="grid">Grid</option>
                <option value="spherical">Spherical</option>
              </select>
            </div>

            {/* Re-layout Button */}
            <button
              onClick={handleReLayout}
              disabled={isConverting || !currentGraph || nodes.length === 0}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isConverting || !currentGraph || nodes.length === 0
                  ? '#444'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: isConverting || !currentGraph || nodes.length === 0 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s',
                marginBottom: '12px',
              }}
              onMouseEnter={(e) => {
                if (!isConverting && currentGraph && nodes.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isConverting ? '⏳ Re-layouting...' : '🔄 Re-layout Graph'}
            </button>

            {/* Quality Indicator */}
            {qualityMetrics && (
              <div style={{
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${getQualityColor(qualityMetrics.qualityScore)}`,
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#aaa', 
                  marginBottom: '6px' 
                }}>
                  Layout Quality
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {qualityMetrics.qualityScore.toFixed(0)}
                  </span>
                  <span style={{ 
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: getQualityColor(qualityMetrics.qualityScore),
                    color: 'white',
                  }}>
                    {qualityMetrics.qualityScore >= 70 
                      ? 'Excellent' 
                      : qualityMetrics.qualityScore >= 50 
                      ? 'Good' 
                      : 'Fair'}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: '#333',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${qualityMetrics.qualityScore}%`,
                    height: '100%',
                    background: getQualityColor(qualityMetrics.qualityScore),
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#888', 
                  marginTop: '6px' 
                }}>
                  {qualityMetrics.overlapCount === 0 
                    ? '✓ No overlaps' 
                    : `${qualityMetrics.overlapCount} overlaps`}
                  {' • '}
                  {(qualityMetrics.spaceUtilization * 100).toFixed(0)}% space
                </div>
              </div>
            )}
          </>
        )}
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
