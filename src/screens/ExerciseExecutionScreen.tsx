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
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { ExerciseType, ExerciseSession, UserSettings, RootStackParamList } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { EXERCISE_DESCRIPTIONS } from '../constants/exercises/descriptions';
import { useSounds } from '../hooks';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    <View style={styles.container}>
      {/* Фоновая гифка на весь экран */}
      <View style={styles.gifContainer}>
        <Image
          source={EXERCISE_ANIMATIONS[exerciseType] || DEFAULT_PLACEHOLDER}
          style={styles.backgroundGif}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.contentOverlay}>
        {/* Заголовок упражнения с иконкой информации - ВВЕРХУ */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
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

        {/* Нижний контент */}
        <View style={styles.bottomContent}>
          {/* КНОПКА СТАРТ (показывается до начала упражнения) */}
          {timer.phase === 'prepare' && !timer.isRunning && (
            <View style={styles.timerContainer}>
              <TouchableOpacity style={styles.startButton} onPress={startExercise}>
                <Text style={styles.startButtonText}>СТАРТ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ТАЙМЕР (показывается после нажатия СТАРТ) */}
          {(timer.isRunning || timer.phase === 'completed') && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {exerciseType === 'walk' 
                  ? formatTime(timer.currentTime)
                  : timer.currentTime.toString()
                }
              </Text>
              <Text style={styles.instructionText}>{timer.instruction}</Text>
            </View>
          )}

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
          <View style={styles.parametersContainer}>
            {exerciseType !== 'walk' ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
          </View>

          {/* Медицинское предупреждение */}
          <Text style={styles.disclaimer}>
            Приведенная информация носит справочный характер. Если вам требуется 
            медицинская консультация или постановка диагноза, обратитесь к специалисту.
          </Text>
        </View>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gifContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  backgroundGif: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    top: 0,
  },
  contentOverlay: {
    flex: 1,
    position: 'relative',
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
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleWithInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoIcon: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  soundToggle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  soundToggleText: {
    fontSize: 20,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.WHITE,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
  setsProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  setCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  parametersContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  parameter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parameterLabel: {
    fontSize: 14,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disclaimer: {
    fontSize: 10,
    color: COLORS.WHITE,
    textAlign: 'center',
    lineHeight: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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