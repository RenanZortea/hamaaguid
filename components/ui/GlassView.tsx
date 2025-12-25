import { View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  contentClassName?: string;
}

export function GlassView({ children, className, style, intensity = 20, tint, contentClassName, ...props }: GlassViewProps) {
  return (
    <View 
      className={`overflow-hidden rounded-3xl border border-gray-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 ${className}`} 
      style={style}
      {...props}
    >
      <View className={contentClassName ?? "p-4"}>
        {children}
      </View>
    </View>
  );
}
