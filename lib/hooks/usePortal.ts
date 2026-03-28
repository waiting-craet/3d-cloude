import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * 创建一个 Portal 容器用于渲染模态框
 * 这确保模态框总是在 DOM 树的最顶层
 */
export function usePortal() {
  const portalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // 创建 portal 容器
    const portalElement = document.createElement('div')
    portalElement.id = 'modal-portal'
    portalElement.style.position = 'fixed'
    portalElement.style.top = '0'
    portalElement.style.left = '0'
    portalElement.style.width = '100%'
    portalElement.style.height = '100%'
    portalElement.style.pointerEvents = 'none'
    portalElement.style.zIndex = '999999'
    
    document.body.appendChild(portalElement)
    portalRef.current = portalElement

    return () => {
      if (portalElement.parentNode) {
        portalElement.parentNode.removeChild(portalElement)
      }
    }
  }, [])

  return portalRef.current
}
