import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
// @ts-ignore - игнорируем типы для react-native-video
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { ExerciseType, ExerciseSession, UserSettings, RootStackParamList, ExerciseProgress, ExerciseButtonState, CompletedExercise } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { EXERCISE_DESCRIPTIONS } from '../constants/exercises/descriptions';
import { useSounds } from '../hooks';
import { useUserSettings } from '../hooks/useUserSettings';
import { saveDayExercise } from '../utils/storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ExerciseExecutionRouteProp = RouteProp<RootStackParamList, 'ExerciseExecution'>;

interface TimerState {
  currentTime: number;
  isRunning: boolean;
  phase: 'prepare' | 'exercise' | 'miniRest' | 'rest' | 'completed' | 'schemeCompleted';
  currentSet: number;
  currentRep: number;
  instruction: string;
  holdSoundPlayed: boolean;
  currentScheme: 1 | 2; // Для bird_dog: 1 = левая рука+правая нога, 2 = правая рука+левая нога
  schemeOneCompleted: boolean; // Завершена ли первая схема
}

// Пути к анимационным файлам
const EXERCISE_ANIMATIONS: Record<ExerciseType, any> = {
  curl_up: require('../assets/videos/curl_up.mp4'),
  side_plank: require('../assets/videos/side_plank.mp4'),
  bird_dog: require('../assets/videos/bird_dog.mp4'), 
  walk: require('../assets/videos/walk.mp4'),
};

// По умолчанию для ошибок загрузки
const DEFAULT_PLACEHOLDER = require('../assets/videos/curl_up.mp4');

// Надписи для каждого упражнения (для walk - старые надписи)
const EXERCISE_INSTRUCTIONS: Record<ExerciseType, Record<string, string>> = {
  curl_up: {
    prepare: 'Приготовьтесь',
    start: 'Поднимите голову и плечи',
    hold: 'Удерживайте положение',
    miniRest: 'Опустите голову и плечи',
    rest: 'Отдых',
    completed: 'Упражнение завершено!'
  },
  side_plank: {
    prepare: 'Приготовьтесь',
    start: 'Поднимите таз вверх',
    hold: 'Удерживайте положение',
    miniRest: 'Опустите таз',
    rest: 'Отдых',
    completed: 'Упражнение завершено!'
  },
  bird_dog: {
    prepare: 'Приготовьтесь',
    start: 'Поднимите руку и ногу',
    startScheme1: 'Поднимите левую руку и правую ногу',
    startScheme2: 'Поднимите правую руку и левую ногу',
    hold: 'Удерживайте положение',
    miniRest: 'Опустите руку и ногу',
    miniRestScheme1: 'Опустите левую руку и правую ногу',
    miniRestScheme2: 'Опустите правую руку и левую ногу',
    rest: 'Отдых',
    schemeCompleted: 'Первая схема завершена! Нажмите СТАРТ для второй схемы',
    completed: 'Упражнение завершено!'
  },
  // Для walk - старые надписи остаются
  walk: {
    prepare: 'Приготовьтесь к выполнению упражнения',
    start: 'Начните ходьбу. Держите спину ровно.',
    hold: 'Продолжайте ходьбу. Держите спину ровно.',
    miniRest: '',
    rest: '',
    completed: 'Упражнение завершено!'
  }
};

const ExerciseExecutionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseExecutionRouteProp>();
  const { exerciseType, exerciseName } = route.params;

  // Хук для управления звуками
  const { playSound, isSoundEnabled, toggleSoundEnabled } = useSounds(exerciseType);
  
  // Используем хук для автоматического обновления настроек
  const { settings } = useUserSettings();
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress | null>(null);
  const [buttonState, setButtonState] = useState<ExerciseButtonState>('start');
  const [timer, setTimer] = useState<TimerState>({
    currentTime: 0,
    isRunning: false,
    phase: 'prepare',
    currentSet: 1,
    currentRep: 1,
    instruction: EXERCISE_INSTRUCTIONS[exerciseType].prepare,
    holdSoundPlayed: false,
    currentScheme: 1,
    schemeOneCompleted: false,
  });

  // Ref для управления видео
  const videoRef = useRef<any>(null);
  
  // Состояние для управления воспроизведением видео
  const [videoDuration, setVideoDuration] = useState(4); // Длительность видео в секундах (теперь 4 сек: 2 вперед + 2 назад)
  const [videoPlaybackState, setVideoPlaybackState] = useState<{
    paused: boolean;
    shouldSeek: boolean;
    seekTime: number;
  }>({
    paused: true,
    shouldSeek: true,
    seekTime: 0,
  });

  // Загрузка прогресса
  useEffect(() => {
    loadExerciseProgress();
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

  // Логика воспроизведения hold.mp3 (только для упражнений, не для ходьбы)
  useEffect(() => {
    if (!timer.isRunning || exerciseType === 'walk') return; // Исключаем ходьбу

    const holdTime = settings?.exerciseSettings.holdTime || 7;
    
    // Воспроизведение hold.mp3 при определенных условиях
    if (timer.phase === 'exercise' && 
        holdTime > 10 && 
        timer.currentTime === holdTime - 5 && 
        !timer.holdSoundPlayed) {
      
      playSound('hold');
      setTimer(prev => ({
        ...prev,
        holdSoundPlayed: true,
        instruction: EXERCISE_INSTRUCTIONS[exerciseType].hold,
      }));
    }
  }, [timer.currentTime, timer.isRunning, timer.phase, timer.holdSoundPlayed, exerciseType, settings, playSound]);

  // Синхронизация видео с фазами таймера (только для curl_up, side_plank, bird_dog)
  useEffect(() => {
    if (exerciseType === 'walk') return; // Для walk оставляем текущее поведение

    switch (timer.phase) {
      case 'prepare':
      case 'rest':
      case 'completed':
      case 'schemeCompleted':
        // Показываем первый кадр
        setVideoPlaybackState({
          paused: true,
          shouldSeek: true,
          seekTime: 0,
        });
        break;

      case 'exercise':
        // Проигрываем видео вперед в начале фазы (первые 2 секунды)
        if (timer.currentTime === (settings?.exerciseSettings.holdTime || 7)) {
          setVideoPlaybackState({
            paused: false,
            shouldSeek: true,
            seekTime: 0,
          });
        }
        break;

      case 'miniRest':
        // Проигрываем вторую половину видео (реверс, с 2 до 4 сек)
        if (timer.currentTime === 3) {
          setVideoPlaybackState({
            paused: false,
            shouldSeek: true,
            seekTime: 2, // Начинаем со 2 секунды
          });
        }
        break;
    }
  }, [timer.phase, timer.currentTime, exerciseType, settings]);

  // Функции для сохранения промежуточного состояния упражнений
  const saveExerciseProgress = async (progress: Partial<ExerciseProgress>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `exercise_progress_${exerciseType}_${today}`;
      
      const fullProgress: ExerciseProgress = {
        exerciseType,
        completedSets: progress.completedSets || 0,
        currentSet: progress.currentSet || 1,
        currentRep: progress.currentRep || 1,
        timestamp: Date.now(),
        ...(exerciseType === 'bird_dog' && {
          currentScheme: progress.currentScheme || 1,
          schemeOneCompleted: progress.schemeOneCompleted || false
        })
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(fullProgress));
      setExerciseProgress(fullProgress);
      console.log(`Промежуточное состояние ${exerciseType} сохранено:`, fullProgress);
    } catch (error) {
      console.error('Error saving exercise progress:', error);
    }
  };

  const loadExerciseProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Проверяем, завершено ли упражнение полностью
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      if (savedExercises) {
        const exercises = JSON.parse(savedExercises);
        const currentExercise = exercises.find((ex: any) => ex.id === exerciseType);
        if (currentExercise?.completed) {
          setButtonState('completed');
          setTimer(prev => ({
            ...prev,
            phase: 'completed',
            instruction: EXERCISE_INSTRUCTIONS[exerciseType].completed,
          }));
          return;
        }
      }
      
      // Проверяем промежуточное состояние
      const key = `exercise_progress_${exerciseType}_${today}`;
      const savedProgress = await AsyncStorage.getItem(key);
      
      if (savedProgress) {
        const progress: ExerciseProgress = JSON.parse(savedProgress);
        // Проверяем, что состояние сохранено сегодня (макс 24 часа)
        const hoursDiff = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setExerciseProgress(progress);
          setButtonState('continue');
          
          // Особая логика для bird_dog
          if (exerciseType === 'bird_dog' && progress.schemeOneCompleted) {
            setTimer(prev => ({
              ...prev,
              phase: 'schemeCompleted',
              schemeOneCompleted: true,
              currentScheme: 2,
              instruction: EXERCISE_INSTRUCTIONS[exerciseType].schemeCompleted,
            }));
          }
          
          console.log(`Промежуточное состояние ${exerciseType} восстановлено:`, progress);
        } else {
          // Удаляем устаревшее состояние
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error loading exercise progress:', error);
    }
  };

  const clearExerciseProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `exercise_progress_${exerciseType}_${today}`;
      await AsyncStorage.removeItem(key);
      setExerciseProgress(null);
      console.log(`Промежуточное состояние ${exerciseType} очищено`);
    } catch (error) {
      console.error('Error clearing exercise progress:', error);
    }
  };

  const handleTimerComplete = async () => {
    // Для ходьбы - простая логика (старая)
    if (exerciseType === 'walk') {
      playSound('completed'); // Проигрываем complete.mp3
      setTimer(prev => ({
        ...prev,
        isRunning: false,
        phase: 'completed',
        currentTime: 0,
        instruction: 'Упражнение завершено!',
      }));

      // Сохранение прогресса для ходьбы
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
        
      // Сохранение выполненного упражнения в историю
        const completedExercise: CompletedExercise = {
              exerciseId: exerciseType,
              exerciseName: exerciseName,
              completedAt: new Date().toISOString(),
              holdTime: 0, // Для ходьбы не используется
              repsSchema: [],
              restTime: 0,
              totalSets: 1,
            };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving progress:', error);
          }

      // Очищаем промежуточное состояние для ходьбы
      await clearExerciseProgress();
      setButtonState('completed');
      setTimeout(() => navigation.goBack(), 2000);
      return;
    }

    // Для остальных упражнений - новая логика
    const repsSchema = settings?.exerciseSettings.repsSchema || [3, 2, 1];
    const holdTime = settings?.exerciseSettings.holdTime || 7;
    const restTime = settings?.exerciseSettings.restTime || 15;

    if (timer.phase === 'prepare') {
      // Переход от подготовки к упражнению
      playSound('start');
      const instruction = exerciseType === 'bird_dog' 
        ? (timer.currentScheme === 1 
            ? EXERCISE_INSTRUCTIONS[exerciseType].startScheme1 
            : EXERCISE_INSTRUCTIONS[exerciseType].startScheme2)
        : EXERCISE_INSTRUCTIONS[exerciseType].start;
      
      setTimer(prev => ({
        ...prev,
        currentTime: holdTime,
        phase: 'exercise',
        instruction,
        holdSoundPlayed: false,
      }));
    } 
    else if (timer.phase === 'exercise') {
      // Упражнение завершено
      const isLastRep = timer.currentRep >= repsSchema[timer.currentSet - 1];
      const isLastSet = timer.currentSet >= repsSchema.length;

      if (isLastRep && isLastSet) {
        // Последняя схема завершена
        if (exerciseType === 'bird_dog' && timer.currentScheme === 1) {
          // Первая схема bird_dog завершена
          playSound('rest');
          setTimer(prev => ({
            ...prev,
            isRunning: false,
            phase: 'schemeCompleted',
            currentTime: 0,
            instruction: EXERCISE_INSTRUCTIONS[exerciseType].schemeCompleted,
            schemeOneCompleted: true,
          }));
          
          // Сохраняем завершённую первую схему в историю
          try {
            const completedExercise: CompletedExercise = {
              exerciseId: exerciseType,
              exerciseName: `${exerciseName} (схема 1)`,
              completedAt: new Date().toISOString(),
              holdTime: settings.exerciseSettings.holdTime,
              repsSchema: settings.exerciseSettings.repsSchema,
              restTime: settings.exerciseSettings.restTime,
              totalSets: repsSchema.length, // Все подходы первой схемы
            };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving scheme 1:', error);
          }
          
          // Сохраняем промежуточное состояние bird_dog
          await saveExerciseProgress({
            completedSets: repsSchema.length, // Все подходы первой схемы завершены
            currentSet: 1,
            currentRep: 1,
            currentScheme: 1,
            schemeOneCompleted: true
          });
        } else {
          // Все упражнения завершены
          playSound('completed');
          setTimer(prev => ({
            ...prev,
            isRunning: false,
            phase: 'completed',
            currentTime: 0,
            instruction: EXERCISE_INSTRUCTIONS[exerciseType].completed,
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
            
            // Сохранение выполненного упражнения в историю
            const totalSets = exerciseType === 'bird_dog' 
              ? settings.exerciseSettings.repsSchema.length // Для bird_dog - только вторая схема
              : settings.exerciseSettings.repsSchema.length;
            
            const completedExerciseName = exerciseType === 'bird_dog'
              ? `${exerciseName} (схема 2)`
              : exerciseName;
            
            const completedExercise: CompletedExercise = {
              exerciseId: exerciseType,
              exerciseName: completedExerciseName,
              completedAt: new Date().toISOString(),
              holdTime: settings.exerciseSettings.holdTime,
              repsSchema: settings.exerciseSettings.repsSchema,
              restTime: settings.exerciseSettings.restTime,
              totalSets: totalSets,
            };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving progress:', error);
          }

          // Очищаем промежуточное состояние при полном завершении
          await clearExerciseProgress();
          setButtonState('completed');
          setTimeout(() => navigation.goBack(), 2000);
        }
      } 
      else if (isLastRep) {
        // Последнее повторение в подходе, переход к отдыху между подходами
        playSound('rest');
        setTimer(prev => ({
          ...prev,
          currentTime: restTime,
          phase: 'rest',
          instruction: EXERCISE_INSTRUCTIONS[exerciseType].rest,
        }));
        
        // Сохраняем выполненный подход в историю
        try {
          const completedExercise: CompletedExercise = {
            exerciseId: exerciseType,
            exerciseName: exerciseName,
            completedAt: new Date().toISOString(),
            holdTime: settings.exerciseSettings.holdTime,
            repsSchema: settings.exerciseSettings.repsSchema,
            restTime: settings.exerciseSettings.restTime,
            totalSets: 1, // Один подход завершён
          };
          await saveDayExercise(completedExercise);
        } catch (error) {
          console.error('Error saving completed set:', error);
        }
        
        // Сохраняем прогресс после завершения подхода
        await saveExerciseProgress({
          completedSets: timer.currentSet, // Количество завершенных подходов
          currentSet: timer.currentSet + 1, // Следующий подход
          currentRep: 1,
          ...(exerciseType === 'bird_dog' && {
            currentScheme: timer.currentScheme,
            schemeOneCompleted: timer.schemeOneCompleted
          })
        });
      } 
      else {
        // Не последнее повторение, переход к мини-отдыху
        playSound('finish');
        const instruction = exerciseType === 'bird_dog' 
          ? (timer.currentScheme === 1 
              ? EXERCISE_INSTRUCTIONS[exerciseType].miniRestScheme1 
              : EXERCISE_INSTRUCTIONS[exerciseType].miniRestScheme2)
          : EXERCISE_INSTRUCTIONS[exerciseType].miniRest;
        
        setTimer(prev => ({
          ...prev,
          currentTime: 3,
          phase: 'miniRest',
          instruction,
        }));
      }
    } 
    else if (timer.phase === 'miniRest') {
      // Мини-отдых завершен, переход к следующему повторению
      playSound('start');
      const instruction = exerciseType === 'bird_dog' 
        ? (timer.currentScheme === 1 
            ? EXERCISE_INSTRUCTIONS[exerciseType].startScheme1 
            : EXERCISE_INSTRUCTIONS[exerciseType].startScheme2)
        : EXERCISE_INSTRUCTIONS[exerciseType].start;
      
      setTimer(prev => ({
        ...prev,
        currentTime: holdTime,
        phase: 'exercise',
        currentRep: prev.currentRep + 1,
        instruction,
        holdSoundPlayed: false,
      }));
    } 
    else if (timer.phase === 'rest') {
      // Отдых между подходами завершен, переход к подготовке следующего подхода
      playSound('prepare');
      setTimer(prev => ({
        ...prev,
        currentTime: 5,
        phase: 'prepare',
        currentSet: prev.currentSet + 1,
        currentRep: 1,
        instruction: EXERCISE_INSTRUCTIONS[exerciseType].prepare,
      }));
    }
  };

  const startExercise = () => {
    if (!settings) return;

    if (exerciseType === 'walk') {
      // Для ходьбы оставляем старую простую логику
      const walkDurationInSeconds = settings.walkSettings.duration * 60;
      playSound('start'); // Проигрываем walk_start.mp3
      setTimer({
        currentTime: walkDurationInSeconds,
        isRunning: true,
        phase: 'exercise', // Сразу в фазу упражнения
        currentSet: 1,
        currentRep: 1,
        instruction: 'Начните ходьбу. Держите спину ровно.',
        holdSoundPlayed: false,
        currentScheme: 1,
        schemeOneCompleted: false,
      });
    } else if (exerciseType === 'bird_dog' && timer.schemeOneCompleted) {
      // Начало второй схемы bird_dog
      playSound('prepare');
      setTimer(prev => ({
        ...prev,
        currentTime: 5,
        isRunning: true,
        phase: 'prepare',
        currentSet: 1,
        currentRep: 1,
        currentScheme: 2,
        instruction: EXERCISE_INSTRUCTIONS[exerciseType].prepare,
        holdSoundPlayed: false,
      }));
    } else if (buttonState === 'continue' && exerciseProgress) {
      // Продолжаем с сохраненного места
      playSound('prepare');
      setTimer({
        currentTime: 5,
        isRunning: true,
        phase: 'prepare',
        currentSet: exerciseProgress.currentSet,
        currentRep: exerciseProgress.currentRep,
        instruction: EXERCISE_INSTRUCTIONS[exerciseType].prepare,
        holdSoundPlayed: false,
        currentScheme: exerciseProgress.currentScheme || 1,
        schemeOneCompleted: exerciseProgress.schemeOneCompleted || false,
      });
    } else {
      // Для остальных случаев - новое упражнение
      playSound('prepare');
      setTimer({
        currentTime: 5, // Подготовка всегда 5 секунд
        isRunning: true,
        phase: 'prepare',
        currentSet: 1,
        currentRep: 1,
        instruction: EXERCISE_INSTRUCTIONS[exerciseType].prepare,
        holdSoundPlayed: false,
        currentScheme: 1,
        schemeOneCompleted: false,
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Обработчики для видео
  const handleVideoLoad = (data: any) => {
    if (exerciseType === 'walk') return;
    setVideoDuration(data.duration);
    console.log('Video loaded, duration:', data.duration);
  };

  const handleVideoProgress = (data: any) => {
    if (exerciseType === 'walk') return;
    
    const currentTime = data.currentTime;
    
    // Во время exercise: остановить видео на 2 секунде (последний кадр первой половины)
    if (timer.phase === 'exercise' && !videoPlaybackState.paused && currentTime >= 2) {
      setVideoPlaybackState(prev => ({
        ...prev,
        paused: true,
        shouldSeek: false,
        seekTime: 2,
      }));
    }
  };

  const handleVideoEnd = () => {
    if (exerciseType === 'walk') return;
    
    // Видео закончилось (дошло до 4 сек) - это конец miniRest
    // Возвращаемся на первый кадр
    if (timer.phase === 'miniRest' && !videoPlaybackState.paused) {
      setVideoPlaybackState({
        paused: true,
        shouldSeek: true,
        seekTime: 0,
      });
    }
  };

  // Выполнение seek когда нужно
  useEffect(() => {
    if (exerciseType === 'walk') return;
    
    if (videoPlaybackState.shouldSeek && videoRef.current) {
      videoRef.current.seek(videoPlaybackState.seekTime);
      setVideoPlaybackState(prev => ({ ...prev, shouldSeek: false }));
    }
  }, [videoPlaybackState.shouldSeek, videoPlaybackState.seekTime, exerciseType]);

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
    <View style={styles.container}>
      {/* Фоновое видео на весь экран */}
      <View style={styles.gifContainer}>
        <Video
          ref={videoRef}
          source={EXERCISE_ANIMATIONS[exerciseType] || DEFAULT_PLACEHOLDER}
          style={styles.backgroundGif}
          resizeMode="contain"
          repeat={exerciseType === 'walk'}
          muted={true}
          paused={exerciseType === 'walk' ? false : videoPlaybackState.paused}
          poster=""
          ignoreSilentSwitch="ignore"
          playWhenInactive={true}
          playInBackground={false}
          onLoad={handleVideoLoad}
          onProgress={handleVideoProgress}
          onEnd={handleVideoEnd}
          onError={(error) => console.log('Video error:', error)}
          progressUpdateInterval={50}
        />
        
        {/* Градиент-виньетка на весь экран */}
        {exerciseType === 'walk' ? (
          // Для квадратного видео walk - более длинный плавный переход
          <LinearGradient
            colors={[
              'rgba(147, 148, 143, 1)',     // Непрозрачный вверху
              'rgba(147, 148, 143, 0.95)',  // Промежуточная прозрачность
              'rgba(147, 148, 143, 0)',     // Полностью прозрачный
              'rgba(147, 148, 143, 0)',     // Прозрачный в центре
              'rgba(147, 148, 143, 0)',     // Полностью прозрачный
              'rgba(147, 148, 143, 0.95)',  // Промежуточная прозрачность
              'rgba(147, 148, 143, 1)'      // Непрозрачный внизу
            ]}
            locations={[0, 0.25, 0.3, 0.5, 0.7, 0.75, 1]}
            style={styles.gradientVignette}
            pointerEvents="none"
          />
        ) : (
          // Для 16:9 видео (curl_up, side_plank, bird_dog) - короткий плавный переход
          <LinearGradient
            colors={[
              'rgba(147, 148, 143, 1)',     // Непрозрачный вверху
              'rgba(147, 148, 143, 0.95)',  // Промежуточная прозрачность
              'rgba(147, 148, 143, 0)',     // Полностью прозрачный
              'rgba(147, 148, 143, 0)',     // Прозрачный в центре
              'rgba(147, 148, 143, 0)',     // Полностью прозрачный
              'rgba(147, 148, 143, 0.95)',  // Промежуточная прозрачность
              'rgba(147, 148, 143, 1)'      // Непрозрачный внизу
            ]}
            locations={[0, 0.35, 0.37, 0.5, 0.63, 0.65, 1]}
            style={styles.gradientVignette}
            pointerEvents="none"
          />
        )}
        
        {/* Дополнительное затемнение краёв экрана (виньетка для UI) */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.4)',      // Затемнение сверху
            'rgba(0, 0, 0, 0.2)',      // Промежуточное
            'rgba(0, 0, 0, 0)',        // Прозрачный
            'rgba(0, 0, 0, 0)',        // Прозрачный в центре
            'rgba(0, 0, 0, 0)',        // Прозрачный
            'rgba(0, 0, 0, 0.2)',      // Промежуточное
            'rgba(0, 0, 0, 0.4)'       // Затемнение снизу
          ]}
          locations={[0, 0.08, 0.15, 0.5, 0.85, 0.92, 1]}
          style={styles.gradientVignette}
          pointerEvents="none"
        />
      </View>
      
      <View style={styles.contentOverlay}>
        {/* Заголовок упражнения с иконкой информации - ВВЕРХУ */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.titleWithInfoContainer}
            onPress={() => setShowDescriptionModal(true)}
          >
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.infoIcon}>ⓘ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.soundToggle, { backgroundColor: isSoundEnabled ? COLORS.PRIMARY_ACCENT : COLORS.SECONDARY_ACCENT }]}
            onPress={toggleSoundEnabled}
          >
            <Text style={styles.soundToggleText}>
              {isSoundEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Нижний контент */}
        <View style={styles.bottomContent}>
          {/* КНОПКА СТАРТ/ПРОДОЛЖИТЬ/ВЫПОЛНЕНО */}
          {((timer.phase === 'prepare' && !timer.isRunning) || timer.phase === 'schemeCompleted') && buttonState !== 'completed' && (
            <View style={styles.timerContainer}>
              <TouchableOpacity style={styles.startButton} onPress={startExercise}>
                <Text style={styles.startButtonText}>
                  {buttonState === 'continue' ? 'ПРОДОЛЖИТЬ' : 'СТАРТ'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* НАДПИСЬ ВЫПОЛНЕНО */}
          {buttonState === 'completed' && (
            <View style={styles.timerContainer}>
              <Text style={[styles.startButtonText, { fontSize: 24, color: COLORS.PRIMARY_ACCENT }]}>
                ВЫПОЛНЕНО
              </Text>
            </View>
          )}

          {/* ТАЙМЕР (показывается после нажатия СТАРТ) */}
          {(timer.isRunning || timer.phase === 'completed') && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {exerciseType === 'walk' 
                  ? formatTime(timer.currentTime)
                  : timer.currentTime.toString()
                }
              </Text>
              <Text style={styles.instructionText}>{timer.instruction}</Text>
            </View>
          )}

          {/* Прогресс подходов */}
          {exerciseType !== 'walk' && (
            <View>
              {/* Для bird_dog - отображаем два ряда */}
              {exerciseType === 'bird_dog' ? (
                <View>
                  {/* Первая схема: левая рука + правая нога */}
                  <View style={styles.schemeContainer}>
                    <Text style={styles.schemeLabel}>Левая рука + правая нога</Text>
                    <View style={styles.setsProgress}>
                      {Array.from({ length: settings.exerciseSettings.repsSchema.length }, (_, index) => (
                        <View
                          key={`scheme1-${index}`}
                          style={[
                            styles.setCircle,
                            {
                              backgroundColor: 
                                (timer.schemeOneCompleted) ||
                                (exerciseProgress?.schemeOneCompleted) ||
                                (timer.currentScheme === 1 && index < timer.currentSet - 1) ||
                                (timer.currentScheme === 1 && index < (exerciseProgress?.completedSets || 0))
                                  ? COLORS.PRIMARY_ACCENT
                                  : (timer.currentScheme === 1 && index === timer.currentSet - 1 && timer.isRunning)
                                  ? COLORS.PRIMARY_ACCENT
                                  : COLORS.WHITE,
                              borderColor: COLORS.PRIMARY_ACCENT,
                            },
                          ]}
                        >
                          {((timer.schemeOneCompleted) ||
                            (exerciseProgress?.schemeOneCompleted) ||
                            (timer.currentScheme === 1 && index < timer.currentSet - 1) ||
                            (timer.currentScheme === 1 && index < (exerciseProgress?.completedSets || 0))) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Вторая схема: правая рука + левая нога */}
                  <View style={styles.schemeContainer}>
                    <Text style={styles.schemeLabel}>Правая рука + левая нога</Text>
                    <View style={styles.setsProgress}>
                      {Array.from({ length: settings.exerciseSettings.repsSchema.length }, (_, index) => (
                        <View
                          key={`scheme2-${index}`}
                          style={[
                            styles.setCircle,
                            {
                              backgroundColor: 
                                (timer.phase === 'completed') ||
                                (timer.currentScheme === 2 && index < timer.currentSet - 1) ||
                                (timer.currentScheme === 2 && index < (exerciseProgress?.completedSets || 0))
                                  ? COLORS.PRIMARY_ACCENT
                                  : (timer.currentScheme === 2 && index === timer.currentSet - 1 && timer.isRunning)
                                  ? COLORS.PRIMARY_ACCENT
                                  : COLORS.WHITE,
                              borderColor: COLORS.PRIMARY_ACCENT,
                            },
                          ]}
                        >
                          {((timer.phase === 'completed') ||
                            (timer.currentScheme === 2 && index < timer.currentSet - 1) ||
                            (timer.currentScheme === 2 && index < (exerciseProgress?.completedSets || 0))) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                /* Для остальных упражнений - обычный ряд */
                <View style={styles.setsProgress}>
                  {Array.from({ length: settings.exerciseSettings.repsSchema.length }, (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.setCircle,
                        {
                          backgroundColor: 
                            (index < (exerciseProgress?.completedSets || 0)) || 
                            (index < timer.currentSet - 1) || 
                            timer.phase === 'completed'
                              ? COLORS.PRIMARY_ACCENT
                              : (index === timer.currentSet - 1 && timer.isRunning)
                              ? COLORS.PRIMARY_ACCENT
                              : COLORS.WHITE,
                          borderColor: COLORS.PRIMARY_ACCENT,
                        },
                      ]}
                    >
                      {((index < (exerciseProgress?.completedSets || 0)) || 
                        (index < timer.currentSet - 1) || 
                        timer.phase === 'completed') && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Параметры упражнения */}
          <View style={styles.parametersContainer}>
            {exerciseType !== 'walk' ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
          </View>

          {/* Медицинское предупреждение */}
          <Text style={styles.disclaimer}>
            Приведенная информация носит справочный характер. Если вам требуется 
            медицинская консультация или постановка диагноза, обратитесь к специалисту.
          </Text>
        </View>
      </View>

      {/* Модальное окно с описанием упражнения */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Описание упражнения</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDescriptionModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalDescriptionText}>
                {EXERCISE_DESCRIPTIONS[exerciseType]}
              </Text>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDescriptionModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#93948f', // Серый фон как у видео
  },
  gifContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 0,
  },
  backgroundGif: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  contentOverlay: {
    flex: 1,
    position: 'relative',
    zIndex: 3,
  },
  gradientVignette: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
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
  headerContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20,
    zIndex: 4,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleWithInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoIcon: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  soundToggle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  soundToggleText: {
    fontSize: 20,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    zIndex: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.WHITE,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 1,
  },
  setsProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  schemeContainer: {
    marginBottom: 15,
  },
  schemeLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  setCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  parametersContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  parameter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parameterLabel: {
    fontSize: 14,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disclaimer: {
    fontSize: 10,
    color: COLORS.WHITE,
    textAlign: 'center',
    lineHeight: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Стили для модального окна
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 0,
    maxHeight: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SCALE_COLOR,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.SCALE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  modalDescriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_PRIMARY,
    padding: 20,
  },
  modalCloseButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});

export default ExerciseExecutionScreen;