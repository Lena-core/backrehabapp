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
import { getActiveProgram, getActiveProgramExercises, initializePrograms } from '../utils/programLoader';
import { convertProgramExercisesToLegacy } from '../utils/legacyAdapter';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'DayPlan'>;

const EXERCISE_DATA: Record<ExerciseType, { name: string; gif: string }> = {
  curl_up: { name: 'Модифицированное скручивание', gif: 'curl_up.gif' },
  side_plank: { name: 'Боковая планка', gif: 'side_plank.gif' },
  bird_dog: { name: 'Птица-собака', gif: 'cat_dog_2.gif' },
  walk: { name: 'Ходьба', gif: '' },
};

// Преобразование PainLevel в число (1-5) для новой системы
const mapPainLevelToNumber = (painLevel: PainLevel): number => {
  const mapping: Record<PainLevel, number> = {
    'none': 1,
    'mild': 2,
    'moderate': 3,
    'severe': 4,
    'acute': 5,
  };
  return mapping[painLevel] || 1;
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
    if (sessions === 1) {
      return `${duration} мин`;
    }
    return `${sessions} сессии по ${duration} мин каждая`;
  }
  
  const { holdTime, repsSchema, restTime } = settings.exerciseSettings;
  const totalSets = repsSchema.length;
  const setsDescription = repsSchema.join('-');
  
  // Рассчитываем общее время
  const totalReps = repsSchema.reduce((sum, reps) => sum + reps, 0);
  const exerciseTime = totalReps * holdTime;
  const restTimeTotal = (totalSets - 1) * restTime;
  const totalTimeInSeconds = exerciseTime + restTimeTotal + 30; // +30 сек на подготовку
  const totalMinutes = Math.ceil(totalTimeInSeconds / 60);
  
  return `${totalSets} подхода (${setsDescription})\nУдержание: ${holdTime}с, отдых: ${restTime}с\n≈ ${totalMinutes} мин`;
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
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null); // Используем exerciseId вместо ExerciseType
  const [activeProgramName, setActiveProgramName] = useState<string>(''); // Название активной программы

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

      // Загружаем активную программу
      const activeProgram = await getActiveProgram();
      
      if (!activeProgram) {
        console.warn('No active program found, using fallback');
        // Fallback: создаем старый план
        const fallbackExercises = createDayPlan(painLevel, settings);
        setExercises(fallbackExercises);
        setActiveProgramName('Базовая программа');
        return;
      }

      setActiveProgramName(activeProgram.nameRu);

      // Преобразуем painLevel в число (1-5)
      const painLevelNumber = mapPainLevelToNumber(painLevel);

      // Загружаем упражнения из программы (с учетом адаптации по боли)
      const programExercises = await getActiveProgramExercises(painLevelNumber);

      // Загружаем сохраненные упражнения со статусом выполнения
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      let completedExerciseIds: string[] = [];

      if (savedExercises) {
        const oldExercises = JSON.parse(savedExercises);
        completedExerciseIds = oldExercises
          .filter((ex: Exercise) => ex.completed)
          .map((ex: Exercise) => {
            // Если есть extendedData - берем оттуда, иначе используем id
            return ex.extendedData?.exerciseId || ex.id;
          });
      }

      // Преобразуем в старый формат
      const dayExercises = await convertProgramExercisesToLegacy(
        programExercises,
        completedExerciseIds
      );

      // Сохраняем обновленный план
      await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(dayExercises));
      setExercises(dayExercises);
    } catch (error) {
      console.error('Error loading day plan:', error);
      // Fallback план
      setExercises(createDayPlan('none', settings));
      setActiveProgramName('Базовая программа');
    }
  }, [settings]);

  // Функция для принудительного обновления плана
  const refreshDayPlan = useCallback(async () => {
    if (!settings) return;
    
    console.log('Refreshing day plan with settings:', {
      holdTime: settings.exerciseSettings.holdTime,
      repsSchema: settings.exerciseSettings.repsSchema,
      restTime: settings.exerciseSettings.restTime,
      walkDuration: settings.walkSettings.duration,
      walkSessions: settings.walkSettings.sessions
    });
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Получаем текущие упражнения
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      
      if (savedExercises) {
        const currentExercises = JSON.parse(savedExercises);
        
        // Обновляем только описания, сохраняя статус выполнения
        const updatedExercises = currentExercises.map((exercise: Exercise) => ({
          ...exercise,
          description: formatExerciseDescription(exercise.id as ExerciseType, settings)
        }));
        
        console.log('Updated exercise descriptions:', updatedExercises.map(ex => ({ name: ex.name, description: ex.description })));
        
        await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
        setExercises(updatedExercises);
      } else {
        // Если плана нет, создаем новый
        await loadDayPlan();
      }
    } catch (error) {
      console.error('Error refreshing day plan:', error);
    }
  }, [settings, loadDayPlan]);

  // Обновляем план при изменении настроек и возвращении на экран
  useFocusEffect(
    useCallback(() => {
      if (settings) {
        refreshDayPlan();
      }
    }, [refreshDayPlan])
  );

  useEffect(() => {
    if (settings) {
      loadDayPlan();
    }
  }, [settings, loadDayPlan]);

  // Инициализация программ при первом запуске
  useEffect(() => {
    const init = async () => {
      try {
        await initializePrograms();
        console.log('Programs initialized successfully');
      } catch (error) {
        console.error('Error initializing programs:', error);
      }
    };
    init();
  }, []);

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

  const isExerciseCompleted = (exercise: Exercise): boolean => {
    return exercise.completed || false;
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

        {/* Активная программа */}
        {activeProgramName && (
          <View style={styles.programBadge}>
            <Text style={styles.programBadgeText}>🎯 {activeProgramName}</Text>
          </View>
        )}

        {/* Рекомендации */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsText}>
            {PAIN_RECOMMENDATIONS[currentPainLevel]}
          </Text>
        </View>

        {/* Список упражнений */}
        <View style={styles.exercisesContainer}>
          {exercises.map((exercise, index) => (
            <View key={exercise.extendedData?.exerciseId || `${exercise.id}-${index}`} style={styles.exerciseRow}>
              {/* Индикатор прогресса */}
              <View style={styles.progressIndicator}>
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: isExerciseCompleted(exercise)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.SCALE_COLOR,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressCircle,
                    {
                      backgroundColor: isExerciseCompleted(exercise)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.WHITE,
                      borderColor: isExerciseCompleted(exercise)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.SCALE_COLOR,
                    },
                  ]}
                >
                  {isExerciseCompleted(exercise) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>

              {/* Карточка упражнения */}
              <TouchableOpacity
                style={[
                  styles.exerciseCard,
                  selectedExercise === (exercise.extendedData?.exerciseId || exercise.id) && styles.selectedCard,
                ]}
                onPress={() => {
                  const exerciseKey = exercise.extendedData?.exerciseId || exercise.id;
                  setSelectedExercise(
                    selectedExercise === exerciseKey ? null : exerciseKey
                  );
                }}
                disabled={isExerciseCompleted(exercise)}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDescription}>
                    {exercise.description}
                  </Text>
                </View>

                {selectedExercise === (exercise.extendedData?.exerciseId || exercise.id) && !isExerciseCompleted(exercise) && (
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
    marginBottom: 15,
  },
  programBadge: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 10,
    alignItems: 'center',
  },
  programBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
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
    minHeight: 120, // Минимальная высота для многострочного описания
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
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    lineHeight: 18,
    minHeight: 50, // Минимальная высота для 3 строк
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
