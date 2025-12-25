import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserSettings, ExerciseType } from '../types';
import { COLORS } from '../constants/colors';

interface ExerciseParametersProps {
  settings: UserSettings;
  exerciseType: ExerciseType;
}

export const ExerciseParameters: React.FC<ExerciseParametersProps> = ({
  settings,
  exerciseType,
}) => {
  if (exerciseType === 'walk') {
    return (
      <View style={styles.container}>
        <View style={styles.parameter}>
          <Text style={styles.parameterLabel}>Длительность сессии</Text>
          <Text style={styles.parameterValue}>
            {settings.walkSettings.duration} мин
          </Text>
        </View>
        <View style={styles.parameter}>
          <Text style={styles.parameterLabel}>Количество сессий</Text>
          <Text style={styles.parameterValue}>
            {settings.walkSettings.sessions}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.parameter}>
        <Text style={styles.parameterLabel}>Время удержания</Text>
        <Text style={styles.parameterValue}>
          {settings.exerciseSettings.holdTime} сек
        </Text>
      </View>
      <View style={styles.parameter}>
        <Text style={styles.parameterLabel}>Схема</Text>
        <Text style={styles.parameterValue}>
          {settings.exerciseSettings.repsSchema.join('-')}
        </Text>
      </View>
      <View style={styles.parameter}>
        <Text style={styles.parameterLabel}>Отдых</Text>
        <Text style={styles.parameterValue}>
          {settings.exerciseSettings.restTime} сек
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  parameter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parameterLabel: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
});
