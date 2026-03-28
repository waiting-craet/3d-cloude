'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5 // 显示的页码数量

    if (totalPages <= showPages) {
      // 如果总页数小于等于显示数量，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 总是显示第一页
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // 总是显示最后一页
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginTop: '40px',
      padding: '20px 0'
    }}>
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '8px 16px',
          background: currentPage === 1 ? 'rgba(107, 142, 133, 0.1)' : 'rgba(255, 255, 255, 0.9)',
          color: currentPage === 1 ? '#b0b0b0' : '#6b8e85',
          border: '1px solid rgba(107, 142, 133, 0.2)',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: currentPage === 1 ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.background = '#6b8e85'
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 142, 133, 0.2)'
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
            e.currentTarget.style.color = '#6b8e85'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        上一页
      </button>

      {/* 页码按钮 */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: '8px 12px',
                color: '#a0a0a0',
                fontSize: '14px'
              }}
            >
              ...
            </span>
          )
        }

        const pageNum = page as number
        const isActive = pageNum === currentPage

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            style={{
              padding: '8px 12px',
              minWidth: '40px',
              background: isActive ? '#6b8e85' : 'rgba(255, 255, 255, 0.9)',
              color: isActive ? 'white' : '#6b8e85',
              border: `1px solid ${isActive ? '#6b8e85' : 'rgba(107, 142, 133, 0.2)'}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? '0 4px 8px rgba(107, 142, 133, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(107, 142, 133, 0.15)'
                e.currentTarget.style.borderColor = '#6b8e85'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 142, 133, 0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                e.currentTarget.style.borderColor = 'rgba(107, 142, 133, 0.2)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            {pageNum}
          </button>
        )
      })}

      {/* 下一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px',
          background: currentPage === totalPages ? 'rgba(107, 142, 133, 0.1)' : 'rgba(255, 255, 255, 0.9)',
          color: currentPage === totalPages ? '#b0b0b0' : '#6b8e85',
          border: '1px solid rgba(107, 142, 133, 0.2)',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: currentPage === totalPages ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.background = '#6b8e85'
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(107, 142, 133, 0.2)'
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
            e.currentTarget.style.color = '#6b8e85'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        下一页
      </button>
    </div>
  )
}
