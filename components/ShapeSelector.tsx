'use client'

interface ShapeSelectorProps {
  value: string           // 当前形状
  onChange: (shape: string) => void
  disabled?: boolean
}

const SHAPES = [
  { id: 'box', name: '正方体', icon: '⬛' },
  { id: 'rect', name: '长方体', icon: '▬' },
  { id: 'cylinder', name: '圆柱', icon: '⬤' },
  { id: 'cone', name: '圆锥', icon: '▲' },
  { id: 'sphere', name: '球', icon: '●' },
  { id: 'prism', name: '棱柱', icon: '◆' },
  { id: 'pyramid', name: '棱锥', icon: '▴' },
  { id: 'frustum', name: '圆台', icon: '⬟' },
  { id: 'torus', name: '圆环', icon: '◯' },
  { id: 'arrow', name: '箭头', icon: '➤' },
]

export function ShapeSelector({ value, onChange, disabled = false }: ShapeSelectorProps) {
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
        节点形状
      </label>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
      }}>
        {SHAPES.map((shape) => (
          <button
            key={shape.id}
            onClick={() => !disabled && onChange(shape.id)}
            disabled={disabled}
            style={{
              padding: '16px',
              border: value === shape.id ? '3px solid #6BB6FF' : '2px solid #e5e7eb',
              borderRadius: '12px',
              background: value === shape.id ? 'rgba(107, 182, 255, 0.1)' : 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              if (!disabled && value !== shape.id) {
                e.currentTarget.style.borderColor = '#6BB6FF'
                e.currentTarget.style.background = 'rgba(107, 182, 255, 0.05)'
              }
            }}
            onMouseOut={(e) => {
              if (!disabled && value !== shape.id) {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = 'white'
              }
            }}
          >
            <span style={{ fontSize: '32px' }}>{shape.icon}</span>
            <span style={{
              fontSize: '13px',
              fontWeight: value === shape.id ? '600' : '500',
              color: value === shape.id ? '#6BB6FF' : '#6b7280',
            }}>
              {shape.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
