import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Layout } from '../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
  weather?: boolean;
}

export function Card({ children, onPress, style, color, weather }: CardProps) {
  const cardStyle = [
    styles.card,
    weather && styles.weatherCard,
    color ? { backgroundColor: color } : undefined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  weatherCard: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
});
