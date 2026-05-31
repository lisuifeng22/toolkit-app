import React from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors, Layout } from '../../constants/Colors';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  noBackground?: boolean;
}

export default function Card({ children, noBackground, style, ...rest }: CardProps) {
  const Component = rest.onPress ? TouchableOpacity : View;
  return (
    <Component style={[styles.card, noBackground && styles.noBg, style]} activeOpacity={0.85} {...rest}>
      {children}
    </Component>
  );
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
