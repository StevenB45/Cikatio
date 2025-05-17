// src/lib/auth/index.ts

interface AdminData {
  email: string;
  role: string;
  id: string;
  firstName?: string;
  lastName?: string;
}

export const isAdminAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        const admin = JSON.parse(adminData) as AdminData;
        return Boolean(admin && 
          admin.role === 'ADMIN' && 
          admin.email && 
          admin.id
        );
      } catch (error) {
        console.error('Error parsing admin data:', error);
        // Clear invalid data
        localStorage.removeItem('admin');
        return false;
      }
    }
  }
  return false;
};

export const getAdminData = (): AdminData | null => {
  if (typeof window !== 'undefined') {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        const admin = JSON.parse(adminData) as AdminData;
        if (admin && admin.role === 'ADMIN' && admin.email && admin.id) {
          return admin;
        }
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem('admin');
      }
    }
  }
  return null;
};

export const logoutAdmin = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin');
  }
};
