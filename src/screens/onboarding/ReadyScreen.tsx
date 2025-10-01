// Финальный экран онбординга - Шаг 4/4

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS, READY_SCREEN } from '../../constants';
import { useOnboarding } from '../../contexts';
import { CustomButton } from '../../components';

const { width } = Dimensions.get('window');

const ReadyScreen: React.FC = () => {
  const { completeOnboarding, onboardingData } = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleStart = async () => {
    if (!onboardingData) {
      console.error('Cannot complete onboarding: no data available');
      return;
    }

    try {
      setIsCompleting(true);
      await completeOnboarding();
      // Навигация произойдет автоматически через изменение hasCompletedOnboarding
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>{READY_SCREEN.title}</Text>
        </View>

        {/* Мотивационное сообщение */}
        <View style={styles.messageContainer}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.motivationalMessage}>
            {READY_SCREEN.motivationalMessage}
          </Text>
        </View>

        {/* Напоминание */}
        <View style={styles.reminderContainer}>
          <Text style={styles.reminderText}>
            {READY_SCREEN.reminder}
          </Text>
        </View>

        {/* Кнопка старта */}
        <View style={styles.buttonContainer}>
          {isCompleting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.CTA_BUTTON} />
              <Text style={styles.loadingText}>Подготовка вашего плана...</Text>
            </View>
          ) : (
            <CustomButton
              title={READY_SCREEN.startButton}
              onPress={handleStart}
              size="large"
              variant="primary"
              style={styles.startButton}
            />
          )}
        </View>

        {/* Декоративные элементы */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  motivationalMessage: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  planContainer: {
    marginBottom: 24,
  },
  reminderContainer: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  reminderText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  // Декоративные элементы
  decorativeCircle1: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.PRIMARY_ACCENT,
    opacity: 0.15,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 150,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    opacity: 0.1,
  },
});

export default ReadyScreen;
