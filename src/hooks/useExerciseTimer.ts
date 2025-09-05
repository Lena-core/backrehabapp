import { useState, useEffect, useCallback } from 'react';
import { ExerciseType, UserSettings } from '../types';
import { EXERCISE_INSTRUCTIONS } from '../constants/exercises/descriptions';

export interface TimerState {
  currentTime: number;
  isRunning: boolean;
  phase: 'prepare' | 'exercise' | 'rest' | 'completed';
  currentSet: number;
  currentRep: number;
  instruction: string;
}

export interface UseExerciseTimerProps {
  exerciseType: ExerciseType;
  settings: UserSettings | null;
  onComplete: () => void;
}

export const useExerciseTimer = ({ 
  exerciseType, 
  settings, 
  onComplete 
}: UseExerciseTimerProps) => {
  const [timer, setTimer] = useState<TimerState>({
    currentTime: 0,
    isRunning: false,
    phase: 'prepare',
    currentSet: 1,
    currentRep: 1,
    instruction: 'Приготовьтесь к выполнению упражнения',
  });

  const getInstruction = useCallback((
    type: ExerciseType, 
    phase: string, 
    set: number, 
    rep: number
  ): string => {
    const repsSchema = settings?.exerciseSettings.repsSchema || [3, 2, 1];
    const instructionFunction = EXERCISE_INSTRUCTIONS[type]?.[phase];
    
    if (instructionFunction) {
      return instructionFunction(set, rep, repsSchema);
    }
    
    return 'Выполняйте упражнение';
  }, [settings]);

  const handleTimerComplete = useCallback((currentTimer: TimerState): TimerState => {
    if (!settings) {
      if (exerciseType === 'walk') {
        onComplete();
        return {
          ...currentTimer,
          isRunning: false,
          phase: 'completed',
          instruction: 'Упражнение завершено. Отлично поработали. Ходьба полезна для вашей спины!',
        };
      }
      return currentTimer;
    }

    const { exerciseSettings } = settings;
    const { repsSchema, holdTime, restTime } = exerciseSettings;

    switch (currentTimer.phase) {
      case 'prepare':
        return {
          ...currentTimer,
          currentTime: holdTime,
          phase: 'exercise',
          instruction: getInstruction(exerciseType, 'exercise', currentTimer.currentSet, currentTimer.currentRep),
        };

      case 'exercise':
        const isLastRep = currentTimer.currentRep >= repsSchema[currentTimer.currentSet - 1];
        const isLastSet = currentTimer.currentSet >= repsSchema.length;

        if (isLastRep && isLastSet) {
          onComplete();
          return {
            ...currentTimer,
            isRunning: false,
            phase: 'completed',
            instruction: 'Упражнение завершено. Отлично поработали.',
          };
        } else if (isLastRep) {
          return {
            ...currentTimer,
            currentTime: restTime,
            phase: 'rest',
            instruction: getInstruction(exerciseType, 'rest', currentTimer.currentSet, currentTimer.currentRep),
          };
        } else {
          return {
            ...currentTimer,
            currentTime: holdTime,
            currentRep: currentTimer.currentRep + 1,
            instruction: getInstruction(exerciseType, 'exercise', currentTimer.currentSet, currentTimer.currentRep + 1),
          };
        }

      case 'rest':
        const nextSet = currentTimer.currentSet + 1;
        return {
          ...currentTimer,
          currentTime: holdTime,
          phase: 'exercise',
          currentSet: nextSet,
          currentRep: 1,
          instruction: getInstruction(exerciseType, 'exercise', nextSet, 1),
        };

      default:
        return currentTimer;
    }
  }, [exerciseType, settings, onComplete, getInstruction]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev.currentTime <= 0) {
            return handleTimerComplete(prev);
          }
          return { ...prev, currentTime: prev.currentTime - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, handleTimerComplete]);

  const startExercise = useCallback(() => {
    if (!settings) return;

    if (exerciseType === 'walk') {
      const walkDurationInSeconds = settings.walkSettings.duration * 60;
      setTimer({
        currentTime: walkDurationInSeconds,
        isRunning: true,
        phase: 'exercise',
        currentSet: 1,
        currentRep: 1,
        instruction: 'Начните ходьбу. Держите спину ровно, смотрите прямо. Делайте короткие шаги.',
      });
    } else {
      const totalSets = settings.exerciseSettings.repsSchema.length;
      setTimer({
        currentTime: 3,
        isRunning: true,
        phase: 'prepare',
        currentSet: 1,
        currentRep: 1,
        instruction: getInstruction(exerciseType, 'prepare', 1, 1),
      });
    }
  }, [exerciseType, settings, getInstruction]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timer,
    startExercise,
    formatTime,
  };
};
