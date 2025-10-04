// Экран "Самое важное правило" - никакой боли во время упражнений

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
          <Text style={styles.title}>Самое важное правило</Text>
        </View>

        {/* Основной контент */}
        <View style={styles.mainContent}>
          {/* Текст */}
          <View style={styles.textContainer}>
            <Text style={styles.mainHeading}>
              Никакой боли во время упражнений!
            </Text>
            
            <Text style={styles.explanationText}>
              Если вы чувствуете острую боль — остановитесь. Наша цель — найти и расширить диапазон движений, которые не вызывают дискомфорта.
            </Text>
          </View>

          {/* Декоративная карточка */}
          <View style={styles.highlightCard}>
            <Text style={styles.highlightText}>
              Упражнения через боль могут замедлить ваше восстановление и повредить заживающие ткани.
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
    paddingBottom: 40,
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
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  explanationText: {
    fontSize: 17,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.85,
  },
  highlightCard: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: COLORS.PAIN_ACUTE,
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
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default PainApproachScreen;
