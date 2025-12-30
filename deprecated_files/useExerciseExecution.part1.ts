import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { 
  ExerciseType, 
  ExerciseProgress, 
  ExerciseButtonState, 
  CompletedExercise,
  RehabProgram,
  UserProgress,
  UserSettings
} from '../types';
import { getExerciseById } from '../constants/exercises/exercisesData';
import RehabProgramLoader from '../utils/rehabProgramLoader';
import UserProgressManager from '../utils/userProgressManager';
import { saveDayExercise } from '../utils/storage';
import { getExerciseVideo, getInstructions, EXERCISE_ANIMATIONS, DEFAULT_PLACEHOLDER } from '../constants/exerciseExecutionConstants';

export interface TimerState {
  currentTime: number;
  isRunning: boolean;
  phase: 'prepare' | 'exercise' | 'miniRest' | 'rest' | 'rolling' | 'completed' | 'schemeCompleted';
  currentSet: number;
  currentRep: number;
  currentSession: number;
  instruction: string;
  holdSoundPlayed: boolean;
  currentScheme: 1 | 2;
  schemeOneCompleted: boolean;
}

interface UseExerciseExecutionProps {
  exerciseType: string;
  exerciseName: string;
  settings: UserSettings | null;
  playSound: (soundType: string) => void;
}

export const useExerciseExecution = ({
  exerciseType,
  exerciseName,
  settings,
  playSound
}: UseExerciseExecutionProps) => {
  const navigation = useNavigation();

  // State
  const [currentExerciseId, setCurrentExerciseId] = useState<string>(exerciseType);
  const [executionType, setExecutionType] = useState<string>('hold');
  const [exerciseSettings, setExerciseSettings] = useState<any>(null);
  const [videoSource, setVideoSource] = useState<any>(DEFAULT_PLACEHOLDER);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [rehabProgram, setRehabProgram] = useState<RehabProgram | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress | null>(null);
  const [buttonState, setButtonState] = useState<ExerciseButtonState>('start');
  
  const [timer, setTimer] = useState<TimerState>({
    currentTime: 0,
    isRunning: false,
    phase: 'prepare',
    currentSet: 1,
    currentRep: 1,
    currentSession: 1,
    instruction: getInstructions(exerciseType).prepare,
    holdSoundPlayed: false,
    currentScheme: 1,
    schemeOneCompleted: false,
  });

  const [videoDuration, setVideoDuration] = useState(4);
  const [videoPlaybackState, setVideoPlaybackState] = useState<{
    paused: boolean;
    shouldSeek: boolean;
    seekTime: number;
  }>({
    paused: true,
    shouldSeek: true,
    seekTime: 0,
  });

  const videoRef = useRef<any>(null);

  // Загрузка программы реабилитации
  useFocusEffect(
    useCallback(() => {
      const loadRehabData = async () => {
        try {
          const progress = await UserProgressManager.getProgress();
          if (progress) {
            setUserProgress(progress);
            await RehabProgramLoader.initializePrograms();
            const program = await RehabProgramLoader.getProgramById(progress.currentProgramId);
            if (program) {
              setRehabProgram(program);
              console.log('[ExerciseExecution] Loaded program:', program.nameRu, 'week:', progress.currentWeek);
            }
          }
        } catch (error) {
          console.error('[ExerciseExecution] Error loading rehab data:', error);
        }
      };
      loadRehabData();
    }, [])
  );

  // Загрузка данных упражнения
  const loadExerciseData = useCallback(async () => {
    try {
      setIsLoadingVideo(true);
      const today = new Date().toISOString().split('T')[0];
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      
      let exerciseId = exerciseType;
      let execType = 'hold';
      let exSettings = null;
      
      if (savedExercises) {
        const exercises = JSON.parse(savedExercises);
        const currentExercise = exercises.find((ex: any) => ex.id === exerciseType);
        
        if (currentExercise?.extendedData) {
          if (currentExercise.extendedData.exerciseId) {
            exerciseId = currentExercise.extendedData.exerciseId;
          }
          
          if (currentExercise.extendedData.exerciseInfo?.executionType) {
            execType = currentExercise.extendedData.exerciseInfo.executionType;
          }
          
          if (rehabProgram && userProgress) {
            exSettings = await UserProgressManager.getExerciseSettings(rehabProgram, exerciseId);
          } else if (currentExercise.extendedData.settings) {
            exSettings = currentExercise.extendedData.settings;
          }
        }
      }
      
      setCurrentExerciseId(exerciseId);
      setExecutionType(execType);
      setExerciseSettings(exSettings);
      setVideoSource(getExerciseVideo(exerciseId));
      setIsLoadingVideo(false);
    } catch (error) {
      console.error('Error loading exercise data:', error);
      setVideoSource(EXERCISE_ANIMATIONS[exerciseType] || DEFAULT_PLACEHOLDER);
      setIsLoadingVideo(false);
    }
  }, [exerciseType, exerciseName, rehabProgram, userProgress]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  // ⚙️ ПЕРЕЗАГРУЗКА при возврате с экрана настроек
  useFocusEffect(
    useCallback(() => {
      loadExerciseData();
    }, [loadExerciseData])
  );

  // Загрузка/сохранение прогресса упражнения
  const loadExerciseProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      if (savedExercises) {
        const exercises = JSON.parse(savedExercises);
        const currentExercise = exercises.find((ex: any) => ex.id === exerciseType);
        if (currentExercise?.completed) {
          setButtonState('completed');
          setTimer(prev => ({
            ...prev,
            phase: 'completed',
            instruction: getInstructions(exerciseType).completed,
          }));
          return;
        }
      }
      
      const key = `exercise_progress_${exerciseType}_${today}`;
      const savedProgress = await AsyncStorage.getItem(key);
      
      if (savedProgress) {
        const progress: ExerciseProgress = JSON.parse(savedProgress);
        const hoursDiff = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setExerciseProgress(progress);
          setButtonState('continue');
          
          if (exerciseType === 'bird_dog' && progress.schemeOneCompleted) {
            setTimer(prev => ({
              ...prev,
              phase: 'schemeCompleted',
              schemeOneCompleted: true,
              currentScheme: 2,
              instruction: getInstructions(exerciseType).schemeCompleted,
            }));
          }
        } else {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error loading exercise progress:', error);
    }
  };

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
    } catch (error) {
      console.error('Error saving exercise progress:', error);
    }
  };

  const clearExerciseProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `exercise_progress_${exerciseType}_${today}`;
      await AsyncStorage.removeItem(key);
      setExerciseProgress(null);
    } catch (error) {
      console.error('Error clearing exercise progress:', error);
    }
  };

  useEffect(() => {
    loadExerciseProgress();
  }, []);

  // ПРОДОЛЖЕНИЕ В СЛЕДУЮЩЕМ ФАЙЛЕ...
  // Это первая часть хука, дальше будет handleTimerComplete, startExercise и т.д.
