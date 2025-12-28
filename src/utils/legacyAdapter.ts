/**
 * Адаптер для обратной совместимости
 * Преобразует новые типы данных (TrainingProgram, ProgramExercise) в старые (Exercise, UserSettings)
 */

import { 
  Exercise, 
  ExerciseType,
  ProgramExercise,
  ExtendedExerciseSettings,
  ExerciseInfo,
} from '../types';
import { getExerciseById } from '../constants/exercises/exercisesData';

/**
 * Преобразует настройки упражнения в описание для отображения
 */
export const formatExerciseDescriptionFromSettings = (
  exerciseInfo: ExerciseInfo,
  settings: ExtendedExerciseSettings
): string => {
  const { executionType } = exerciseInfo;

  switch (executionType) {
    case 'hold':
    case 'reps': {
      const { holdTime = 8, repsSchema = [3, 2, 1], restTime = 15 } = settings;
      const totalSets = repsSchema.length;
      const setsDescription = repsSchema.join('-');
      
      // Рассчитываем общее время
      const totalReps = repsSchema.reduce((sum, reps) => sum + reps, 0);
      const exerciseTime = totalReps * holdTime;
      const restTimeTotal = (totalSets - 1) * restTime;
      const totalTimeInSeconds = exerciseTime + restTimeTotal + 30; // +30 сек на подготовку
      const totalMinutes = Math.ceil(totalTimeInSeconds / 60);
      
      return `${totalSets} подхода (${setsDescription})\nУдержание: ${holdTime}с, отдых: ${restTime}с\n≈ ${totalMinutes} мин`;
    }

    case 'walk': {
      const { walkDuration = 5, walkSessions = 1 } = settings;
      if (walkSessions === 1) {
        return `${walkDuration} мин`;
      }
      return `${walkSessions} сессии по ${walkDuration} мин каждая`;
    }

    case 'foam_rolling': {
      const { rollingDuration = 60, rollingSessions = 1 } = settings;
      const totalTime = (rollingDuration * rollingSessions) / 60;
      return `${rollingSessions} сессия${rollingSessions > 1 ? 'и' : ''} по ${rollingDuration}с\n≈ ${Math.ceil(totalTime)} мин`;
    }

    case 'dynamic': {
      const { dynamicReps = 10, dynamicSets = 3 } = settings;
      const totalTime = Math.ceil((dynamicReps * dynamicSets * 3) / 60); // ~3 сек на повторение
      return `${dynamicSets} подхода по ${dynamicReps} повторений\n≈ ${totalTime} мин`;
    }

    default:
      return '3 мин';
  }
};

/**
 * Преобразует ProgramExercise в старый формат Exercise
 */
export const convertProgramExerciseToLegacy = (
  programExercise: ProgramExercise,
  completed: boolean = false
): Exercise | null => {
  const exerciseInfo = getExerciseById(programExercise.exerciseId);
  
  if (!exerciseInfo) {
    console.warn(`Exercise not found: ${programExercise.exerciseId}`);
    return null;
  }

  return {
    id: programExercise.exerciseId, // ИСПРАВЛЕНО: используем exerciseId напрямую
    name: exerciseInfo.nameRu,
    description: formatExerciseDescriptionFromSettings(exerciseInfo, programExercise.settings),
    completed,
    visible: programExercise.isEnabled,
    // Добавляем расширенные данные для нового функционала
    extendedData: {
      exerciseId: programExercise.exerciseId,
      exerciseInfo,
      settings: programExercise.settings,
    },
  };
};

/**
 * Маппинг новых ID упражнений на старые ExerciseType для обратной совместимости
 * Только для 4 старых упражнений
 */
const mapToLegacyExerciseId = (newExerciseId: string): ExerciseType => {
  const mapping: Record<string, ExerciseType> = {
    'curl_up': 'curl_up',
    'side_plank': 'side_plank',
    'side_plank_lvl2': 'side_plank',
    'side_plank_lvl3': 'side_plank',
    'bird_dog': 'bird_dog',
    'walk': 'walk',
  };

  return mapping[newExerciseId] || 'curl_up'; // fallback на curl_up
};

/**
 * Преобразует массив ProgramExercise[] в старый формат Exercise[]
 */
export const convertProgramExercisesToLegacy = async (
  programExercises: ProgramExercise[],
  completedExerciseIds: string[] = []
): Promise<Exercise[]> => {
  const exercises: Exercise[] = [];

  for (const programExercise of programExercises) {
    if (!programExercise.isEnabled) {
      continue; // Пропускаем отключенные упражнения
    }

    const isCompleted = completedExerciseIds.includes(programExercise.exerciseId);
    const exercise = convertProgramExerciseToLegacy(programExercise, isCompleted);
    
    if (exercise) {
      exercises.push(exercise);
    }
  }

  return exercises;
};

/**
 * Проверяет, является ли exerciseId одним из старых 4 упражнений
 */
export const isLegacyExercise = (exerciseId: string): boolean => {
  return ['curl_up', 'side_plank', 'bird_dog', 'walk'].includes(exerciseId);
};

/**
 * Получает exerciseId из старого Exercise объекта
 * Если есть extendedData - берем оттуда, иначе используем id
 */
export const getExerciseIdFromLegacy = (exercise: Exercise): string => {
  if ('extendedData' in exercise && exercise.extendedData?.exerciseId) {
    return exercise.extendedData.exerciseId;
  }
  return exercise.id as string;
};

/**
 * Получает настройки упражнения из старого Exercise объекта
 */
export const getExerciseSettingsFromLegacy = (exercise: Exercise): ExtendedExerciseSettings | null => {
  if ('extendedData' in exercise && exercise.extendedData?.settings) {
    return exercise.extendedData.settings;
  }
  return null;
};

/**
 * Получает ExerciseInfo из старого Exercise объекта
 */
export const getExerciseInfoFromLegacy = (exercise: Exercise): ExerciseInfo | null => {
  if ('extendedData' in exercise && exercise.extendedData?.exerciseInfo) {
    return exercise.extendedData.exerciseInfo;
  }
  
  // Fallback - пытаемся загрузить по ID
  const exerciseId = getExerciseIdFromLegacy(exercise);
  return getExerciseById(exerciseId);
};
