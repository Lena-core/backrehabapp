// Утилиты для онбординга: подбор настроек по уровню боли

import { PainLevel, ExerciseSettings, WalkSettings, NotificationSettings } from '../types';

// ============ РЕКОМЕНДОВАННЫЕ НАСТРОЙКИ УПРАЖНЕНИЙ ============

interface PainLevelSettings {
  exerciseSettings: ExerciseSettings;
  walkSettings: WalkSettings;
  explanation: string;
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
    explanation: `Упражнения "Большой Тройки" не рекомендуются. 
Сосредоточьтесь на покое и легкой ходьбе, если это возможно без боли.`,
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
    explanation: `Минимальная нагрузка с максимальным отдыхом.
Короткие удержания учат мышцы активироваться без спазма.
Можно выполнять несколько раз в день, если не вызывает ухудшения.`,
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
    explanation: `Классическая схема для начала тренировки выносливости.
Пирамида 3-2-1 позволяет избежать отказа мышц и потери формы.
Следите за самочувствием на следующий день.`,
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
    explanation: `Плавное увеличение объема тренировки.
Пирамида 4-3-2 помогает наращивать выносливость без перегрузки.
Можно постепенно увеличивать время удержания до 10 секунд.`,
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
    explanation: `Целевая схема для поддержания здоровья спины.
Пирамида 6-4-2 с удержанием 10 секунд создает необходимую 
стабильность кора. Упражнения становятся ежедневной 
"гигиеной позвоночника".`,
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

/**
 * Получить объяснение рекомендованных настроек
 */
export const getSettingsExplanation = (painLevel: PainLevel): string => {
  return PAIN_LEVEL_EXERCISE_SETTINGS[painLevel].explanation;
};

/**
 * Получить все рекомендации для уровня боли
 */
export const getAllRecommendations = (painLevel: PainLevel): PainLevelSettings => {
  return PAIN_LEVEL_EXERCISE_SETTINGS[painLevel];
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

// ============ ВАЛИДАЦИЯ НАСТРОЕК ============

/**
 * Проверить, валидны ли настройки упражнений
 */
export const validateExerciseSettings = (settings: ExerciseSettings): boolean => {
  const { holdTime, repsSchema, restTime } = settings;
  
  // Проверка времени удержания (3-10 секунд)
  if (holdTime < 3 || holdTime > 10) {
    return false;
  }
  
  // Проверка схемы повторений
  if (!Array.isArray(repsSchema) || repsSchema.length === 0) {
    return false;
  }
  
  // Каждое значение в схеме должно быть от 1 до 10
  if (repsSchema.some(reps => reps < 1 || reps > 10)) {
    return false;
  }
  
  // Проверка времени отдыха (5-30 секунд)
  if (restTime < 5 || restTime > 30) {
    return false;
  }
  
  return true;
};

/**
 * Проверить, валидны ли настройки ходьбы
 */
export const validateWalkSettings = (settings: WalkSettings): boolean => {
  const { duration, sessions } = settings;
  
  // Длительность от 1 до 60 минут
  if (duration < 1 || duration > 60) {
    return false;
  }
  
  // Сессии от 1 до 5
  if (sessions < 1 || sessions > 5) {
    return false;
  }
  
  return true;
};

// ============ ФОРМАТИРОВАНИЕ ============

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

/**
 * Рассчитать примерное время выполнения упражнения
 */
export const calculateExerciseDuration = (settings: ExerciseSettings): number => {
  const { holdTime, repsSchema, restTime } = settings;
  
  const totalReps = repsSchema.reduce((sum, reps) => sum + reps, 0);
  const totalSets = repsSchema.length;
  
  const exerciseTime = totalReps * holdTime;
  const restTimeTotal = (totalSets - 1) * restTime;
  const preparationTime = 30; // Подготовка
  
  return Math.ceil((exerciseTime + restTimeTotal + preparationTime) / 60); // В минутах
};

/**
 * Проверить, нужны ли упражнения для данного уровня боли
 */
export const shouldShowExercises = (painLevel: PainLevel): boolean => {
  return painLevel !== 'acute';
};
