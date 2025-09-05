import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ExerciseType } from '../types';
import { EXERCISE_ANIMATIONS_URI } from '../constants/exercises/animations';
import { COLORS } from '../constants/colors';

interface ExerciseAnimationProps {
  exerciseType: ExerciseType;
  onError?: () => void;
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exerciseType,
  onError,
}) => {
  return (
    <View style={styles.container}>
      <FastImage 
        source={{
          uri: EXERCISE_ANIMATIONS_URI[exerciseType],
          priority: FastImage.priority.high,
        }}
        style={styles.animation}
        resizeMode={FastImage.resizeMode.contain}
        onError={() => {
          console.log('Error loading animation for:', exerciseType);
          onError?.();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
