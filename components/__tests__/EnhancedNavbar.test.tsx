import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import EnhancedNavbar from '../EnhancedNavbar'
import { useUserStore } from '@/lib/userStore'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock user store
jest.mock('@/lib/userStore', () => ({
  useUserStore: jest.fn(),
}))

const mockPush = jest.fn()
const mockUserStore = {
  user: null,
  isLoggedIn: false,
  logout: jest.fn(),
  initializeFromStorage: jest.fn(),
}

beforeEach(() => {
  ;(useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  })
  ;(useUserStore as jest.Mock).mockReturnValue(mockUserStore)
  jest.clearAllMocks()
})

describe('EnhancedNavbar', () => {
  it('renders logo and brand name', () => {
    render(<EnhancedNavbar />)
    
    expect(screen.getByText('知识图谱')).toBeInTheDocument()
    expect(screen.getByText('📊')).toBeInTheDocument()
  })

  it('renders search bar with placeholder', () => {
    render(<EnhancedNavbar />)
    
    expect(screen.getByPlaceholderText('搜索知识图谱')).toBeInTheDocument()
  })

  it('shows login button when user is not logged in', () => {
    render(<EnhancedNavbar />)
    
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('shows user menu when user is logged in', () => {
    const loggedInUserStore = {
      ...mockUserStore,
      user: { id: '1', username: 'testuser' },
      isLoggedIn: true,
    }
    ;(useUserStore as jest.Mock).mockReturnValue(loggedInUserStore)

    render(<EnhancedNavbar />)
    
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.queryByText('登录')).not.toBeInTheDocument()
  })

  it('shows disabled create button when not logged in', () => {
    render(<EnhancedNavbar />)
    
    const createButton = screen.getByText('开始创作')
    expect(createButton).toBeDisabled()
  })

  it('shows enabled create button when logged in', () => {
    const loggedInUserStore = {
      ...mockUserStore,
      user: { id: '1', username: 'testuser' },
      isLoggedIn: true,
    }
    ;(useUserStore as jest.Mock).mockReturnValue(loggedInUserStore)

    render(<EnhancedNavbar />)
    
    const createButton = screen.getByText('开始创作')
    expect(createButton).not.toBeDisabled()
  })

  it('calls search change handler when typing in search input', () => {
    const mockOnSearchChange = jest.fn()
    render(<EnhancedNavbar onSearchChange={mockOnSearchChange} />)
    
    const searchInput = screen.getByPlaceholderText('搜索知识图谱')
    fireEvent.change(searchInput, { target: { value: 'test query' } })
    
    expect(mockOnSearchChange).toHaveBeenCalledWith('test query')
  })

  it('calls search submit handler when clicking search button', () => {
    const mockOnSearchSubmit = jest.fn()
    render(<EnhancedNavbar onSearchSubmit={mockOnSearchSubmit} />)
    
    const searchButton = screen.getByText('🔍')
    fireEvent.click(searchButton)
    
    expect(mockOnSearchSubmit).toHaveBeenCalled()
  })

  it('navigates to home when logo is clicked', () => {
    render(<EnhancedNavbar />)
    
    const logo = screen.getByText('知识图谱')
    fireEvent.click(logo)
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('opens mobile menu when hamburger button is clicked', () => {
    render(<EnhancedNavbar />)
    
    // Find hamburger button - it's the button in the md:hidden div
    const buttons = screen.getAllByRole('button')
    const hamburgerButton = buttons.find(button => 
      button.querySelector('svg') && button.className.includes('md:hidden')
    ) || buttons[buttons.length - 1] // fallback to last button
    
    fireEvent.click(hamburgerButton)
    
    // Mobile menu should now be visible with duplicate search bar
    const searchInputs = screen.getAllByPlaceholderText('搜索知识图谱')
    expect(searchInputs).toHaveLength(2) // Desktop + mobile
  })

  it('initializes user state on mount', () => {
    render(<EnhancedNavbar />)
    
    expect(mockUserStore.initializeFromStorage).toHaveBeenCalled()
  })
})