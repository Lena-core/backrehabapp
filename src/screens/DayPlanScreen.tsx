import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { PainLevel, Exercise, ExerciseType, RootStackParamList, UserSettings } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useUserSettings } from '../hooks/useUserSettings';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'DayPlan'>;

const EXERCISE_DATA: Record<ExerciseType, { name: string; gif: string }> = {
  curl_up: { name: 'Модифицированное скручивание', gif: 'curl_up.gif' },
  side_plank: { name: 'Боковая планка', gif: 'side_plank.gif' },
  bird_dog: { name: 'Птица-собака', gif: 'cat_dog_2.gif' },
  walk: { name: 'Ходьба', gif: '' },
};

// Функция расчета времени выполнения упражнения
const calculateExerciseTime = (exerciseType: ExerciseType, settings: UserSettings | null): number => {
  if (!settings) return 180; // По умолчанию 3 минуты
  
  if (exerciseType === 'walk') {
    return settings.walkSettings.duration * 60; // Минуты в секунды
  }
  
  const { holdTime, repsSchema, restTime } = settings.exerciseSettings;
  
  // Рассчитываем общее время:
  // - Время удержания для всех повторений
  // - Время отдыха между подходами
  // - Подготовка (примерно 30 секунд)
  
  const totalReps = repsSchema.reduce((sum, reps) => sum + reps, 0);
  const totalSets = repsSchema.length;
  
  const exerciseTime = totalReps * holdTime; // Время выполнения
  const restTimeTotal = (totalSets - 1) * restTime; // Отдых между подходами
  const preparationTime = 30; // Подготовка
  
  return exerciseTime + restTimeTotal + preparationTime;
};

// Функция форматирования описания времени
const formatExerciseDescription = (exerciseType: ExerciseType, settings: UserSettings | null): string => {
  if (!settings) {
    return exerciseType === 'walk' ? '5 мин' : '3 мин';
  }
  
  if (exerciseType === 'walk') {
    const { duration, sessions } = settings.walkSettings;
    return sessions > 1 ? `${sessions} сессии по ${duration} мин` : `${duration} мин`;
  }
  
  const totalTimeInSeconds = calculateExerciseTime(exerciseType, settings);
  const minutes = Math.round(totalTimeInSeconds / 60);
  
  const { repsSchema } = settings.exerciseSettings;
  const setsDescription = repsSchema.join('-');
  
  return `${minutes} мин (${setsDescription})`;
};

const PAIN_RECOMMENDATIONS: Record<PainLevel, string> = {
  none: `Важно выполнить все упражнения, это укрепит мышцы спины и снизит риск рецидивов в будущем.

Если чувствуете, что нужна дополнительная нагрузка, добавьте одно повторение к каждому подходу. Эта стратегия поможет уменьшить судороги в мышцах спины и повысить выносливость. Никогда не жертвуйте правильной техникой выполнения упражнения ради большего количества повторений.`,
  mild: 'При выполнении упражнений не переусердствуйте, опирайтесь на свои ощущения.',
  moderate: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
  severe: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
  acute: 'Рекомендуется отдохнуть от упражнений и подождать, когда боль снизится. Походите, если состояние это позволяет.',
};

const DayPlanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { settings, loading } = useUserSettings();
  const [currentPainLevel, setCurrentPainLevel] = useState<PainLevel>('none');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);

  const loadDayPlan = useCallback(async () => {
    try {
      // Загружаем текущий уровень боли
      const today = new Date().toISOString().split('T')[0];
      const todayPainStatus = await AsyncStorage.getItem(`painStatus_${today}`);
      let painLevel: PainLevel = 'none';
      
      if (todayPainStatus) {
        painLevel = JSON.parse(todayPainStatus).level;
      } else {
        const lastStatus = await AsyncStorage.getItem('lastPainStatus');
        if (lastStatus) {
          painLevel = JSON.parse(lastStatus).level;
        }
      }
      
      setCurrentPainLevel(painLevel);

      // Загружаем состояние упражнений
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      let dayExercises: Exercise[];

      if (savedExercises) {
        dayExercises = JSON.parse(savedExercises);
        // Обновляем описания на основе текущих настроек
        dayExercises = dayExercises.map(exercise => ({
          ...exercise,
          description: formatExerciseDescription(exercise.id as ExerciseType, settings)
        }));
      } else {
        // Создаем план упражнений на основе уровня боли и настроек
        dayExercises = createDayPlan(painLevel, settings);
        await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(dayExercises));
      }

      setExercises(dayExercises);
    } catch (error) {
      console.error('Error loading day plan:', error);
      // Fallback план
      setExercises(createDayPlan('none', settings));
    }
  }, [settings]);

  // Обновляем план при изменении настроек
  useFocusEffect(
    useCallback(() => {
      if (settings) {
        loadDayPlan();
      }
    }, [settings, loadDayPlan])
  );

  useEffect(() => {
    if (settings) {
      loadDayPlan();
    }
  }, [settings, loadDayPlan]);

  const createDayPlan = (painLevel: PainLevel, userSettings: UserSettings | null = null): Exercise[] => {
    const plan: Exercise[] = [];

    if (painLevel !== 'acute') {
      plan.push({
        id: 'curl_up',
        name: EXERCISE_DATA.curl_up.name,
        description: formatExerciseDescription('curl_up', userSettings),
        completed: false,
        visible: true,
      });

      plan.push({
        id: 'side_plank',
        name: EXERCISE_DATA.side_plank.name,
        description: formatExerciseDescription('side_plank', userSettings),
        completed: false,
        visible: true,
      });

      plan.push({
        id: 'bird_dog',
        name: EXERCISE_DATA.bird_dog.name,
        description: formatExerciseDescription('bird_dog', userSettings),
        completed: false,
        visible: true,
      });
    }

    plan.push({
      id: 'walk',
      name: EXERCISE_DATA.walk.name,
      description: painLevel === 'acute' ? 'По состоянию' : formatExerciseDescription('walk', userSettings),
      completed: false,
      visible: true,
    });

    return plan;
  };

  const startExercise = (exercise: Exercise) => {
    navigation.navigate('ExerciseExecution', {
      exerciseType: exercise.id,
      exerciseName: exercise.name,
    });
  };

  const isExerciseCompleted = (exerciseId: ExerciseType): boolean => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.completed || false;
  };

  // Отображаем индикатор загрузки пока настройки загружаются
  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка плана...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Заголовок */}
        <Text style={styles.title}>План На День</Text>

        {/* Рекомендации */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsText}>
            {PAIN_RECOMMENDATIONS[currentPainLevel]}
          </Text>
        </View>

        {/* Список упражнений */}
        <View style={styles.exercisesContainer}>
          {exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseRow}>
              {/* Индикатор прогресса */}
              <View style={styles.progressIndicator}>
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: isExerciseCompleted(exercise.id)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.SCALE_COLOR,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressCircle,
                    {
                      backgroundColor: isExerciseCompleted(exercise.id)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.WHITE,
                      borderColor: isExerciseCompleted(exercise.id)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.SCALE_COLOR,
                    },
                  ]}
                >
                  {isExerciseCompleted(exercise.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>

              {/* Карточка упражнения */}
              <TouchableOpacity
                style={[
                  styles.exerciseCard,
                  selectedExercise === exercise.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedExercise(
                  selectedExercise === exercise.id ? null : exercise.id
                )}
                disabled={isExerciseCompleted(exercise.id)}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDescription}>
                    {exercise.description}
                  </Text>
                </View>

                {selectedExercise === exercise.id && !isExerciseCompleted(exercise.id) && (
                  <View style={styles.startButtonContainer}>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => startExercise(exercise)}
                    >
                      <Text style={styles.startButtonText}>СТАРТ</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Медицинское предупреждение */}
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
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 30,
  },
  recommendationsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
  },
  exercisesContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  exerciseRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  progressIndicator: {
    alignItems: 'center',
    marginRight: 15,
    marginTop: 10,
  },
  progressLine: {
    width: 3,
    height: 60,
    marginBottom: -30,
  },
  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
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
  },
  cardContent: {
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  startButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
    marginHorizontal: 20,
    marginBottom: 20,
  },
});

export default DayPlanScreen;
