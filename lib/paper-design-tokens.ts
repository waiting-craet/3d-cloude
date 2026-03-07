/**
 * Paper Design Tokens for Homepage Exact Replica
 * 
 * This file contains the design system tokens for the paper-white aesthetic:
 * - Warm paper-white background (#FAFAF8)
 * - Sky-blue/jade-green accent (#6b8e85)
 * - Muted, low-saturation colors
 * - Eastern-inspired minimalism
 */

export const paperTokens = {
  colors: {
    // Primary colors
    paperWhite: '#FAFAF8',      // Warm paper-white background (resembles rice paper)
    skyBlue: '#6b8e85',          // Sky-blue/jade-green accent (Eastern-inspired)
    skyBlueLight: '#8ba9a0',     // Lighter variant for hover states
    skyBlueDark: '#567169',      // Darker variant for active states
    
    // Neutral colors
    white: '#FFFFFF',            // Pure white for cards
    textPrimary: '#333333',      // Primary text color
    textSecondary: '#666666',    // Secondary text color
    textTertiary: '#999999',     // Tertiary text/metadata color
    border: '#E8E8E6',           // Subtle warm gray border
    borderLight: '#F0F0EE',      // Lighter border variant
    cardBg: '#FFFFFF',           // Card background
    
    // Icon colors
    iconPlaceholder: '#CCCCCC',  // Icon placeholder color
    iconLight: '#E0E0E0',        // Light icon color
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '42px',
      '4xl': '48px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
    '5xl': '60px',
    '6xl': '80px',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 4px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.10)',
  },
  
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
} as const

export type PaperTokens = typeof paperTokens
