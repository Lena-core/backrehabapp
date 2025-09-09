import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  Image,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { ExerciseType, ExerciseSession, UserSettings, RootStackParamList } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { EXERCISE_DESCRIPTIONS } from '../constants/exercises/descriptions';
import { useSounds } from '../hooks';

type ExerciseExecutionRouteProp = RouteProp<RootStackParamList, 'ExerciseExecution'>;

interface TimerState {
  currentTime: number;
  isRunning: boolean;
  phase: 'prepare' | 'exercise' | 'rest' | 'completed';
  currentSet: number;
  currentRep: number;
  instruction: string;
}

// Пути к анимационным файлам
const EXERCISE_ANIMATIONS: Record<ExerciseType, any> = {
  curl_up: require('../assets/animations/curl_up.gif'),
  side_plank: require('../assets/animations/side_plank.gif'),
  bird_dog: require('../assets/animations/bird_dog.gif'), 
  walk: require('../assets/animations/walk.gif'),
};

// По умолчанию для ошибок загрузки
const DEFAULT_PLACEHOLDER = require('../assets/animations/curl_up.gif');

const ExerciseExecutionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseExecutionRouteProp>();
  const { exerciseType, exerciseName } = route.params;

  // Хук для управления звуками
  const { playSound, isSoundEnabled, toggleSoundEnabled } = useSounds();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [timer, setTimer] = useState<TimerState>({
    currentTime: 0,
    isRunning: false,
    phase: 'prepare',
    currentSet: 1,
    currentRep: 1,
    instruction: 'Приготовьтесь к выполнению упражнения',
  });

  // Загрузка настроек
  useEffect(() => {
    loadSettings();
  }, []);

  // Логика таймера
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.currentTime > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, currentTime: prev.currentTime - 1 }));
      }, 1000);
    } else if (timer.isRunning && timer.currentTime === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.currentTime]);

  // Звуковые сигналы во время таймера
  useEffect(() => {
    if (!timer.isRunning || timer.currentTime <= 0) return;

    // Предупреждающий звук за 3 секунды до конца
    if (timer.currentTime === 3 && (timer.phase === 'exercise' || timer.phase === 'rest')) {
      playSound('warning', 0.7);
    }

    // Звук каждой секунды для последних 3 секунд (опционально)
    if (timer.currentTime <= 3 && timer.currentTime > 0 && timer.phase === 'prepare') {
      playSound('tick', 0.8);
    }
  }, [timer.currentTime, timer.isRunning, timer.phase, playSound]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        const defaultSettings: UserSettings = {
          exerciseSettings: {
            holdTime: 7,
            repsSchema: [3, 2, 1],
            restTime: 15,
          },
          walkSettings: {
            duration: 5,
            sessions: 3,
          },
        };
        setSettings(defaultSettings);
        await AsyncStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleTimerComplete = async () => {
    if (timer.phase === 'prepare') {
      playSound('start'); // Звук начала упражнения
      setTimer(prev => ({
        ...prev,
        currentTime: settings?.exerciseSettings.holdTime || 7,
        phase: 'exercise',
        instruction: 'Выполняйте упражнение',
      }));
    } else if (timer.phase === 'exercise') {
      const repsSchema = settings?.exerciseSettings.repsSchema || [3, 2, 1];
      const isLastRep = timer.currentRep >= repsSchema[timer.currentSet - 1];
      const isLastSet = timer.currentSet >= repsSchema.length;

      if (isLastRep && isLastSet) {
        // Упражнение завершено
        playSound('complete'); // Звук завершения
        setTimer(prev => ({
          ...prev,
          isRunning: false,
          phase: 'completed',
          instruction: 'Упражнение завершено!',
        }));

        // Сохранение прогресса
        try {
          const today = new Date().toISOString().split('T')[0];
          const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
          
          if (savedExercises) {
            const exercises = JSON.parse(savedExercises);
            const updatedExercises = exercises.map((ex: any) =>
              ex.id === exerciseType ? { ...ex, completed: true } : ex
            );
            await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(updatedExercises));
          }
        } catch (error) {
          console.error('Error saving progress:', error);
        }

        setTimeout(() => navigation.goBack(), 2000);
      } else if (isLastRep) {
        // Переход к следующему подходу
        playSound('rest'); // Звук перехода к отдыху
        setTimer(prev => ({
          ...prev,
          currentTime: settings?.exerciseSettings.restTime || 15,
          phase: 'rest',
          currentSet: prev.currentSet + 1,
          currentRep: 1,
          instruction: 'Отдых между подходами',
        }));
      } else {
        // Следующее повторение
        setTimer(prev => ({
          ...prev,
          currentTime: settings?.exerciseSettings.holdTime || 7,
          currentRep: prev.currentRep + 1,
          instruction: 'Продолжайте упражнение',
        }));
      }
    } else if (timer.phase === 'rest') {
      playSound('nextSet'); // Звук перехода к следующему подходу
      setTimer(prev => ({
        ...prev,
        currentTime: settings?.exerciseSettings.holdTime || 7,
        phase: 'exercise',
        instruction: 'Выполняйте упражнение',
      }));
    }
  };

  const startExercise = () => {
    if (!settings) return;

    if (exerciseType === 'walk') {
      const walkDurationInSeconds = settings.walkSettings.duration * 60;
      setTimer({
        currentTime: walkDurationInSeconds,
        isRunning: true,
        phase: 'exercise',
        currentSet: 1,
        currentRep: 1,
        instruction: 'Начните ходьбу. Держите спину ровно.',
      });
    } else {
      playSound('prepare'); // Звук начала подготовки
      setTimer({
        currentTime: 3,
        isRunning: true,
        phase: 'prepare',
        currentSet: 1,
        currentRep: 1,
        instruction: 'Приготовьтесь к выполнению упражнения',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!settings) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Заголовок упражнения с иконкой информации */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.titleWithInfoContainer}
            onPress={() => setShowDescriptionModal(true)}
          >
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.infoIcon}>ⓘ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.soundToggle, { backgroundColor: isSoundEnabled ? COLORS.PRIMARY_ACCENT : COLORS.SECONDARY_ACCENT }]}
            onPress={toggleSoundEnabled}
          >
            <Text style={styles.soundToggleText}>
              {isSoundEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ТАЙМЕР И КНОПКА СТАРТ - ВЫНЕСЕНЫ НАВЕРХ */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {exerciseType === 'walk' 
              ? formatTime(timer.currentTime)
              : timer.currentTime.toString()
            }
          </Text>
          <Text style={styles.instructionText}>{timer.instruction}</Text>
        </View>

        {/* Кнопка СТАРТ */}
        {!timer.isRunning && timer.phase !== 'completed' && (
          <TouchableOpacity style={styles.startButton} onPress={startExercise}>
            <Text style={styles.startButtonText}>СТАРТ</Text>
          </TouchableOpacity>
        )}

        {/* Анимация упражнения */}
        <View style={styles.mediaContainer}>
          <Image 
            source={EXERCISE_ANIMATIONS[exerciseType] || DEFAULT_PLACEHOLDER}
            style={styles.exerciseAnimation}
            resizeMode="contain"
            onError={() => console.log('Error loading animation for:', exerciseType)}
          />
        </View>

        {/* Прогресс подходов */}
        {exerciseType !== 'walk' && (
          <View style={styles.setsProgress}>
            {Array.from({ length: settings.exerciseSettings.repsSchema.length }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.setCircle,
                  {
                    backgroundColor: 
                      index < timer.currentSet - 1 || timer.phase === 'completed'
                        ? COLORS.PRIMARY_ACCENT
                        : index === timer.currentSet - 1
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.WHITE,
                    borderColor: COLORS.PRIMARY_ACCENT,
                  },
                ]}
              >
                {index < timer.currentSet - 1 && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Параметры упражнения */}
        {exerciseType !== 'walk' ? (
          <View style={styles.parametersContainer}>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Время удержания</Text>
              <Text style={styles.parameterValue}>
                {settings.exerciseSettings.holdTime} сек
              </Text>
            </View>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Схема</Text>
              <Text style={styles.parameterValue}>
                {settings.exerciseSettings.repsSchema.join('-')}
              </Text>
            </View>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Отдых</Text>
              <Text style={styles.parameterValue}>
                {settings.exerciseSettings.restTime} сек
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.parametersContainer}>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Длительность сессии</Text>
              <Text style={styles.parameterValue}>
                {settings.walkSettings.duration} мин
              </Text>
            </View>
            <View style={styles.parameter}>
              <Text style={styles.parameterLabel}>Количество сессий</Text>
              <Text style={styles.parameterValue}>
                {settings.walkSettings.sessions}
              </Text>
            </View>
          </View>
        )}

        {/* Медицинское предупреждение */}
        <Text style={styles.disclaimer}>
          Приведенная информация носит справочный характер. Если вам требуется 
          медицинская консультация или постановка диагноза, обратитесь к специалисту.
        </Text>
      </ScrollView>

      {/* Модальное окно с описанием упражнения */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Описание упражнения</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDescriptionModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalDescriptionText}>
                {EXERCISE_DESCRIPTIONS[exerciseType]}
              </Text>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDescriptionModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  titleWithInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  infoIcon: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.6,
    marginLeft: 10,
  },
  soundToggle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  soundToggleText: {
    fontSize: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_ACCENT,
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 1,
  },
  mediaContainer: {
    height: 200,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  exerciseAnimation: {
    width: '100%',
    height: '100%',
  },
  setsProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  setCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  parametersContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  parameter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parameterLabel: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
  // Стили для модального окна
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 0,
    maxHeight: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SCALE_COLOR,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.SCALE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  modalDescriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_PRIMARY,
    padding: 20,
  },
  modalCloseButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});

export default ExerciseExecutionScreen;