// Утилиты для обработки ошибок и валидации данных

import { Alert } from 'react-native';
import { PainLevel, ExerciseSettings, WalkSettings } from '../types';

// Типы ошибок
export enum ErrorType {
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Класс для обработки ошибок
export class AppError extends Error {
  public type: ErrorType;
  public code?: string;
  public userMessage: string;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    code?: string
  ) {
    super(message);
    this.type = type;
    this.userMessage = userMessage;
    this.code = code;
  }
}

// Обработчик ошибок с показом пользователю
export const handleError = (error: Error | AppError, showAlert: boolean = true): void => {
  console.error('App Error:', error);

  if (showAlert) {
    let userMessage = 'Произошла неизвестная ошибка';

    if (error instanceof AppError) {
      userMessage = error.userMessage;
    } else {
      // Обработка стандартных ошибок
      if (error.message.includes('network')) {
        userMessage = 'Проблемы с подключением. Проверьте интернет-соединение.';
      } else if (error.message.includes('storage')) {
        userMessage = 'Ошибка сохранения данных. Попробуйте перезапустить приложение.';
      }
    }

    Alert.alert('Ошибка', userMessage, [{ text: 'OK' }]);
  }
};

// Валидация уровня боли
export const validatePainLevel = (level: string): PainLevel | null => {
  const validLevels: PainLevel[] = ['none', 'mild', 'moderate', 'severe', 'acute'];
  if (validLevels.includes(level as PainLevel)) {
    return level as PainLevel;
  }
  return null;
};

// Валидация настроек упражнений
export const validateExerciseSettings = (settings: Partial<ExerciseSettings>): string[] => {
  const errors: string[] = [];

  if (settings.holdTime !== undefined) {
    if (settings.holdTime < 3 || settings.holdTime > 10) {
      errors.push('Время удержания должно быть от 3 до 10 секунд');
    }
  }

  if (settings.restTime !== undefined) {
    if (settings.restTime < 5 || settings.restTime > 30) {
      errors.push('Время отдыха должно быть от 5 до 30 секунд');
    }
  }

  if (settings.repsSchema !== undefined) {
    if (!Array.isArray(settings.repsSchema) || settings.repsSchema.length !== 3) {
      errors.push('Схема повторений должна содержать 3 подхода');
    } else {
      for (const reps of settings.repsSchema) {
        if (typeof reps !== 'number' || reps < 0 || reps > 30) {
          errors.push('Количество повторений должно быть от 0 до 30');
          break;
        }
      }
    }
  }

  return errors;
};

// Валидация настроек ходьбы
export const validateWalkSettings = (settings: Partial<WalkSettings>): string[] => {
  const errors: string[] = [];

  if (settings.duration !== undefined) {
    if (settings.duration < 1 || settings.duration > 60) {
      errors.push('Длительность сессии должна быть от 1 до 60 минут');
    }
  }

  if (settings.sessions !== undefined) {
    if (settings.sessions < 1 || settings.sessions > 5) {
      errors.push('Количество сессий должно быть от 1 до 5');
    }
  }

  return errors;
};

// Безопасное выполнение асинхронных операций
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const appError = new AppError(
      ErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      errorMessage || 'Операция не может быть выполнена'
    );
    handleError(appError, false);
    return null;
  }
};

// Валидация даты
export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Создание безопасного парсера JSON
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(json);
    return parsed;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

// Проверка доступности функций устройства
export const checkDeviceCapabilities = (): {
  hasAsyncStorage: boolean;
  hasVibration: boolean;
  hasNotifications: boolean;
} => {
  return {
    hasAsyncStorage: true, // AsyncStorage всегда доступен в React Native
    hasVibration: true,   // Вибрация доступна на большинстве устройств
    hasNotifications: true, // Уведомления требуют дополнительной настройки
  };
};

// Форматирование ошибок для отладки
export const formatErrorForDebug = (error: Error | AppError): string => {
  if (error instanceof AppError) {
    return `[${error.type}] ${error.message} (User: ${error.userMessage})`;
  }
  return `[STANDARD_ERROR] ${error.message}`;
};

// Проверка целостности данных
export const validateDataIntegrity = (data: any): boolean => {
  if (data === null || data === undefined) {
    return false;
  }

  if (typeof data === 'object') {
    try {
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  }

  return true;
};

// Ретраи для критических операций
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        handleError(
          new AppError(
            ErrorType.UNKNOWN_ERROR,
            `Operation failed after ${maxRetries} attempts`,
            'Операция не может быть выполнена. Попробуйте позже.'
          )
        );
        return null;
      }
      
      // Задержка перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  return null;
};
