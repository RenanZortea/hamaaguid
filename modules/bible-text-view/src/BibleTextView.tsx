import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';

import { BibleTextViewProps } from './BibleTextView.types';

const NativeView: React.ComponentType<BibleTextViewProps> | null = 
  Platform.OS === 'android' ? requireNativeView('bible-text-view') : null;

export default function BibleTextView(props: BibleTextViewProps) {
  // Fallback to regular Text on iOS/web for now
  if (!NativeView) {
    return (
      <View style={props.style}>
        <Text>Native view not available on this platform</Text>
      </View>
    );
  }
  
  return <NativeView {...props} />;
}
