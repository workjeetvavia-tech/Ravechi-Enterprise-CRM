export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

const STORAGE_KEY = 'gujtech_user_session';

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const saveUserSession = (user: User) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearUserSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock login logic: if email contains 'admin', grant admin role, otherwise employee
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'employee';
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0].toUpperCase(),
        email: email,
        role: role,
        avatar: role === 'admin' ? 'JD' : 'U'
      };
      
      saveUserSession(user);
      resolve(user);
    }, 800);
  });
};

export const signupUser = async (name: string, email: string, password: string, role: 'admin' | 'employee'): Promise<User> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        email: email,
        role: role,
        avatar: name.substring(0, 2).toUpperCase()
      };
      
      saveUserSession(user);
      resolve(user);
    }, 800);
  });
};
