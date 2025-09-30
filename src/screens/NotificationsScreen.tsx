import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NotificationSettings, NotificationConfig, NotificationTime } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useUserSettings } from '../hooks/useUserSettings';
import NotificationService from '../NotificationService';

// Компонент выбора времени
interface TimePickerProps {
  visible: boolean;
  time: NotificationTime;
  onTimeChange: (time: NotificationTime) => void;
  onClose: () => void;
  title: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ visible, time, onTimeChange, onClose, title }) => {
  const [selectedHour, setSelectedHour] = useState(time.hour);
  const [selectedMinute, setSelectedMinute] = useState(time.minute);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i); // каждую минуту

  const handleConfirm = () => {
    onTimeChange({ hour: selectedHour, minute: selectedMinute });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerModal}>
          <Text style={styles.timePickerTitle}>{title}</Text>
          
          <View style={styles.timePickerContainer}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnTitle}>Час</Text>
              <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                {hours.map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeOption,
                      selectedHour === hour && styles.timeOptionSelected
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedHour === hour && styles.timeOptionTextSelected
                    ]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnTitle}>Минуты</Text>
              <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                {minutes.map(minute => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeOption,
                      selectedMinute === minute && styles.timeOptionSelected
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedMinute === minute && styles.timeOptionTextSelected
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.timePickerButtons}>
            <TouchableOpacity style={styles.timePickerButton} onPress={onClose}>
              <Text style={styles.timePickerButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timePickerButton, styles.timePickerButtonPrimary]} 
              onPress={handleConfirm}
            >
              <Text style={[styles.timePickerButtonText, styles.timePickerButtonTextPrimary]}>
                Сохранить
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Компонент переключателя уведомлений с временем
interface NotificationToggleProps {
  title: string;
  description: string;
  config: NotificationConfig;
  onToggle: (enabled: boolean) => void;
  onTimePress: () => void;
  disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  title,
  description,
  config,
  onToggle,
  onTimePress,
  disabled = false,
}) => {
  const formatTime = (time: NotificationTime) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

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
          
          {config.enabled && (
            <TouchableOpacity 
              style={styles.timeButton} 
              onPress={onTimePress}
              disabled={disabled}
            >
              <Text style={styles.timeButtonText}>
                🕐 Время: {formatTime(config.time)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Switch
          value={config.enabled}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{
            false: COLORS.TEXT_INACTIVE,
            true: COLORS.PRIMARY_ACCENT,
          }}
          thumbColor={config.enabled ? COLORS.WHITE : COLORS.WHITE}
        />
      </View>
    </View>
  );
};

const NotificationsScreen: React.FC = () => {
  const { settings, loading, saveSettings } = useUserSettings();
  
  const [localNotificationSettings, setLocalNotificationSettings] = useState<NotificationSettings>({
    exerciseReminders: { enabled: true, time: { hour: 9, minute: 0 } },
    spineHygieneTips: { enabled: true, time: { hour: 14, minute: 0 } },
    educationalMessages: { enabled: true, time: { hour: 20, minute: 0 } },
  });

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [currentEditingType, setCurrentEditingType] = useState<keyof NotificationSettings | null>(null);

  // Загружаем настройки при получении данных
  useEffect(() => {
    if (settings?.notificationSettings) {
      setLocalNotificationSettings(settings.notificationSettings);
    }
  }, [settings]);

  const handleToggleNotification = async (
    key: keyof NotificationSettings,
    enabled: boolean
  ) => {
    if (!settings) return;

    const newSettings = {
      ...localNotificationSettings,
      [key]: {
        ...localNotificationSettings[key],
        enabled: enabled,
      },
    };

    setLocalNotificationSettings(newSettings);

    // Автоматически сохраняем изменения
    try {
      const updatedSettings = {
        ...settings,
        notificationSettings: newSettings,
      };

      await saveSettings(updatedSettings);
      await NotificationService.scheduleNotificationsFromSettings(newSettings);
      
      console.log('Notification settings auto-saved');
    } catch (error) {
      console.error('Error auto-saving notification settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки уведомлений');
    }
  };

  const handleTimeChange = async (key: keyof NotificationSettings, time: NotificationTime) => {
    if (!settings) return;

    const newSettings = {
      ...localNotificationSettings,
      [key]: {
        ...localNotificationSettings[key],
        time: time,
      },
    };

    setLocalNotificationSettings(newSettings);

    // Автоматически сохраняем изменения
    try {
      const updatedSettings = {
        ...settings,
        notificationSettings: newSettings,
      };

      await saveSettings(updatedSettings);
      await NotificationService.scheduleNotificationsFromSettings(newSettings);
      
      console.log('Notification time auto-saved');
    } catch (error) {
      console.error('Error auto-saving notification time:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить время уведомления');
    }
  };

  const openTimePicker = (type: keyof NotificationSettings) => {
    setCurrentEditingType(type);
    setTimePickerVisible(true);
  };

  const getNotificationTitle = (type: keyof NotificationSettings): string => {
    const titles = {
      exerciseReminders: 'Выберите время для упражнений',
      spineHygieneTips: 'Выберите время для советов',
      educationalMessages: 'Выберите время для сообщений'
    };
    return titles[type];
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
            config={localNotificationSettings.exerciseReminders}
            onToggle={(enabled) => handleToggleNotification('exerciseReminders', enabled)}
            onTimePress={() => openTimePicker('exerciseReminders')}
          />

          <NotificationToggle
            title="Подсказки о гигиене позвоночника"
            description="Советы по правильной осанке и уходу за спиной"
            config={localNotificationSettings.spineHygieneTips}
            onToggle={(enabled) => handleToggleNotification('spineHygieneTips', enabled)}
            onTimePress={() => openTimePicker('spineHygieneTips')}
          />

          <NotificationToggle
            title="Образовательные сообщения"
            description="Полезная информация о здоровье позвоночника"
            config={localNotificationSettings.educationalMessages}
            onToggle={(enabled) => handleToggleNotification('educationalMessages', enabled)}
            onTimePress={() => openTimePicker('educationalMessages')}
          />
        </View>

        {/* Информация */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Информация</Text>
          <Text style={styles.infoText}>
            Push-уведомления помогают поддерживать регулярность выполнения упражнений и получать полезные советы. 
            Каждый тип уведомлений можно настроить отдельно и задать удобное время.
            {'\n\n'}
            Изменения сохраняются автоматически. Уведомления будут повторяться каждый день в указанное время.
          </Text>
        </View>
      </ScrollView>

      {/* Модальное окно выбора времени */}
      {currentEditingType && (
        <TimePicker
          visible={timePickerVisible}
          time={localNotificationSettings[currentEditingType].time}
          onTimeChange={(time) => handleTimeChange(currentEditingType, time)}
          onClose={() => {
            setTimePickerVisible(false);
            setCurrentEditingType(null);
          }}
          title={getNotificationTitle(currentEditingType)}
        />
      )}
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
    alignItems: 'flex-start',
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
    marginBottom: 8,
  },
  disabledText: {
    opacity: 0.5,
  },
  timeButton: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  timeButtonText: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '600',
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
  
  // Стили для TimePicker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  timeScrollView: {
    maxHeight: 200,
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: 20,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 2,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
  },
  timeOptionText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  timePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  timePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: COLORS.SCALE_COLOR,
  },
  timePickerButtonPrimary: {
    backgroundColor: COLORS.CTA_BUTTON,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  timePickerButtonTextPrimary: {
    fontWeight: '600',
  },
});

export default NotificationsScreen;
