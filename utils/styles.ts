/**
 * Design System - Reusable elements and utilities
 * 
 * This file provides reusable UI components and style utilities
 * based on the application's theme colors.
 */

import { Platform, StatusBar, StyleSheet } from 'react-native';
import { DarkTheme, LightTheme, Theme } from './theme';

// =========================================
// Color Palette - Direct access to colors
// =========================================
export const Colors = {
  // Core palette
  purple: {
    50: '#f2e6ff',
    100: '#e0ccff',
    200: '#c8aaff',
    300: '#b895fd',
    400: '#a87ffb',
    500: '#8964e8',
    600: '#6f4cde',
    700: '#603bce',
    800: '#4d21bb',
    900: '#340099',
  },
  gray: {
    50: '#fafbfe',
    100: '#f4f7fd',
    200: '#e7ebf2',
    300: '#d9dfe7',
    400: '#bfc7d2',
    500: '#a4afbd',
    600: '#8b98a9',
    700: '#738295',
    800: '#5d6a7d',
    900: '#475365',
    950: '#333e4f',
    1000: '#1f2939',
  },
  success: {
    light: '#17975f',
    dark: '#17b877',
  },
  warning: {
    light: '#df8128',
    dark: '#ffa23e',
  },
  error: {
    light: '#df4047',
    dark: '#f76769',
  },
  info: {
    light: '#5173f1',
    dark: '#708fff',
  },
};

// =========================================
// Theme Context
// =========================================
export type ThemeMode = 'light' | 'dark';

export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'light' ? LightTheme : DarkTheme;
};

// =========================================
// Spacing System
// =========================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// =========================================
// Typography System
// =========================================
export const Typography = {
  fontFamily: {
    regular: 'Montserrat-Regular',
    medium: 'Montserrat-Medium',
    semiBold: 'Montserrat-SemiBold',
    bold: 'Montserrat-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
};

// =========================================
// Border Radius System
// =========================================
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// =========================================
// Shadow System
// =========================================
export const createShadow = (theme: Theme) => ({
  small: {
    shadowColor: theme.ui.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: theme.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: theme.ui.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

// =========================================
// Component Style Creators
// =========================================
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // Container styles
    safeArea:{
        flex: 1,
        backgroundColor: theme.background.primary,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
        padding: Spacing.md,
    },
    card: {
      backgroundColor: theme.background.elevated,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.ui.border,
      ...createShadow(theme).small,
    },
    section: {
      marginVertical: Spacing.md,
    },

    // Text styles
    textH1: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xxxl,
      lineHeight: Typography.lineHeight.xxxl,
      color: theme.text.primary,
    },
    textH2: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xxl,
      lineHeight: Typography.lineHeight.xxl,
      color: theme.text.primary,
    },
    textH3: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.xl,
      lineHeight: Typography.lineHeight.xl,
      color: theme.text.primary,
    },
    textBody: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.md,
      lineHeight: Typography.lineHeight.md,
      color: theme.text.primary,
    },
    textBodySmall: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      lineHeight: Typography.lineHeight.sm,
      color: theme.text.secondary,
    },
    textCaption: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.xs,
      lineHeight: Typography.lineHeight.xs,
      color: theme.text.tertiary,
    },

    // Button styles
    buttonPrimary: {
      backgroundColor: theme.accent.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    buttonText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.md,
      color: theme.background.primary,
    },
    buttonSecondaryText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.md,
      color: theme.accent.primary,
    },
    buttonDisabled: {
      backgroundColor: theme.text.disabled,
      opacity: 0.5,
    },
    
    // Input styles
    input: {
      borderWidth: 1,
      borderColor: theme.ui.border,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.md,
      color: theme.text.primary,
      backgroundColor: theme.background.primary,
    },
    inputFocused: {
      borderColor: theme.accent.primary,
    },
    inputError: {
      borderColor: theme.status.error,
    },
    
    // List item styles
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.ui.divider,
    },

    // Badge styles
    badge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.round,
      backgroundColor: theme.accent.muted,
    },
    badgeText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.xs,
      color: theme.accent.primary,
    },

    // Status indicators
    statusSuccess: {
      backgroundColor: theme.status.success,
    },
    statusWarning: {
      backgroundColor: theme.status.warning,
    },
    statusError: {
      backgroundColor: theme.status.error,
    },
    statusInfo: {
      backgroundColor: theme.status.info,
    },
  });
};





// =========================================
// Usage Example
// =========================================
/**
 * How to use in a component:
 * 
 * import { useColorScheme } from 'react-native';
 * import { getTheme, createStyles } from './designSystem';
 * 
 * const MyComponent = () => {
 *   const colorScheme = useColorScheme() as ThemeMode;
 *   const theme = getTheme(colorScheme);
 *   const styles = createStyles(theme);
 * 
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.textH2}>Hello World</Text>
 *       <TouchableOpacity 
 *         style={styles.buttonPrimary}
 *         activeOpacity={0.8}
 *       >
 *         <Text style={styles.buttonText}>Press Me</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * };
 */