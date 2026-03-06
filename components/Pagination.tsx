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
          background: currentPage === 1 ? '#f5f5f5' : 'white',
          color: currentPage === 1 ? '#ccc' : '#666',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.borderColor = '#00bfa5'
            e.currentTarget.style.color = '#00bfa5'
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.borderColor = '#ddd'
            e.currentTarget.style.color = '#666'
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
                color: '#999',
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
              background: isActive ? '#00bfa5' : 'white',
              color: isActive ? 'white' : '#666',
              border: `1px solid ${isActive ? '#00bfa5' : '#ddd'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#00bfa5'
                e.currentTarget.style.color = '#00bfa5'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.color = '#666'
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
          background: currentPage === totalPages ? '#f5f5f5' : 'white',
          color: currentPage === totalPages ? '#ccc' : '#666',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.borderColor = '#00bfa5'
            e.currentTarget.style.color = '#00bfa5'
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.borderColor = '#ddd'
            e.currentTarget.style.color = '#666'
          }
        }}
      >
        下一页
      </button>
    </div>
  )
}
