import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

// Глобальные слушатели для обновлений настроек
type SettingsListener = () => void;
const settingsListeners: SettingsListener[] = [];

// Функция для уведомления всех слушателей об изменении настроек
const notifySettingsChanged = () => {
  settingsListeners.forEach(listener => listener());
};

// Экспортируем функцию для внешнего использования
export const triggerSettingsUpdate = () => {
  notifySettingsChanged();
};

export interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (newSettings: UserSettings) => Promise<void>;
}

export const useUserSettings = (): UseUserSettingsReturn => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDefaultSettings = (): UserSettings => ({
    exerciseSettings: {
      holdTime: 7,
      repsSchema: [3, 2, 1],
      restTime: 15,
    },
    walkSettings: {
      duration: 5,
      sessions: 3,
    },
    notificationSettings: {
      exerciseReminders: true,
      spineHygieneTips: true,
      educationalMessages: true,
    },
  });

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading settings from AsyncStorage...');
      const savedSettings = await AsyncStorage.getItem('userSettings');
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        console.log('Loaded settings:', parsed);
        
        // Обратная совместимость: добавляем настройки уведомлений если их нет
        if (!parsed.notificationSettings) {
          parsed.notificationSettings = {
            exerciseReminders: true,
            spineHygieneTips: true,
            educationalMessages: true,
          };
          // Сохраняем обновленные настройки
          await AsyncStorage.setItem('userSettings', JSON.stringify(parsed));
        }
        
        // Удаляем старое поле allNotifications если оно есть
        if (parsed.notificationSettings?.allNotifications !== undefined) {
          delete parsed.notificationSettings.allNotifications;
          await AsyncStorage.setItem('userSettings', JSON.stringify(parsed));
        }
        
        setSettings(parsed);
      } else {
        const defaultSettings = getDefaultSettings();
        console.log('No saved settings, using defaults:', defaultSettings);
        setSettings(defaultSettings);
        await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Ошибка загрузки настроек');
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings): Promise<void> => {
    try {
      console.log('Saving settings:', newSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      setError(null);
      
      // Уведомляем всех слушателей об изменении
      notifySettingsChanged();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Ошибка сохранения настроек');
      throw err;
    }
  };

  useEffect(() => {
    loadSettings();
    
    // Подписываемся на обновления настроек
    const settingsUpdateListener = () => {
      console.log('Settings update triggered, reloading...');
      loadSettings();
    };
    
    settingsListeners.push(settingsUpdateListener);
    
    // Очищаем слушателя при размонтировании
    return () => {
      const index = settingsListeners.indexOf(settingsUpdateListener);
      if (index > -1) {
        settingsListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
  };
};
