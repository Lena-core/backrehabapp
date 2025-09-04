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

// Альтернативные пути к анимационным файлам (для бэкапа)
const EXERCISE_ANIMATIONS_URI: Record<ExerciseType, string> = {
  curl_up: 'file:///android_asset/animations/curl_up.gif',
  side_plank: 'file:///android_asset/animations/side_plank.gif', 
  bird_dog: 'file:///android_asset/animations/bird_dog.gif',
  walk: 'file:///android_asset/animations/walk.gif',
};

// Пути к анимационным файлам
const EXERCISE_ANIMATIONS: Record<ExerciseType, any> = {
  curl_up: require('../assets/animations/curl_up.gif'),
  side_plank: require('../assets/animations/side_plank.gif'),
  bird_dog: require('../assets/animations/bird_dog.gif'), 
  walk: require('../assets/animations/walk.gif'),
};

// По умолчанию для ошибок загрузки
const DEFAULT_PLACEHOLDER = require('../assets/animations/curl_up.gif');

const EXERCISE_DESCRIPTIONS: Record<ExerciseType, string> = {
  curl_up: `Это упражнение предназначено для тренировки прямой мышцы живота (rectus abdominis). Оно помогает укрепить корпус, обеспечивая при этом минимальную нагрузку на позвоночник.

Исходное положение:
1. Лягте на спину на ровную, твердую поверхность.
2. Согните одну ногу в колене так, чтобы стопа стояла на полу.
3. Разместите обе руки под поясницей ладонями вниз.

Техника выполнения:
1. Напрягите мышцы кора, как будто готовитесь к удару в живот.
2. На выдохе медленно приподнимите голову и плечи от пола.
3. Поднимайтесь только на несколько сантиметров.
4. Избегайте сгибания шеи и не отрывайте поясницу от пола.
5. Задержитесь в верхней точке на 8 секунд.`,

  side_plank: `Это упражнение эффективно укрепляет мышцы-стабилизаторы корпуса, оберегая позвоночник от высоких нагрузок.

Исходное положение:
1. Лягте на бок, опираясь на локоть и предплечье.
2. Локоть должен находиться строго под плечом.
3. Ноги выпрямите.

Техника выполнения:
1. Создайте напряжение в мышцах живота.
2. Медленно поднимите бедра от пола.
3. Ваше тело должно образовать прямую линию от головы до пяток.
4. Не прогибайтесь в пояснице и не позволяйте тазу опускаться.
5. Задержитесь в этом положении на 8 секунд.`,

  bird_dog: `Это упражнение помогает повысить выносливость мышц кора, обеспечивая стабильность позвоночника.

Исходное положение:
1. Встаньте на четвереньки.
2. Руки строго под плечами, колени под бедрами.
3. Спина в нейтральном положении.

Техника выполнения:
1. Напрягите мышцы кора.
2. Медленно вытяните одну руку вперед, а противоположную ногу назад.
3. Не поднимайте конечности слишком высоко.
4. Не допускайте поворота или наклона таза или плеч.
5. Задержитесь в этом положении на 8 секунд.`,

  walk: `Ходьба позволяет обеспечить питание межпозвонковых дисков и восстановить их здоровье.

Техника выполнения:
1. Держите спину прямо в нейтральном положении.
2. Делайте короткие, но быстрые шаги.
3. Двигайте руками в такт ходьбе.
4. Смотрите прямо перед собой.

Длительность: Начните с коротких прогулок по 5-10 минут. Важно, чтобы ходьба не вызывала боль.`,
};

const ExerciseExecutionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseExecutionRouteProp>();
  const { exerciseType, exerciseName } = route.params;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [timer, setTimer] = useState<TimerState>({
    currentTime: 0,
    isRunning: false,
    phase: 'prepare',
    currentSet: 1,
    currentRep: 1,
    instruction: 'Приготовьтесь к выполнению упражнения',
  });

  useEffect(() => {
    loadSettings();
    setupBackHandler();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev.currentTime <= 0) {
            return handleTimerComplete(prev);
          }
          return { ...prev, currentTime: prev.currentTime - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const setupBackHandler = useCallback(() => {
    const backAction = () => {
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

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [timer.isRunning, navigation]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Настройки по умолчанию
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
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const startExercise = () => {
    if (!settings) return;

    if (exerciseType === 'walk') {
      const walkDurationInSeconds = settings.walkSettings.duration * 60; // конвертируем минуты в секунды
      setTimer({
        currentTime: walkDurationInSeconds,
        isRunning: true,
        phase: 'exercise',
        currentSet: 1,
        currentRep: 1,
        instruction: 'Начните ходьбу. Держите спину ровно, смотрите прямо. Делайте короткие шаги.',
      });
    } else {
      const totalSets = settings.exerciseSettings.repsSchema.length;
      setSession({
        exerciseId: exerciseType,
        currentSet: 1,
        totalSets,
        currentRep: 1,
        totalReps: settings.exerciseSettings.repsSchema[0],
        isActive: true,
        isResting: false,
        completedSets: new Array(totalSets).fill(false),
      });

      setTimer({
        currentTime: 3,
        isRunning: true,
        phase: 'prepare',
        currentSet: 1,
        currentRep: 1,
        instruction: getExerciseInstruction(exerciseType, 'prepare', 1, 1),
      });
    }
  };

  const handleTimerComplete = (currentTimer: TimerState): TimerState => {
    if (!settings || !session) {
      // Для упражнения ходьбы session может быть null
      if (exerciseType === 'walk') {
        completeExercise();
        return {
          ...currentTimer,
          isRunning: false,
          phase: 'completed',
          instruction: 'Упражнение завершено. Отлично поработали. Ходьба полезна для вашей спины!',
        };
      }
      return currentTimer;
    }

    const { exerciseSettings } = settings;
    const { repsSchema, holdTime, restTime } = exerciseSettings;

    switch (currentTimer.phase) {
      case 'prepare':
        return {
          ...currentTimer,
          currentTime: holdTime,
          phase: 'exercise',
          instruction: getExerciseInstruction(exerciseType, 'exercise', currentTimer.currentSet, currentTimer.currentRep),
        };

      case 'exercise':
        const isLastRep = currentTimer.currentRep >= repsSchema[currentTimer.currentSet - 1];
        const isLastSet = currentTimer.currentSet >= repsSchema.length;

        if (isLastRep && isLastSet) {
          completeExercise();
          return {
            ...currentTimer,
            isRunning: false,
            phase: 'completed',
            instruction: 'Упражнение завершено. Отлично поработали.',
          };
        } else if (isLastRep) {
          // Переход к отдыху между подходами
          return {
            ...currentTimer,
            currentTime: restTime,
            phase: 'rest',
            instruction: getRestInstruction(exerciseType),
          };
        } else {
          // Следующее повторение
          return {
            ...currentTimer,
            currentTime: holdTime,
            currentRep: currentTimer.currentRep + 1,
            instruction: getExerciseInstruction(exerciseType, 'exercise', currentTimer.currentSet, currentTimer.currentRep + 1),
          };
        }

      case 'rest':
        const nextSet = currentTimer.currentSet + 1;
        return {
          ...currentTimer,
          currentTime: holdTime,
          phase: 'exercise',
          currentSet: nextSet,
          currentRep: 1,
          instruction: getExerciseInstruction(exerciseType, 'exercise', nextSet, 1),
        };

      default:
        return currentTimer;
    }
  };

  const getExerciseInstruction = (type: ExerciseType, phase: string, set: number, rep: number): string => {
    const currentRepsSchema = settings?.exerciseSettings.repsSchema || [3, 2, 1];
    const instructions: Record<ExerciseType, Record<string, string>> = {
      curl_up: {
        prepare: 'Примите исходное положение. Лягте на спину. Согните одну ногу, другую выпрямите. Руки под поясницей, ладонями вниз. Напрягите пресс. Приготовьтесь.',
        exercise: set === 1 && rep === 1 ? 'Начните. Медленно поднимите голову и плечи.' : rep === currentRepsSchema[set - 1] ? 'Последнее повторение в этом подходе. Поднимите голову и плечи.' : 'Поднимите голову и плечи.',
      },
      side_plank: {
        prepare: 'Примите исходное положение. Лягте на бок. Опирайтесь на локоть, расположенный под плечом. Ноги прямые. Приготовьтесь.',
        exercise: set === 1 && rep === 1 ? 'Начните. Поднимите таз, выпрямляя тело в прямую линию.' : rep === currentRepsSchema[set - 1] ? 'Последнее повторение в этом подходе. Поднимите таз.' : 'Поднимите таз.',
      },
      bird_dog: {
        prepare: 'Примите исходное положение на четвереньках. Руки под плечами, колени под бедрами. Спина ровная. Приготовьтесь.',
        exercise: set === 1 && rep === 1 ? 'Начните. Поднимите правую руку и левую ногу.' : rep === currentRepsSchema[set - 1] ? 'Последнее повторение в этом подходе. Поднимите правую руку и левую ногу.' : rep % 2 === 1 ? 'Поднимите правую руку и левую ногу.' : 'Поднимите левую руку и правую ногу.',
      },
      walk: {
        prepare: '',
        exercise: 'Продолжайте ходьбу. Держите спину ровно.',
      },
    };

    return instructions[type]?.[phase] || 'Выполняйте упражнение';
  };

  const getRestInstruction = (type: ExerciseType): string => {
    const restInstructions: Record<ExerciseType, string> = {
      curl_up: 'Отдых. Глубокий вдох.',
      side_plank: 'Отдых. Перевернитесь на другой бок.',
      bird_dog: 'Отдых. Глубокий вдох.',
      walk: '',
    };

    return restInstructions[type] || 'Отдыхайте';
  };

  const completeExercise = async () => {
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
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const repsSchema = settings?.exerciseSettings.repsSchema || [3, 2, 1];

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Заголовок упражнения */}
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

        {/* Индикатор прогресса по подходам */}
        {exerciseType !== 'walk' && (
          <View style={styles.setsProgress}>
            {repsSchema.map((_, index) => (
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

        {/* Параметры упражнения */}
        {exerciseType !== 'walk' ? (
          <View style={styles.parametersContainer}>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Время удержания</Text>
              <Text style={styles.parameterValue}>
                {settings?.exerciseSettings.holdTime || 7} сек
              </Text>
            </View>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Схема</Text>
              <Text style={styles.parameterValue}>
                {repsSchema.join('-')}
              </Text>
            </View>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Отдых</Text>
              <Text style={styles.parameterValue}>
                {settings?.exerciseSettings.restTime || 15} сек
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.parametersContainer}>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Длительность сессии</Text>
              <Text style={styles.parameterValue}>
                {settings?.walkSettings.duration || 5} мин
              </Text>
            </View>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Количество сессий</Text>
              <Text style={styles.parameterValue}>
                {settings?.walkSettings.sessions || 3}
              </Text>
            </View>
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

        {/* Описание упражнения */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {EXERCISE_DESCRIPTIONS[exerciseType]}
          </Text>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  mediaPlaceholder: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.6,
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
  parametersContainer: {
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
