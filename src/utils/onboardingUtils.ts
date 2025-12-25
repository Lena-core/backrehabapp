// Утилиты для онбординга: подбор настроек по уровню боли

import { PainLevel, ExerciseSettings, WalkSettings, NotificationSettings } from '../types';

// ============ РЕКОМЕНДОВАННЫЕ НАСТРОЙКИ УПРАЖНЕНИЙ ============

interface PainLevelSettings {
  exerciseSettings: ExerciseSettings;
  walkSettings: WalkSettings;
}

// Настройки упражнений в зависимости от уровня боли
const PAIN_LEVEL_EXERCISE_SETTINGS: Record<PainLevel, PainLevelSettings> = {
  // Уровень 5: Острая боль
  acute: {
    exerciseSettings: {
      holdTime: 0,
      repsSchema: [],
      restTime: 0,
    },
    walkSettings: {
      duration: 5,
      sessions: 1,
    },
  },

  // Уровень 4: Сильно болит
  severe: {
    exerciseSettings: {
      holdTime: 3,
      repsSchema: [2],
      restTime: 30,
    },
    walkSettings: {
      duration: 5,
      sessions: 3,
    },
  },

  // Уровень 3: Умеренно болит
  moderate: {
    exerciseSettings: {
      holdTime: 7,
      repsSchema: [3, 2, 1],
      restTime: 20,
    },
    walkSettings: {
      duration: 10,
      sessions: 2,
    },
  },

  // Уровень 2: Немного болит
  mild: {
    exerciseSettings: {
      holdTime: 7,
      repsSchema: [4, 3, 2],
      restTime: 15,
    },
    walkSettings: {
      duration: 15,
      sessions: 2,
    },
  },

  // Уровень 1: Не болит
  none: {
    exerciseSettings: {
      holdTime: 10,
      repsSchema: [6, 4, 2],
      restTime: 10,
    },
    walkSettings: {
      duration: 20,
      sessions: 2,
    },
  },
};

// ============ ОСНОВНЫЕ ФУНКЦИИ ============

/**
 * Получить рекомендованные настройки упражнений по уровню боли
 */
export const getRecommendedSettings = (painLevel: PainLevel): ExerciseSettings => {
  return PAIN_LEVEL_EXERCISE_SETTINGS[painLevel].exerciseSettings;
};

/**
 * Получить рекомендованные настройки ходьбы по уровню боли
 */
export const getRecommendedWalkSettings = (painLevel: PainLevel): WalkSettings => {
  return PAIN_LEVEL_EXERCISE_SETTINGS[painLevel].walkSettings;
};

// ============ НАСТРОЙКИ УВЕДОМЛЕНИЙ ПО УМОЛЧАНИЮ ============

/**
 * Получить настройки уведомлений по умолчанию
 */
export const getDefaultNotificationSettings = (): NotificationSettings => {
  return {
    exerciseReminders: {
      enabled: true,
      time: { hour: 9, minute: 0 },
    },
    spineHygieneTips: {
      enabled: true,
      time: { hour: 14, minute: 0 },
    },
    educationalMessages: {
      enabled: true,
      time: { hour: 20, minute: 0 },
    },
  };
};

// ============ ФОРМАТИРОВАНИЕ И ВАЛИДАЦИЯ ============

/**
 * Проверить, нужны ли упражнения для данного уровня боли
 */
export const shouldShowExercises = (painLevel: PainLevel): boolean => {
  return painLevel !== 'acute';
};

/**
 * Форматировать описание настроек упражнений
 */
export const formatExerciseSettingsDescription = (settings: ExerciseSettings): string => {
  const { holdTime, repsSchema, restTime } = settings;
  const totalSets = repsSchema.length;
  const setsDescription = repsSchema.join('-');
  
  return `${totalSets} подхода (${setsDescription})\nУдержание: ${holdTime}с, отдых: ${restTime}с`;
};

/**
 * Форматировать описание настроек ходьбы
 */
export const formatWalkSettingsDescription = (settings: WalkSettings): string => {
  const { duration, sessions } = settings;
  
  if (sessions === 1) {
    return `${duration} мин`;
  }
  
  return `${sessions} сессии по ${duration} мин`;
};
