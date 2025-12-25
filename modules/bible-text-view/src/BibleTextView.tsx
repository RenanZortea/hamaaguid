import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';

import { BibleTextViewProps } from './BibleTextView.types';

const NativeView: React.ComponentType<BibleTextViewProps> | null = 
  Platform.OS === 'android' ? requireNativeView('bible-text-view') : null;

export default function BibleTextView(props: BibleTextViewProps) {
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  const handleContentSizeChange = React.useCallback(
    (event: { nativeEvent: { width: number; height: number } }) => {
      // Handle both nested nativeEvent and direct payload just in case logic varies
      const { width, height } = event.nativeEvent || event;
      console.log('BibleTextView: Size changed', width, height);
      
      if (height > 0) {
        setHeight(height);
      }
      props.onContentSizeChange?.(event);
    },
    [props.onContentSizeChange]
  );

  // Fallback to regular Text on iOS/web for now
  if (!NativeView) {
    return (
      <View style={props.style}>
        <Text>Native view not available on this platform</Text>
      </View>
    );
  }

  return (
    <NativeView
      {...props}
      onContentSizeChange={handleContentSizeChange}
      style={[
        { minHeight: 50 }, 
        props.style, 
        height !== undefined && { height }
      ]}
    />
  );
}
