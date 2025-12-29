// Финальный экран онбординга - Шаг 4/4

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, GRADIENTS, READY_SCREEN } from '../../constants';
import { OnboardingStackParamList } from '../../types';
import { CustomButton } from '../../components';

const { width } = Dimensions.get('window');

type ReadyScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Ready'>;

const ReadyScreen: React.FC = () => {
  const navigation = useNavigation<ReadyScreenNavigationProp>();

  const handleStart = () => {
    // Переходим к выбору программы
    navigation.navigate('RehabProgramSelection');
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Отлично!{"\n"}Ваш план готов</Text>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icons/logo2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Мотивационное сообщение */}
        <View style={styles.messageContainer}>
          <Text style={styles.motivationalMessage}>
            Вы сделали важный шаг к здоровой спине. Помните: слушайте свое тело и двигайтесь без боли. Вы на верном пути!
          </Text>
        </View>

        {/* Кнопка старта */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Начать первую тренировку"
            onPress={handleStart}
            size="large"
            variant="primary"
            style={styles.startButton}
          />
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
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    maxWidth: 140,
    maxHeight: 140,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  motivationalMessage: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
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
