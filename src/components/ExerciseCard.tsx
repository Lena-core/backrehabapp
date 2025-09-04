import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Exercise } from '../types';
import { COLORS } from '../constants/colors';
import CustomButton from './CustomButton';

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  isCompleted: boolean;
  onPress: () => void;
  onStart: () => void;
  style?: ViewStyle;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isSelected,
  isCompleted,
  onPress,
  onStart,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        isCompleted && styles.completedCard,
        style,
      ]}
      onPress={onPress}
      disabled={isCompleted}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.exerciseName, isCompleted && styles.completedText]}>
          {exercise.name}
        </Text>
        <Text style={[styles.exerciseDescription, isCompleted && styles.completedText]}>
          {exercise.description}
        </Text>
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Выполнено</Text>
          </View>
        )}
      </View>

      {isSelected && !isCompleted && (
        <View style={styles.startButtonContainer}>
          <CustomButton
            title="СТАРТ"
            onPress={onStart}
            size="small"
            variant="primary"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    shadowColor: COLORS.PRIMARY_ACCENT,
    shadowOpacity: 0.3,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: COLORS.SCALE_COLOR,
  },
  cardContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    marginBottom: 10,
  },
  completedText: {
    opacity: 0.6,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.PRIMARY_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  startButtonContainer: {
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.SCALE_COLOR,
  },
});

export default ExerciseCard;
