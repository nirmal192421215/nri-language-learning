import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithGoogleFirebase, isFirebaseConfigured, signOutFirebase } from '../utils/firebase';

const API_URL = 'http://localhost:5005/api';

const fetchWithTimeout = async (url: string, options: any, timeoutMs = 2000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  streak: number;
  level: string;
  levelProgress: number;
  learningLanguage: string;
  completedModules: string[]; // tracks completed pillars at current tier e.g. ['foundations','communication']
  unlockedCountries: string[];
  currentCountry: string;
  coins: number;
};

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string) => Promise<UserData | null>;
  logout: () => Promise<void>;
  updateProgress: (xpGained: number, coinsGained?: number) => void;
  setAssessmentLevel: (level: string, score: number) => void;
  updateProfile: (name: string, avatar: string) => Promise<void>;
  setLearningLanguage: (langId: string) => Promise<void>;
  loginWithGoogle: (email: string, name?: string) => Promise<UserData | null>;
  completeModule: (moduleId: string) => Promise<{ leveledUp: boolean; newTier: string } | null>;
  setWorldProgress: (unlockedCountries: string[], currentCountry: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const lang = await AsyncStorage.getItem('learningLanguage') || 'tamil';
      const localXpStr = await AsyncStorage.getItem('localXp');
      const localLevel = await AsyncStorage.getItem('localLevel');
      const localCompletedStr = await AsyncStorage.getItem('localCompletedModules');
      const localUnlockedCountries = await AsyncStorage.getItem('unlockedCountries');
      const localCurrentCountry = await AsyncStorage.getItem('currentCountry');
      
      const savedXp = localXpStr ? parseInt(localXpStr, 10) : 25400;
      const savedLevel = localLevel || 'Pro - Level 5';
      const savedCompleted = localCompletedStr ? JSON.parse(localCompletedStr) : [];
      const savedUnlockedCountries = localUnlockedCountries ? JSON.parse(localUnlockedCountries) : ['india'];
      const savedCurrentCountry = localCurrentCountry || 'india';

      if (email) {
        try {
          const res = await fetchWithTimeout(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data && data.error) {
            setUser({ id: 'local1', email, name: email.split('@')[0], avatar: 'tiger', xp: savedXp, coins: savedCoins, streak: 5, level: savedLevel, levelProgress: 60, learningLanguage: lang, completedModules: savedCompleted, unlockedCountries: savedUnlockedCountries, currentCountry: savedCurrentCountry });
          } else {
            setUser({ ...data, learningLanguage: data.learningLanguage || lang, completedModules: data.completedModules || [], unlockedCountries: data.unlockedCountries || savedUnlockedCountries, currentCountry: data.currentCountry || savedCurrentCountry, coins: data.coins || savedCoins });
          }
        } catch (e) {
          console.warn('MongoDB load error (falling back to offline mode):', e);
          setUser({ id: 'local1', email, name: email.split('@')[0], avatar: 'tiger', xp: savedXp, coins: savedCoins, streak: 5, level: savedLevel, levelProgress: 60, learningLanguage: lang, completedModules: savedCompleted, unlockedCountries: savedUnlockedCountries, currentCountry: savedCurrentCountry });
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('userEmail', email);
      const res = await fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      const lang = await AsyncStorage.getItem('learningLanguage') || 'tamil';
      
      const localXpStr = await AsyncStorage.getItem('localXp');
      const localLevel = await AsyncStorage.getItem('localLevel');
      const localCompletedStr = await AsyncStorage.getItem('localCompletedModules');
      const localUnlockedCountries = await AsyncStorage.getItem('unlockedCountries');
      const localCurrentCountry = await AsyncStorage.getItem('currentCountry');
      const localCoinsStr = await AsyncStorage.getItem('localCoins');
      
      const savedXp = localXpStr ? parseInt(localXpStr, 10) : 25400;
      const savedCoins = localCoinsStr ? parseInt(localCoinsStr, 10) : 0;
      const savedLevel = localLevel || 'Pro - Level 5';
      const savedCompleted = localCompletedStr ? JSON.parse(localCompletedStr) : [];
      const savedUnlockedCountries = localUnlockedCountries ? JSON.parse(localUnlockedCountries) : ['india'];
      const savedCurrentCountry = localCurrentCountry || 'india';

      if (data && data.error) {
        const mockUser = { id: 'local1', email, name: email.split('@')[0], avatar: 'tiger', xp: savedXp, coins: savedCoins, streak: 5, level: savedLevel, levelProgress: 60, learningLanguage: lang, completedModules: savedCompleted, unlockedCountries: savedUnlockedCountries, currentCountry: savedCurrentCountry };
        setUser(mockUser);
        setIsLoading(false);
        return mockUser as any;
      } else {
        const fullUser = { ...data, learningLanguage: data.learningLanguage || lang, unlockedCountries: data.unlockedCountries || savedUnlockedCountries, currentCountry: data.currentCountry || savedCurrentCountry, coins: data.coins || savedCoins };
        setUser(fullUser);
        setIsLoading(false);
        return fullUser;
      }
    } catch (e) {
      console.warn('MongoDB login error (falling back to offline mode):', e);
      const lang = await AsyncStorage.getItem('learningLanguage') || 'tamil';
      const localXpStr = await AsyncStorage.getItem('localXp');
      const localLevel = await AsyncStorage.getItem('localLevel');
      const localCompletedStr = await AsyncStorage.getItem('localCompletedModules');
      const localUnlockedCountries = await AsyncStorage.getItem('unlockedCountries');
      const localCurrentCountry = await AsyncStorage.getItem('currentCountry');
      
      const savedXp = localXpStr ? parseInt(localXpStr, 10) : 25400;
      const savedLevel = localLevel || 'Pro - Level 5';
      const savedCompleted = localCompletedStr ? JSON.parse(localCompletedStr) : [];
      const savedUnlockedCountries = localUnlockedCountries ? JSON.parse(localUnlockedCountries) : ['india'];
      const savedCurrentCountry = localCurrentCountry || 'india';
      
      const mockUser = { id: 'local1', email, name: email.split('@')[0], avatar: 'tiger', xp: savedXp, streak: 5, level: savedLevel, levelProgress: 60, learningLanguage: lang, completedModules: savedCompleted, unlockedCountries: savedUnlockedCountries, currentCountry: savedCurrentCountry };
      setUser(mockUser);
      setIsLoading(false);
      return mockUser as any;
    }
  };

  // --- Module Completion & Level Up Logic ---
  const FOUR_PILLARS = ['foundations', 'communication', 'pronunciation', 'assessment'];
  const TIER_ORDER = ['Beginner', 'Intermediate', 'Pro'];

  const getTier = (levelStr: string) => {
    if (levelStr?.includes('Pro')) return 'Pro';
    if (levelStr?.includes('Intermediate')) return 'Intermediate';
    return 'Beginner';
  };

  const completeModule = async (moduleId: string): Promise<{ leveledUp: boolean; newTier: string } | null> => {
    if (!user) return null;

    const currentCompleted = user.completedModules || [];
    if (currentCompleted.includes(moduleId)) {
      return { leveledUp: false, newTier: getTier(user.level) };
    }

    const newCompleted = [...currentCompleted, moduleId];
    const allDone = FOUR_PILLARS.every(p => newCompleted.includes(p));

    let newLevel = user.level;
    let leveledUp = false;
    let resetCompleted = newCompleted;

    if (allDone) {
      const currentTier = getTier(user.level);
      const currentTierIdx = TIER_ORDER.indexOf(currentTier);
      if (currentTierIdx < TIER_ORDER.length - 1) {
        const nextTier = TIER_ORDER[currentTierIdx + 1];
        newLevel = `${nextTier} - Level 1`;
        resetCompleted = []; // reset for the new level
        leveledUp = true;
      }
    }

    // Persist the new state
    const updatedUser = { ...user, completedModules: resetCompleted, level: newLevel };
    setUser(updatedUser);
    await AsyncStorage.setItem('localCompletedModules', JSON.stringify(resetCompleted));
    await AsyncStorage.setItem('localLevel', newLevel);

    // Also save XP for leaderboard
    const xpMap: Record<string, number> = { foundations: 20, communication: 30, pronunciation: 50, assessment: 100 };
    const xpGained = xpMap[moduleId] || 20;
    
    const newXp = user.xp + xpGained;
    setUser(prev => prev ? { ...prev, xp: newXp } : prev);
    await AsyncStorage.setItem('localXp', newXp.toString());

    try {
      await fetch(`${API_URL}/update-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, xpGained, completedModules: resetCompleted, level: newLevel })
      });
    } catch (e) {
      // offline mode – state already updated locally
    }

    return { leveledUp, newTier: getTier(newLevel) };
  };

  const setAssessmentLevel = async (levelTier: string, score: number) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/update-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, levelTier, score })
      });
      const data = await res.json();
      if (data && data.error) {
        setUser({ ...user, level: `${levelTier} - Level 1`, xp: score * 10, levelProgress: 0, completedModules: [] });
      } else {
        setUser({ ...data, learningLanguage: user.learningLanguage, completedModules: data.completedModules || [] });
      }
    } catch (e) {
      console.error('MongoDB update-level error:', e);
    }
  };

  const updateProgress = async (xpGained: number, coinsGained: number = 0) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/update-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, xpGained, coinsGained })
      });
      const data = await res.json();
      if (data && data.error) {
        setUser({ ...user, xp: user.xp + xpGained, coins: (user.coins || 0) + coinsGained });
      } else {
        setUser({ ...data, learningLanguage: user.learningLanguage });
      }
    } catch (e) {
      console.error('MongoDB update-progress error:', e);
    }
  };

  const updateProfile = async (name: string, avatar: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name, avatar })
      });
      const data = await res.json();
      if (data && data.error) {
        setUser({ ...user, name, avatar });
      } else {
        setUser({ ...data, learningLanguage: user.learningLanguage });
      }
    } catch (e) {
      console.error('MongoDB update-profile error:', e);
      setUser({ ...user, name, avatar });
    }
  };

  const setLearningLanguage = async (langId: string) => {
    await AsyncStorage.setItem('learningLanguage', langId);
    if (user) {
      setUser({ ...user, learningLanguage: langId });
      try {
        await fetch(`${API_URL}/update-language`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, learningLanguage: langId })
        });
      } catch (e) {
        console.warn('MongoDB update-language error:', e);
      }
    }
  };

  const loginWithGoogle = async (email: string, name?: string) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('userEmail', email);
      const res = await fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      const lang = await AsyncStorage.getItem('learningLanguage') || 'tamil';
      
      const localCoinsStr = await AsyncStorage.getItem('localCoins');
      const savedCoins = localCoinsStr ? parseInt(localCoinsStr, 10) : 0;
      
      let finalUser;
      if (data && data.error) {
        const localXpStr = await AsyncStorage.getItem('localXp');
        const localLevel = await AsyncStorage.getItem('localLevel');
        const localCompletedStr = await AsyncStorage.getItem('localCompletedModules');
        
        const savedXp = localXpStr ? parseInt(localXpStr, 10) : 0;
        const savedLevel = localLevel || 'Beginner - Level 1';
        const savedCompleted = localCompletedStr ? JSON.parse(localCompletedStr) : [];
        
        const mockUser = { id: 'local1', email, name: name || email.split('@')[0], avatar: 'tiger', xp: savedXp, coins: savedCoins, streak: 1, level: savedLevel, levelProgress: 0, learningLanguage: lang, completedModules: savedCompleted };
        finalUser = mockUser;
      } else {
        finalUser = { ...data, learningLanguage: data.learningLanguage || lang, completedModules: data.completedModules || [], coins: data.coins || savedCoins };
      }

      if (name && (!data || data.name !== name)) {
        try {
          const updateRes = await fetch(`${API_URL}/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, avatar: finalUser.avatar || 'tiger' })
          });
          const updatedData = await updateRes.json();
          if (updatedData && !updatedData.error) {
            finalUser = { ...finalUser, name: updatedData.name };
          }
        } catch (updateErr) {
          console.warn('Failed to sync Google profile name with DB:', updateErr);
        }
      }

      setUser(finalUser);
      setIsLoading(false);
      return finalUser;
    } catch (e) {
      console.warn('MongoDB login error (falling back to offline mode):', e);
      const lang = await AsyncStorage.getItem('learningLanguage') || 'tamil';
      const localXpStr = await AsyncStorage.getItem('localXp');
      const localLevel = await AsyncStorage.getItem('localLevel');
      const localCompletedStr = await AsyncStorage.getItem('localCompletedModules');
      const localCoinsStr = await AsyncStorage.getItem('localCoins');
      
      const savedXp = localXpStr ? parseInt(localXpStr, 10) : 0;
      const savedCoins = localCoinsStr ? parseInt(localCoinsStr, 10) : 0;
      const savedLevel = localLevel || 'Beginner - Level 1';
      const savedCompleted = localCompletedStr ? JSON.parse(localCompletedStr) : [];
      
      const mockUser = { id: 'local1', email, name: name || email.split('@')[0], avatar: 'tiger', xp: savedXp, coins: savedCoins, streak: 1, level: savedLevel, levelProgress: 0, learningLanguage: lang, completedModules: savedCompleted };
      setUser(mockUser);
      setIsLoading(false);
      return mockUser as any;
    }
  };

  const setWorldProgress = async (unlockedCountries: string[], currentCountry: string) => {
    if (!user) return;
    await AsyncStorage.setItem('unlockedCountries', JSON.stringify(unlockedCountries));
    await AsyncStorage.setItem('currentCountry', currentCountry);
    setUser({ ...user, unlockedCountries, currentCountry });

    try {
      await fetch(`${API_URL}/update-country`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, unlockedCountries, currentCountry })
      });
    } catch (e) {
      console.warn('MongoDB update-country error:', e);
    }
  };

  const logout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn('Firebase logout error:', e);
    }
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('learningLanguage');
    await AsyncStorage.removeItem('localXp');
    await AsyncStorage.removeItem('localLevel');
    await AsyncStorage.removeItem('localCompletedModules');
    await AsyncStorage.removeItem('unlockedCountries');
    await AsyncStorage.removeItem('currentCountry');
    await AsyncStorage.removeItem('localCoins');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProgress, setAssessmentLevel, updateProfile, setLearningLanguage, loginWithGoogle, completeModule, setWorldProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
