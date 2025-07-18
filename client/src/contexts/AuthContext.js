import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user in our backend
          const token = await firebaseUser.getIdToken();
          const userData = {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL
          };

          // Try to login first, if fails, register
          try {
            const loginResponse = await api.post('/auth/login', {
              firebaseUid: firebaseUser.uid
            });
            
            const { user: backendUser, token: backendToken } = loginResponse.data.data;
            localStorage.setItem('token', backendToken);
            localStorage.setItem('user', JSON.stringify(backendUser));
            setUser(backendUser);
          } catch (loginError) {
            // User doesn't exist, register them
            const registerResponse = await api.post('/auth/register', userData);
            const { user: backendUser, token: backendToken } = registerResponse.data.data;
            localStorage.setItem('token', backendToken);
            localStorage.setItem('user', JSON.stringify(backendUser));
            setUser(backendUser);
          }
        } catch (error) {
          console.error('Auth error:', error);
          toast.error('Authentication failed');
          await signOut(auth);
        }
      } else {
        // User is signed out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (displayName) {
        await result.user.updateProfile({
          displayName: displayName
        });
      }
      
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Logout from backend
      await api.post('/auth/logout');
      
      // Logout from Firebase
      await signOut(auth);
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await api.put('/auth/profile', updates);
      const updatedUser = response.data.data.user;
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};