import { supabase } from './client';
import type { User, UserRole } from '@gkvs/shared';
import type { AuthError, Session } from '@supabase/supabase-js';

export interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { user: null, session: null, error };
    }

    if (!data.session) {
        return {
            user: null,
            session: null,
            error: { message: 'No session returned', name: 'NoSession', status: 401 } as AuthError,
        };
    }

    // Fetch user details from users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (userError) {
        return {
            user: null,
            session: null,
            error: userError as unknown as AuthError,
        };
    }

    return { user: userData, session: data.session, error: null };
}

/**
 * Sign out the currently authenticated user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
    const {
        data: { user: authUser },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return { user: null, error: authError };
    }

    // Fetch user details from users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (userError) {
        return { user: null, error: userError };
    }

    return { user: userData, error: null };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}

/**
 * Reset password by sending a reset email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    return { error };
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
    return hasRole(user, 'admin');
}

/**
 * Check if user is teacher
 */
export function isTeacher(user: User | null): boolean {
    return hasRole(user, 'teacher');
}

/**
 * Check if user is parent
 */
export function isParent(user: User | null): boolean {
    return hasRole(user, 'parent');
}

/**
 * Check if user is student
 */
export function isStudent(user: User | null): boolean {
    return hasRole(user, 'student');
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
    callback: (event: string, session: Session | null) => void
) {
    return supabase.auth.onAuthStateChange(callback);
}
