import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExerciseExecution,
  ExerciseHistorySummary,
  ProgressionSuggestion,
  ExtendedExerciseSettings,
  ExerciseExecutionType,
} from '../types';
import { getExerciseById } from '../constants/exercises/exercisesData';

// ========== КЛЮЧИ ХРАНЕНИЯ ==========
const EXERCISE_HISTORY_KEY = '@exercise_history';
const HISTORY_SUMMARY_KEY_PREFIX = '@history_summary_';

// ========== СОХРАНЕНИЕ ВЫПОЛНЕНИЯ ==========

/**
 * Сохранить новое выполнение упражнения
 */
export const saveExerciseExecution = async (
  execution: ExerciseExecution
): Promise<void> => {
  try {
    // Получаем всю историю
    const history = await getAllExecutions();
    history.push(execution);
    
    // Сохраняем обновленную историю
    await AsyncStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
    
    // Обновляем сводку для этого упражнения
    await updateExerciseSummary(execution.exerciseId);
    
    console.log(`Exercise execution saved: ${execution.exerciseId}`);
  } catch (error) {
    console.error('Error saving exercise execution:', error);
    throw error;
  }
};

// ========== ПОЛУЧЕНИЕ ИСТОРИИ ==========

/**
 * Получить всю историю выполнений
 */
