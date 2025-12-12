
import { GlassView } from '@/components/ui/GlassView';
import { Text, View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  title?: string;
  children?: React.ReactNode;
}

export function GlassCard({ title, children, className, ...props }: GlassCardProps) {
  return (
    <GlassView className={`mx-4 my-2 ${className || ''}`} {...props}>
      {title && (
        <View className="flex-row items-center mb-4 opacity-70">
          <Text className="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium text-right w-full">
            {title}
          </Text>
        </View>
      )}
      {children}
    </GlassView>
  );
}
