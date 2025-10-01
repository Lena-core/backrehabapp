// Компонент карточки уровня боли для онбординга

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { PainLevel } from '../types';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface PainLevelCardProps {
  level: PainLevel;
  label: string;
  description: string;
  iconSource: any;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

const PainLevelCard: React.FC<PainLevelCardProps> = ({
  level,
  label,
  description,
  iconSource,
  color,
  isSelected,
  onPress,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isSelected) {
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [isSelected]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: color },
          isSelected && styles.cardSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Иконка */}
        <Image
          source={iconSource}
          style={styles.icon}
          resizeMode="contain"
        />

        {/* Текст */}
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>

        {/* Индикатор выбора */}
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.TEXT_PRIMARY,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  icon: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  description: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    lineHeight: 18,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default PainLevelCard;
