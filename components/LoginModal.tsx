'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/userStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useUserStore((state) => state.login);

  // 调试：打印 modal 状态
  console.log('LoginModal - isOpen:', isOpen);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // 登录成功
        login(data.user);
        setUsername('');
        setPassword('');
        onClose();
      } else {
        // 显示错误
        setError(data.error || '操作失败');
      }
    } catch (err) {
      console.error('请求失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标签页切换 */}
        <div style={{
          display: 'flex',
          marginBottom: '28px',
          borderBottom: '2px solid #f3f4f6',
        }}>
          <button
            style={{
              flex: 1,
              padding: '12px 0',
              textAlign: 'center',
              transition: 'all 0.2s',
              color: activeTab === 'login' ? '#111827' : '#9ca3af',
              borderBottom: activeTab === 'login' ? '2px solid #111827' : 'none',
              marginBottom: '-2px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
            }}
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
          >
            登录
          </button>
          <button
            style={{
              flex: 1,
              padding: '12px 0',
              textAlign: 'center',
              transition: 'all 0.2s',
              color: activeTab === 'register' ? '#111827' : '#9ca3af',
              borderBottom: activeTab === 'register' ? '2px solid #111827' : 'none',
              marginBottom: '-2px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
            }}
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#374151', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              placeholder="请输入用户名"
              disabled={loading}
              onFocus={(e) => e.currentTarget.style.borderColor = '#111827'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#374151', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              placeholder="请输入密码（至少6位）"
              disabled={loading}
              onFocus={(e) => e.currentTarget.style.borderColor = '#111827'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#e5e7eb' : '#111827',
              color: loading ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#1f2937';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#111827';
            }}
          >
            {loading ? '处理中...' : activeTab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.color = '#111827';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
