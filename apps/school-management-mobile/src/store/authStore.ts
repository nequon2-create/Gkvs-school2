import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoggedInUser } from '../types';

const AUTH_STORAGE_KEY = 'school_app_user';

interface AuthState {
    user: LoggedInUser | null;
    isLoading: boolean;
    setUser: (user: LoggedInUser | null) => Promise<void>;
    loadUser: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,

    setUser: async (user) => {
        if (user) {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
        set({ user });
    },

    loadUser: async () => {
        try {
            const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
                set({ user: JSON.parse(stored), isLoading: false });
            } else {
                set({ user: null, isLoading: false });
            }
        } catch {
            set({ user: null, isLoading: false });
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null });
    },
}));
