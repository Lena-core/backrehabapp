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

export interface UserSettings {
  exerciseSettings: ExerciseSettings;
  walkSettings: WalkSettings;
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

// Навигационные типы
export type RootStackParamList = {
  PainTracker: undefined;
  DayPlan: undefined;
  ExerciseExecution: {
    exerciseType: ExerciseType;
    exerciseName: string;
  };
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};
