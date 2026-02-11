'use client'

interface GlowToggleProps {
  value: boolean
  onChange: (isGlowing: boolean) => void
  disabled?: boolean
}

export function GlowToggle({ value, onChange, disabled = false }: GlowToggleProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '12px',
      }}>
        节点发光
      </label>
      
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: value 
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)'
            : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseOver={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#fbbf24'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.3)'
          }
        }}
        onMouseOut={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: value ? '#f59e0b' : '#6b7280',
          }}>
            {value ? '发光中' : '关闭'}
          </span>
        </div>

        {/* 切换开关 */}
        <div style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: value ? '#fbbf24' : '#d1d5db',
          position: 'relative',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '10px',
            background: 'white',
            position: 'absolute',
            left: value ? '22px' : '2px',
            transition: 'all 0.3s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }} />
        </div>
      </button>

      {value && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(251, 191, 36, 0.1)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>💡</span>
          <span>节点将发出明亮的光芒</span>
        </div>
      )}
    </div>
  )
}
