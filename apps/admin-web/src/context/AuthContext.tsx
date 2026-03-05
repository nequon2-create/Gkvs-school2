import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type UserRole = 'admin' | 'principal' | 'teacher' | 'parent' | 'student';

interface User {
    id: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use ONLY onAuthStateChange — do NOT call getSession() separately.
        // Calling both at the same time causes a Navigator Lock deadlock:
        // both try to acquire the same browser lock "sb-...-auth-token" simultaneously.
        // The INITIAL_SESSION event fires on mount with the current session (or null).
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);

            if (event === 'INITIAL_SESSION') {
                if (session?.user) {
                    setTimeout(() => loadUserData(session.user.id), 0);
                } else {
                    setLoading(false);
                }
            } else if (event === 'SIGNED_IN') {
                if (session?.user) {
                    setTimeout(() => loadUserData(session.user.id), 0);
                }
            } else if (event === 'SIGNED_OUT') {
                // Also fires when a refresh token is invalid/expired (400 error)
                setUser(null);
                setSession(null);
                setLoading(false);
            } else if (event === 'TOKEN_REFRESHED') {
                setSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserData = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, role')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUser(data);
        } catch (error) {
            console.error('Error loading user data:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // SIGNED_IN event fires automatically → calls loadUserData
        } catch (error: any) {
            setLoading(false);
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, fullName: string = '') => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'admin',
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (error) throw error;

            if (data.session && data.user) {
                await loadUserData(data.user.id);
            }
        } catch (error: any) {
            console.error('Sign up error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
