/**
 * Reusable UI Components
 * 
 * This file provides ready-to-use UI components that implement
 * the design system and automatically handle theming.
 */

import React from 'react';
import {
    ActivityIndicator,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    useColorScheme,
    View,
    ViewStyle
} from 'react-native';
import { BorderRadius, createShadow as createShadowUtil, createStyles, getTheme, Spacing, ThemeMode, Typography } from './styles';
// import { Theme } from './theme';

// =========================================
// Button Components
// =========================================

type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Button = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  ...props
}: ButtonProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  // Determine button style based on variant
  let buttonStyle: ViewStyle = styles.buttonPrimary;
  let textStyle: TextStyle = styles.buttonText;

  if (variant === 'secondary') {
    buttonStyle = styles.buttonSecondary;
    textStyle = styles.buttonSecondaryText;
  } else if (variant === 'text') {
    buttonStyle = {};
    textStyle = { ...styles.buttonSecondaryText, fontFamily: Typography.fontFamily.regular };
  }

  // Determine size
  let sizeStyle: ViewStyle = {};
  let textSizeStyle: TextStyle = {};
  
  if (size === 'small') {
    sizeStyle = {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.xs,
    };
    textSizeStyle = {
      fontSize: Typography.fontSize.sm,
    };
  } else if (size === 'large') {
    sizeStyle = {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
    };
    textSizeStyle = {
      fontSize: Typography.fontSize.lg,
    };
  }

  // Width style
  const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

  // Disabled style
  const disabledStyle: ViewStyle = disabled ? styles.buttonDisabled : {};

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        buttonStyle,
        sizeStyle,
        widthStyle,
        disabledStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? theme.background.primary : theme.accent.primary} 
        />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: Spacing.xs }}>{leftIcon}</View>}
          <Text style={[textStyle, textSizeStyle]}>{title}</Text>
          {rightIcon && <View style={{ marginLeft: Spacing.xs }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

// =========================================
// Text Components
// =========================================

type TextComponentProps = {
  children: React.ReactNode;
  style?: TextStyle;
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'accent';
};

export const Heading1 = ({ children, style, color = 'primary' }: TextComponentProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  const textColor = {
    color: color === 'accent' ? theme.accent.primary : theme.text[color],
  };

  return <Text style={[styles.textH1, textColor, style]}>{children}</Text>;
};

export const Heading2 = ({ children, style, color = 'primary' }: TextComponentProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  const textColor = {
    color: color === 'accent' ? theme.accent.primary : theme.text[color],
  };

  return <Text style={[styles.textH2, textColor, style]}>{children}</Text>;
};

export const Heading3 = ({ children, style, color = 'primary' }: TextComponentProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  const textColor = {
    color: color === 'accent' ? theme.accent.primary : theme.text[color],
  };

  return <Text style={[styles.textH3, textColor, style]}>{children}</Text>;
};

export const BodyText = ({ children, style, color = 'primary' }: TextComponentProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  const textColor = {
    color: color === 'accent' ? theme.accent.primary : theme.text[color],
  };

  return <Text style={[styles.textBody, textColor, style]}>{children}</Text>;
};

export const SmallText = ({ children, style, color = 'secondary' }: TextComponentProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  const textColor = {
    color: color === 'accent' ? theme.accent.primary : theme.text[color],
  };

  return <Text style={[styles.textBodySmall, textColor, style]}>{children}</Text>;
};

export const Caption = ({ children, style, color = 'tertiary' }: TextComponentProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  const textColor = {
    color: color === 'accent' ? theme.accent.primary : theme.text[color],
  };

  return <Text style={[styles.textCaption, textColor, style]}>{children}</Text>;
};

// =========================================
// Input Components
// =========================================

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
};

export const Input = ({ label, error, helper, style, ...props }: InputProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={{ marginBottom: Spacing.md }}>
      {label && (
        <Text style={[styles.textBodySmall, { marginBottom: Spacing.xs }]}>
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.text.disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {error ? (
        <Text style={[styles.textCaption, { color: theme.status.error, marginTop: Spacing.xs }]}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={[styles.textCaption, { marginTop: Spacing.xs }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
};

// =========================================
// Card Component
// =========================================

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'none' | 'small' | 'medium' | 'large';
};

export const Card = ({ children, style, elevation = 'small' }: CardProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);
  const shadows = createShadowUtil(theme);

  let shadowStyle: ViewStyle = {};
  if (elevation === 'small') shadowStyle = shadows.small;
  if (elevation === 'medium') shadowStyle = shadows.medium;
  if (elevation === 'large') shadowStyle = shadows.large;

  return (
    <View style={[styles.card, shadowStyle, style]}>
      {children}
    </View>
  );
};

// =========================================
// Badge Component
// =========================================

type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium'; 
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const Badge = ({ 
  label, 
  variant = 'default', 
  size = 'medium',
  style,
  textStyle
}: BadgeProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  let badgeStyle: ViewStyle = styles.badge;
  let badgeTextStyle: TextStyle = styles.badgeText;

  // Apply variant style
  if (variant === 'success') {
    badgeStyle = { ...badgeStyle, backgroundColor: theme.status.success + '33' }; // 20% opacity
    badgeTextStyle = { ...badgeTextStyle, color: theme.status.success };
  } else if (variant === 'warning') {
    badgeStyle = { ...badgeStyle, backgroundColor: theme.status.warning + '33' };
    badgeTextStyle = { ...badgeTextStyle, color: theme.status.warning };
  } else if (variant === 'error') {
    badgeStyle = { ...badgeStyle, backgroundColor: theme.status.error + '33' };
    badgeTextStyle = { ...badgeTextStyle, color: theme.status.error };
  } else if (variant === 'info') {
    badgeStyle = { ...badgeStyle, backgroundColor: theme.status.info + '33' };
    badgeTextStyle = { ...badgeTextStyle, color: theme.status.info };
  }

  // Apply size style
  const sizeStyle: ViewStyle = size === 'small' 
    ? { paddingVertical: 2, paddingHorizontal: Spacing.xs }
    : {};
  
  const textSizeStyle: TextStyle = size === 'small'
    ? { fontSize: Typography.fontSize.xs - 2 }
    : {};

  return (
    <View style={[badgeStyle, sizeStyle, style]}>
      <Text style={[badgeTextStyle, textSizeStyle, textStyle]}>{label}</Text>
    </View>
  );
};

// =========================================
// Divider Component
// =========================================

type DividerProps = {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
};

export const Divider = ({ 
  orientation = 'horizontal', 
  spacing = 'medium',
  style
}: DividerProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);

  let spacingValue = 0;
  if (spacing === 'small') spacingValue = Spacing.sm;
  if (spacing === 'medium') spacingValue = Spacing.md;
  if (spacing === 'large') spacingValue = Spacing.lg;

  const dividerStyle: ViewStyle = orientation === 'horizontal'
    ? {
        height: 1,
        backgroundColor: theme.ui.divider,
        marginVertical: spacingValue,
      }
    : {
        width: 1,
        backgroundColor: theme.ui.divider,
        marginHorizontal: spacingValue,
        alignSelf: 'stretch',
      };

  return <View style={[dividerStyle, style]} />;
};

// =========================================
// Container Component
// =========================================

type ContainerProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
};

export const Container = ({ 
  children, 
  variant = 'primary',
  padding = 'medium',
  style
}: ContainerProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  let backgroundColor = theme.background.primary;
  if (variant === 'secondary') backgroundColor = theme.background.secondary;
  if (variant === 'tertiary') backgroundColor = theme.background.tertiary;

  let paddingValue = 0;
  if (padding === 'small') paddingValue = Spacing.sm;
  if (padding === 'medium') paddingValue = Spacing.md;
  if (padding === 'large') paddingValue = Spacing.lg;

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor, padding: paddingValue },
        style
      ]}
    >
      {children}
    </View>
  );
};


type HeaderProps = {
  screenName: string;
  onMenuPress: () => void;
};

export const Header = ({ screenName, onMenuPress }: HeaderProps) => {
  const colorScheme = useColorScheme() as ThemeMode || 'light';
  const theme = getTheme(colorScheme);
  const styles = createStyles(theme);

  return (
    <View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: theme.background.elevated,
        borderBottomWidth: 1,
        borderBottomColor: theme.ui.border,
        ...createShadowUtil(theme).small
      }
    ]}>
      <Text style={[
        styles.textH3,
        { color: theme.accent.primary, fontFamily: Typography.fontFamily.bold }
      ]}>
        MEC
      </Text>
      
      <Text style={[
        styles.textH3,
        { color: theme.text.primary }
      ]}>
        {screenName}
      </Text>

      <TouchableOpacity onPress={onMenuPress}>
        <View style={{
          padding: Spacing.xs,
          borderRadius: BorderRadius.round,
          backgroundColor: theme.accent.muted
        }}>
          <Text style={[
            styles.textH3,
            { color: theme.accent.primary }
          ]}>
            ☰
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
