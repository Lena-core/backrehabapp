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
  id: string; // Изменено с ExerciseType на string для поддержки новых упражнений
  name: string;
  description: string;
  gif?: string;
  completed: boolean;
  visible: boolean;
  // Расширенные данные для новой системы (опционально)
  extendedData?: {
    exerciseId: string;                    // ID из новой базы
    exerciseInfo: any;                     // ExerciseInfo (чтобы избежать циклических зависимостей)
    settings: ExtendedExerciseSettings;    // Настройки из программы
  };
}

export interface DayPlan {
  date: string;
  painLevel: PainLevel;
  exercises: Exercise[];
  recommendations: string;
}

export interface ExerciseSession {
  exerciseId: string; // Изменено с ExerciseType на string
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
  exerciseType: string; // Изменено с ExerciseType на string
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
  Home: undefined;
  Onboarding: undefined;
  PainLevelCheck: { source: 'home' | 'settings' };
  PainTracker: undefined;
  DayPlan: undefined;
  Settings: undefined;
  ProgramSelection: undefined;
  ProgramExerciseSettings: undefined;
  ManualExerciseSettings: {
    exerciseId: string;
    exerciseName: string;
  };
  ExerciseExecution: {
    exerciseType: string; // Изменено с ExerciseType на string
    exerciseName: string;
  };
  Main: undefined;
  TestingInfrastructure: undefined;
  RehabSystemTest: undefined;
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
  TestInfrastructure: undefined;  // Тестовый экран
};

// ============ ТИПЫ ДЛЯ ДНЕВНИКА (ИСТОРИИ) ============

// Данные о выполненном упражнении
export interface CompletedExercise {
  exerciseId: string; // Изменено с ExerciseType на string
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
  RehabProgramSelection: undefined;
  Ready: undefined;
};

// Режим настройки упражнений в онбординге
export type ExerciseSettingsMode = 'recommended' | 'detailed';

// ============ НОВЫЕ ТИПЫ ДЛЯ РАСШИРЕННОЙ СИСТЕМЫ УПРАЖНЕНИЙ ============

// ========== КАТЕГОРИИ ПО МЫШЕЧНЫМ ГРУППАМ ==========
export type MuscleGroup = 
  | 'abs'              // Прямая мышца живота
  | 'obliques'         // Косые мышцы живота
  | 'core_stability'   // Стабилизаторы кора
  | 'glutes'           // Ягодичные мышцы
  | 'back'             // Мышцы спины
  | 'hip_flexors'      // Сгибатели бедра
  | 'hamstrings'       // Задняя поверхность бедра
  | 'quads'            // Квадрицепс
  | 'calves'           // Икроножные
  | 'full_body'        // Все тело
  | 'mobility'         // Мобильность/растяжка
  | 'walk';            // Ходьба

// Уровень сложности
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

// Тип выполнения упражнения
export type ExerciseExecutionType = 
  | 'hold'            // Статическое удержание (планки, bird-dog)
  | 'reps'            // Повторения (скручивания)
  | 'foam_rolling'    // Самомассаж (прокатка)
  | 'walk'            // Ходьба
  | 'dynamic';        // Динамическое (медвежья походка)

// ========== РАСШИРЕННЫЕ НАСТРОЙКИ УПРАЖНЕНИЙ ==========
export interface ExtendedExerciseSettings {
  // Для упражнений с удержанием (hold)
  holdTime?: number;        // 3-10 секунд
  repsSchema?: number[];    // [3, 2, 1] или [5, 4, 3]
  restTime?: number;        // 5-30 секунд
  
  // Для ходьбы
  walkDuration?: number;    // 1-60 минут
  walkSessions?: number;    // 1-5 сессий
  
  // Для самомассажа
  rollingDuration?: number; // 30-120 секунд
  rollingSessions?: number; // 1-3 сессий
  
  // Для динамических упражнений
  dynamicReps?: number;     // Количество повторений
  dynamicSets?: number;     // Количество подходов
}

