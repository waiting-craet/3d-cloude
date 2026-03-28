/**
 * Bug Condition Exploration Test for Import Page Direct Navigation
 * 
 * **Validates: Requirements 1.1, 1.2**
 * 
 * This test demonstrates the bug where handleUpload uses setTimeout for delayed navigation
 * when import succeeds, causing a flickering intermediate success page.
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or code when it fails.
 * 
 * The test encodes the expected behavior: immediate navigation without intermediate page.
 * When this test passes after implementation, it validates the fix.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ImportPage from '../page'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('Import Page Bug Condition Exploration', () => {
  beforeEach(() => {
    mockPush.mockClear()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  /**
   * Property 1: Fault Condition - Import Success Immediate Navigation
   * 
   * This test demonstrates the setTimeout bug by simulating a successful import
   * and verifying that navigation happens immediately vs after a 2-second delay.
   * 
   * **Validates: Requirements 2.1, 2.2**
   * 
   * This test will FAIL on unfixed code because:
   * - Current code uses setTimeout(() => router.push(...), 2000)
   * - Expected behavior is immediate router.push(...) without setTimeout
   */
  test('Property 1: Import success should trigger immediate navigation without setTimeout delay', async () => {
    // Mock all required API calls
    ;(global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url === '/api/projects' && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 'project1', name: 'Test Project' }] })
        })
      }
      if (url === '/api/projects/project1/graphs') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ graphs: [{ id: 'graph1', name: 'Test Graph' }] })
        })
      }
      if (url === '/api/import' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: '导入成功！',
            warnings: [],
            skippedEdges: 0
          })
        })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    })

    render(<ImportPage />)

    // Wait for initial load and setup
    await waitFor(() => {
      expect(screen.getByDisplayValue('项目选择')).toBeInTheDocument()
    })

    // Select project
    const projectSelect = screen.getByDisplayValue('项目选择')
    await act(async () => {
      fireEvent.change(projectSelect, { target: { value: 'project1' } })
    })

    // Wait for graphs to load
    await waitFor(() => {
      const graphSelect = screen.getByDisplayValue('请选择图谱')
      expect(graphSelect).toBeInTheDocument()
    })

    // Wait a bit more for the graph select to be enabled
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    const graphSelect = screen.getByDisplayValue('请选择图谱')
    await act(async () => {
      fireEvent.change(graphSelect, { target: { value: 'graph1' } })
    })

    // Add file
    const testFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      })
      fireEvent.change(fileInput)
    })

    // Use fake timers to control setTimeout
    jest.useFakeTimers()

    // Trigger import process
    const generateButton = screen.getByRole('button', { name: /生成图谱/ })
    
    // Wait for button to be enabled
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled()
    }, { timeout: 5000 })

    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Handle confirmation modal
    await waitFor(() => {
      expect(screen.getByText('确认生成图谱')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: /确认生成/ })
    await act(async () => {
      fireEvent.click(confirmButton)
    })

    // Wait for import API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/import', expect.any(Object))
    })

    // CRITICAL TEST: Check for immediate navigation
    // This will FAIL on unfixed code due to setTimeout delay
    
    // Advance time slightly - immediate navigation should happen
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Expected: router.push called immediately
    expect(mockPush).toHaveBeenCalledWith('/graph?projectId=project1&graphId=graph1')
    expect(mockPush).toHaveBeenCalledTimes(1)

    // Verify no duplicate calls after delay
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(mockPush).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  /**
   * Direct Navigation Test - Validates the fix is working
   * 
   * This test directly validates that router.push is called immediately
   * after a successful import response, confirming the setTimeout bug is fixed.
   */
  test('Direct test: Navigation happens immediately after successful import', async () => {
    // Mock successful responses
    ;(global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url === '/api/projects' && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects: [{ id: 'project1', name: 'Test Project' }] })
        })
      }
      if (url === '/api/projects/project1/graphs') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ graphs: [{ id: 'graph1', name: 'Test Graph' }] })
        })
      }
      if (url === '/api/import' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: '导入成功！',
            warnings: [],
            skippedEdges: 0
          })
        })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    })

    render(<ImportPage />)

    // Use fake timers to control timing
    jest.useFakeTimers()

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('导入数据')).toBeInTheDocument()
    })

    // Simulate the import process by directly triggering the handleUpload function
    // We'll do this by setting up the component state and then triggering the import
    
    // First, let's set up the basic state by interacting with the UI minimally
    const projectSelect = screen.getByDisplayValue('项目选择')
    fireEvent.change(projectSelect, { target: { value: 'project1' } })

    // Wait for the graphs API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/project1/graphs')
    })

    // Now find the graph select and set it
    await waitFor(() => {
      const graphSelects = screen.getAllByDisplayValue('请选择图谱')
      expect(graphSelects.length).toBeGreaterThan(0)
    })

    const graphSelect = screen.getAllByDisplayValue('请选择图谱')[0]
    fireEvent.change(graphSelect, { target: { value: 'graph1' } })

    // Add a file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const testFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      })
      fireEvent.change(fileInput)
    }

    // Wait for the generate button to be enabled
    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /生成图谱/ })
      expect(generateButton).not.toBeDisabled()
    }, { timeout: 5000 })

    // Click generate
    const generateButton = screen.getByRole('button', { name: /生成图谱/ })
    fireEvent.click(generateButton)

    // Handle confirmation modal
    await waitFor(() => {
      expect(screen.getByText('确认生成图谱')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: /确认生成/ })
    fireEvent.click(confirmButton)

    // Wait for the import API call to be made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/import', expect.any(Object))
    })

    // CRITICAL TEST: Navigation should happen immediately
    // Advance time by a small amount - navigation should already have happened
    act(() => {
      jest.advanceTimersByTime(10)
    })

    // Verify router.push was called immediately
    expect(mockPush).toHaveBeenCalledWith('/graph?projectId=project1&graphId=graph1')
    expect(mockPush).toHaveBeenCalledTimes(1)

    // Verify no additional calls after the old 2-second delay
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(mockPush).toHaveBeenCalledTimes(1) // Still only called once

    jest.useRealTimers()
  })
})