/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { DarkTheme, LightTheme, Theme } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ThemeColorCategory = keyof Theme;
type ThemeColorValue<T extends ThemeColorCategory> = keyof Theme[T];

export function useThemeColor<T extends ThemeColorCategory>(
  props: { light?: string; dark?: string },
  colorCategory: T,
  colorName: ThemeColorValue<T>
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  
  if (colorFromProps) {
    return colorFromProps;
  }

  return theme === 'dark' ? DarkTheme[colorCategory][colorName as keyof Theme[T]] : LightTheme[colorCategory][colorName as keyof Theme[T]];
}