import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  authToken: AuthToken | null;
  isLoading: boolean;
  login: (user: User, token?: AuthToken) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initializeFromStorage: () => void;
  checkTokenExpiration: () => boolean;
  refreshAuthToken: () => Promise<boolean>;
}

const STORAGE_KEYS = {
  USER: 'currentUser',
  TOKEN: 'authToken',
  LAST_LOGIN: 'lastLoginTime'
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  authToken: null,
  isLoading: false,

  login: (user: User, token?: AuthToken) => {
    const loginTime = Date.now();
    
    // Save to localStorage with error handling
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, loginTime.toString());
        
        if (token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(token));
        }
        
        // Trigger login state change event
        window.dispatchEvent(new CustomEvent('loginStateChange', { 
          detail: { user, isLoggedIn: true } 
        }));
      } catch (error) {
        console.error('Failed to save login state to localStorage:', error);
      }
    }
    
    set({ user, isLoggedIn: true, authToken: token });
  },

  logout: () => {
    // Clear localStorage with error handling
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
        
        // Trigger login state change event
        window.dispatchEvent(new CustomEvent('loginStateChange', { 
          detail: { user: null, isLoggedIn: false } 
        }));
      } catch (error) {
        console.error('Failed to clear login state from localStorage:', error);
      }
    }
    
    set({ user: null, isLoggedIn: false, authToken: null });
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update user in localStorage:', error);
      }
    }
    
    set({ user: updatedUser });
  },

  checkTokenExpiration: () => {
    const { authToken } = get();
    if (!authToken) return false;
    
    const now = Date.now();
    const isExpired = now >= authToken.expiresAt;
    
    if (isExpired) {
      // Token expired, logout user
      get().logout();
      return false;
    }
    
    return true;
  },

  refreshAuthToken: async () => {
    const { authToken } = get();
    if (!authToken?.refreshToken) return false;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: authToken.refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newToken: AuthToken = {
          token: data.token,
          expiresAt: Date.now() + (data.expiresIn * 1000),
          refreshToken: data.refreshToken || authToken.refreshToken
        };
        
        // Update token in storage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(newToken));
        }
        
        set({ authToken: newToken });
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh auth token:', error);
    }
    
    // Refresh failed, logout user
    get().logout();
    return false;
  },

  initializeFromStorage: () => {
    if (typeof window === 'undefined') return;
    
    set({ isLoading: true });
    
    try {
      // Restore user data
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const lastLoginTime = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        let authToken: AuthToken | null = null;
        
        // Parse and validate token
        if (storedToken) {
          try {
            authToken = JSON.parse(storedToken);
            
            // Check if token is expired
            if (authToken && Date.now() >= authToken.expiresAt) {
              // Try to refresh token
              get().refreshAuthToken().then((success) => {
                if (!success) {
                  console.log('Token expired and refresh failed, user logged out');
                }
              });
              authToken = null;
            }
          } catch (tokenError) {
            console.error('Failed to parse stored token:', tokenError);
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
          }
        }
        
        // Check if login is too old (e.g., older than 30 days)
        const MAX_LOGIN_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (lastLoginTime) {
          const loginAge = Date.now() - parseInt(lastLoginTime);
          if (loginAge > MAX_LOGIN_AGE) {
            console.log('Login too old, logging out user');
            get().logout();
            set({ isLoading: false });
            return;
          }
        }
        
        set({ user, isLoggedIn: true, authToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize from storage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);
      set({ user: null, isLoggedIn: false, authToken: null, isLoading: false });
    }
  },
}));

// Auto-check token expiration every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useUserStore.getState();
    if (store.isLoggedIn && store.authToken) {
      store.checkTokenExpiration();
    }
  }, 5 * 60 * 1000); // 5 minutes
}