// ========== ИНФОРМАЦИЯ ОБ УПРАЖНЕНИИ ==========
export interface ExerciseInfo {
  id: string;
  nameRu: string;
  nameEn: string;
  primaryMuscles: MuscleGroup[];        // Основные мышцы
  secondaryMuscles?: MuscleGroup[];     // Вспомогательные мышцы
  difficulty: ExerciseDifficulty;
  executionType: ExerciseExecutionType;
  videoFile: string;
  preparationVideoFile?: string;        // Видео подготовки (для curl_up)
  alternativeVideoFile?: string;        // Альтернативное видео (для другой ноги/стороны)
  shortDescription: string;
  fullDescription?: string;
  recommendedForPainLevels: number[];   // [1, 2, 3, 4] или [4, 5]
  defaultSettings: ExtendedExerciseSettings;    // Настройки по умолчанию
  progressionPath?: string[];           // Путь прогрессии: ['side_plank', 'side_plank_lvl2', 'side_plank_lvl3']
}

// ========== УПРАЖНЕНИЕ В ПРОГРАММЕ ==========
export interface ProgramExercise {
  exerciseId: string;
  settings: ExtendedExerciseSettings;  // Индивидуальные настройки для этого упражнения в программе
  order: number;               // Порядок выполнения в программе (1, 2, 3...)
  isEnabled: boolean;          // Включено ли упражнение (пользователь может отключить)
}

// ========== ПРОГРАММА ТРЕНИРОВОК ==========
export interface TrainingProgram {
  id: string;
  nameRu: string;
  nameEn: string;
  description: string;
  type: 'preset' | 'custom';
  exercises: ProgramExercise[];        // Упражнения с их настройками
  adaptToPainLevel: boolean;
  painLevelRules?: {
    [key: string]: ProgramExercise[];  // '1-3': [упражнения для боли 1-3]
  };
  icon?: string;
  createdAt?: string;                  // Для кастомных программ
  updatedAt?: string;
}

// ========== ИСТОРИЯ ВЫПОЛНЕНИЯ ==========
export interface ExerciseExecution {
  id: string;                          // UUID выполнения
  exerciseId: string;
  programId: string;                   // Из какой программы
  date: string;                        // YYYY-MM-DD
  timestamp: number;
  settings: ExtendedExerciseSettings;  // Какие настройки использовались
  completed: boolean;
  completedSets: number;               // Сколько подходов выполнено
  totalDuration: number;               // Общее время в секундах
  painLevelBefore?: number;            // Уровень боли до упражнения
  painLevelAfter?: number;             // Уровень боли после (опционально)
}

// История упражнения (для анализа прогресса)
export interface ExerciseHistorySummary {
  exerciseId: string;
  totalCompletions: number;            // Сколько раз выполнено
  lastCompleted?: string;              // Дата последнего выполнения
  currentSettings: ExtendedExerciseSettings;   // Текущие настройки
  completionStreak: number;            // Серия выполнений подряд
  averageCompletionRate: number;       // Средний процент выполнения (0-1)
  readyForProgression: boolean;        // Готов к усложнению
}

// ========== ПРАВИЛА ПРОГРЕССИИ ==========
export interface ProgressionRule {
  exerciseId: string;
  minCompletions: number;              // Минимум выполнений для прогрессии
  completionRate: number;              // Минимальный процент выполнения (0-1)
  nextLevel: {
    type: 'settings' | 'exercise';     // Изменить настройки или перейти на другое упражнение
    // Если type === 'settings'
    newSettings?: Partial<ExtendedExerciseSettings>;
    // Если type === 'exercise'
    upgradeToExerciseId?: string;
  };
}

// ========== ПРЕДЛОЖЕНИЕ ПРОГРЕССИИ ==========
export interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  currentSettings: ExtendedExerciseSettings;
  suggestion: {
    type: 'settings' | 'exercise';
    message: string;                   // Описание предложения
    // Если type === 'settings'
    newSettings?: ExtendedExerciseSettings;
    // Если type === 'exercise'
    newExerciseId?: string;
    newExerciseName?: string;
  };
  reason: string;                      // Почему предлагается прогрессия
  completions: number;
  avgCompletionRate: number;
}

