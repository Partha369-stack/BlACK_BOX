import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Parse from 'parse';
import { ParseService } from '../services/parseService';

interface AuthContextType {
    user: Parse.User | null;
    loading: boolean;
    role: string;
    isAdmin: boolean;
    login: (username: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string, googleUser: any) => Promise<void>;
    signUp: (username: string, email: string, password: string, name: string, phone: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Parse.User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string>('guest');

    // Helper to get role from user
    const getUserRole = (user: Parse.User | null): string => {
        if (!user) return 'guest';
        return user.get('role') || 'user';
    };

    useEffect(() => {
        console.log("AuthProvider Mounted");
        // Check for existing session on mount
        const loadUser = async () => {
            const currentUser = ParseService.getCurrentUser();
            if (currentUser) {
                try {
                    // Explicitly fetch to ensure custom fields like 'role' are loaded
                    await currentUser.fetch();
                } catch (error) {
                    console.error('Error fetching user on mount:', error);
                }
            }
            setUser(currentUser);
            setRole(getUserRole(currentUser));
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (username: string, password: string) => {
        const loggedInUser = await ParseService.login(username, password);
        setUser(loggedInUser);
        setRole(getUserRole(loggedInUser));
    };

    const loginWithGoogle = async (idToken: string, googleUser: any) => {
        const loggedInUser = await ParseService.loginWithGoogle(idToken, googleUser);
        setUser(loggedInUser);
        setRole(getUserRole(loggedInUser));
    };

    const signUp = async (username: string, email: string, password: string, name: string, phone: string) => {
        const newUser = await ParseService.signUp(username, email, password, name, phone);
        setUser(newUser);
        setRole(getUserRole(newUser));
    };

    const logout = async () => {
        await ParseService.logout();
        setUser(null);
        setRole('guest');
    };

    const resetPassword = async (email: string) => {
        await ParseService.resetPassword(email);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                role,
                isAdmin: role === 'admin',
                login,
                loginWithGoogle,
                signUp,
                logout,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
