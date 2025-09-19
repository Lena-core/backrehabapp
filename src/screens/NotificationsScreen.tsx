import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NotificationSettings } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useUserSettings } from '../hooks/useUserSettings';

interface NotificationToggleProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}) => {
  return (
    <View style={[styles.toggleContainer, disabled && styles.disabledContainer]}>
      <View style={styles.toggleContent}>
        <View style={styles.toggleText}>
          <Text style={[styles.toggleTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          <Text style={[styles.toggleDescription, disabled && styles.disabledText]}>
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: COLORS.TEXT_INACTIVE,
            true: COLORS.PRIMARY_ACCENT,
          }}
          thumbColor={value ? COLORS.WHITE : COLORS.WHITE}
        />
      </View>
    </View>
  );
};

const NotificationsScreen: React.FC = () => {
  const { settings, loading, saveSettings } = useUserSettings();
  
  const [localNotificationSettings, setLocalNotificationSettings] = useState<NotificationSettings>({
    exerciseReminders: true,
    spineHygieneTips: true,
    educationalMessages: true,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Загружаем настройки при получении данных
  useEffect(() => {
    if (settings?.notificationSettings) {
      setLocalNotificationSettings(settings.notificationSettings);
    }
  }, [settings]);

  const handleToggleNotification = (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    const newSettings = {
      ...localNotificationSettings,
      [key]: value,
    };

    setLocalNotificationSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        notificationSettings: localNotificationSettings,
      };

      await saveSettings(updatedSettings);
      setHasUnsavedChanges(false);
      Alert.alert('Успешно', 'Настройки уведомлений сохранены!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки уведомлений');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка настроек...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Настройки уведомлений */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Типы уведомлений</Text>
          
          <NotificationToggle
            title="Напоминания об упражнениях"
            description="Уведомления о необходимости выполнить упражнения"
            value={localNotificationSettings.exerciseReminders}
            onValueChange={(value) => handleToggleNotification('exerciseReminders', value)}
          />

          <NotificationToggle
            title="Подсказки о гигиене позвоночника"
            description="Советы по правильной осанке и уходу за спиной"
            value={localNotificationSettings.spineHygieneTips}
            onValueChange={(value) => handleToggleNotification('spineHygieneTips', value)}
          />

          <NotificationToggle
            title="Образовательные сообщения"
            description="Полезная информация о здоровье позвоночника"
            value={localNotificationSettings.educationalMessages}
            onValueChange={(value) => handleToggleNotification('educationalMessages', value)}
          />
        </View>

        {/* Информация */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Информация</Text>
          <Text style={styles.infoText}>
            Push-уведомления помогают поддерживать регулярность выполнения упражнений и получать полезные советы. 
            Каждый тип уведомлений можно настроить отдельно.
          </Text>
        </View>

        {/* Кнопка сохранения */}
        {hasUnsavedChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Text style={styles.saveButtonText}>Сохранить изменения</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
  },
  toggleContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    flex: 1,
    marginRight: 15,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    lineHeight: 18,
  },
  disabledText: {
    opacity: 0.5,
  },
  infoSection: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
