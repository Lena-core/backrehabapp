// Экран с объяснением подхода "без боли" - перед выбором уровня боли

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

type PainApproachNavigationProp = StackNavigationProp<OnboardingStackParamList, 'PainApproach'>;

const PainApproachScreen: React.FC = () => {
  const navigation = useNavigation<PainApproachNavigationProp>();

  const handleContinue = () => {
    navigation.navigate('PainLevel');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Наш подход</Text>
        </View>

        {/* Основной контент */}
        <View style={styles.mainContent}>
          {/* Иконка */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💡</Text>
          </View>

          {/* Текст */}
          <View style={styles.textContainer}>
            <Text style={styles.mainText}>
              Основа нашего подхода — полный отказ от упражнений через боль.
            </Text>
            
            <Text style={styles.secondaryText}>
              Именно ваш сегодняшний уровень дискомфорта определит, какие упражнения и с какой интенсивностью мы будем выполнять.
            </Text>

            <Text style={styles.secondaryText}>
              Это нужно, чтобы не повредить заживающие ткани и не замедлить ваше восстановление.
            </Text>
          </View>

          {/* Декоративная карточка */}
          <View style={styles.highlightCard}>
            <Text style={styles.highlightText}>
              ⚠️ Упражнения через боль могут навредить вашему восстановлению
            </Text>
          </View>
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
            title="Понятно"
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  mainText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  secondaryText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.8,
  },
  highlightCard: {
    backgroundColor: COLORS.PAIN_ACUTE,
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
    marginHorizontal: 10,
  },
  highlightText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 22,
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

export default PainApproachScreen;
