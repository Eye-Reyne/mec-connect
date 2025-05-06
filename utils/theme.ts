
/**
 * This file defines the color theme and font families for the application.
 * The theme is based on the suggested theme in suggestedTheme.md, and the fonts are defined in app.json and app/(admin)/_layout.tsx.
 */

export type BackgroundColor = {
  primary: string;
  secondary: string;
  tertiary: string;
  elevated: string;
};

export type TextColor = {
  primary: string;
  secondary: string;
  tertiary: string;
  disabled: string;
};

export type AccentColor = {
  primary: string;
  secondary: string;
  tertiary: string;
  hover: string;
  muted: string;
};

export type UIElementColor = {
  border: string;
  divider: string;
  focus: string;
  shadow: string;
};

export type StatusColor = {
  success: string;
  warning: string;
  error: string;
  info: string;
};

export type InteractiveStateColor = {
  hover: string;
  active: string;
  focus: string;
};

export type Theme = {
  background: BackgroundColor;
  text: TextColor;
  accent: AccentColor;
  ui: UIElementColor;
  status: StatusColor;
  states: InteractiveStateColor;
};

export const DarkTheme: Theme = {
  background: {
    primary: '#171f2b',
    secondary: '#10151d',
    tertiary: '#1f2939',
    elevated: '#242e3f',
  },
  text: {
    primary: '#d9dfe7',
    secondary: '#a4afbd',
    tertiary: '#8b98a9',
    disabled: '#738295',
  },
  accent: {
    primary: '#a87ffb',
    secondary: '#8964e8',
    tertiary: '#b895fd',
    hover: '#c8aaff',
    muted: '#6f4cde80',
  },
  ui: {
    border: '#333e4f',
    divider: '#475365',
    focus: '#8964e8',
    shadow: '#080a0e4d',
  },
  status: {
    success: '#17b877',
    warning: '#ffa23e',
    error: '#f76769',
    info: '#708fff',
  },
  states: {
    hover: '#1f2939',
    active: '#293444',
    focus: '#340099',
  },
};


export const LightTheme: Theme = {
    background: {
      primary: '#ffffff',
      secondary: '#f4f7fd',
      tertiary: '#fafbfe',
      elevated: '#ffffff',
    },
    text: {
      primary: '#1f2939',
      secondary: '#333e4f',
      tertiary: '#5d6a7d',
      disabled: '#8b98a9',
    },
    accent: {
      primary: '#6f4cde',
      secondary: '#8964e8',
      tertiary: '#a87ffb',
      hover: '#603bce',
      muted: '#a87ffb4d',
    },
    ui: {
      border: '#d9dfe7',
      divider: '#bfc7d2',
      focus: '#8964e8',
      shadow: '#1f293940',
    },
    status: {
      success: '#17975f',
      warning: '#df8128',
      error: '#df4047',
      info: '#5173f1',
    },
    states: {
      hover: '#e7ebf2',
      active: '#d9dfe7',
      focus: '#f2e6ff',
    },
  };