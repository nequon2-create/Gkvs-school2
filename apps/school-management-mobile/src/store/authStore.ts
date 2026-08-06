import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoggedInUser } from '../types';

const AUTH_STORAGE_KEY = 'school_app_user';
const ACCOUNTS_STORAGE_KEY = 'school_app_accounts';

interface AuthState {
    user: LoggedInUser | null;
    accounts: LoggedInUser[];
    isLoading: boolean;
    setUser: (user: LoggedInUser | null) => Promise<void>;
    addAccount: (user: LoggedInUser) => Promise<void>;
    switchAccount: (userId: string) => Promise<void>;
    removeAccount: (userId: string) => Promise<void>;
    updateAccountPhoto: (userId: string, photoUrl: string) => Promise<void>;
    loadUser: () => Promise<void>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accounts: [],
    isLoading: true,

    setUser: async (user) => {
        if (user) {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            
            // Manage accounts list
            const currentAccounts = get().accounts;
            const existingIndex = currentAccounts.findIndex((a) => a.id === user.id);
            let updatedAccounts: LoggedInUser[];

            if (existingIndex >= 0) {
                updatedAccounts = [...currentAccounts];
                updatedAccounts[existingIndex] = user;
            } else {
                updatedAccounts = [...currentAccounts, user];
            }

            await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
            set({ user, accounts: updatedAccounts });
        } else {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            set({ user: null });
        }
    },

    addAccount: async (newUser) => {
        const currentAccounts = get().accounts;
        const existingIndex = currentAccounts.findIndex((a) => a.id === newUser.id);
        let updatedAccounts: LoggedInUser[];

        if (existingIndex >= 0) {
            updatedAccounts = [...currentAccounts];
            updatedAccounts[existingIndex] = newUser;
        } else {
            updatedAccounts = [...currentAccounts, newUser];
        }

        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
        set({ user: newUser, accounts: updatedAccounts });
    },

    switchAccount: async (userId) => {
        const targetAccount = get().accounts.find((a) => a.id === userId);
        if (targetAccount) {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(targetAccount));
            set({ user: targetAccount });
        }
    },

    removeAccount: async (userId) => {
        const currentAccounts = get().accounts;
        const updatedAccounts = currentAccounts.filter((a) => a.id !== userId);
        await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

        const currentUser = get().user;
        if (currentUser?.id === userId) {
            const nextUser = updatedAccounts.length > 0 ? updatedAccounts[0] : null;
            if (nextUser) {
                await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
            } else {
                await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            }
            set({ user: nextUser, accounts: updatedAccounts });
        } else {
            set({ accounts: updatedAccounts });
        }
    },

    updateAccountPhoto: async (userId, photoUrl) => {
        if (!userId || !photoUrl) return;
        const currentAccounts = get().accounts;
        let modified = false;

        const updatedAccounts = currentAccounts.map((acc) => {
            if (acc.id === userId && acc.photo_url !== photoUrl) {
                modified = true;
                return { ...acc, photo_url: photoUrl };
            }
            return acc;
        });

        const currentUser = get().user;
        let updatedUser = currentUser;
        if (currentUser?.id === userId && currentUser.photo_url !== photoUrl) {
            modified = true;
            updatedUser = { ...currentUser, photo_url: photoUrl };
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        }

        if (modified) {
            await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
            set({ user: updatedUser, accounts: updatedAccounts });
        }
    },

    loadUser: async () => {
        try {
            const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            const storedAccounts = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);

            const userObj = storedUser ? JSON.parse(storedUser) : null;
            let accountsArr: LoggedInUser[] = storedAccounts ? JSON.parse(storedAccounts) : [];

            if (userObj && !accountsArr.some((a) => a.id === userObj.id)) {
                accountsArr = [userObj, ...accountsArr];
                await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accountsArr));
            }

            set({ user: userObj, accounts: accountsArr, isLoading: false });
        } catch {
            set({ user: null, accounts: [], isLoading: false });
        }
    },

    logout: async () => {
        const currentUser = get().user;
        if (!currentUser) return;

        const currentAccounts = get().accounts;
        const updatedAccounts = currentAccounts.filter((a) => a.id !== currentUser.id);

        await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

        if (updatedAccounts.length > 0) {
            const nextUser = updatedAccounts[0];
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
            set({ user: nextUser, accounts: updatedAccounts });
        } else {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            await AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY);
            set({ user: null, accounts: [] });
        }
    },

    logoutAll: async () => {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        await AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY);
        set({ user: null, accounts: [] });
    },
}));
