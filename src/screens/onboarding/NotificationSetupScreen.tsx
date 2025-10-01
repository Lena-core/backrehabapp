// Экран настройки уведомлений - Шаг 3/4

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList, NotificationSettings, NotificationTime } from '../../types';
import { COLORS, GRADIENTS, NOTIFICATION_SETUP_SCREEN } from '../../constants';
import { useOnboarding } from '../../contexts';
import { CustomButton, NotificationCard } from '../../components';

type NotificationSetupNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'NotificationSetup'
>;

const NotificationSetupScreen: React.FC = () => {
  const navigation = useNavigation<NotificationSetupNavigationProp>();
  const { onboardingData, setNotificationSettings } = useOnboarding();

  // Инициализация локального состояния из контекста
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(
    onboardingData?.notificationSettings || {
      exerciseReminders: {
        enabled: true,
        time: { hour: 9, minute: 0 },
      },
      spineHygieneTips: {
        enabled: true,
        time: { hour: 14, minute: 0 },
      },
      educationalMessages: {
        enabled: true,
        time: { hour: 20, minute: 0 },
      },
    }
  );

  const handleToggle = (type: keyof NotificationSettings, enabled: boolean) => {
    const updatedSettings = {
      ...localSettings,
      [type]: {
        ...localSettings[type],
        enabled,
      },
    };
    setLocalSettings(updatedSettings);
    setNotificationSettings(updatedSettings);
  };

  const handleTimeChange = (type: keyof NotificationSettings, time: NotificationTime) => {
    const updatedSettings = {
      ...localSettings,
      [type]: {
        ...localSettings[type],
        time,
      },
    };
    setLocalSettings(updatedSettings);
    setNotificationSettings(updatedSettings);
  };

  const handleContinue = () => {
    // Сохраняем финальные настройки перед переходом
    setNotificationSettings(localSettings);
    navigation.navigate('Ready');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>{NOTIFICATION_SETUP_SCREEN.title}</Text>
          <Text style={styles.subtitle}>{NOTIFICATION_SETUP_SCREEN.subtitle}</Text>
        </View>

        {/* Карточки уведомлений */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Напоминания об упражнениях */}
          <NotificationCard
            title={NOTIFICATION_SETUP_SCREEN.types.exerciseReminders.title}
            description={NOTIFICATION_SETUP_SCREEN.types.exerciseReminders.description}
            enabled={localSettings.exerciseReminders.enabled}
            time={localSettings.exerciseReminders.time}
            onToggle={(enabled) => handleToggle('exerciseReminders', enabled)}
            onTimeChange={(time) => handleTimeChange('exerciseReminders', time)}
          />

          {/* Советы по гигиене позвоночника */}
          <NotificationCard
            title={NOTIFICATION_SETUP_SCREEN.types.spineHygieneTips.title}
            description={NOTIFICATION_SETUP_SCREEN.types.spineHygieneTips.description}
            enabled={localSettings.spineHygieneTips.enabled}
            time={localSettings.spineHygieneTips.time}
            onToggle={(enabled) => handleToggle('spineHygieneTips', enabled)}
            onTimeChange={(time) => handleTimeChange('spineHygieneTips', time)}
          />

          {/* Образовательные материалы */}
          <NotificationCard
            title={NOTIFICATION_SETUP_SCREEN.types.educationalMessages.title}
            description={NOTIFICATION_SETUP_SCREEN.types.educationalMessages.description}
            enabled={localSettings.educationalMessages.enabled}
            time={localSettings.educationalMessages.time}
            onToggle={(enabled) => handleToggle('educationalMessages', enabled)}
            onTimeChange={(time) => handleTimeChange('educationalMessages', time)}
          />

          {/* Пояснение */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Вы сможете изменить настройки уведомлений в любое время в разделе "Настройки"
            </Text>
          </View>
        </ScrollView>

        {/* Кнопки навигации */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={NOTIFICATION_SETUP_SCREEN.backButton}
            onPress={handleBack}
            variant="outline"
            size="medium"
            style={styles.backButton}
          />
          <CustomButton
            title="Далее"
            onPress={handleContinue}
            variant="primary"
            size="medium"
            style={styles.continueButton}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoContainer: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 20,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default NotificationSetupScreen;
