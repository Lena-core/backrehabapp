import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 20 },
      medium: { paddingVertical: 12, paddingHorizontal: 30 },
      large: { paddingVertical: 16, paddingHorizontal: 40 },
    };

    const variantStyles = {
      primary: { backgroundColor: COLORS.CTA_BUTTON },
      secondary: { backgroundColor: COLORS.PRIMARY_ACCENT },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.CTA_BUTTON,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: 'bold',
      textAlign: 'center',
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantStyles = {
      primary: { color: COLORS.TEXT_PRIMARY },
      secondary: { color: COLORS.TEXT_PRIMARY },
      outline: { color: COLORS.CTA_BUTTON },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? COLORS.CTA_BUTTON : COLORS.TEXT_PRIMARY} 
          size="small" 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
