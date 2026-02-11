'use client'

import { useState, useEffect } from 'react'

interface ColorPickerProps {
  value: string           // 当前颜色（十六进制）
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  // 将十六进制转换为HSL
  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    // 移除 # 号
    hex = hex.replace('#', '')
    
    // 转换为RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }
  
  // 将HSL转换为十六进制
  const hslToHex = (h: number, s: number, l: number): string => {
    h = h / 360
    s = s / 100
    l = l / 100
    
    let r, g, b
    
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }
  
  const [hsl, setHSL] = useState(hexToHSL(value))
  
  // 当value改变时更新HSL
  useEffect(() => {
    setHSL(hexToHSL(value))
  }, [value])
  
  const handleHSLChange = (type: 'h' | 's' | 'l', newValue: number) => {
    const newHSL = { ...hsl, [type]: newValue }
    setHSL(newHSL)
    onChange(hslToHex(newHSL.h, newHSL.s, newHSL.l))
  }
  
  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ marginBottom: '20px' }}
    >
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px',
      }}>
        节点颜色
      </label>
      
      {/* 颜色预览和原生选择器 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            background: value,
            border: '3px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        />
        <div style={{ flex: 1 }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              height: '80px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
        </div>
      </div>
      
      {/* 十六进制值显示 */}
      <div style={{
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '16px',
        fontFamily: 'monospace',
      }}>
        {value.toUpperCase()}
      </div>
      
      {/* HSL滑轮控制 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 色相 */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>色相 (H)</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>{hsl.h}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={hsl.h}
            onChange={(e) => handleHSLChange('h', parseInt(e.target.value))}
            disabled={disabled}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
        </div>
        
        {/* 饱和度 */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>饱和度 (S)</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>{hsl.s}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.s}
            onChange={(e) => handleHSLChange('s', parseInt(e.target.value))}
            disabled={disabled}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
        </div>
        
        {/* 亮度 */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>亮度 (L)</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>{hsl.l}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.l}
            onChange={(e) => handleHSLChange('l', parseInt(e.target.value))}
            disabled={disabled}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
        </div>
      </div>
    </div>
  )
}
