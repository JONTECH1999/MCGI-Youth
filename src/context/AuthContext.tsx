import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/user';
import { OfficerAccount, INITIAL_OFFICERS } from '../data/defaultOfficers';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
  officers: OfficerAccount[];
  login: (usernameOrEmail: string, passkey: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  switchRolePreview: (role: UserRole) => void;
  saveOfficer: (officer: OfficerAccount) => { success: boolean; message: string };
  deleteOfficer: (officerId: string) => { success: boolean; message: string };
}

const STORAGE_KEYS = {
  SESSION: 'mcgi_officer_session',
  OFFICERS: 'mcgi_officer_roster',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load officers list from local storage or fallback to default
  const [officers, setOfficers] = useState<OfficerAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFICERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_OFFICERS;
      }
    }
    return INITIAL_OFFICERS;
  });

  // Active authenticated officer session
  const [user, setUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Save officers list changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(officers));
  }, [officers]);

  // Save active session changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [user]);

  /**
   * Officer Login
   */
  const login = useCallback(
    async (usernameOrEmail: string, passkey: string): Promise<{ success: boolean; message: string; user?: User }> => {
      const cleanIdent = usernameOrEmail.trim().toLowerCase();
      const cleanKey = passkey.trim();

      const matched = officers.find(
        (o) =>
          (o.username.toLowerCase() === cleanIdent || o.email.toLowerCase() === cleanIdent) &&
          o.passkey === cleanKey
      );

      if (!matched) {
        return {
          success: false,
          message: 'Invalid officer credentials. Please verify your officer username/email and passkey.',
        };
      }

      if (matched.status === 'Suspended') {
        return {
          success: false,
          message: 'This officer account is currently suspended. Please contact the head administrator.',
        };
      }

      const now = new Date().toISOString();
      const authenticatedUser: User = {
        id: matched.id,
        username: matched.username,
        fullName: matched.fullName,
        role: matched.role,
        email: matched.email,
        title: matched.title,
        lastLoginAt: now,
      };

      // Update last login in roster
      const updatedOfficers = officers.map((o) => (o.id === matched.id ? { ...o, lastLoginAt: now } : o));
      setOfficers(updatedOfficers);

      setUser(authenticatedUser);
      return {
        success: true,
        message: `Welcome back, ${matched.fullName}!`,
        user: authenticatedUser,
      };
    },
    [officers]
  );

  /**
   * Officer Logout
   */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }, []);

  /**
   * Switch role preview for testing permissions (Admin only)
   */
  const switchRolePreview = useCallback((newRole: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        role: newRole,
      };
    });
  }, []);

  /**
   * Save / Add Officer Account
   */
  const saveOfficer = useCallback(
    (officer: OfficerAccount) => {
      const idx = officers.findIndex((o) => o.id === officer.id);
      let updated: OfficerAccount[];
      if (idx >= 0) {
        updated = [...officers];
        updated[idx] = officer;
      } else {
        updated = [...officers, officer];
      }
      setOfficers(updated);
      return { success: true, message: 'Officer account saved.' };
    },
    [officers]
  );

  /**
   * Delete Officer Account
   */
  const deleteOfficer = useCallback(
    (officerId: string) => {
      if (officers.length <= 1) {
        return { success: false, message: 'Cannot delete the sole remaining administrator account.' };
      }
      const updated = officers.filter((o) => o.id !== officerId);
      setOfficers(updated);
      return { success: true, message: 'Officer removed.' };
    },
    [officers]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isOfficer: user?.role === 'OFFICER',
        officers,
        login,
        logout,
        switchRolePreview,
        saveOfficer,
        deleteOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