// ========== ОБНОВЛЕННЫЕ НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ ==========
export interface ExtendedUserSettings {
  notificationSettings: NotificationSettings;
  activeProgramId: string;             // ID активной программы
  progressionEnabled: boolean;         // Включена ли система прогрессии
  autoProgressionEnabled: boolean;     // Автоматическая прогрессия или по запросу
}

// ========== СИСТЕМА РЕАБИЛИТАЦИОННЫХ ПРОГРАММ ==========

// Фаза реабилитации
export type RehabPhase = 'acute' | 'start' | 'consolidation' | 'maintenance';

// Настройки для конкретной недели программы
export interface WeeklyProgression {
  week: number;                        // Номер недели (1, 2, 3...)
  repsSchema: number[];                // Схема повторений [3,2,1] или [4,3,2]
  holdTime?: number;                   // Время удержания (для hold/reps)
  restTime?: number;                   // Время отдыха
  dynamicReps?: number;                // Количество повторений (для dynamic)
  dynamicSets?: number;                // Количество подходов (для dynamic)
  rollingDuration?: number;            // Длительность прокатки (для foam_rolling)
  rollingSessions?: number;            // Количество сессий (для foam_rolling)
  walkDuration?: number;               // Длительность ходьбы
  walkSessions?: number;               // Количество сессий ходьбы
}

// Программа реабилитации с weekly progression
export interface RehabProgram {
  id: string;
  nameRu: string;
  nameEn: string;
  description: string;
  phase: RehabPhase;                   // Фаза реабилитации
  icon: string;                        // Эмодзи иконка
  
  // Длительность программы
  durationDays: number;                // Количество дней (14, 60, 60, -1 для unlimited)
  
  // План прогрессии по неделям
  weeklyProgression: WeeklyProgression[];
  
  // Упражнения программы (базовые настройки)
  exercises: ProgramExercise[];
  
  // Адаптация по уровню боли
  adaptToPainLevel: boolean;
  painLevelRules?: {
    [key: string]: string[];           // '1': ['curl_up', 'walk'], '3-4': ['walk']
  };
  
  // Следующая программа после завершения
  nextProgramId?: string;
  
  // Условие перехода на следующую программу
  transitionCondition?: {
    type: 'days_completed' | 'manual';  // Автоматически или вручную
    requiredDays?: number;              // Минимум дней для автоперехода
  };
  
  createdAt?: string;
  updatedAt?: string;
}

// Прогресс пользователя в программе
export interface UserProgress {
  currentProgramId: string;            // ID текущей программы
  programStartDate: string;            // Дата начала программы (ISO)
  daysCompleted: number;               // Количество выполненных дней
  currentWeek: number;                 // Текущая неделя (1, 2, 3...)
  
  // Ручные изменения пользователя (отключают auto-прогрессию для упражнения)
  manualOverrides: {
    [exerciseId: string]: ExtendedExerciseSettings;
  };
  
  // История прогрессии (когда пользователь принял/отклонил увеличение)
  progressionHistory: {
    date: string;                      // ISO date
    week: number;                      // Неделя прогрессии
    accepted: boolean;                 // Принял ли увеличение
    previousSettings?: WeeklyProgression;
    newSettings?: WeeklyProgression;
  }[];
  
  // Пропущенные дни (для расчета streak)
  missedDays: string[];                // ISO dates
  
  // Серия выполнения
  currentStreak: number;               // Дней подряд
  longestStreak: number;               // Максимальная серия
  
  // Последний показанный popup прогрессии
  lastProgressionPopupDate?: string;   // ISO date
}

// Popup предложения увеличения нагрузки
export interface ProgressionOffer {
  week: number;
  currentSettings: WeeklyProgression;
  newSettings: WeeklyProgression;
  affectedExercises: string[];         // IDs упражнений, которые затронуты
}
