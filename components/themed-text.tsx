import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';


export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'p',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'h1' ? styles.h1 : undefined,
        type === 'h2' ? styles.h2 : undefined,
        type === 'h3' ? styles.h3 : undefined,
        type === 'h4' ? styles.h4 : undefined,
        type === 'p' ? styles.p : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 42,
    fontFamily: 'Geist-ExtraLight',
    lineHeight: 46,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    lineHeight: 24,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Geist-ExtraLight',
    lineHeight: 20,
  },
  h4: {
    fontSize: 16,
    fontFamily: 'Geist-ExtraLight',
    lineHeight: 16,
  },
  p: {
    fontSize: 14,
    fontFamily: 'GeistMono-Light',
    lineHeight: 24,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
