import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/user';
import { OfficerAccount, INITIAL_OFFICERS } from '../data/defaultOfficers';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { isLocalDemoAuthEnabled, isSupabaseConfigured, supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
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

const loadStaffUser = async (authUser: SupabaseAuthUser): Promise<User> => {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: profile, error } = await supabase
    .from('staff_profiles')
    .select('username, full_name, role, title, is_active')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!profile || !profile.is_active || !['ADMIN', 'OFFICER'].includes(profile.role)) {
    throw new Error('This Supabase account is not linked to an active staff profile. Contact an administrator.');
  }

  return {
    id: authUser.id,
    username: profile.username || authUser.email?.split('@')[0] || '',
    fullName: profile.full_name || authUser.email || 'Staff member',
    role: profile.role as UserRole,
    email: authUser.email || '',
    title: profile.title || undefined,
    lastLoginAt: authUser.last_sign_in_at || new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load officers list from local storage or fallback to default
  const [officers, setOfficers] = useState<OfficerAccount[]>(() => {
    if (!isLocalDemoAuthEnabled || isSupabaseConfigured) return [];
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
    if (isSupabaseConfigured) return null;
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
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);

  // Save officers list changes
  useEffect(() => {
    if (!isLocalDemoAuthEnabled || isSupabaseConfigured) {
      localStorage.removeItem(STORAGE_KEYS.OFFICERS);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(officers));
  }, [officers]);

  // Save active session changes
  useEffect(() => {
    if (isSupabaseConfigured) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return;
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [user]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setUser(null);
        setIsAuthReady(true);
        return;
      }

      try {
        setUser(await loadStaffUser(data.session.user));
      } catch {
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        if (active) setIsAuthReady(true);
      }
    };

    void restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthReady(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Officer Login
   */
  const login = useCallback(
    async (usernameOrEmail: string, passkey: string): Promise<{ success: boolean; message: string; user?: User }> => {
      const cleanIdent = usernameOrEmail.trim().toLowerCase();
      const cleanKey = passkey.trim();

      if (supabase) {
        if (!cleanIdent.includes('@')) {
          return { success: false, message: 'Sign in with the email address registered in Supabase.' };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanIdent,
          password: cleanKey,
        });
        if (error || !data.user) {
          return { success: false, message: error?.message || 'Supabase sign-in failed.' };
        }

        try {
          const authenticatedUser = await loadStaffUser(data.user);
          setUser(authenticatedUser);
          setIsAuthReady(true);
          return {
            success: true,
            message: `Welcome back, ${authenticatedUser.fullName}!`,
            user: authenticatedUser,
          };
        } catch (profileError) {
          await supabase.auth.signOut();
          return {
            success: false,
            message: profileError instanceof Error ? profileError.message : 'Could not load your staff profile.',
          };
        }
      }

      if (!isLocalDemoAuthEnabled) {
        return {
          success: false,
          message: 'Supabase Auth is not configured. Set the project URL and publishable key before officer sign-in.',
        };
      }

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
    if (supabase) void supabase.auth.signOut();
  }, []);

  /**
   * Switch role preview for testing permissions (Admin only)
   */
  const switchRolePreview = useCallback((newRole: UserRole) => {
    if (supabase || !isLocalDemoAuthEnabled) return;
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
      if (supabase || !isLocalDemoAuthEnabled) return { success: false, message: 'Manage staff accounts in Supabase Authentication.' };
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
      if (supabase || !isLocalDemoAuthEnabled) return { success: false, message: 'Manage staff accounts in Supabase Authentication.' };
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
        isAuthReady,
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
