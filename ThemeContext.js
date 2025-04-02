// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = {
  standardLight: {
    primary: '#2A9D8F',
    secondary: '#264653',
    accent: '#E9C46A',
    background: '#F8F9FA',
    text: '#2B2D42',
    error: '#E76F51',
    statsHeader: '#264653',
    albumBorder: '#e0e0e0',
    surface: '#FFFFFF',
    textSecondary: '#666666',
    surfaceVariant: '#F0FAF9',
    shadow: '#000',
    isDark: false
  },
  standardDark: {
    primary: '#2A9D8F',
    secondary: '#E9C46A',
    accent: '#264653',
    background: '#121212',
    text: '#FFFFFF',
    error: '#E76F51',
    statsHeader: '#1B1B1B',
    albumBorder: '#333333',
    surface: '#1E1E1E',
    textSecondary: '#888888',
    surfaceVariant: '#1E2E2E',
    shadow: '#000',
    isDark: true
  },
  naturLight: {
    primary: '#4A7C59',
    secondary: '#3A5A40',
    accent: '#C6AC8F',
    background: '#F5F5F5',
    text: '#2D3A3A',
    error: '#D32F2F',
    statsHeader: '#3A5A40',
    albumBorder: '#D4D4D4',
    surface: '#FFFFFF',
    textSecondary: '#6B7280',
    surfaceVariant: '#EBF5EB',
    shadow: '#00000020',
    isDark: false
  },
  naturDark: {
    primary: '#6C9A8B',
    secondary: '#B8C4BB',
    accent: '#EAB364',
    background: '#1A2E2A',
    text: '#E0ECE4',
    error: '#EF5350',
    statsHeader: '#2D4A43',
    albumBorder: '#3E524B',
    surface: '#243D37',
    textSecondary: '#9DB4AD',
    surfaceVariant: '#2F4D46',
    shadow: '#00000080',
    isDark: true
  },
  sonnenuntergangLight: {
    primary: '#FF7F50',
    secondary: '#FF6B6B',
    accent: '#4ECDC4',
    background: '#FFF8F0',
    text: '#2F4858',
    error: '#FF4757',
    statsHeader: '#FF6B6B',
    albumBorder: '#FFE4D6',
    surface: '#FFFFFF',
    textSecondary: '#6D7C8C',
    surfaceVariant: '#FFF0E6',
    shadow: '#FFA07A50',
    isDark: false
  },
  sonnenuntergangDark: {
    primary: '#FF8C61',
    secondary: '#FFB997',
    accent: '#70C1B3',
    background: '#2D2424',
    text: '#FFE5D9',
    error: '#FF6B6B',
    statsHeader: '#543A3A',
    albumBorder: '#5C4444',
    surface: '#3A2E2E',
    textSecondary: '#C4A59E',
    surfaceVariant: '#4A3636',
    shadow: '#00000080',
    isDark: true
  },
  ozeanLight: {
    primary: '#3B82F6',
    secondary: '#06B6D4',
    accent: '#F59E0B',
    background: '#F0F7FF',
    text: '#1E293B',
    error: '#EF4444',
    statsHeader: '#1D4ED8',
    albumBorder: '#BFDBFE',
    surface: '#FFFFFF',
    textSecondary: '#64748B',
    surfaceVariant: '#E0F2FE',
    shadow: '#93C5FD50',
    isDark: false
  },
  ozeanDark: {
    primary: '#60A5FA',
    secondary: '#22D3EE',
    accent: '#FBBF24',
    background: '#0F172A',
    text: '#E2E8F0',
    error: '#F87171',
    statsHeader: '#1E40AF',
    albumBorder: '#334155',
    surface: '#1E293B',
    textSecondary: '#94A3B8',
    surfaceVariant: '#1E3A8A',
    shadow: '#00000080',
    isDark: true
  },
  minimalLight: {
    primary: '#6B7280',
    secondary: '#374151',
    accent: '#9CA3AF',
    background: '#F9FAFB',
    text: '#111827',
    error: '#DC2626',
    statsHeader: '#4B5563',
    albumBorder: '#E5E7EB',
    surface: '#FFFFFF',
    textSecondary: '#6B7280',
    surfaceVariant: '#F3F4F6',
    shadow: '#6B728020',
    isDark: false
  },
  minimalDark: {
    primary: '#9CA3AF',
    secondary: '#D1D5DB',
    accent: '#6B7280',
    background: '#18181B',
    text: '#F4F4F5',
    error: '#F87171',
    statsHeader: '#3F3F46',
    albumBorder: '#3F3F46',
    surface: '#27272A',
    textSecondary: '#A1A1AA',
    surfaceVariant: '#3F3F46',
    shadow: '#00000080',
    isDark: true
  },
  vintageLight: {
    primary: '#A27B5C',
    secondary: '#3F2E3E',
    accent: '#D8973C',
    background: '#FDF6E3',
    text: '#393232',
    error: '#B91C1C',
    statsHeader: '#4A403A',
    albumBorder: '#E0D4C7',
    surface: '#FFF9F0',
    textSecondary: '#6D5D54',
    surfaceVariant: '#F5E6D3',
    shadow: '#D4B49950',
    isDark: false
  },
  vintageDark: {
    primary: '#C4A484',
    secondary: '#5D4954',
    accent: '#E6B325',
    background: '#2D2424',
    text: '#EDE0D4',
    error: '#DC2626',
    statsHeader: '#453A36',
    albumBorder: '#58423C',
    surface: '#3A2E2A',
    textSecondary: '#B8A69B',
    surfaceVariant: '#4D3D38',
    shadow: '#00000080',
    isDark: true
  },
  cyberLight: {
    primary: '#6366F1',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#F8FAFC',
    text: '#1E293B',
    error: '#EF4444',
    statsHeader: '#475569',
    albumBorder: '#E2E8F0',
    surface: '#FFFFFF',
    textSecondary: '#64748B',
    surfaceVariant: '#F1F5F9',
    shadow: '#94A3B850',
    isDark: false
  },
  cyberDark: {
    primary: '#818CF8',
    secondary: '#34D399',
    accent: '#FBBF24',
    background: '#0F172A',
    text: '#E2E8F0',
    error: '#F87171',
    statsHeader: '#1E293B',
    albumBorder: '#334155',
    surface: '#1E293B',
    textSecondary: '#94A3B8',
    surfaceVariant: '#2C3A4B',
    shadow: '#00000099',
    isDark: true
  },
  blüteLight: {
    primary: '#EC4899',
    secondary: '#DB2777',
    accent: '#FCD34D',
    background: '#FFF1F2',
    text: '#431407',
    error: '#DC2626',
    statsHeader: '#9D174D',
    albumBorder: '#FBCFE8',
    surface: '#FFFFFF',
    textSecondary: '#881337',
    surfaceVariant: '#FFE4E6',
    shadow: '#FDA4AF50',
    isDark: false
  },
  blüteDark: {
    primary: '#F472B6',
    secondary: '#F9A8D4',
    accent: '#FDE68A',
    background: '#2A0A18',
    text: '#FCE7F3',
    error: '#FB7185',
    statsHeader: '#4C0519',
    albumBorder: '#5A1D3C',
    surface: '#3F0D1F',
    textSecondary: '#FDA4AF',
    surfaceVariant: '#5A1D3C',
    shadow: '#00000080',
    isDark: true
  },
  weltraumLight: {
    primary: '#7C3AED',
    secondary: '#6D28D9',
    accent: '#38BDF8',
    background: '#F5F3FF',
    text: '#1E1B4B',
    error: '#DC2626',
    statsHeader: '#4C1D95',
    albumBorder: '#DDD6FE',
    surface: '#FFFFFF',
    textSecondary: '#4F46E5',
    surfaceVariant: '#EDE9FE',
    shadow: '#A78BFA50',
    isDark: false
  },
  weltraumDark: {
    primary: '#A78BFA',
    secondary: '#8B5CF6',
    accent: '#60A5FA',
    background: '#0F0524',
    text: '#E0E7FF',
    error: '#F87171',
    statsHeader: '#2E1065',
    albumBorder: '#3B2A5C',
    surface: '#1A0933',
    textSecondary: '#818CF8',
    surfaceVariant: '#2E1A47',
    shadow: '#000000CC',
    isDark: true
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('standardLight');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('selectedTheme');
      if (savedTheme && THEMES[savedTheme]) setThemeName(savedTheme);
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme) => {
    if (THEMES[newTheme]) {
      setThemeName(newTheme);
      await AsyncStorage.setItem('selectedTheme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ COLORS: THEMES[themeName], setTheme, themeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);