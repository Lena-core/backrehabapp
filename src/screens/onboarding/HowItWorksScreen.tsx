// Экран "Как это работает? Три главных принципа"

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

type HowItWorksNavigationProp = StackNavigationProp<OnboardingStackParamList, 'HowItWorks'>;

interface Principle {
  icon: string;
  title: string;
  color: string;
}

const PRINCIPLES: Principle[] = [
  {
    icon: '✓',
    title: 'Убираем причину боли, а не просто маскируем симптомы.',
    color: COLORS.CTA_BUTTON,
  },
  {
    icon: '⚡',
    title: 'Создаем стабильность в позвоночнике с помощью безопасных упражнений.',
    color: COLORS.SECONDARY_ACCENT,
  },
  {
    icon: '🎯',
    title: 'Формируем «гигиену позвоночника» — здоровые двигательные привычки на каждый день.',
    color: COLORS.PRIMARY_ACCENT,
  },
];

const HowItWorksScreen: React.FC = () => {
  const navigation = useNavigation<HowItWorksNavigationProp>();

  const handleContinue = () => {
    navigation.navigate('AppFeatures');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Как это работает?</Text>
          <Text style={styles.subtitle}>Три главных принципа:</Text>
        </View>

        {/* Принципы */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {PRINCIPLES.map((principle, index) => (
            <View key={index} style={styles.principleCard}>
              <View style={[styles.iconCircle, { backgroundColor: principle.color }]}>
                <Text style={styles.iconText}>{principle.icon}</Text>
              </View>
              <Text style={styles.principleText}>{principle.title}</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  principleCard: {
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
  principleText: {
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

export default HowItWorksScreen;
