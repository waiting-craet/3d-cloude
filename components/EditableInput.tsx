'use client'

interface EditableInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  multiline?: boolean
  rows?: number
  disabled?: boolean
  label: string
}

export function EditableInput({
  value,
  onChange,
  placeholder = '',
  maxLength,
  multiline = false,
  rows = 1,
  disabled = false,
  label,
}: EditableInputProps) {
  const Component = multiline ? 'textarea' : 'input'
  const showCharCount = maxLength !== undefined
  const isNearLimit = maxLength && value.length > maxLength * 0.9

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px',
      }}>
        {label}
        {showCharCount && (
          <span style={{
            float: 'right',
            fontSize: '12px',
            color: isNearLimit ? '#ef4444' : '#9ca3af',
          }}>
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <Component
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={multiline ? rows : undefined}
        style={{
          width: '100%',
          padding: '12px',
          border: disabled ? '2px solid #e5e7eb' : '2px solid #6BB6FF',
          borderRadius: '8px',
          fontSize: '14px',
          background: disabled ? '#f9fafb' : 'white',
          color: '#1f2937',
          minHeight: multiline ? '100px' : '44px',
          resize: multiline ? 'vertical' : 'none',
          outline: 'none',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
