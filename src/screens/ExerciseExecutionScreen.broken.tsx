import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';

import { ExerciseType, RootStackParamList } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { EXERCISE_DESCRIPTIONS } from '../constants/exercises/descriptions';

// Hooks
import { useUserSettings } from '../hooks/useUserSettings';
import { useExerciseTimer } from '../hooks/useExerciseTimer';

// Components  
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { SetsProgress } from '../components/SetsProgress';
import { ExerciseParameters } from '../components/ExerciseParameters';

type ExerciseExecutionRouteProp = RouteProp<RootStackParamList, 'ExerciseExecution'>;

const ExerciseExecutionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseExecutionRouteProp>();
  const { exerciseType, exerciseName } = route.params;

  const { settings, loading: settingsLoading } = useUserSettings();

  const handleExerciseComplete = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      
      if (savedExercises) {
        const exercises = JSON.parse(savedExercises);
        const updatedExercises = exercises.map((ex: any) =>
          ex.id === exerciseType ? { ...ex, completed: true } : ex
        );
        await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
      }

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  }, [exerciseType, navigation]);

  const { timer, startExercise, formatTime } = useExerciseTimer({
    exerciseType,
    settings,
    onComplete: handleExerciseComplete,
  });

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (timer.isRunning) {
          Alert.alert(
            'Прервать упражнение?',
            'Вы уверены, что хотите прервать выполнение упражнения?',
            [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Да', style: 'destructive', onPress: () => navigation.goBack() },
            ]
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [timer.isRunning, navigation])
  );

  if (settingsLoading || !settings) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  const repsSchema = settings.exerciseSettings.repsSchema;

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{exerciseName}</Text>

        <ExerciseAnimation exerciseType={exerciseType} />

        {exerciseType !== 'walk' && (
          <SetsProgress
            totalSets={repsSchema.length}
            currentSet={timer.currentSet}
            isCompleted={timer.phase === 'completed'}
          />
        )}

        <ExerciseParameters settings={settings} exerciseType={exerciseType} />

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {exerciseType === 'walk' 
              ? formatTime(timer.currentTime)
              : timer.currentTime.toString()
            }
          </Text>
          <Text style={styles.instructionText}>{timer.instruction}</Text>
        </View>

        {!timer.isRunning && timer.phase !== 'completed' && (
          <TouchableOpacity style={styles.startButton} onPress={startExercise}>
            <Text style={styles.startButtonText}>СТАРТ</Text>
          </TouchableOpacity>
        )}

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {EXERCISE_DESCRIPTIONS[exerciseType]}
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Приведенная информация носит справочный характер. Если вам требуется 
          медицинская консультация или постановка диагноза, обратитесь к специалисту.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 30,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_ACCENT,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  descriptionContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
});

export default ExerciseExecutionScreen;
