// Утилиты для работы с AsyncStorage и данными

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PainLevel, PainStatus, UserSettings } from '../types';

// Ключи для хранения данных
export const STORAGE_KEYS = {
  LAST_PAIN_STATUS: 'lastPainStatus',
  PAIN_STATUS_PREFIX: 'painStatus_',
  EXERCISES_PREFIX: 'exercises_',
  USER_SETTINGS: 'userSettings',
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
    const painStatus: PainStatus = {
      level,
      date: getCurrentDateString(),
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_PAIN_STATUS, JSON.stringify(painStatus));
    await AsyncStorage.setItem(`${STORAGE_KEYS.PAIN_STATUS_PREFIX}${painStatus.date}`, JSON.stringify(painStatus));
  } catch (error) {
    console.error('Error saving pain status:', error);
    throw error;
  }
};

// Получение настроек пользователя
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    // Настройки по умолчанию
    return {
      exerciseSettings: {
        holdTime: 7,
        repsSchema: [3, 2, 1],
        restTime: 15,
      },
      walkSettings: {
        duration: 5,
        sessions: 3,
      },
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    // Возвращаем настройки по умолчанию в случае ошибки
    return {
      exerciseSettings: {
        holdTime: 7,
        repsSchema: [3, 2, 1],
        restTime: 15,
      },
      walkSettings: {
        duration: 5,
        sessions: 3,
      },
    };
  }
};

// Сохранение настроек пользователя
export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
};

// Форматирование времени в MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

// Получение рекомендаций по уровню боли
export const getPainLevelRecommendation = (level: PainLevel): string => {
  const recommendations = {
    none: `Важно выполнить все упражнения, это укрепит мышцы спины и снизит риск рецидивов в будущем.

Если чувствуете, что нужна дополнительная нагрузка, добавьте одно повторение к каждому подходу. Эта стратегия поможет уменьшить судороги в мышцах спины и повысить выносливость. Никогда не жертвуйте правильной техникой выполнения упражнения ради большего количества повторений.`,
    mild: 'При выполнении упражнений не переусердствуйте, опирайтесь на свои ощущения.',
    moderate: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
    severe: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
    acute: 'Рекомендуется отдохнуть от упражнений и подождать, когда боль снизится. Походите, если состояние это позволяет.',
  };
  return recommendations[level] || recommendations.none;
};

// Очистка всех данных (для разработки/тестирования)
export const clearAllData = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    console.log('All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
