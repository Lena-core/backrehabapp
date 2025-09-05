import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { ExerciseType, ExerciseSession, UserSettings, RootStackParamList } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';

type ExerciseExecutionRouteProp = RouteProp<RootStackParamList, 'ExerciseExecution'>;

interface TimerState {
  currentTime: number;
  isRunning: boolean;
  phase: 'prepare' | 'exercise' | 'rest' | 'completed';
  currentSet: number;
  currentRep: number;
  instruction: string;
}

// Простые константы - без внешних импортов
const EXERCISE_ANIMATIONS_URI: Record<ExerciseType, string> = {
  curl_up: 'file:///android_asset/animations/curl_up.gif',
  side_plank: 'file:///android_asset/animations/side_plank.gif', 
  bird_dog: 'file:///android_asset/animations/bird_dog.gif',
  walk: 'file:///android_asset/animations/walk.gif',
};

const EXERCISE_DESCRIPTIONS: Record<ExerciseType, string> = {
  curl_up: 'Подъем туловища укрепляет мышцы пресса с минимальной нагрузкой на позвоночник.',
  side_plank: 'Боковая планка развивает мышцы-стабилизаторы корпуса.',
  bird_dog: 'Упражнение птица-собака улучшает координацию и стабильность.',
  walk: 'Ходьба способствует питанию межпозвонковых дисков.',
};

const ExerciseExecutionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseExecutionRouteProp>();
  const { exerciseType, exerciseName } = route.params;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [timer, setTimer] = useState<TimerState>({
    currentTime: 0,
    isRunning: false,
    phase: 'prepare',
    currentSet: 1,
    currentRep: 1,
    instruction: 'Приготовьтесь к выполнению упражнения',
  });

  // Загрузка настроек
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          const defaultSettings: UserSettings = {
            exerciseSettings: {
              holdTime: 7,
              repsSchema: [3, 2, 1],
              restTime: 15,
            },
            walkSettings: {
              duration: 5,
              sessions: 3,
            },
          };
          setSettings(defaultSettings);
          await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Логика таймера
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.currentTime > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, currentTime: prev.currentTime - 1 }));
      }, 1000);
    } else if (timer.isRunning && timer.currentTime === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.currentTime]);

  const handleTimerComplete = async () => {
    if (timer.phase === 'prepare') {
      setTimer(prev => ({
        ...prev,
        currentTime: settings?.exerciseSettings.holdTime || 7,
        phase: 'exercise',
        instruction: 'Выполняйте упражнение',
      }));
    } else if (timer.phase === 'exercise') {
      const repsSchema = settings?.exerciseSettings.repsSchema || [3, 2, 1];
      const isLastRep = timer.currentRep >= repsSchema[timer.currentSet - 1];
      const isLastSet = timer.currentSet >= repsSchema.length;

      if (isLastRep && isLastSet) {
        // Упражнение завершено
        setTimer(prev => ({
          ...prev,
          isRunning: false,
          phase: 'completed',
          instruction: 'Упражнение завершено!',
        }));

        // Сохранение прогресса
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
        } catch (error) {
          console.error('Error saving progress:', error);
        }

        setTimeout(() => navigation.goBack(), 2000);
      } else if (isLastRep) {
        // Переход к следующему подходу
        setTimer(prev => ({
          ...prev,
          currentTime: settings?.exerciseSettings.restTime || 15,
          phase: 'rest',
          currentSet: prev.currentSet + 1,
          currentRep: 1,
          instruction: 'Отдых между подходами',
        }));
      } else {
        // Следующее повторение
        setTimer(prev => ({
          ...prev,
          currentTime: settings?.exerciseSettings.holdTime || 7,
          currentRep: prev.currentRep + 1,
          instruction: 'Продолжайте упражнение',
        }));
      }
    } else if (timer.phase === 'rest') {
      setTimer(prev => ({
        ...prev,
        currentTime: settings?.exerciseSettings.holdTime || 7,
        phase: 'exercise',
        instruction: 'Выполняйте упражнение',
      }));
    }
  };

  const startExercise = () => {
    if (!settings) return;

    if (exerciseType === 'walk') {
      const walkDurationInSeconds = settings.walkSettings.duration * 60;
      setTimer({
        currentTime: walkDurationInSeconds,
        isRunning: true,
        phase: 'exercise',
        currentSet: 1,
        currentRep: 1,
        instruction: 'Начните ходьбу. Держите спину ровно.',
      });
    } else {
      setTimer({
        currentTime: 3,
        isRunning: true,
        phase: 'prepare',
        currentSet: 1,
        currentRep: 1,
        instruction: 'Приготовьтесь к выполнению упражнения',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!settings) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{exerciseName}</Text>

        {/* Анимация упражнения */}
        <View style={styles.mediaContainer}>
          <FastImage 
            source={{
              uri: EXERCISE_ANIMATIONS_URI[exerciseType],
              priority: FastImage.priority.high,
            }}
            style={styles.exerciseAnimation}
            resizeMode={FastImage.resizeMode.contain}
            onError={() => console.log('Error loading animation for:', exerciseType)}
          />
        </View>

        {/* Прогресс подходов */}
        {exerciseType !== 'walk' && (
          <View style={styles.setsProgress}>
            {Array.from({ length: settings.exerciseSettings.repsSchema.length }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.setCircle,
                  {
                    backgroundColor: 
                      index < timer.currentSet - 1 || timer.phase === 'completed'
                        ? COLORS.PRIMARY_ACCENT
                        : index === timer.currentSet - 1
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.WHITE,
                    borderColor: COLORS.PRIMARY_ACCENT,
                  },
                ]}
              >
                {index < timer.currentSet - 1 && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Таймер */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {exerciseType === 'walk' 
              ? formatTime(timer.currentTime)
              : timer.currentTime.toString()
            }
          </Text>
          <Text style={styles.instructionText}>{timer.instruction}</Text>
        </View>

        {/* Кнопка СТАРТ */}
        {!timer.isRunning && timer.phase !== 'completed' && (
          <TouchableOpacity style={styles.startButton} onPress={startExercise}>
            <Text style={styles.startButtonText}>СТАРТ</Text>
          </TouchableOpacity>
        )}

        {/* Описание */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {EXERCISE_DESCRIPTIONS[exerciseType]}
          </Text>
        </View>
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
  mediaContainer: {
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
  exerciseAnimation: {
    width: '100%',
    height: '100%',
  },
  setsProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  setCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default ExerciseExecutionScreen;
