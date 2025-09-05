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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PainLevel, PainStatus } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { PAIN_ICONS } from '../assets/icons';

const { width, height } = Dimensions.get('window');

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

const PainTrackerScreen: React.FC = () => {
  const [selectedPain, setSelectedPain] = useState<PainLevel>('none');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [outerPulseAnimation] = useState(new Animated.Value(1)); // Анимация для внешнего круга
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLastPainStatus();
  }, []);

  useEffect(() => {
    // Адаптивный скейл в зависимости от размера экрана
    const baseScale = height < 700 ? 1.05 : height < 800 ? 1.08 : 1.12;
    const outerBaseScale = height < 700 ? 1.08 : height < 800 ? 1.12 : 1.15;
    
    // Анимация пульсации внутреннего круга
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

    // Анимация пульсации внешнего круга (с небольшой задержкой)
    const outerPulse = Animated.sequence([
      Animated.delay(100), // Небольшая задержка
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

    // Запуск обеих анимаций одновременно
    const parallelAnimation = Animated.parallel([
      Animated.loop(innerPulse),
      Animated.loop(outerPulse)
    ]);

    parallelAnimation.start();

    return () => parallelAnimation.stop();
  }, [selectedPain, height]);

  const loadLastPainStatus = async () => {
    try {
      const lastStatus = await AsyncStorage.getItem('lastPainStatus');
      if (lastStatus) {
        const parsed: PainStatus = JSON.parse(lastStatus);
        setSelectedPain(parsed.level);
      }
    } catch (error) {
      console.log('Error loading pain status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePainStatus = async () => {
    try {
      const painStatus: PainStatus = {
        level: selectedPain,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem('lastPainStatus', JSON.stringify(painStatus));
      await AsyncStorage.setItem(`painStatus_${painStatus.date}`, JSON.stringify(painStatus));
      
      // Здесь можно добавить навигацию к следующему экрану
      console.log('Pain status saved:', painStatus);
    } catch (error) {
      console.error('Error saving pain status:', error);
    }
  };

  const getCurrentPainOption = () => {
    return PAIN_OPTIONS.find(opt => opt.level === selectedPain) || PAIN_OPTIONS[0];
  };

  if (isLoading) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </LinearGradient>
    );
  }

  const currentOption = getCurrentPainOption();

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      {/* Заголовок */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Как Самочувствие?</Text>
      </View>

      {/* Центральный интерактивный элемент */}
      <View style={styles.middleSection}>
        <View style={styles.centralContainer}>
          <Animated.View style={[
            styles.outerCircle,
            { 
              borderColor: currentOption.color, // Динамический цвет границы
              transform: [{ scale: outerPulseAnimation }] // Пульсация внешнего круга
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
              {/* Центральная иконка */}
              <Image
                source={currentOption.iconSource}
                style={styles.centralIcon}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
          {/* Текст под центральным кругом */}
          <Text style={styles.centralLabel}>{currentOption.label}</Text>
        </View>
      </View>

      {/* Шкала боли */}
      <View style={styles.bottomSection}>
        <View style={styles.painScale}>
          <View style={styles.scaleBackground}>
            {PAIN_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.level}
                style={[
                  styles.painOption,
                  selectedPain === option.level && styles.selectedPainOption,
                ]}
                onPress={() => setSelectedPain(option.level)}
              >
                <View
                  style={[
                    styles.painCircle,
                    {
                      backgroundColor: option.color,
                      opacity: selectedPain === option.level ? 1 : 0.6,
                    },
                  ]}
                >
                  {/* Иконка в кружочке */}
                  <Image
                    source={option.iconSource}
                    style={styles.painIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[
                  styles.painLabel,
                  selectedPain === option.level && styles.selectedPainLabel
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit={true}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Основная кнопка */}
        <TouchableOpacity style={styles.ctaButton} onPress={savePainStatus}>
          <Text style={styles.ctaButtonText}>Сохранить</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'space-between', // Равномерное распределение
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: height * 0.4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  topSection: {
    alignItems: 'center',
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
    width: 160, // Увеличили с 120
    height: 160, // Увеличили с 120
    borderRadius: 80, // Половина от 160
    borderWidth: 3, // Увеличили с 2
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 140, // Увеличили с 100
    height: 140, // Увеличили с 100
    borderRadius: 70, // Половина от 140
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralIcon: {
    width: 70, // Увеличили с 50
    height: 70, // Увеличили с 50
  },
  centralLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 10, // Уменьшили с 15
    textAlign: 'center',
  },
  painScale: {
    width: '100%',
  },
  scaleBackground: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 20,
    paddingVertical: 15, // Уменьшили с 20
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  painOption: {
    alignItems: 'center',
    flex: 1,
    height: 65, // Уменьшили с 80
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
    height: 28, // Уменьшили с 32
    lineHeight: 12,
    marginTop: 4,
  },
  selectedPainLabel: {
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 25,
    marginTop: 30, // Отступ от шкалы боли
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});

export default PainTrackerScreen;
