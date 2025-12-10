import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  contentClassName?: string;
}

export function GlassView({ children, className, style, intensity = 20, tint, contentClassName, ...props }: GlassViewProps) {
  const colorScheme = useColorScheme();
  const effectiveTint = tint || (colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <View 
      className={`overflow-hidden rounded-3xl border border-white/20 bg-white/10 dark:bg-black/10 dark:border-white/10 ${className}`} 
      style={style}
      {...props}
    >
      <BlurView intensity={intensity} tint={effectiveTint} style={StyleSheet.absoluteFill} />
      <View className={contentClassName ?? "p-4"}>
        {children}
      </View>
    </View>
  );
}
