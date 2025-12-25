// Утилиты для работы с AsyncStorage и данными

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PainLevel, PainStatus, CompletedExercise, DayHistory, CalendarDay } from '../types';

// Ключи для хранения данных
export const STORAGE_KEYS = {
  LAST_PAIN_STATUS: 'lastPainStatus',
  PAIN_STATUS_PREFIX: 'painStatus_',
  EXERCISES_PREFIX: 'exercises_',
  USER_SETTINGS: 'userSettings',
  DAY_HISTORY_PREFIX: 'dayHistory_',
};

// Получение даты в формате YYYY-MM-DD
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Получение статуса боли за сегодня
export const getTodayPainStatus = async (): Promise<PainLevel> => {
  try {
    const today = getCurrentDateString();
    const todayStatus = await AsyncStorage.getItem(`${STORAGE_KEYS.PAIN_STATUS_PREFIX}${today}`);
    
    if (todayStatus) {
      const parsed: PainStatus = JSON.parse(todayStatus);
      return parsed.level;
    }
    
    // Если нет записи за сегодня, берем последний статус
    const lastStatus = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PAIN_STATUS);
    if (lastStatus) {
      const parsed: PainStatus = JSON.parse(lastStatus);
      return parsed.level;
    }
    
    return 'none'; // По умолчанию
  } catch (error) {
    console.error('Error getting today pain status:', error);
    return 'none';
  }
};

// Сохранение статуса боли
export const savePainStatus = async (level: PainLevel): Promise<void> => {
  try {
    const dateStr = getCurrentDateString();
    const painStatus: PainStatus = {
      level,
      date: dateStr,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_PAIN_STATUS, JSON.stringify(painStatus));
    await AsyncStorage.setItem(`${STORAGE_KEYS.PAIN_STATUS_PREFIX}${painStatus.date}`, JSON.stringify(painStatus));
    
    // Обновляем уровень боли в истории дня
    await updateDayPainLevel(dateStr, level);
  } catch (error) {
    console.error('Error saving pain status:', error);
    throw error;
  }
};

// Получение цвета для уровня боли
export const getPainLevelColor = (level: PainLevel): string => {
  const colors = {
    none: '#FDE7B1',    // Все хорошо
    mild: '#F5EACF',    // Немного болит
    moderate: '#E0EBEB', // Болит
    severe: '#B6C5E1',   // Сильно болит
    acute: '#F2B2A5',    // Острая боль
  };
  return colors[level] || colors.none;
};

// ============ ФУНКЦИИ ДЛЯ ДНЕВНИКА (ИСТОРИИ) ============

// Сохранение выполненного упражнения
export const saveDayExercise = async (exercise: CompletedExercise): Promise<void> => {
  try {
    const dateStr = exercise.completedAt.split('T')[0]; // Получаем YYYY-MM-DD
    const historyKey = `${STORAGE_KEYS.DAY_HISTORY_PREFIX}${dateStr}`;
    
    // Получаем текущую историю за этот день
    const existingHistoryStr = await AsyncStorage.getItem(historyKey);
    let dayHistory: DayHistory;
    
    if (existingHistoryStr) {
      dayHistory = JSON.parse(existingHistoryStr);
      // Добавляем новое упражнение
      dayHistory.exercises.push(exercise);
    } else {
      // Создаём новую запись
      // Пробуем получить уровень боли за этот день
      const painStatusStr = await AsyncStorage.getItem(`${STORAGE_KEYS.PAIN_STATUS_PREFIX}${dateStr}`);
      let painLevel = null;
      if (painStatusStr) {
        const painStatus = JSON.parse(painStatusStr);
        painLevel = painStatus.level;
      }
      
      dayHistory = {
        date: dateStr,
        painLevel,
        exercises: [exercise],
      };
    }
    
    // Сохраняем обновлённую историю
    await AsyncStorage.setItem(historyKey, JSON.stringify(dayHistory));
  } catch (error) {
    console.error('Error saving day exercise:', error);
    throw error;
  }
};

// Получение истории за конкретный день
export const getDayHistory = async (dateStr: string): Promise<DayHistory | null> => {
  try {
    const historyKey = `${STORAGE_KEYS.DAY_HISTORY_PREFIX}${dateStr}`;
    const historyStr = await AsyncStorage.getItem(historyKey);
    
    if (historyStr) {
      return JSON.parse(historyStr);
    }
    
    // Если нет истории, проверяем есть ли хотя бы уровень боли
    const painStatusStr = await AsyncStorage.getItem(`${STORAGE_KEYS.PAIN_STATUS_PREFIX}${dateStr}`);
    if (painStatusStr) {
      const painStatus = JSON.parse(painStatusStr);
      return {
        date: dateStr,
        painLevel: painStatus.level,
        exercises: [],
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting day history:', error);
    return null;
  }
};

// Получение истории за месяц (для календаря)
export const getMonthHistory = async (year: number, month: number): Promise<CalendarDay[]> => {
  try {
    // Получаем количество дней в месяце
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays: CalendarDay[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayHistory = await getDayHistory(dateStr);
      
      if (dayHistory) {
        calendarDays.push({
          date: dateStr,
          hasActivity: dayHistory.painLevel !== null || dayHistory.exercises.length > 0,
          painLevel: dayHistory.painLevel,
          exerciseCount: dayHistory.exercises.length,
        });
      } else {
        calendarDays.push({
          date: dateStr,
          hasActivity: false,
          painLevel: null,
          exerciseCount: 0,
        });
      }
    }
    
    return calendarDays;
  } catch (error) {
    console.error('Error getting month history:', error);
    return [];
  }
};

// Обновление уровня боли в истории дня
export const updateDayPainLevel = async (dateStr: string, painLevel: PainLevel): Promise<void> => {
  try {
    const historyKey = `${STORAGE_KEYS.DAY_HISTORY_PREFIX}${dateStr}`;
    const existingHistoryStr = await AsyncStorage.getItem(historyKey);
    
    if (existingHistoryStr) {
      const dayHistory: DayHistory = JSON.parse(existingHistoryStr);
      dayHistory.painLevel = painLevel;
      await AsyncStorage.setItem(historyKey, JSON.stringify(dayHistory));
    } else {
      // Создаём новую запись с уровнем боли
      const dayHistory: DayHistory = {
        date: dateStr,
        painLevel,
        exercises: [],
      };
      await AsyncStorage.setItem(historyKey, JSON.stringify(dayHistory));
    }
  } catch (error) {
    console.error('Error updating day pain level:', error);
    throw error;
  }
};
