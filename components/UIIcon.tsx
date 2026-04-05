import React from 'react'

type IconName =
  | 'folder'
  | 'folderOpen'
  | 'chart'
  | 'map'
  | 'search'
  | 'user'
  | 'book'
  | 'settings'
  | 'logout'
  | 'bell'
  | 'thumbUp'
  | 'comment'
  | 'help'
  | 'rocket'
  | 'message'
  | 'target'
  | 'star'
  | 'pin'
  | 'link'
  | 'eye'
  | 'palette'
  | 'edit'
  | 'trash'
  | 'moon'
  | 'sun'
  | 'hourglass'
  | 'spinner'
  | 'error'
  | 'empty'
  | 'camera'
  | 'video'
  | 'tree'
  | 'globe'
  | 'timer'
  | 'mouse'
  | 'hand'
  | 'click'
  | 'spark'
  | 'arrowRight'

interface UIIconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
  title?: string
}

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export default function UIIcon({
  name,
  size = 18,
  color = 'currentColor',
  className,
  title,
}: UIIconProps) {
  const props = {
    width: size,
    height: size,
    className,
    role: title ? 'img' : 'presentation',
    'aria-label': title,
    'aria-hidden': title ? undefined : true,
  }

  switch (name) {
    case 'folder':
      return (
        <svg {...props} {...baseProps}>
          <path d="M3 7C3 5.9 3.9 5 5 5H9L11 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z" stroke={color} />
        </svg>
      )
    case 'folderOpen':
      return (
        <svg {...props} {...baseProps}>
          <path d="M3 8C3 6.9 3.9 6 5 6H9L11 8H20L18 18H5C3.9 18 3 17.1 3 16V8Z" stroke={color} />
        </svg>
      )
    case 'chart':
      return (
        <svg {...props} {...baseProps}>
          <path d="M4 20H20" stroke={color} />
          <rect x="6" y="11" width="3" height="7" rx="1" fill={color} stroke="none" />
          <rect x="11" y="8" width="3" height="10" rx="1" fill={color} opacity="0.82" stroke="none" />
          <rect x="16" y="5" width="3" height="13" rx="1" fill={color} opacity="0.65" stroke="none" />
        </svg>
      )
    case 'map':
      return (
        <svg {...props} {...baseProps}>
          <path d="M3 6L8 4L16 6L21 4V18L16 20L8 18L3 20V6Z" stroke={color} />
          <path d="M8 4V18M16 6V20" stroke={color} strokeWidth="1.4" />
        </svg>
      )
    case 'search':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="11" cy="11" r="7" stroke={color} />
          <path d="M20 20L16.5 16.5" stroke={color} />
        </svg>
      )
    case 'user':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="8" r="3.2" stroke={color} />
          <path d="M5 19C6.8 16.6 9.1 15.5 12 15.5C14.9 15.5 17.2 16.6 19 19" stroke={color} />
        </svg>
      )
    case 'book':
      return (
        <svg {...props} {...baseProps}>
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11V20H5.5C4.7 20 4 19.3 4 18.5V5.5Z" stroke={color} />
          <path d="M20 5.5C20 4.7 19.3 4 18.5 4H13V20H18.5C19.3 20 20 19.3 20 18.5V5.5Z" stroke={color} />
        </svg>
      )
    case 'settings':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="3" stroke={color} />
          <path d="M19.4 15A1.6 1.6 0 0 0 20 13.8V10.2A1.6 1.6 0 0 0 19.4 9L17.8 7.8L17.3 5.9A1.6 1.6 0 0 0 15.8 4.8H8.2A1.6 1.6 0 0 0 6.7 5.9L6.2 7.8L4.6 9A1.6 1.6 0 0 0 4 10.2V13.8A1.6 1.6 0 0 0 4.6 15L6.2 16.2L6.7 18.1A1.6 1.6 0 0 0 8.2 19.2H15.8A1.6 1.6 0 0 0 17.3 18.1L17.8 16.2L19.4 15Z" stroke={color} />
        </svg>
      )
    case 'logout':
      return (
        <svg {...props} {...baseProps}>
          <path d="M10 4H6.5C5.7 4 5 4.7 5 5.5V18.5C5 19.3 5.7 20 6.5 20H10" stroke={color} />
          <path d="M13 8L18 12L13 16" stroke={color} />
          <path d="M8 12H18" stroke={color} />
        </svg>
      )
    case 'bell':
      return (
        <svg {...props} {...baseProps}>
          <path d="M18 10A6 6 0 1 0 6 10C6 12.8 5 14.5 4 16H20C19 14.5 18 12.8 18 10Z" stroke={color} />
          <path d="M10 19C10.4 19.6 11.1 20 12 20C12.9 20 13.6 19.6 14 19" stroke={color} />
        </svg>
      )
    case 'thumbUp':
      return (
        <svg {...props} {...baseProps}>
          <path d="M10 11V5.5C10 4.7 10.7 4 11.5 4L12 4.5C12.6 5.1 13 5.9 13 6.8V8H17.2C18.2 8 19 8.9 18.8 9.8L17.8 15.8C17.6 16.5 17 17 16.3 17H10" stroke={color} />
          <path d="M6 10H9V17H6C5.4 17 5 16.6 5 16V11C5 10.4 5.4 10 6 10Z" stroke={color} />
        </svg>
      )
    case 'comment':
      return (
        <svg {...props} {...baseProps}>
          <path d="M5 6.5C5 5.7 5.7 5 6.5 5H17.5C18.3 5 19 5.7 19 6.5V14.5C19 15.3 18.3 16 17.5 16H10L6 19V16H6.5C5.7 16 5 15.3 5 14.5V6.5Z" stroke={color} />
        </svg>
      )
    case 'help':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="9" stroke={color} />
          <path d="M9.5 9.5A2.5 2.5 0 1 1 14 11C13 11.7 12 12.2 12 13.5" stroke={color} />
          <circle cx="12" cy="17" r="0.8" fill={color} stroke="none" />
        </svg>
      )
    case 'rocket':
      return (
        <svg {...props} {...baseProps}>
          <path d="M14 4C17 4.2 19.8 7 20 10L14.5 15.5L8.5 9.5L14 4Z" stroke={color} />
          <path d="M8.5 9.5L6 12L9 12L9 15L11.5 12.5" stroke={color} />
          <circle cx="15.5" cy="8.5" r="1.2" stroke={color} />
        </svg>
      )
    case 'message':
      return (
        <svg {...props} {...baseProps}>
          <path d="M4 6.5C4 5.7 4.7 5 5.5 5H18.5C19.3 5 20 5.7 20 6.5V14.5C20 15.3 19.3 16 18.5 16H9L4 19V6.5Z" stroke={color} />
        </svg>
      )
    case 'target':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="8" stroke={color} />
          <circle cx="12" cy="12" r="4.5" stroke={color} />
          <circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
        </svg>
      )
    case 'star':
      return (
        <svg {...props} {...baseProps}>
          <path d="M12 4L14.3 8.7L19.4 9.4L15.7 13L16.6 18L12 15.6L7.4 18L8.3 13L4.6 9.4L9.7 8.7L12 4Z" stroke={color} />
        </svg>
      )
    case 'pin':
      return (
        <svg {...props} {...baseProps}>
          <path d="M12 20C12 20 6 14.4 6 10.5A6 6 0 1 1 18 10.5C18 14.4 12 20 12 20Z" stroke={color} />
          <circle cx="12" cy="10" r="2.2" stroke={color} />
        </svg>
      )
    case 'link':
      return (
        <svg {...props} {...baseProps}>
          <path d="M10.5 13.5L13.5 10.5" stroke={color} />
          <path d="M8.5 15.5L6.8 17.2A3 3 0 1 1 2.6 13L4.3 11.3" stroke={color} />
          <path d="M15.5 8.5L17.2 6.8A3 3 0 1 0 13 2.6L11.3 4.3" stroke={color} />
        </svg>
      )
    case 'eye':
      return (
        <svg {...props} {...baseProps}>
          <path d="M2.5 12C4.3 8.8 7.7 7 12 7C16.3 7 19.7 8.8 21.5 12C19.7 15.2 16.3 17 12 17C7.7 17 4.3 15.2 2.5 12Z" stroke={color} />
          <circle cx="12" cy="12" r="2.3" stroke={color} />
        </svg>
      )
    case 'palette':
      return (
        <svg {...props} {...baseProps}>
          <path d="M12 4C7.6 4 4 7.4 4 11.5C4 14.8 6.3 17 9 17H10C10.8 17 11.5 17.7 11.5 18.5C11.5 19.3 12.2 20 13 20C17.4 20 20 16.5 20 12.5C20 7.8 16.4 4 12 4Z" stroke={color} />
          <circle cx="8" cy="10" r="0.8" fill={color} stroke="none" />
          <circle cx="11" cy="8.5" r="0.8" fill={color} stroke="none" />
          <circle cx="14.2" cy="9.2" r="0.8" fill={color} stroke="none" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...props} {...baseProps}>
          <path d="M4 20H8L18.5 9.5C19.1 8.9 19.1 8 18.5 7.4L16.6 5.5C16 4.9 15.1 4.9 14.5 5.5L4 16V20Z" stroke={color} />
          <path d="M13.5 6.5L17.5 10.5" stroke={color} />
        </svg>
      )
    case 'trash':
      return (
        <svg {...props} {...baseProps}>
          <path d="M4 7H20" stroke={color} />
          <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7" stroke={color} />
          <path d="M6 7L7 19C7.1 19.6 7.6 20 8.2 20H15.8C16.4 20 16.9 19.6 17 19L18 7" stroke={color} />
          <path d="M10 11V17M14 11V17" stroke={color} />
        </svg>
      )
    case 'moon':
      return (
        <svg {...props} {...baseProps}>
          <path d="M15.2 4.5A7.5 7.5 0 1 0 19.5 14.8A6.5 6.5 0 0 1 15.2 4.5Z" stroke={color} />
        </svg>
      )
    case 'sun':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="4" stroke={color} />
          <path d="M12 2.5V5M12 19V21.5M21.5 12H19M5 12H2.5M18.7 5.3L17 7M7 17L5.3 18.7M18.7 18.7L17 17M7 7L5.3 5.3" stroke={color} />
        </svg>
      )
    case 'hourglass':
      return (
        <svg {...props} {...baseProps}>
          <path d="M7 4H17M7 20H17" stroke={color} />
          <path d="M8 4C8 7 10 8.5 12 10C14 8.5 16 7 16 4" stroke={color} />
          <path d="M8 20C8 17 10 15.5 12 14C14 15.5 16 17 16 20" stroke={color} />
        </svg>
      )
    case 'spinner':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="8" stroke={color} opacity="0.25" />
          <path d="M20 12A8 8 0 0 0 12 4" stroke={color} />
        </svg>
      )
    case 'error':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="9" stroke={color} />
          <path d="M9 9L15 15M15 9L9 15" stroke={color} />
        </svg>
      )
    case 'empty':
      return (
        <svg {...props} {...baseProps}>
          <rect x="4" y="7" width="16" height="10" rx="2" stroke={color} />
          <path d="M8 11H16" stroke={color} />
        </svg>
      )
    case 'camera':
      return (
        <svg {...props} {...baseProps}>
          <rect x="3.5" y="7" width="17" height="12" rx="2" stroke={color} />
          <path d="M8 7L9.2 5H14.8L16 7" stroke={color} />
          <circle cx="12" cy="13" r="3" stroke={color} />
        </svg>
      )
    case 'video':
      return (
        <svg {...props} {...baseProps}>
          <rect x="3.5" y="7" width="11.5" height="10" rx="2" stroke={color} />
          <path d="M15 11L20.5 8V16L15 13V11Z" stroke={color} />
        </svg>
      )
    case 'tree':
      return (
        <svg {...props} {...baseProps}>
          <path d="M12 4L16.5 10H13.8L17 14H13.2V20H10.8V14H7L10.2 10H7.5L12 4Z" stroke={color} />
        </svg>
      )
    case 'globe':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="12" r="9" stroke={color} />
          <path d="M3.5 12H20.5M12 3.5C14.5 6 14.5 18 12 20.5M12 3.5C9.5 6 9.5 18 12 20.5" stroke={color} />
        </svg>
      )
    case 'timer':
      return (
        <svg {...props} {...baseProps}>
          <circle cx="12" cy="13" r="7" stroke={color} />
          <path d="M12 13L15.5 10.5M9.5 3.5H14.5" stroke={color} />
        </svg>
      )
    case 'mouse':
      return (
        <svg {...props} {...baseProps}>
          <rect x="8" y="3.5" width="8" height="17" rx="4" stroke={color} />
          <path d="M12 3.5V8.5" stroke={color} />
        </svg>
      )
    case 'hand':
      return (
        <svg {...props} {...baseProps}>
          <path d="M8.5 12V7.5C8.5 6.7 9.2 6 10 6C10.8 6 11.5 6.7 11.5 7.5V11M11.5 11V6.5C11.5 5.7 12.2 5 13 5C13.8 5 14.5 5.7 14.5 6.5V11M14.5 11V7.5C14.5 6.7 15.2 6 16 6C16.8 6 17.5 6.7 17.5 7.5V13.5C17.5 16.5 15.2 19 12.2 19H11.5C9.6 19 8 17.4 8 15.5V12.8C8 12.4 8.2 12.1 8.5 12Z" stroke={color} />
        </svg>
      )
    case 'click':
      return (
        <svg {...props} {...baseProps}>
          <path d="M12 4V8M6 6L8.5 8.5M18 6L15.5 8.5M4 12H8M16 12H20" stroke={color} />
          <circle cx="12" cy="13.5" r="4.5" stroke={color} />
        </svg>
      )
    case 'spark':
      return (
        <svg {...props} {...baseProps}>
          <path d="M12 4L13.6 8.4L18 10L13.6 11.6L12 16L10.4 11.6L6 10L10.4 8.4L12 4Z" stroke={color} />
        </svg>
      )
    case 'arrowRight':
      return (
        <svg {...props} {...baseProps}>
          <path d="M6 12H18M13 7L18 12L13 17" stroke={color} />
        </svg>
      )
    default:
      return null
  }
}
