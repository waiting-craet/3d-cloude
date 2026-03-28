'use client';

import { FloatingCardsDecorator } from '@/components/decorative/FloatingCardsDecorator';

/**
 * 测试页面 - 用于调试浮动卡片动画
 * 访问 http://localhost:3001/test-floating-cards
 */
export default function TestFloatingCardsPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f0f0f0',
      position: 'relative'
    }}>
      <div style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ marginBottom: '20px' }}>浮动卡片动画测试</h1>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>检查步骤：</h2>
          <ol style={{ lineHeight: '1.8' }}>
            <li>打开浏览器开发者工具（F12）</li>
            <li>切换到 Console 标签页，查看日志输出</li>
            <li>找到 [FloatingCard] 和 [useFloatingAnimation] 的日志</li>
            <li>检查 animationDuration 的值（应该是 20-30 秒）</li>
            <li>切换到 Elements 标签页</li>
            <li>找到 div[data-testid="floating-card"] 元素</li>
            <li>在右侧 Styles 面板中查看 Computed 标签</li>
            <li>搜索 "animation-duration" 查看实际应用的值</li>
            <li>在 Styles 标签中查看 @keyframes 是否正确注入</li>
          </ol>
        </div>

        <div style={{
          background: '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffc107'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>预期行为：</h2>
          <ul style={{ lineHeight: '1.8' }}>
            <li>卡片应该缓慢上下浮动（20-30秒完成一次循环）</li>
            <li>卡片应该有轻微的旋转角度（-3到3度之间）</li>
            <li>卡片不应该快速旋转</li>
            <li>动画应该平滑流畅</li>
          </ul>
        </div>

        <div style={{
          background: '#d1ecf1',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #17a2b8'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>当前配置：</h2>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
{`speedRange: [20, 30] // 秒
amplitudeRange: [15, 25] // 像素
rotationRange: [-3, 3] // 度`}
          </pre>
        </div>
      </div>

      {/* 浮动卡片组件 */}
      <FloatingCardsDecorator />
    </div>
  );
}
