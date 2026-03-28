'use client'

import BannerImageUpload from '@/components/BannerImageUpload'

export default function BannerAdminPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              margin: '0 0 12px 0',
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a',
            }}
          >
            横幅图片管理
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              color: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            在这里上传或更新首页顶部的横幅图片
          </p>
        </div>

        <BannerImageUpload />

        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            background: 'rgba(102, 126, 234, 0.05)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '12px',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a1a1a',
            }}
          >
            📋 使用说明
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              color: 'rgba(0, 0, 0, 0.7)',
              fontSize: '14px',
              lineHeight: '1.8',
            }}
          >
            <li>支持 PNG、JPG、WebP 等常见图片格式</li>
            <li>推荐尺寸: 1920 x 320 像素</li>
            <li>文件大小不能超过 5MB</li>
            <li>上传后页面会自动刷新显示新图片</li>
            <li>如需更换图片，直接上传新文件即可覆盖</li>
          </ul>
        </div>

        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a1a1a',
            }}
          >
            💡 提示
          </h3>
          <p
            style={{
              margin: 0,
              color: 'rgba(0, 0, 0, 0.7)',
              fontSize: '14px',
              lineHeight: '1.8',
            }}
          >
            上传的图片会显示在首页顶部，图片上方会有一个半透明的紫色渐变遮罩，确保文字清晰可读。
          </p>
        </div>
      </div>
    </div>
  )
}
