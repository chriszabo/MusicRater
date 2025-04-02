// ThemedStatusBar.js
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../ThemeContext';

const ThemedStatusBar = () => {
  const { COLORS } = useTheme();
  
  return (
    <StatusBar 
      backgroundColor={COLORS.background}
      style={COLORS.isDark ? 'light' : 'dark'}
    />
  );
};

export default ThemedStatusBar;