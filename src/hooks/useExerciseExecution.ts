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
          
          // Берём настройки из extendedData (уже с weekly progression)
          if (currentExercise.extendedData.settings) {
            exSettings = currentExercise.extendedData.settings;
          }
        }
      }
      
      // ⚙️ ПРИМЕНЯЕМ РУЧНЫЕ НАСТРОЙКИ (самый высокий приоритет!)
      if (exerciseId) {
        try {
          const manualSettingsKey = `manual_exercise_settings_${exerciseId}`;
          const manualSettingsJson = await AsyncStorage.getItem(manualSettingsKey);
          
          if (manualSettingsJson) {
            const manualSettings = JSON.parse(manualSettingsJson);
            console.log(`[ExerciseExecution] ⚙️ Manual settings applied for ${exerciseId}`);
            
            // Если есть базовые настройки - применяем поверх них
            if (exSettings) {
              exSettings = { ...exSettings, ...manualSettings };
            } else {
              // Если базовых нет - используем только ручные
              exSettings = manualSettings;
            }
          }
        } catch (error) {
          console.error(`[ExerciseExecution] Error loading manual settings for ${exerciseId}:`, error);
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
  }, [exerciseType, exerciseName]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  useFocusEffect(
    useCallback(() => {
      loadExerciseData();
    }, [loadExerciseData])
  );

  const loadExerciseProgress = useCallback(async () => {
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
  }, [exerciseType]);

  const saveExerciseProgress = useCallback(async (progress: Partial<ExerciseProgress>) => {
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
  }, [exerciseType]);

  const clearExerciseProgress = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `exercise_progress_${exerciseType}_${today}`;
      await AsyncStorage.removeItem(key);
      setExerciseProgress(null);
    } catch (error) {
      console.error('Error clearing exercise progress:', error);
    }
  }, [exerciseType]);

  useEffect(() => {
    loadExerciseProgress();
  }, [loadExerciseProgress]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerComplete = useCallback(async () => {
    if (executionType === 'foam_rolling' && exerciseSettings) {
      const rollingDuration = exerciseSettings.rollingDuration || 60;
      const rollingSessions = exerciseSettings.rollingSessions || 2;
      const restTime = exerciseSettings.restTime || 30;
      if (timer.phase === 'prepare') {
        playSound('start');
        setTimer(prev => ({ ...prev, currentTime: rollingDuration, phase: 'rolling', instruction: getInstructions(currentExerciseId).rolling || 'Прокатывайте мышцу', holdSoundPlayed: false }));
      } else if (timer.phase === 'rolling') {
        const isLastSession = timer.currentSession >= rollingSessions;
        if (isLastSession) {
          playSound('completed');
          setTimer(prev => ({ ...prev, isRunning: false, phase: 'completed', currentTime: 0, instruction: getInstructions(currentExerciseId).completed }));
          try {
            const today = new Date().toISOString().split('T')[0];
            const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
            if (savedExercises) {
              const exercises = JSON.parse(savedExercises);
              const updatedExercises = exercises.map((ex: any) => ex.id === exerciseType ? { ...ex, completed: true } : ex);
              await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
            }
            const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: exerciseName, completedAt: new Date().toISOString(), holdTime: rollingDuration, repsSchema: [], restTime: restTime, totalSets: rollingSessions };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving progress:', error);
          }
          await clearExerciseProgress();
          setButtonState('completed');
          setTimeout(() => navigation.goBack(), 2000);
        } else {
          playSound('rest');
          setTimer(prev => ({ ...prev, currentTime: restTime, phase: 'rest', instruction: getInstructions(currentExerciseId).rest }));
          try {
            const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: exerciseName, completedAt: new Date().toISOString(), holdTime: rollingDuration, repsSchema: [], restTime: restTime, totalSets: 1 };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving completed session:', error);
          }
        }
      } else if (timer.phase === 'rest') {
        playSound('prepare');
        setTimer(prev => ({ ...prev, currentTime: 5, phase: 'prepare', currentSession: prev.currentSession + 1, instruction: getInstructions(currentExerciseId).prepare }));
      }
      return;
    }
    if (executionType === 'dynamic' && exerciseSettings) {
      const dynamicReps = exerciseSettings.dynamicReps || 10;
      const dynamicSets = exerciseSettings.dynamicSets || 2;
      const restTime = exerciseSettings.restTime || 15;
      const exerciseDuration = dynamicReps * 3;
      if (timer.phase === 'prepare') {
        playSound('start');
        setTimer(prev => ({ ...prev, currentTime: exerciseDuration, phase: 'exercise', instruction: getInstructions(currentExerciseId).start, holdSoundPlayed: false }));
      } else if (timer.phase === 'exercise') {
        const isLastSet = timer.currentSet >= dynamicSets;
        if (isLastSet) {
          playSound('completed');
          setTimer(prev => ({ ...prev, isRunning: false, phase: 'completed', currentTime: 0, instruction: getInstructions(currentExerciseId).completed }));
          try {
            const today = new Date().toISOString().split('T')[0];
            const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
            if (savedExercises) {
              const exercises = JSON.parse(savedExercises);
              const updatedExercises = exercises.map((ex: any) => ex.id === exerciseType ? { ...ex, completed: true } : ex);
              await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
            }
            const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: exerciseName, completedAt: new Date().toISOString(), holdTime: 0, repsSchema: [], restTime: restTime, totalSets: dynamicSets };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving progress:', error);
          }
          await clearExerciseProgress();
          setButtonState('completed');
          setTimeout(() => navigation.goBack(), 2000);
        } else {
          playSound('rest');
          setTimer(prev => ({ ...prev, currentTime: restTime, phase: 'rest', instruction: getInstructions(currentExerciseId).rest }));
          try {
            const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: exerciseName, completedAt: new Date().toISOString(), holdTime: 0, repsSchema: [], restTime: restTime, totalSets: 1 };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving completed set:', error);
          }
        }
      } else if (timer.phase === 'rest') {
        playSound('prepare');
        setTimer(prev => ({ ...prev, currentTime: 5, phase: 'prepare', currentSet: prev.currentSet + 1, instruction: getInstructions(currentExerciseId).prepare }));
      }
      return;
    }
    if (exerciseType === 'walk') {
      playSound('completed');
      setTimer(prev => ({ ...prev, isRunning: false, phase: 'completed', currentTime: 0, instruction: 'Упражнение завершено!' }));
      try {
        const today = new Date().toISOString().split('T')[0];
        const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
        if (savedExercises) {
          const exercises = JSON.parse(savedExercises);
          const updatedExercises = exercises.map((ex: any) => ex.id === exerciseType ? { ...ex, completed: true } : ex);
          await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
        }
        const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: exerciseName, completedAt: new Date().toISOString(), holdTime: 0, repsSchema: [], restTime: 0, totalSets: 1 };
        await saveDayExercise(completedExercise);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
      await clearExerciseProgress();
      setButtonState('completed');
      setTimeout(() => navigation.goBack(), 2000);
      return;
    }
    const repsSchema = exerciseSettings?.repsSchema || settings?.exerciseSettings.repsSchema || [3, 2, 1];
    const holdTime = exerciseSettings?.holdTime || settings?.exerciseSettings.holdTime || 7;
    const restTime = exerciseSettings?.restTime || settings?.exerciseSettings.restTime || 15;
    if (timer.phase === 'prepare') {
      playSound('start');
      const instructions = getInstructions(exerciseType);
      const instruction = exerciseType === 'bird_dog' ? (timer.currentScheme === 1 ? instructions.startScheme1 || instructions.start : instructions.startScheme2 || instructions.start) : instructions.start;
      setTimer(prev => ({ ...prev, currentTime: holdTime, phase: 'exercise', instruction, holdSoundPlayed: false }));
    } else if (timer.phase === 'exercise') {
      const isLastRep = timer.currentRep >= repsSchema[timer.currentSet - 1];
      const isLastSet = timer.currentSet >= repsSchema.length;
      if (isLastRep && isLastSet) {
        if (exerciseType === 'bird_dog' && timer.currentScheme === 1) {
          playSound('rest');
          setTimer(prev => ({ ...prev, isRunning: false, phase: 'schemeCompleted', currentTime: 0, instruction: getInstructions(exerciseType).schemeCompleted || getInstructions(exerciseType).completed, schemeOneCompleted: true }));
          try {
            const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: `${exerciseName} (схема 1)`, completedAt: new Date().toISOString(), holdTime: exerciseSettings?.holdTime || settings!.exerciseSettings.holdTime, repsSchema: exerciseSettings?.repsSchema || settings!.exerciseSettings.repsSchema, restTime: exerciseSettings?.restTime || settings!.exerciseSettings.restTime, totalSets: repsSchema.length };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving scheme 1:', error);
          }
          await saveExerciseProgress({ completedSets: repsSchema.length, currentSet: 1, currentRep: 1, currentScheme: 1, schemeOneCompleted: true });
        } else {
          playSound('completed');
          setTimer(prev => ({ ...prev, isRunning: false, phase: 'completed', currentTime: 0, instruction: getInstructions(exerciseType).completed }));
          try {
            const today = new Date().toISOString().split('T')[0];
            const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
            if (savedExercises) {
              const exercises = JSON.parse(savedExercises);
              const updatedExercises = exercises.map((ex: any) => ex.id === exerciseType ? { ...ex, completed: true } : ex);
              await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
            }
            const totalSets = exerciseType === 'bird_dog' ? (exerciseSettings?.repsSchema || settings!.exerciseSettings.repsSchema).length : (exerciseSettings?.repsSchema || settings!.exerciseSettings.repsSchema).length;
            const completedExerciseName = exerciseType === 'bird_dog' ? `${exerciseName} (схема 2)` : exerciseName;
            const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: completedExerciseName, completedAt: new Date().toISOString(), holdTime: exerciseSettings?.holdTime || settings!.exerciseSettings.holdTime, repsSchema: exerciseSettings?.repsSchema || settings!.exerciseSettings.repsSchema, restTime: exerciseSettings?.restTime || settings!.exerciseSettings.restTime, totalSets: totalSets };
            await saveDayExercise(completedExercise);
          } catch (error) {
            console.error('Error saving progress:', error);
          }
          await clearExerciseProgress();
          setButtonState('completed');
          setTimeout(() => navigation.goBack(), 2000);
        }
      } else if (isLastRep) {
        playSound('rest');
        setTimer(prev => ({ ...prev, currentTime: restTime, phase: 'rest', instruction: getInstructions(exerciseType).rest }));
        try {
          const completedExercise: CompletedExercise = { exerciseId: exerciseType, exerciseName: exerciseName, completedAt: new Date().toISOString(), holdTime: exerciseSettings?.holdTime || settings!.exerciseSettings.holdTime, repsSchema: exerciseSettings?.repsSchema || settings!.exerciseSettings.repsSchema, restTime: exerciseSettings?.restTime || settings!.exerciseSettings.restTime, totalSets: 1 };
          await saveDayExercise(completedExercise);
        } catch (error) {
          console.error('Error saving completed set:', error);
        }
        await saveExerciseProgress({ completedSets: timer.currentSet, currentSet: timer.currentSet + 1, currentRep: 1, ...(exerciseType === 'bird_dog' && { currentScheme: timer.currentScheme, schemeOneCompleted: timer.schemeOneCompleted }) });
      } else {
        playSound('finish');
        const instructions = getInstructions(exerciseType);
        const instruction = exerciseType === 'bird_dog' ? (timer.currentScheme === 1 ? instructions.miniRestScheme1 || instructions.miniRest : instructions.miniRestScheme2 || instructions.miniRest) : instructions.miniRest;
        setTimer(prev => ({ ...prev, currentTime: 3, phase: 'miniRest', instruction }));
      }
    } else if (timer.phase === 'miniRest') {
      playSound('start');
      const instructions = getInstructions(exerciseType);
      const instruction = exerciseType === 'bird_dog' ? (timer.currentScheme === 1 ? instructions.startScheme1 || instructions.start : instructions.startScheme2 || instructions.start) : instructions.start;
      setTimer(prev => ({ ...prev, currentTime: holdTime, phase: 'exercise', currentRep: prev.currentRep + 1, instruction, holdSoundPlayed: false }));
    } else if (timer.phase === 'rest') {
      playSound('prepare');
      setTimer(prev => ({ ...prev, currentTime: 5, phase: 'prepare', currentSet: prev.currentSet + 1, currentRep: 1, instruction: getInstructions(exerciseType).prepare }));
    }
  }, [timer, exerciseSettings, settings, exerciseType, executionType, currentExerciseId, playSound, exerciseName, navigation, saveExerciseProgress, clearExerciseProgress]);

  const startExercise = useCallback(() => {
    if (!settings) return;
    if (executionType === 'foam_rolling' && exerciseSettings) {
      playSound('start');
      setTimer({ currentTime: 5, isRunning: true, phase: 'prepare', currentSet: 1, currentRep: 1, currentSession: 1, instruction: getInstructions(currentExerciseId).prepare, holdSoundPlayed: false, currentScheme: 1, schemeOneCompleted: false });
      return;
    }
    if (executionType === 'dynamic' && exerciseSettings) {
      playSound('prepare');
      setTimer({ currentTime: 5, isRunning: true, phase: 'prepare', currentSet: 1, currentRep: 1, currentSession: 1, instruction: getInstructions(currentExerciseId).prepare, holdSoundPlayed: false, currentScheme: 1, schemeOneCompleted: false });
      return;
    }
    if (exerciseType === 'walk') {
      const walkDurationInSeconds = (exerciseSettings?.walkDuration || settings.walkSettings.duration) * 60;
      playSound('start');
      setTimer({ currentTime: walkDurationInSeconds, isRunning: true, phase: 'exercise', currentSet: 1, currentRep: 1, currentSession: 1, instruction: 'Начните ходьбу. Держите спину ровно.', holdSoundPlayed: false, currentScheme: 1, schemeOneCompleted: false });
    } else if (exerciseType === 'bird_dog' && timer.schemeOneCompleted) {
      playSound('prepare');
      setTimer(prev => ({ ...prev, currentTime: 5, isRunning: true, phase: 'prepare', currentSet: 1, currentRep: 1, currentScheme: 2, instruction: getInstructions(exerciseType).prepare, holdSoundPlayed: false }));
    } else if (buttonState === 'continue' && exerciseProgress) {
      playSound('prepare');
      setTimer({ currentTime: 5, isRunning: true, phase: 'prepare', currentSet: exerciseProgress.currentSet, currentRep: exerciseProgress.currentRep, currentSession: 1, instruction: getInstructions(exerciseType).prepare, holdSoundPlayed: false, currentScheme: exerciseProgress.currentScheme || 1, schemeOneCompleted: exerciseProgress.schemeOneCompleted || false });
    } else {
      playSound('prepare');
      setTimer({ currentTime: 5, isRunning: true, phase: 'prepare', currentSet: 1, currentRep: 1, currentSession: 1, instruction: getInstructions(currentExerciseId).prepare, holdSoundPlayed: false, currentScheme: 1, schemeOneCompleted: false });
    }
  }, [settings, executionType, exerciseSettings, exerciseType, currentExerciseId, timer.schemeOneCompleted, buttonState, exerciseProgress, playSound]);

  const handleVideoLoad = useCallback((data: any) => {
    if (exerciseType === 'walk' || executionType === 'dynamic' || executionType === 'foam_rolling') {
      return;
    }
    setVideoDuration(data.duration);
  }, [exerciseType, executionType]);

  const handleVideoProgress = useCallback((data: any) => {
    if (exerciseType === 'walk' || executionType === 'dynamic' || executionType === 'foam_rolling') return;
    const holdTime = exerciseSettings?.holdTime || settings?.exerciseSettings.holdTime || 7;
    const isStaticPose = holdTime >= 20;
    if (isStaticPose) return;
    const currentTime = data.currentTime;
    if (timer.phase === 'exercise' && !videoPlaybackState.paused && currentTime >= 2) {
      setVideoPlaybackState(prev => ({ ...prev, paused: true, shouldSeek: false, seekTime: 2 }));
    }
  }, [exerciseType, executionType, exerciseSettings, settings, timer.phase, videoPlaybackState.paused]);

  const handleVideoEnd = useCallback(() => {
    if (exerciseType === 'walk' || executionType === 'dynamic' || executionType === 'foam_rolling') return;
    if (timer.phase === 'miniRest' && !videoPlaybackState.paused) {
      setVideoPlaybackState({ paused: true, shouldSeek: true, seekTime: 0 });
    }
  }, [exerciseType, executionType, timer.phase, videoPlaybackState.paused]);

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
  }, [timer.isRunning, timer.currentTime, handleTimerComplete]);

  useEffect(() => {
    if (!timer.isRunning || exerciseType === 'walk') return;
    const holdTime = exerciseSettings?.holdTime || settings?.exerciseSettings.holdTime || 7;
    if (timer.phase === 'exercise' && holdTime > 10 && timer.currentTime === holdTime - 5 && !timer.holdSoundPlayed) {
      playSound('hold');
      setTimer(prev => ({ ...prev, holdSoundPlayed: true, instruction: getInstructions(currentExerciseId).hold }));
    }
  }, [timer.currentTime, timer.isRunning, timer.phase, timer.holdSoundPlayed, exerciseType, exerciseSettings, settings, playSound, currentExerciseId]);

  useEffect(() => {
    if (exerciseType === 'walk') return;
    if (executionType === 'dynamic' || executionType === 'foam_rolling') {
      if (timer.phase === 'exercise' || timer.phase === 'rolling') {
        setVideoPlaybackState({ paused: false, shouldSeek: false, seekTime: 0 });
      } else {
        setVideoPlaybackState({ paused: true, shouldSeek: true, seekTime: 0 });
      }
      return;
    }
    const holdTime = exerciseSettings?.holdTime || settings?.exerciseSettings.holdTime || 7;
    const isStaticPose = holdTime >= 20;
    if (isStaticPose) {
      switch (timer.phase) {
        case 'prepare':
        case 'rest':
        case 'completed':
        case 'schemeCompleted':
          setVideoPlaybackState({ paused: true, shouldSeek: true, seekTime: 0 });
          break;
        case 'exercise':
          setVideoPlaybackState({ paused: true, shouldSeek: true, seekTime: 2 });
          break;
        case 'miniRest':
          setVideoPlaybackState({ paused: true, shouldSeek: true, seekTime: 0 });
          break;
      }
    } else {
      switch (timer.phase) {
        case 'prepare':
        case 'rest':
        case 'completed':
        case 'schemeCompleted':
          setVideoPlaybackState({ paused: true, shouldSeek: true, seekTime: 0 });
          break;
        case 'exercise':
          if (timer.currentTime === holdTime) {
            setVideoPlaybackState({ paused: false, shouldSeek: true, seekTime: 0 });
          }
          break;
        case 'miniRest':
          if (timer.currentTime === 3) {
            setVideoPlaybackState({ paused: false, shouldSeek: true, seekTime: 2 });
          }
          break;
      }
    }
  }, [timer.phase, timer.currentTime, exerciseType, executionType, exerciseSettings, settings, currentExerciseId]);

  useEffect(() => {
    if (exerciseType === 'walk' || executionType === 'dynamic' || executionType === 'foam_rolling') return;
    if (videoPlaybackState.shouldSeek && videoRef.current) {
      videoRef.current.seek(videoPlaybackState.seekTime);
      setVideoPlaybackState(prev => ({ ...prev, shouldSeek: false }));
    }
  }, [videoPlaybackState.shouldSeek, videoPlaybackState.seekTime, exerciseType, executionType]);

  return {
    currentExerciseId,
    executionType,
    exerciseSettings,
    videoSource,
    isLoadingVideo,
    rehabProgram,
    userProgress,
    exerciseProgress,
    buttonState,
    timer,
    videoDuration,
    videoPlaybackState,
    videoRef,
    startExercise,
    formatTime,
    handleVideoLoad,
    handleVideoProgress,
    handleVideoEnd,
    setTimer,
    setButtonState,
    setVideoDuration,
    setVideoPlaybackState,
  };
};
