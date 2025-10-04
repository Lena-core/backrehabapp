// Экран "Что поможет вам в приложении"

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList } from '../../types';
import { COLORS, GRADIENTS } from '../../constants';
import { CustomButton } from '../../components';

const { width, height } = Dimensions.get('window');

type AppFeaturesNavigationProp = StackNavigationProp<OnboardingStackParamList, 'AppFeatures'>;

interface Feature {
  icon: string;
  title: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: '📋',
    title: 'Персональный план, который ежедневно адаптируется под ваш уровень боли и подготовки.',
    color: COLORS.CTA_BUTTON,
  },
  {
    icon: '🎬',
    title: 'Видео-инструкции и таймер для каждого упражнения, чтобы вы выполняли все идеально и безопасно.',
    color: COLORS.SECONDARY_ACCENT,
  },
  {
    icon: '🔔',
    title: 'Умные напоминания, которые помогут сделать заботу о спине полезной привычкой.',
    color: COLORS.PRIMARY_ACCENT,
  },
];

const AppFeaturesScreen: React.FC = () => {
  const navigation = useNavigation<AppFeaturesNavigationProp>();

  const handleContinue = () => {
    navigation.navigate('MedicalDisclaimer');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Что поможет вам в приложении:</Text>
        </View>

        {/* Возможности */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.iconCircle, { backgroundColor: feature.color }]}>
                <Text style={styles.iconText}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureText}>{feature.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Кнопки навигации */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Назад"
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 34,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default AppFeaturesScreen;
