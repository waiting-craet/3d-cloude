/**
 * Navigation Workflow Performance Tests
 * 
 * Task 9.3: Performance and timing validation
 * - End-to-end performance testing of the complete navigation workflow
 * - Verify 1-2 second navigation timing requirements
 * - Test loading state transitions and success message timing
 * - Requirements: 4.2, 4.3
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextPage from '../text-page/page'
import { NavigationService } from '@/lib/services/navigation-service'

// Mock NavigationService
jest.mock('@/lib/services/navigation-service')
const mockNavigationService = NavigationService as jest.Mocked<typeof NavigationService>

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock Preview3DGraph component
jest.mock('@/components/Preview3DGraph', () => {
  return {
    __esModule: true,
    default: ({ nodes, edges }: any) => (
      <div data-testid="preview-3d-graph">
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
      </div>
    ),
  }
})

// Mock graph layouts
jest.mock('@/lib/graph-layouts', () => ({
  applyLayout: (nodes: any[], edges: any[]) => ({
    nodes: nodes.map((node, index) => ({
      ...node,
      x: index * 10,
      y: index * 10,
    })),
    analysis: {
      recommendedLayout: 'force',
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density: 0.5,
      hasHierarchy: false,
      hasCycles: false,
    },
  }),
}))

describe('Navigation Workflow Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Mock successful navigation
    mockNavigationService.navigateToGraph.mockResolvedValue({
      success: true,
    })

    // Mock projects API
    ;(fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            projects: [
              { id: 'project1', name: 'Test Project 1' },
              { id: 'project2', name: 'Test Project 2' },
            ]
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Complete Workflow Performance (Requirements 4.2, 4.3)', () => {
    it('should complete save-to-navigation workflow within 1-2 seconds', async () => {
      const testGraphId = 'workflow-perf-123'
      const mockSaveResponse = {
        success: true,
        data: {
          graphId: testGraphId,
          graphName: 'Performance Test Graph',
          nodesCreated: 5,
          edgesCreated: 3,
          totalNodes: 5,
          totalEdges: 3,
        }
      }

      // Mock AI analysis API
      ;(fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              projects: [{ id: 'project1', name: 'Test Project' }]
            })
          })
        }
        
        if (url === '/api/ai/analyze') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                nodes: [
                  { id: 'node1', name: 'Node 1', type: 'concept', properties: {} },
                  { id: 'node2', name: 'Node 2', type: 'concept', properties: {} },
                ],
                edges: [
                  { id: 'edge1', fromNodeId: 'node1', toNodeId: 'node2', label: 'relates to', properties: {} },
                ],
                stats: { totalNodes: 2, totalEdges: 1, duplicateNodes: 0, redundantEdges: 0, conflicts: 0 }
              }
            })
          })
        }

        if (url === '/api/ai/save-graph') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSaveResponse)
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      })

      const workflowStartTime = Date.now()

      render(<TextPage />)

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('知识图谱生成器')).toBeInTheDocument()
      })

      // Simulate user input and AI analysis
      const textInput = screen.getByPlaceholderText('请输入您想要分析的文本内容...')
      fireEvent.change(textInput, { target: { value: 'Test content for analysis' } })

      const analyzeButton = screen.getByText('🤖 AI 分析')
      fireEvent.click(analyzeButton)

      // Wait for AI analysis to complete and modal to appear
      await waitFor(() => {
        expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      })

      // Start the save process
      const saveButton = screen.getByText('💾 保存图谱')
      const saveStartTime = Date.now()
      
      fireEvent.click(saveButton)

      // Verify loading state appears immediately
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()

      // Wait for save to complete and success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      const successMessageTime = Date.now()

      // Verify navigation hasn't started yet (success message timing)
      expect(mockNavigationService.navigateToGraph).not.toHaveBeenCalled()

      // Fast-forward through success message timing (1.5 seconds)
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation to be triggered
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith(testGraphId, expect.any(Object))
      })

      const navigationTime = Date.now()
      const workflowEndTime = Date.now()

      // Verify timing requirements
      const saveToSuccessTime = successMessageTime - saveStartTime
      const successToNavigationTime = navigationTime - successMessageTime
      const totalWorkflowTime = workflowEndTime - workflowStartTime

      // Success message should appear quickly after save
      expect(saveToSuccessTime).toBeLessThan(500)

      // Success message should be displayed for ~1.5 seconds (requirement 4.2)
      expect(successToNavigationTime).toBeGreaterThanOrEqual(1400)
      expect(successToNavigationTime).toBeLessThanOrEqual(1600)

      // Total workflow should be efficient (requirement 4.3)
      expect(totalWorkflowTime).toBeLessThan(5000) // Complete workflow under 5 seconds
    })

    it('should maintain smooth loading state transitions throughout workflow', async () => {
      const testGraphId = 'smooth-workflow-456'
      const stateTransitions: Array<{ state: string; timestamp: number }> = []

      const mockSaveResponse = {
        success: true,
        data: {
          graphId: testGraphId,
          graphName: 'Smooth Workflow Test',
          nodesCreated: 3,
          edgesCreated: 2,
        }
      }

      // Mock APIs with timing
      ;(fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] })
          })
        }
        
        if (url === '/api/ai/analyze') {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: {
                    nodes: [
                      { id: 'node1', name: 'Node 1', type: 'concept', properties: {} },
                    ],
                    edges: [],
                    stats: { totalNodes: 1, totalEdges: 0, duplicateNodes: 0, redundantEdges: 0, conflicts: 0 }
                  }
                })
              })
            }, 100) // Simulate analysis delay
          })
        }

        if (url === '/api/ai/save-graph') {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockSaveResponse)
              })
            }, 200) // Simulate save delay
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      })

      render(<TextPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('知识图谱生成器')).toBeInTheDocument()
      })
      stateTransitions.push({ state: 'page_loaded', timestamp: Date.now() })

      // Start AI analysis
      const textInput = screen.getByPlaceholderText('请输入您想要分析的文本内容...')
      fireEvent.change(textInput, { target: { value: 'Test content' } })

      const analyzeButton = screen.getByText('🤖 AI 分析')
      fireEvent.click(analyzeButton)
      stateTransitions.push({ state: 'analysis_started', timestamp: Date.now() })

      // Wait for analysis loading state
      await waitFor(() => {
        expect(screen.getByText('🤖 分析中...')).toBeInTheDocument()
      })
      stateTransitions.push({ state: 'analysis_loading', timestamp: Date.now() })

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      })
      stateTransitions.push({ state: 'modal_opened', timestamp: Date.now() })

      // Start save process
      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)
      stateTransitions.push({ state: 'save_started', timestamp: Date.now() })

      // Verify save loading state
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      stateTransitions.push({ state: 'save_loading', timestamp: Date.now() })

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })
      stateTransitions.push({ state: 'save_success', timestamp: Date.now() })

      // Fast-forward through success timing
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Wait for navigation
      await waitFor(() => {
        expect(mockNavigationService.navigateToGraph).toHaveBeenCalled()
      })
      stateTransitions.push({ state: 'navigation_started', timestamp: Date.now() })

      // Verify smooth state transitions (no gaps > 100ms between states)
      for (let i = 1; i < stateTransitions.length; i++) {
        const timeDiff = stateTransitions[i].timestamp - stateTransitions[i - 1].timestamp
        const fromState = stateTransitions[i - 1].state
        const toState = stateTransitions[i].state
        
        // Allow longer times for expected delays (analysis, save operations)
        if (fromState === 'analysis_started' || fromState === 'save_started') {
          expect(timeDiff).toBeLessThan(500) // API operations
        } else {
          expect(timeDiff).toBeLessThan(100) // UI state transitions should be fast
        }
      }
    })

    it('should handle performance under various load conditions', async () => {
      const testCases = [
        { nodes: 10, edges: 15, description: 'small graph' },
        { nodes: 50, edges: 100, description: 'medium graph' },
        { nodes: 100, edges: 200, description: 'large graph' },
      ]

      for (const testCase of testCases) {
        const testGraphId = `load-test-${testCase.nodes}-${testCase.edges}`
        
        // Generate test data
        const nodes = Array.from({ length: testCase.nodes }, (_, i) => ({
          id: `node-${i}`,
          name: `Node ${i}`,
          type: 'concept',
          properties: { description: `Description ${i}` }
        }))

        const edges = Array.from({ length: testCase.edges }, (_, i) => ({
          id: `edge-${i}`,
          fromNodeId: `node-${i % testCase.nodes}`,
          toNodeId: `node-${(i + 1) % testCase.nodes}`,
          label: `Edge ${i}`,
          properties: {}
        }))

        const mockSaveResponse = {
          success: true,
          data: {
            graphId: testGraphId,
            graphName: `${testCase.description} test`,
            nodesCreated: testCase.nodes,
            edgesCreated: testCase.edges,
          }
        }

        // Mock APIs for this test case
        ;(fetch as jest.Mock).mockImplementation((url: string) => {
          if (url === '/api/projects') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ projects: [] })
            })
          }
          
          if (url === '/api/ai/analyze') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  nodes,
                  edges,
                  stats: {
                    totalNodes: testCase.nodes,
                    totalEdges: testCase.edges,
                    duplicateNodes: 0,
                    redundantEdges: 0,
                    conflicts: 0
                  }
                }
              })
            })
          }

          if (url === '/api/ai/save-graph') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockSaveResponse)
            })
          }

          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
          })
        })

        const startTime = Date.now()

        const { unmount } = render(<TextPage />)

        // Wait for page load
        await waitFor(() => {
          expect(screen.getByText('知识图谱生成器')).toBeInTheDocument()
        })

        // Trigger analysis
        const textInput = screen.getByPlaceholderText('请输入您想要分析的文本内容...')
        fireEvent.change(textInput, { target: { value: `Test content for ${testCase.description}` } })

        const analyzeButton = screen.getByText('🤖 AI 分析')
        fireEvent.click(analyzeButton)

        // Wait for modal
        await waitFor(() => {
          expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
        })

        // Verify data is displayed correctly
        expect(screen.getByText(testCase.nodes.toString())).toBeInTheDocument()
        expect(screen.getByText(testCase.edges.toString())).toBeInTheDocument()

        // Start save
        const saveButton = screen.getByText('💾 保存图谱')
        fireEvent.click(saveButton)

        // Wait for success
        await waitFor(() => {
          expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
        })

        // Fast-forward timing
        act(() => {
          jest.advanceTimersByTime(1500)
        })

        // Wait for navigation
        await waitFor(() => {
          expect(mockNavigationService.navigateToGraph).toHaveBeenCalledWith(testGraphId, expect.any(Object))
        })

        const endTime = Date.now()
        const totalTime = endTime - startTime

        // Performance should scale reasonably with data size
        const expectedMaxTime = 2000 + (testCase.nodes * 5) // Base time + scaling factor
        expect(totalTime).toBeLessThan(expectedMaxTime)

        unmount()
        jest.clearAllMocks()
      }
    })
  })

  describe('Loading State Performance', () => {
    it('should show loading indicators without delay', async () => {
      const mockSaveResponse = {
        success: true,
        data: {
          graphId: 'loading-test-123',
          graphName: 'Loading Test Graph',
        }
      }

      ;(fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] })
          })
        }
        
        if (url === '/api/ai/analyze') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                nodes: [{ id: 'node1', name: 'Node 1', type: 'concept', properties: {} }],
                edges: [],
                stats: { totalNodes: 1, totalEdges: 0, duplicateNodes: 0, redundantEdges: 0, conflicts: 0 }
              }
            })
          })
        }

        if (url === '/api/ai/save-graph') {
          // Simulate slow save to test loading states
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockSaveResponse)
              })
            }, 1000)
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      })

      render(<TextPage />)

      await waitFor(() => {
        expect(screen.getByText('知识图谱生成器')).toBeInTheDocument()
      })

      // Trigger analysis
      const textInput = screen.getByPlaceholderText('请输入您想要分析的文本内容...')
      fireEvent.change(textInput, { target: { value: 'Test content' } })

      const analyzeButton = screen.getByText('🤖 AI 分析')
      const analysisStartTime = Date.now()
      
      fireEvent.click(analyzeButton)

      // Loading state should appear immediately
      const loadingAppearTime = Date.now()
      expect(screen.getByText('🤖 分析中...')).toBeInTheDocument()
      
      // Loading should appear within 50ms
      expect(loadingAppearTime - analysisStartTime).toBeLessThan(50)

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      })

      // Test save loading state
      const saveButton = screen.getByText('💾 保存图谱')
      const saveStartTime = Date.now()
      
      fireEvent.click(saveButton)

      // Save loading should appear immediately
      const saveLoadingAppearTime = Date.now()
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()
      
      // Save loading should appear within 50ms
      expect(saveLoadingAppearTime - saveStartTime).toBeLessThan(50)

      // Wait for save completion
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })
    })

    it('should clear loading states promptly after completion', async () => {
      const mockSaveResponse = {
        success: true,
        data: {
          graphId: 'clear-loading-456',
          graphName: 'Clear Loading Test',
        }
      }

      ;(fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/projects') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] })
          })
        }
        
        if (url === '/api/ai/analyze') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                nodes: [{ id: 'node1', name: 'Node 1', type: 'concept', properties: {} }],
                edges: [],
                stats: { totalNodes: 1, totalEdges: 0, duplicateNodes: 0, redundantEdges: 0, conflicts: 0 }
              }
            })
          })
        }

        if (url === '/api/ai/save-graph') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSaveResponse)
          })
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      })

      render(<TextPage />)

      await waitFor(() => {
        expect(screen.getByText('知识图谱生成器')).toBeInTheDocument()
      })

      // Trigger analysis
      const textInput = screen.getByPlaceholderText('请输入您想要分析的文本内容...')
      fireEvent.change(textInput, { target: { value: 'Test content' } })

      const analyzeButton = screen.getByText('🤖 AI 分析')
      fireEvent.click(analyzeButton)

      // Wait for modal (analysis loading should clear)
      await waitFor(() => {
        expect(screen.getByText('🤖 AI 图谱预览')).toBeInTheDocument()
      })

      // Analysis loading should be cleared
      expect(screen.queryByText('🤖 分析中...')).not.toBeInTheDocument()

      // Test save loading clearing
      const saveButton = screen.getByText('💾 保存图谱')
      fireEvent.click(saveButton)

      // Verify save loading appears
      expect(screen.getByText('💾 保存中...')).toBeInTheDocument()

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('图谱保存成功！准备跳转...')).toBeInTheDocument()
      })

      // Save loading should be cleared promptly
      expect(screen.queryByText('💾 保存中...')).not.toBeInTheDocument()
    })
  })
})