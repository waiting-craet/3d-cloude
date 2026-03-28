/**
 * 文件移除功能验证测试
 * 
 * 验证需求：2.1, 2.2, 2.3, 2.4
 * 
 * 测试目标：
 * - 确认 handleRemoveFile 函数正确设置 uploadedFile 为 null
 * - 确认 handleRemoveFile 函数关闭预览窗口
 * - 验证文本输入框在文件移除后自动启用
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextPage from '../page'

describe('文件移除功能的状态恢复', () => {
  beforeEach(() => {
    // Mock fetch for projects and graphs
    global.fetch = jest.fn((url) => {
      if (url === '/api/projects') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ projects: [{ id: '1', name: 'Test Project' }] }),
        })
      }
      if (url.includes('/api/projects/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ graphs: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    }) as jest.Mock
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('需求 2.1: 点击移除文件按钮后 uploadedFile 状态被设置为 null', async () => {
    const { container } = render(<TextPage />)
    
    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('AI知识图谱生成器')).toBeInTheDocument()
    })

    // 创建一个测试文件
    const file = new File(['测试文件内容'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    
    // 上传文件
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    // 等待文件上传完成
    await waitFor(() => {
      expect(screen.getByText('文件已导入')).toBeInTheDocument()
    })

    // 验证文件已上传
    expect(screen.getByText('📄 test.txt')).toBeInTheDocument()

    // 点击移除按钮
    const removeButton = screen.getByText('🗑️ 移除')
    fireEvent.click(removeButton)

    // 验证文件信息卡片消失（uploadedFile 为 null）
    await waitFor(() => {
      expect(screen.queryByText('文件已导入')).not.toBeInTheDocument()
      expect(screen.queryByText('📄 test.txt')).not.toBeInTheDocument()
    })
  })

  test('需求 2.2 & 2.3: 移除文件后预览窗口被关闭', async () => {
    const { container } = render(<TextPage />)
    
    await waitFor(() => {
      expect(screen.getByText('AI知识图谱生成器')).toBeInTheDocument()
    })

    // 上传文件
    const file = new File(['测试文件内容\n第二行内容'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('文件已导入')).toBeInTheDocument()
    })

    // 展开预览
    const previewButton = screen.getByText('🔽 展开预览')
    fireEvent.click(previewButton)

    // 验证预览已展开
    await waitFor(() => {
      expect(screen.getByText('🔼 收起预览')).toBeInTheDocument()
    })

    // 点击移除按钮
    const removeButton = screen.getByText('🗑️ 移除')
    fireEvent.click(removeButton)

    // 验证预览窗口关闭（预览按钮消失）
    await waitFor(() => {
      expect(screen.queryByText('🔼 收起预览')).not.toBeInTheDocument()
      expect(screen.queryByText('🔽 展开预览')).not.toBeInTheDocument()
    })
  })

  test('需求 2.4: 文本输入框在文件移除后自动启用', async () => {
    const { container } = render(<TextPage />)
    
    await waitFor(() => {
      expect(screen.getByText('AI知识图谱生成器')).toBeInTheDocument()
    })

    // 获取文本输入框
    const textarea = screen.getByPlaceholderText(/输入文本内容/) as HTMLTextAreaElement

    // 验证初始状态：输入框启用
    expect(textarea).not.toBeDisabled()
    expect(textarea.placeholder).toBe('输入文本内容，AI 将自动提取实体和关系...')

    // 上传文件
    const file = new File(['测试文件内容'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('文件已导入')).toBeInTheDocument()
    })

    // 验证文件上传后：输入框禁用
    expect(textarea).toBeDisabled()
    expect(textarea.placeholder).toBe('已导入文件，如需输入文本请先移除文件')

    // 点击移除按钮
    const removeButton = screen.getByText('🗑️ 移除')
    fireEvent.click(removeButton)

    // 验证文件移除后：输入框重新启用
    await waitFor(() => {
      expect(textarea).not.toBeDisabled()
      expect(textarea.placeholder).toBe('输入文本内容，AI 将自动提取实体和关系...')
    })
  })

  test('完整流程：上传 -> 禁用 -> 移除 -> 启用 -> 可输入', async () => {
    const { container } = render(<TextPage />)
    
    await waitFor(() => {
      expect(screen.getByText('AI知识图谱生成器')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/输入文本内容/) as HTMLTextAreaElement

    // 步骤 1: 初始状态 - 输入框启用
    expect(textarea).not.toBeDisabled()

    // 步骤 2: 上传文件
    const file = new File(['测试文件内容'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('文件已导入')).toBeInTheDocument()
    })

    // 步骤 3: 验证输入框禁用
    expect(textarea).toBeDisabled()

    // 步骤 4: 移除文件
    const removeButton = screen.getByText('🗑️ 移除')
    fireEvent.click(removeButton)

    // 步骤 5: 验证输入框重新启用
    await waitFor(() => {
      expect(textarea).not.toBeDisabled()
    })

    // 步骤 6: 验证可以输入新内容
    fireEvent.change(textarea, { target: { value: '新的文本内容' } })
    expect(textarea.value).toBe('新的文本内容')
  })

  test('验证 handleRemoveFile 函数的两个关键操作', async () => {
    const { container } = render(<TextPage />)
    
    await waitFor(() => {
      expect(screen.getByText('AI知识图谱生成器')).toBeInTheDocument()
    })

    // 上传文件
    const file = new File(['测试内容'], 'test.txt', { type: 'text/plain' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('文件已导入')).toBeInTheDocument()
    })

    // 展开预览
    const previewButton = screen.getByText('🔽 展开预览')
    fireEvent.click(previewButton)
    
    await waitFor(() => {
      expect(screen.getByText('🔼 收起预览')).toBeInTheDocument()
    })

    // 移除文件
    const removeButton = screen.getByText('🗑️ 移除')
    fireEvent.click(removeButton)

    // 验证两个关键操作的结果：
    // 1. uploadedFile 设置为 null（文件信息消失）
    // 2. showPreview 设置为 false（预览按钮消失）
    await waitFor(() => {
      expect(screen.queryByText('文件已导入')).not.toBeInTheDocument()
      expect(screen.queryByText('🔼 收起预览')).not.toBeInTheDocument()
      expect(screen.queryByText('🔽 展开预览')).not.toBeInTheDocument()
    })
  })
})
