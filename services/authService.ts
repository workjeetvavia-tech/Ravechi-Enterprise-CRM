import { supabase } from './supabaseClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

// Map Supabase user object to our App's User interface
const mapSupabaseUser = (u: any): User | null => {
    if (!u) return null;
    return {
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
        role: u.user_metadata?.role || 'employee',
        avatar: u.user_metadata?.name ? u.user_metadata.name.substring(0, 2).toUpperCase() : 'U'
    };
};

export const getCurrentUser = async (): Promise<User | null> => {
    const { data } = await supabase.auth.getUser();
    return mapSupabaseUser(data.user);
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.user) throw new Error("Login failed");
    return mapSupabaseUser(data.user)!;
};

export const signupUser = async (name: string, email: string, password: string, role: 'admin' | 'employee'): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
            data: {
                name,
                role
            }
        }
    });

    if (error) {
        throw new Error(error.message);
    }

    // Check if session is missing. If so, email confirmation is enabled in Supabase.
    if (data.user && !data.session) {
        throw new Error("Account created successfully! Please check your email to verify your account before logging in.");
    }

    if (!data.user) throw new Error("Signup successful, but user data is missing.");
    
    return mapSupabaseUser(data.user)!;
};

export const clearUserSession = async () => {
    await supabase.auth.signOut();
};