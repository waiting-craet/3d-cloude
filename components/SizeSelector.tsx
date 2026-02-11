'use client'

interface SizeSelectorProps {
  value: number           // 当前大小 (1-4)
  onChange: (size: number) => void
  disabled?: boolean
}

const SIZES = [
  { id: 1, label: '1x', description: '缩小' },
  { id: 2, label: '2x', description: '标准' },
  { id: 3, label: '3x', description: '变大' },
  { id: 4, label: '4x', description: '更大' },
]

export function SizeSelector({ value, onChange, disabled = false }: SizeSelectorProps) {
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
        节点大小
      </label>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
      }}>
        {SIZES.map((size) => (
          <button
            key={size.id}
            onClick={() => !disabled && onChange(size.id)}
            disabled={disabled}
            style={{
              padding: '12px 8px',
              border: value === size.id ? '3px solid #6BB6FF' : '2px solid #e5e7eb',
              borderRadius: '8px',
              background: value === size.id ? 'rgba(107, 182, 255, 0.1)' : 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseOver={(e) => {
              if (!disabled && value !== size.id) {
                e.currentTarget.style.borderColor = '#6BB6FF'
                e.currentTarget.style.background = 'rgba(107, 182, 255, 0.05)'
              }
            }}
            onMouseOut={(e) => {
              if (!disabled && value !== size.id) {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = 'white'
              }
            }}
          >
            <span style={{
              fontSize: '16px',
              fontWeight: value === size.id ? '700' : '600',
              color: value === size.id ? '#6BB6FF' : '#1f2937',
            }}>
              {size.label}
            </span>
            <span style={{
              fontSize: '11px',
              color: value === size.id ? '#6BB6FF' : '#9ca3af',
            }}>
              {size.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
