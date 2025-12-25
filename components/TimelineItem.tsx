import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { View } from 'react-native';

interface TimelineItemProps {
  children: React.ReactNode;
  isLast?: boolean;
}

export function TimelineItem({ children, isLast = false }: TimelineItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View className="flex-row w-full">
      {/* Timeline Line Column */}
      <View className="items-center mr-4 w-8">
        {/* Circle/Dot */}
        <View className={`w-3 h-3 rounded-full mt-6 ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'}`} />
        
        {/* Vertical Line */}
        {!isLast && (
          <View className={`w-[2px] flex-1 -mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 pb-6 pt-2">
        {children}
      </View>
    </View>
  );
}
