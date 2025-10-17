// Типы данных для приложения Back Rehab

export type PainLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'acute';

export interface PainStatus {
  level: PainLevel;
  date: string;
  timestamp: number;
}

export interface ExerciseSettings {
  holdTime: number;      // 3-10 секунд
  repsSchema: number[];  // например [3, 2, 1]
  restTime: number;      // 5-30 секунд
}

export interface WalkSettings {
  duration: number;      // 1-60 минут
  sessions: number;      // 1-5 сессий
}

// Типы для системы уведомлений
export interface NotificationTime {
  hour: number;    // 0-23
  minute: number;  // 0-59
}

export interface NotificationConfig {
  enabled: boolean;
  time: NotificationTime;
}

export interface NotificationSettings {
  exerciseReminders: NotificationConfig;    // Напоминания об упражнениях
  spineHygieneTips: NotificationConfig;     // Подсказки о гигиене позвоночника
  educationalMessages: NotificationConfig;  // Образовательные сообщения
}

// Типы уведомлений
export type NotificationType = 'exerciseReminders' | 'spineHygieneTips' | 'educationalMessages';

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledTime: NotificationTime;
  isActive: boolean;
}

export interface UserSettings {
  exerciseSettings: ExerciseSettings;
  walkSettings: WalkSettings;
  notificationSettings: NotificationSettings;
}

export type ExerciseType = 'curl_up' | 'side_plank' | 'bird_dog' | 'walk';

export interface Exercise {
  id: ExerciseType;
  name: string;
  description: string;
  gif?: string;
  completed: boolean;
  visible: boolean;
}

export interface DayPlan {
  date: string;
  painLevel: PainLevel;
  exercises: Exercise[];
  recommendations: string;
}

export interface ExerciseSession {
  exerciseId: ExerciseType;
  currentSet: number;
  totalSets: number;
  currentRep: number;
  totalReps: number;
  isActive: boolean;
  isResting: boolean;
  completedSets: boolean[];
}

export interface WalkSession {
  sessionNumber: number;
  totalSessions: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  isActive: boolean;
}

// НОВЫЕ ТИПЫ для промежуточного состояния упражнений
export interface ExerciseProgress {
  exerciseType: ExerciseType;
  currentSet: number;           // Текущий подход (1-based)
  currentRep: number;          // Текущее повторение в подходе (1-based)
  completedSets: number;       // Количество завершенных подходов
  currentScheme?: 1 | 2;       // Для bird_dog: какая схема выполняется
  schemeOneCompleted?: boolean; // Для bird_dog: завершена ли первая схема
  timestamp: number;           // Время сохранения состояния
}

export type ExerciseButtonState = 'start' | 'continue' | 'completed';

// Навигационные типы
export type RootStackParamList = {
  PainTracker: undefined;
  DayPlan: undefined;
  ExerciseExecution: {
    exerciseType: ExerciseType;
    exerciseName: string;
  };
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Diary: undefined;
  Settings: undefined;
};

// Навигация внутри Settings
export type SettingsStackParamList = {
  SettingsMain: undefined;
  ExerciseSettings: undefined;
  Notifications: undefined;
  Feedback: undefined;
  PrivacyPolicy: undefined;
  UserAgreement: undefined;
};

// ============ ТИПЫ ДЛЯ ДНЕВНИКА (ИСТОРИИ) ============

// Данные о выполненном упражнении
export interface CompletedExercise {
  exerciseId: ExerciseType;
  exerciseName: string;
  completedAt: string;          // ISO timestamp
  holdTime: number;             // Настройки, которые использовались
  repsSchema: number[];         // при выполнении
  restTime: number;
  totalSets: number;            // Сколько подходов было выполнено
}

// История активности за день
export interface DayHistory {
  date: string;                 // YYYY-MM-DD
  painLevel: PainLevel | null;  // Уровень боли в этот день
  exercises: CompletedExercise[]; // Выполненные упражнения
}

// Данные для календаря (краткая инфа о дне)
export interface CalendarDay {
  date: string;                 // YYYY-MM-DD
  hasActivity: boolean;         // Есть ли активность (упражнения или уровень боли)
  painLevel: PainLevel | null;
  exerciseCount: number;        // Количество выполненных упражнений
}

// ============ ТИПЫ ДЛЯ ОНБОРДИНГА ============

// Ключи для хранения данных онбординга
export const ONBOARDING_STORAGE_KEYS = {
  HAS_COMPLETED: 'hasCompletedOnboarding',
  ONBOARDING_DATA: 'onboardingData',
} as const;

// Данные, собранные во время онбординга
export interface OnboardingData {
  painLevel: PainLevel;
  exerciseSettings: ExerciseSettings;
  walkSettings: WalkSettings;
  notificationSettings: NotificationSettings;
  acknowledgedDisclaimer: boolean;
  completedAt?: number; // timestamp
}

// Навигация онбординга
export type OnboardingStackParamList = {
  Welcome: undefined;
  Intro: undefined;
  HowItWorks: undefined;
  AppFeatures: undefined;
  MedicalDisclaimer: undefined;
  PainApproach: undefined;
  PainLevel: undefined;
  ExercisePreview: undefined;
  ExerciseSettingsDetail: undefined;
  NotificationSetup: undefined;
  Ready: undefined;
};

// Режим настройки упражнений в онбординге
export type ExerciseSettingsMode = 'recommended' | 'detailed';