export const getAllExecutions = async (): Promise<ExerciseExecution[]> => {
  try {
    const stored = await AsyncStorage.getItem(EXERCISE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading exercise history:', error);
    return [];
  }
};

/**
 * Получить историю конкретного упражнения
 */
export const getExerciseExecutions = async (
  exerciseId: string,
  limit?: number
): Promise<ExerciseExecution[]> => {
  try {
    const allHistory = await getAllExecutions();
    const exerciseHistory = allHistory
      .filter(ex => ex.exerciseId === exerciseId)
      .sort((a, b) => b.timestamp - a.timestamp); // Новые сначала
      
    return limit ? exerciseHistory.slice(0, limit) : exerciseHistory;
  } catch (error) {
    console.error('Error loading exercise executions:', error);
    return [];
  }
};

/**
 * Получить историю за определенный период
 */
export const getExecutionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<ExerciseExecution[]> => {
  try {
    const allHistory = await getAllExecutions();
    return allHistory.filter(ex => {
      return ex.date >= startDate && ex.date <= endDate;
    }).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error loading executions by date range:', error);
    return [];
  }
};

/**
 * Получить историю по программе
 */
export const getExecutionsByProgram = async (
  programId: string
): Promise<ExerciseExecution[]> => {
  try {
    const allHistory = await getAllExecutions();
    return allHistory
      .filter(ex => ex.programId === programId)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error loading executions by program:', error);
    return [];
  }
};

// ========== СВОДКА ПО УПРАЖНЕНИЮ ==========

/**
 * Обновить сводку по упражнению
 */
export const updateExerciseSummary = async (
  exerciseId: string
): Promise<void> => {
  try {
    const executions = await getExerciseExecutions(exerciseId);
    
    if (executions.length === 0) {
      // Если нет выполнений - удаляем сводку
      await AsyncStorage.removeItem(`${HISTORY_SUMMARY_KEY_PREFIX}${exerciseId}`);
      return;
    }
    
    const completed = executions.filter(ex => ex.completed);
    const totalCompletions = completed.length;
    const lastCompleted = completed[0]?.date;
    const currentSettings = executions[0]?.settings;
    
    // Считаем серию выполнений (streak)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedByDate = [...executions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (const ex of sortedByDate) {
      if (ex.completed) {
        const exDate = new Date(ex.date);
        exDate.setHours(0, 0, 0, 0);
        
        // Проверяем, что выполнение было сегодня или вчера
        const daysDiff = Math.floor((today.getTime() - exDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= streak + 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    // Средний процент выполнения
    const completionRates = executions.map(ex => {
      const totalSets = ex.settings.repsSchema?.length || 
                       ex.settings.dynamicSets || 
                       ex.settings.rollingSessions ||
                       1;
      return ex.completedSets / totalSets;
    });
    
    const avgCompletionRate = completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 0;
    
    // Готов к прогрессии?
    const readyForProgression = checkIfReadyForProgression(
      exerciseId,
      totalCompletions,
      avgCompletionRate
    );
    
    const summary: ExerciseHistorySummary = {
      exerciseId,
      totalCompletions,
      lastCompleted,
      currentSettings,
      completionStreak: streak,
      averageCompletionRate: avgCompletionRate,
      readyForProgression,
    };
    
    await AsyncStorage.setItem(
      `${HISTORY_SUMMARY_KEY_PREFIX}${exerciseId}`,
      JSON.stringify(summary)
    );
    
    console.log(`Exercise summary updated: ${exerciseId}`);
  } catch (error) {
    console.error('Error updating exercise summary:', error);
  }
};

/**
 * Получить сводку по упражнению
 */
export const getExerciseSummary = async (
  exerciseId: string
): Promise<ExerciseHistorySummary | null> => {
  try {
    const stored = await AsyncStorage.getItem(`${HISTORY_SUMMARY_KEY_PREFIX}${exerciseId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading exercise summary:', error);
    return null;
  }
};

/**
 * Получить сводки по всем упражнениям
 */
export const getAllExerciseSummaries = async (): Promise<ExerciseHistorySummary[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const summaryKeys = allKeys.filter(key => key.startsWith(HISTORY_SUMMARY_KEY_PREFIX));
    
    const summaries: ExerciseHistorySummary[] = [];
    for (const key of summaryKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        summaries.push(JSON.parse(stored));
      }
    }
    
    return summaries;
  } catch (error) {
    console.error('Error loading all exercise summaries:', error);
    return [];
  }
};

// ========== СИСТЕМА ПРОГРЕССИИ ==========

/**
 * Проверить готовность к прогрессии
 */
const checkIfReadyForProgression = (
  exerciseId: string,
  completions: number,
  avgCompletionRate: number
): boolean => {
  // Простые правила - можно усложнить позже
  const MIN_COMPLETIONS = 5;        // Минимум 5 выполнений
  const MIN_COMPLETION_RATE = 0.8;  // 80% успешности
  
  return completions >= MIN_COMPLETIONS && avgCompletionRate >= MIN_COMPLETION_RATE;
};

/**
 * Получить предложения прогрессии для программы
 */
export const getProgressionSuggestions = async (
  programId: string,
  exerciseIds: string[]
): Promise<ProgressionSuggestion[]> => {
  try {
    const suggestions: ProgressionSuggestion[] = [];
    
    for (const exerciseId of exerciseIds) {
      const summary = await getExerciseSummary(exerciseId);
      
      if (summary && summary.readyForProgression) {
        const exercise = getExerciseById(exerciseId);
        
        if (!exercise) continue;
        
        // Проверяем есть ли путь прогрессии
        if (exercise.progressionPath && exercise.progressionPath.length > 1) {
          const currentIndex = exercise.progressionPath.indexOf(exerciseId);
          const nextExerciseId = exercise.progressionPath[currentIndex + 1];
          
          if (nextExerciseId) {
            // Предлагаем переход на следующее упражнение
            const nextExercise = getExerciseById(nextExerciseId);
            
            if (nextExercise) {
              suggestions.push({
                exerciseId,
                exerciseName: exercise.nameRu,
                currentSettings: summary.currentSettings,
                suggestion: {
                  type: 'exercise',
                  message: `Отличная работа! Вы готовы перейти на следующий уровень`,
                  newExerciseId: nextExerciseId,
                  newExerciseName: nextExercise.nameRu,
                },
                reason: `Выполнено ${summary.totalCompletions} раз со средней успешностью ${Math.round(summary.averageCompletionRate * 100)}%`,
                completions: summary.totalCompletions,
                avgCompletionRate: summary.averageCompletionRate,
              });
            }
          } else {
            // Нет следующего упражнения - предлагаем усложнить настройки
            const newSettings = suggestNewSettings(summary.currentSettings, exercise.executionType);
            
            suggestions.push({
              exerciseId,
              exerciseName: exercise.nameRu,
              currentSettings: summary.currentSettings,
              suggestion: {
                type: 'settings',
                message: `Попробуйте увеличить нагрузку`,
                newSettings,
              },
              reason: `Выполнено ${summary.totalCompletions} раз, можно усложнить`,
              completions: summary.totalCompletions,
              avgCompletionRate: summary.averageCompletionRate,
            });
          }
        } else {
          // Нет пути прогрессии - только усложняем настройки
          const newSettings = suggestNewSettings(summary.currentSettings, exercise.executionType);
          
          suggestions.push({
            exerciseId,
            exerciseName: exercise.nameRu,
            currentSettings: summary.currentSettings,
            suggestion: {
              type: 'settings',
              message: `Попробуйте увеличить нагрузку`,
              newSettings,
            },
            reason: `Выполнено ${summary.totalCompletions} раз со средней успешностью ${Math.round(summary.averageCompletionRate * 100)}%`,
            completions: summary.totalCompletions,
            avgCompletionRate: summary.averageCompletionRate,
          });
        }
      }
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error getting progression suggestions:', error);
    return [];
  }
};

/**
 * Предложить новые настройки
 */
const suggestNewSettings = (
  currentSettings: ExtendedExerciseSettings,
  executionType: ExerciseExecutionType
): ExtendedExerciseSettings => {
  const newSettings = { ...currentSettings };
  
  switch (executionType) {
    case 'hold':
    case 'reps':
      // Увеличиваем время удержания на 2 секунды (максимум 15)
      if (newSettings.holdTime) {
        newSettings.holdTime = Math.min(newSettings.holdTime + 2, 15);
      }
      // Добавляем повторения в каждом подходе (максимум 5 на подход)
      if (newSettings.repsSchema) {
        newSettings.repsSchema = newSettings.repsSchema.map(r => Math.min(r + 1, 5));
      }
      break;
      
    case 'foam_rolling':
      // Увеличиваем время прокатки на 15 секунд (максимум 120)
      if (newSettings.rollingDuration) {
        newSettings.rollingDuration = Math.min(newSettings.rollingDuration + 15, 120);
      }
      break;
      
    case 'dynamic':
      // Увеличиваем количество повторений на 2 (максимум 20)
      if (newSettings.dynamicReps) {
        newSettings.dynamicReps = Math.min(newSettings.dynamicReps + 2, 20);
      }
      break;
      
    case 'walk':
      // Увеличиваем продолжительность на 5 минут (максимум 60)
      if (newSettings.walkDuration) {
        newSettings.walkDuration = Math.min(newSettings.walkDuration + 5, 60);
      }
      break;
  }
  
  return newSettings;
};

// ========== СТАТИСТИКА ==========

/**
 * Получить общую статистику по всем упражнениям
 */
export const getOverallStatistics = async (): Promise<{
  totalExecutions: number;
  completedExecutions: number;
  totalDuration: number; // в секундах
  averageCompletionRate: number;
  exercisesWithStreak: number;
}> => {
  try {
    const allExecutions = await getAllExecutions();
    
    const totalExecutions = allExecutions.length;
    const completedExecutions = allExecutions.filter(ex => ex.completed).length;
    const totalDuration = allExecutions.reduce((sum, ex) => sum + ex.totalDuration, 0);
    
    const completionRates = allExecutions.map(ex => {
      const totalSets = ex.settings.repsSchema?.length || 
                       ex.settings.dynamicSets || 
                       ex.settings.rollingSessions ||
                       1;
      return ex.completedSets / totalSets;
    });
    
    const averageCompletionRate = completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 0;
    
    const summaries = await getAllExerciseSummaries();
    const exercisesWithStreak = summaries.filter(s => s.completionStreak > 0).length;
    
    return {
      totalExecutions,
      completedExecutions,
      totalDuration,
      averageCompletionRate,
      exercisesWithStreak,
    };
  } catch (error) {
    console.error('Error calculating overall statistics:', error);
    return {
      totalExecutions: 0,
      completedExecutions: 0,
      totalDuration: 0,
      averageCompletionRate: 0,
      exercisesWithStreak: 0,
    };
  }
};

// ========== ОЧИСТКА ДАННЫХ ==========

/**
 * Очистить всю историю (для тестирования или сброса)
 */
export const clearAllHistory = async (): Promise<void> => {
  try {
    // Удаляем всю историю
    await AsyncStorage.removeItem(EXERCISE_HISTORY_KEY);
    
    // Удаляем все сводки
    const allKeys = await AsyncStorage.getAllKeys();
    const summaryKeys = allKeys.filter(key => key.startsWith(HISTORY_SUMMARY_KEY_PREFIX));
    await AsyncStorage.multiRemove(summaryKeys);
    
    console.log('All history cleared');
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};

/**
 * Удалить историю конкретного упражнения
 */
export const clearExerciseHistory = async (exerciseId: string): Promise<void> => {
  try {
    // Получаем всю историю
    const allHistory = await getAllExecutions();
    
    // Фильтруем, оставляя все кроме указанного упражнения
    const filteredHistory = allHistory.filter(ex => ex.exerciseId !== exerciseId);
    
    // Сохраняем обновленную историю
    await AsyncStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(filteredHistory));
    
    // Удаляем сводку
    await AsyncStorage.removeItem(`${HISTORY_SUMMARY_KEY_PREFIX}${exerciseId}`);
    
    console.log(`History cleared for exercise: ${exerciseId}`);
  } catch (error) {
    console.error('Error clearing exercise history:', error);
    throw error;
  }
};
