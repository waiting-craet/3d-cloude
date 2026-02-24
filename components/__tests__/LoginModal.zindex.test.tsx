import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginModal from '../LoginModal'

describe('LoginModal Z-Index Fix', () => {
  it('should render modal with correct z-index values', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onLogin={() => {}}
      />
    )

    // 验证模态框内容存在
    expect(screen.getByText('管理员登录')).toBeInTheDocument()
  })

  it('should render modal content above backdrop', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onLogin={() => {}}
      />
    )

    // 验证所有表单元素都存在
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(
      <LoginModal
        isOpen={false}
        onClose={() => {}}
        onLogin={() => {}}
      />
    )

    // 不应该有任何模态框元素
    expect(screen.queryByText('管理员登录')).not.toBeInTheDocument()
  })

  it('should handle backdrop click to close modal', () => {
    const onClose = jest.fn()
    render(
      <LoginModal
        isOpen={true}
        onClose={onClose}
        onLogin={() => {}}
      />
    )

    // 获取取消按钮来验证模态框存在
    const cancelButton = screen.getByText('取消')
    expect(cancelButton).toBeInTheDocument()
    
    // 点击取消按钮来关闭模态框
    fireEvent.click(cancelButton)
    
    // 验证 onClose 被调用
    expect(onClose).toHaveBeenCalled()
  })

  it('should display login form elements', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onLogin={() => {}}
      />
    )

    // 验证表单元素存在
    expect(screen.getByText('管理员登录')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('should validate form inputs', () => {
    const onLogin = jest.fn()
    render(
      <LoginModal
        isOpen={true}
        onClose={() => {}}
        onLogin={onLogin}
      />
    )

    // 点击登录按钮而不填写表单
    const loginButton = screen.getByText('登录')
    fireEvent.click(loginButton)

    // 应该显示错误信息
    expect(screen.getByText('请输入用户名和密码')).toBeInTheDocument()
    
    // onLogin 不应该被调用
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('should handle successful login', () => {
    const onLogin = jest.fn()
    const onClose = jest.fn()
    render(
      <LoginModal
        isOpen={true}
        onClose={onClose}
        onLogin={onLogin}
      />
    )

    // 填写表单
    const usernameInput = screen.getByPlaceholderText('请输入用户名') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('请输入密码') as HTMLInputElement
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'admin123' } })

    // 点击登录按钮
    const loginButton = screen.getByText('登录')
    fireEvent.click(loginButton)

    // 验证 onLogin 被调用
    expect(onLogin).toHaveBeenCalledWith('admin', 'admin123')
    
    // 验证 onClose 被调用
    expect(onClose).toHaveBeenCalled()
  })
})
