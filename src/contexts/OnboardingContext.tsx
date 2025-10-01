// Контекст для управления состоянием онбординга

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingData,
  PainLevel,
  ExerciseSettings,
  WalkSettings,
  NotificationSettings,
  ONBOARDING_STORAGE_KEYS,
} from '../types';
import {
  getRecommendedSettings,
  getRecommendedWalkSettings,
  getDefaultNotificationSettings,
} from '../utils/onboardingUtils';

// ============ ТИПЫ ============

interface OnboardingContextType {
  // Состояние
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  onboardingData: OnboardingData | null;
  
  // Методы для обновления данных
  setPainLevel: (level: PainLevel) => void;
  setExerciseSettings: (settings: ExerciseSettings) => void;
  setWalkSettings: (settings: WalkSettings) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
  setAcknowledgedDisclaimer: (acknowledged: boolean) => void;
  
  // Методы для работы с онбордингом
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  initializeOnboardingData: (painLevel: PainLevel) => void;
}

// ============ КОНТЕКСТ ============

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// ============ PROVIDER ============

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  // Загрузка состояния онбординга при монтировании
  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  /**
   * Загрузить статус завершения онбординга
   */
  const loadOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.HAS_COMPLETED);
      const savedData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.ONBOARDING_DATA);

      if (completed === 'true') {
        setHasCompletedOnboarding(true);
      }

      if (savedData) {
        setOnboardingData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Инициализировать данные онбординга на основе выбранного уровня боли
   */
  const initializeOnboardingData = (painLevel: PainLevel) => {
    const exerciseSettings = getRecommendedSettings(painLevel);
    const walkSettings = getRecommendedWalkSettings(painLevel);
    const notificationSettings = getDefaultNotificationSettings();

    const newData: OnboardingData = {
      painLevel,
      exerciseSettings,
      walkSettings,
      notificationSettings,
      acknowledgedDisclaimer: false,
    };

    setOnboardingData(newData);
    
    // Сохраняем временные данные
    saveOnboardingData(newData);
  };

  /**
   * Установить уровень боли
   */
  const setPainLevel = (level: PainLevel) => {
    if (!onboardingData) {
      initializeOnboardingData(level);
      return;
    }

    const updatedData: OnboardingData = {
      ...onboardingData,
      painLevel: level,
      // Обновляем рекомендованные настройки при изменении уровня боли
      exerciseSettings: getRecommendedSettings(level),
      walkSettings: getRecommendedWalkSettings(level),
    };

    setOnboardingData(updatedData);
    saveOnboardingData(updatedData);
  };

  /**
   * Установить настройки упражнений
   */
  const setExerciseSettings = (settings: ExerciseSettings) => {
    if (!onboardingData) return;

    const updatedData: OnboardingData = {
      ...onboardingData,
      exerciseSettings: settings,
    };

    setOnboardingData(updatedData);
    saveOnboardingData(updatedData);
  };

  /**
   * Установить настройки ходьбы
   */
  const setWalkSettings = (settings: WalkSettings) => {
    if (!onboardingData) return;

    const updatedData: OnboardingData = {
      ...onboardingData,
      walkSettings: settings,
    };

    setOnboardingData(updatedData);
    saveOnboardingData(updatedData);
  };

  /**
   * Установить настройки уведомлений
   */
  const setNotificationSettings = (settings: NotificationSettings) => {
    if (!onboardingData) return;

    const updatedData: OnboardingData = {
      ...onboardingData,
      notificationSettings: settings,
    };

    setOnboardingData(updatedData);
    saveOnboardingData(updatedData);
  };

  /**
   * Установить подтверждение медицинских противопоказаний
   */
  const setAcknowledgedDisclaimer = (acknowledged: boolean) => {
    if (!onboardingData) return;

    const updatedData: OnboardingData = {
      ...onboardingData,
      acknowledgedDisclaimer: acknowledged,
    };

    setOnboardingData(updatedData);
    saveOnboardingData(updatedData);
  };

  /**
   * Сохранить данные онбординга в AsyncStorage
   */
  const saveOnboardingData = async (data: OnboardingData) => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEYS.ONBOARDING_DATA,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  /**
   * Завершить онбординг и сохранить все настройки
   */
  const completeOnboarding = async () => {
    if (!onboardingData) {
      console.error('Cannot complete onboarding: no data available');
      return;
    }

    try {
      // Добавляем timestamp завершения
      const completedData: OnboardingData = {
        ...onboardingData,
        completedAt: Date.now(),
      };

      // Сохраняем данные онбординга
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEYS.ONBOARDING_DATA,
        JSON.stringify(completedData)
      );

      // Сохраняем настройки пользователя в основное хранилище
      const userSettings = {
        exerciseSettings: completedData.exerciseSettings,
        walkSettings: completedData.walkSettings,
        notificationSettings: completedData.notificationSettings,
      };

      await AsyncStorage.setItem('userSettings', JSON.stringify(userSettings));

      // Сохраняем уровень боли
      const painStatus = {
        level: completedData.painLevel,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem('lastPainStatus', JSON.stringify(painStatus));
      await AsyncStorage.setItem(
        `painStatus_${painStatus.date}`,
        JSON.stringify(painStatus)
      );

      // Устанавливаем флаг завершения онбординга
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.HAS_COMPLETED, 'true');

      setHasCompletedOnboarding(true);
      setOnboardingData(completedData);

      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  /**
   * Сбросить онбординг (для тестирования)
   */
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.HAS_COMPLETED);
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEYS.ONBOARDING_DATA);

      setHasCompletedOnboarding(false);
      setOnboardingData(null);

      console.log('Onboarding reset successfully');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  // Значение контекста
  const value: OnboardingContextType = {
    hasCompletedOnboarding,
    isLoading,
    onboardingData,
    setPainLevel,
    setExerciseSettings,
    setWalkSettings,
    setNotificationSettings,
    setAcknowledgedDisclaimer,
    completeOnboarding,
    resetOnboarding,
    initializeOnboardingData,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// ============ HOOK ============

/**
 * Хук для использования контекста онбординга
 */
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  
  return context;
};
