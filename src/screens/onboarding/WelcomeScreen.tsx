// Приветственный экран онбординга

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList } from '../../types';
import { COLORS, GRADIENTS, WELCOME_CONTENT } from '../../constants';
import CustomButton from '../../components/CustomButton';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleStart = () => {
    navigation.navigate('Intro');
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Логотип */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icons/logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Приветственный текст */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{WELCOME_CONTENT.title}</Text>
          <Text style={styles.subtitle}>{WELCOME_CONTENT.subtitle}</Text>
        </View>

        {/* Кнопка "Начать" */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={WELCOME_CONTENT.buttonText}
            onPress={handleStart}
            size="large"
            variant="primary"
            style={styles.startButton}
          />
        </View>

        {/* Декоративные элементы (опционально) */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
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
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
  },
  // Декоративные элементы для визуального интереса
  decorativeCircle1: {
    position: 'absolute',
    top: height * 0.15,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.PRIMARY_ACCENT,
    opacity: 0.1,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: height * 0.2,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    opacity: 0.08,
  },
});

export default WelcomeScreen;
