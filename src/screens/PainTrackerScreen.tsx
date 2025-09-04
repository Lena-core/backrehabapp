import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PainLevel, PainStatus } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface PainOption {
  level: PainLevel;
  label: string;
  color: string;
}

const PAIN_OPTIONS: PainOption[] = [
  { level: 'none', label: 'Все хорошо', color: COLORS.PAIN_NONE },
  { level: 'mild', label: 'Немного болит', color: COLORS.PAIN_MILD },
  { level: 'moderate', label: 'Болит', color: COLORS.PAIN_MODERATE },
  { level: 'severe', label: 'Сильно болит', color: COLORS.PAIN_SEVERE },
  { level: 'acute', label: 'Острая боль', color: COLORS.PAIN_ACUTE },
];

const PainTrackerScreen: React.FC = () => {
  const [selectedPain, setSelectedPain] = useState<PainLevel>('none');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLastPainStatus();
  }, []);

  useEffect(() => {
    // Анимация пульсации центрального круга
    const pulse = Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    const loopAnimation = Animated.loop(pulse);
    loopAnimation.start();

    return () => loopAnimation.stop();
  }, [selectedPain]);

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

  const getCurrentPainColor = () => {
    const option = PAIN_OPTIONS.find(opt => opt.level === selectedPain);
    return option?.color || COLORS.PAIN_NONE;
  };

  if (isLoading) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      {/* Заголовок */}
      <Text style={styles.title}>Как Самочувствие?</Text>

      {/* Центральный интерактивный элемент */}
      <View style={styles.centralContainer}>
        <View style={styles.outerCircle}>
          <Animated.View
            style={[
              styles.innerCircle,
              {
                backgroundColor: getCurrentPainColor(),
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            {/* Здесь можно добавить иконку */}
          </Animated.View>
        </View>
      </View>

      {/* Шкала боли */}
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
              />
              <Text style={styles.painLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Основная кнопка */}
      <TouchableOpacity style={styles.ctaButton} onPress={savePainStatus}>
        <Text style={styles.ctaButtonText}>Сохранить</Text>
      </TouchableOpacity>

      {/* Медицинское предупреждение */}
      <Text style={styles.disclaimer}>
        Приведенная информация носит справочный характер. Если вам требуется 
        медицинская консультация или постановка диагноза, обратитесь к специалисту.
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 60,
  },
  centralContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
  },
  outerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painScale: {
    width: '100%',
    marginBottom: 80,
  },
  scaleBackground: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  painOption: {
    alignItems: 'center',
    flex: 1,
  },
  selectedPainOption: {
    transform: [{ scale: 1.1 }],
  },
  painCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  painLabel: {
    fontSize: 10,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 25,
    marginBottom: 30,
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
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
});

export default PainTrackerScreen;
