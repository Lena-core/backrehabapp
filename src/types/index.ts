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

export interface NotificationSettings {
  exerciseReminders: boolean;    // Напоминания об упражнениях
  spineHygieneTips: boolean;     // Подсказки о гигиене позвоночника
  educationalMessages: boolean;  // Образовательные сообщения
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
