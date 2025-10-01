// Экран выбора уровня боли - Шаг 1/4 (с пульсирующими кругами)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList, PainLevel } from '../../types';
import { COLORS, GRADIENTS, PAIN_LEVEL_SCREEN } from '../../constants';
import { useOnboarding } from '../../contexts';
import { CustomButton } from '../../components';
import { PAIN_ICONS } from '../../assets/icons';

const { width, height } = Dimensions.get('window');

type PainLevelNavigationProp = StackNavigationProp<OnboardingStackParamList, 'PainLevel'>;

interface PainOption {
  level: PainLevel;
  label: string;
  color: string;
  iconSource: any;
}

const PAIN_OPTIONS: PainOption[] = [
  { level: 'none', label: 'Все хорошо', color: COLORS.PAIN_NONE, iconSource: PAIN_ICONS.none },
  { level: 'mild', label: 'Немного болит', color: COLORS.PAIN_MILD, iconSource: PAIN_ICONS.mild },
  { level: 'moderate', label: 'Болит', color: COLORS.PAIN_MODERATE, iconSource: PAIN_ICONS.moderate },
  { level: 'severe', label: 'Сильно болит', color: COLORS.PAIN_SEVERE, iconSource: PAIN_ICONS.severe },
  { level: 'acute', label: 'Острая боль', color: COLORS.PAIN_ACUTE, iconSource: PAIN_ICONS.acute },
];

const PainLevelScreen: React.FC = () => {
  const navigation = useNavigation<PainLevelNavigationProp>();
  const { onboardingData, setPainLevel, initializeOnboardingData } = useOnboarding();
  
  const [selectedLevel, setSelectedLevel] = useState<PainLevel>(
    onboardingData?.painLevel || 'none'
  );
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [outerPulseAnimation] = useState(new Animated.Value(1));

  // Инициализируем данные с уровнем по умолчанию
  useEffect(() => {
    if (!onboardingData) {
      initializeOnboardingData('none');
    }
  }, []);

  // Анимация пульсации
  useEffect(() => {
    const baseScale = height < 700 ? 1.05 : height < 800 ? 1.08 : 1.12;
    const outerBaseScale = height < 700 ? 1.08 : height < 800 ? 1.12 : 1.15;
    
    const innerPulse = Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: baseScale,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    const outerPulse = Animated.sequence([
      Animated.delay(100),
      Animated.timing(outerPulseAnimation, {
        toValue: outerBaseScale,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(outerPulseAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    const parallelAnimation = Animated.parallel([
      Animated.loop(innerPulse),
      Animated.loop(outerPulse)
    ]);

    parallelAnimation.start();

    return () => parallelAnimation.stop();
  }, [selectedLevel]);

  const handleSelectLevel = (level: PainLevel) => {
    setSelectedLevel(level);
    
    if (!onboardingData) {
      initializeOnboardingData(level);
    } else {
      setPainLevel(level);
    }
  };

  const handleContinue = () => {
    navigation.navigate('ExercisePreview');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getCurrentPainOption = () => {
    return PAIN_OPTIONS.find(opt => opt.level === selectedLevel) || PAIN_OPTIONS[0];
  };

  const currentOption = getCurrentPainOption();

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      {/* Заголовок */}
      <View style={styles.topSection}>
        <Text style={styles.title}>{PAIN_LEVEL_SCREEN.title}</Text>
      </View>

      {/* Центральный интерактивный элемент */}
      <View style={styles.middleSection}>
        <View style={styles.centralContainer}>
          <Animated.View style={[
            styles.outerCircle,
            { 
              borderColor: currentOption.color,
              transform: [{ scale: outerPulseAnimation }]
            }
          ]}>
            <Animated.View
              style={[
                styles.innerCircle,
                {
                  backgroundColor: currentOption.color,
                  transform: [{ scale: pulseAnimation }],
                },
              ]}
            >
              <Image
                source={currentOption.iconSource}
                style={styles.centralIcon}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
          
          <Text style={styles.centralLabel}>{currentOption.label}</Text>
        </View>
      </View>

      {/* Шкала боли */}
      <View style={styles.bottomSection}>
        <View style={styles.painScale}>
          <View style={styles.scaleBackground}>
            {PAIN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.level}
                style={[
                  styles.painOption,
                  selectedLevel === option.level && styles.selectedPainOption,
                ]}
                onPress={() => handleSelectLevel(option.level)}
              >
                <View
                  style={[
                    styles.painCircle,
                    {
                      backgroundColor: option.color,
                      opacity: selectedLevel === option.level ? 1 : 0.6,
                    },
                  ]}
                >
                  <Image
                    source={option.iconSource}
                    style={styles.painIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text 
                  style={[
                    styles.painLabel,
                    selectedLevel === option.level && styles.selectedPainLabel
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  middleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  centralContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralIcon: {
    width: 70,
    height: 70,
  },
  centralLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 10,
    textAlign: 'center',
  },
  painScale: {
    width: '100%',
    marginBottom: 20,
  },
  scaleBackground: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  painOption: {
    alignItems: 'center',
    flex: 1,
    height: 65,
  },
  selectedPainOption: {
    transform: [{ scale: 1.1 }],
  },
  painCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painIcon: {
    width: 20,
    height: 20,
  },
  painLabel: {
    fontSize: 10,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '500',
    height: 28,
    lineHeight: 12,
    marginTop: 4,
  },
  selectedPainLabel: {
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default PainLevelScreen;
