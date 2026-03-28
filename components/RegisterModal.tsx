'use client'

import { useState } from 'react'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterSuccess: () => void
  onSwitchToLogin: () => void
}

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess, onSwitchToLogin }: RegisterModalProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    // 验证密码长度
    if (password.length < 6) {
      setError('密码必须至少包含 6 个字符')
      return
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || '注册失败')
        return
      }

      setEmail('')
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setError('')
      
      onRegisterSuccess()
      onClose()
    } catch (err) {
      setError('网络连接失败，请检查您的网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(30, 30, 30, 0.98)',
          borderRadius: '16px',
          padding: '40px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          margin: '20px auto',
          position: 'relative',
        }}
      >
        <div className="register-modal-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
          }}>注册</h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}>创建新账户</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="请输入邮箱地址"
              required
              autoFocus
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="请输入用户名（2-30个字符）"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="至少 6 个字符"
                required
                className="form-input password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
            <p className="form-hint">至少 6 个字符</p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                placeholder="请再次输入密码"
                required
                className="form-input password-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="button-group">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-cancel"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-submit"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </div>

          <div className="login-link">
            <span>已有账号？</span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="link-button"
            >
              立即登录
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .register-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
          overflow-y: auto;
        }

        .register-modal-content {
          background: rgba(30, 30, 30, 0.98);
          border-radius: 16px;
          padding: 40px;
          width: 90%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideUp 0.3s ease-out;
          margin: auto;
          position: relative;
        }

        .register-modal-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .register-modal-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .register-modal-header p {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .register-form {
          display: flex;
          flex-direction: column;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: rgba(74, 158, 255, 0.5);
          background: rgba(255, 255, 255, 0.12);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input {
          padding-right: 60px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .form-hint {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .error-message {
          margin-bottom: 20px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 14px;
          text-align: center;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .btn {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
        }

        .btn-submit {
          background: linear-gradient(135deg, #4A9EFF 0%, #3A8EEF 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
        }

        .btn-submit:disabled {
          background: rgba(74, 158, 255, 0.5);
        }

        .login-link {
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .login-link span {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .link-button {
          background: transparent;
          border: none;
          color: #4A9EFF;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-left: 8px;
          padding: 0;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .link-button:hover {
          color: #3A8EEF;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
