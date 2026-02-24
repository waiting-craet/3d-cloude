import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  initializeFromStorage: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,

  login: (user: User) => {
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    // 清除 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    set({ user: null, isLoggedIn: false });
  },

  initializeFromStorage: () => {
    // 从 localStorage 恢复登录状态
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, isLoggedIn: true });
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  },
}));
