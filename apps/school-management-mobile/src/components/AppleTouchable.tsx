import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppleSprings } from '../config/theme';

interface AppleTouchableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  enableHaptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'selection';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppleTouchable: React.FC<AppleTouchableProps> = ({
  children,
  style,
  scaleTo = 0.96,
  enableHaptic = true,
  hapticStyle = 'light',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const triggerHaptic = () => {
    if (!enableHaptic || Platform.OS === 'web') return;
    try {
      if (hapticStyle === 'selection') {
        Haptics.selectionAsync();
      } else if (hapticStyle === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // Haptics optional fallback
    }
  };

  const handlePressIn = (event: any) => {
    if (disabled) return;
    triggerHaptic();
    scale.value = withSpring(scaleTo, AppleSprings.snappy);
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (disabled) return;
    scale.value = withSpring(1, AppleSprings.snappy);
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[style, animatedStyle, disabled && styles.disabled]}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
