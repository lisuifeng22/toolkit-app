import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Layout } from '../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
  noBackground?: boolean;
}

export function Card({ children, onPress, style, color, noBackground }: CardProps) {
  const cardStyle = [
    styles.card,
    noBackground && styles.noBg,
    color ? { backgroundColor: color } : undefined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={cardStyle}>
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
  noBg: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
});
