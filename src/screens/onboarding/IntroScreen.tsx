// Экран "Ваш путь к спине без боли"

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList } from '../../types';
import { COLORS, GRADIENTS } from '../../constants';
import { CustomButton } from '../../components';

const { width, height } = Dimensions.get('window');

type IntroScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Intro'>;

const IntroScreen: React.FC = () => {
  const navigation = useNavigation<IntroScreenNavigationProp>();

  const handleContinue = () => {
    navigation.navigate('HowItWorks');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Иконка */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🎯</Text>
          </View>
        </View>

        {/* Заголовок */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Ваш путь к спине без боли</Text>
          <Text style={styles.subtitle}>
            Мы используем научный подход, чтобы помочь вам двигаться уверенно и без дискомфорта.
          </Text>
        </View>

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
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.PRIMARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default IntroScreen;
