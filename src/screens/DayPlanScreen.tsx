import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { PainLevel, Exercise, ExerciseType, RootStackParamList, UserSettings, RehabProgram, UserProgress } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useUserSettings } from '../hooks/useUserSettings';
import { convertProgramExercisesToLegacy } from '../utils/legacyAdapter';
import RehabProgramLoader from '../utils/rehabProgramLoader';
import UserProgressManager from '../utils/userProgressManager';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'DayPlan'>;

const EXERCISE_DATA: Record<ExerciseType, { name: string; gif: string }> = {
  curl_up: { name: 'Модифицированное скручивание', gif: 'curl_up.gif' },
  side_plank: { name: 'Боковая планка', gif: 'side_plank.gif' },
  bird_dog: { name: 'Птица-собака', gif: 'cat_dog_2.gif' },
  walk: { name: 'Ходьба', gif: '' },
};

const PAIN_RECOMMENDATIONS: Record<PainLevel, string> = {
  none: `Важно выполнить все упражнения, это укрепит мышцы спины и снизит риск рецидивов в будущем.

Если чувствуете, что нужна дополнительная нагрузка, добавьте одно повторение к каждому подходу. Эта стратегия поможет уменьшить судороги в мышцах спины и повысить выносливость. Никогда не жертвуйте правильной техникой выполнения упражнения ради большего количества повторений.`,
  mild: 'При выполнении упражнений не переусердствуйте, опирайтесь на свои ощущения.',
  moderate: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
  severe: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
  acute: 'Рекомендуется отдохнуть от упражнений и подождать, когда боль снизится. Походите, если состояние это позволяет.',
};

const DayPlanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { settings, loading } = useUserSettings();
  const [currentPainLevel, setCurrentPainLevel] = useState<PainLevel>('none');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [activeProgramName, setActiveProgramName] = useState<string>('');
  
  // Новые состояния для rehab system
  const [rehabProgram, setRehabProgram] = useState<RehabProgram | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showProgressionPopup, setShowProgressionPopup] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showDayCompletionMessage, setShowDayCompletionMessage] = useState(false);
  const [dayAlreadyCompleted, setDayAlreadyCompleted] = useState(false);

  const loadDayPlan = useCallback(async () => {
    try {
      console.log('[DayPlan] Loading day plan...');
      
      // Инициализация программ реабилитации
      await RehabProgramLoader.initializePrograms();
      
      // Загружаем прогресс пользователя
      let progress = await UserProgressManager.getProgress();
      
      // Если прогресса нет, инициализируем с первой программой
      if (!progress) {
        const allPrograms = await RehabProgramLoader.getAllPrograms();
        if (allPrograms.length > 0) {
          progress = await UserProgressManager.initializeProgress(allPrograms[0].id);
        }
      }
      
      setUserProgress(progress);
      
      // Загружаем текущую программу реабилитации
      let program: RehabProgram | null = null;
      
      if (progress) {
        program = await RehabProgramLoader.getProgramById(progress.currentProgramId);
        setRehabProgram(program);
        
        if (program) {
          console.log(`[DayPlan] Loaded rehab program: ${program.nameRu}`);
          setActiveProgramName(program.nameRu);
          
          // Проверяем, нужно ли показать popup прогрессии
          const shouldShow = await UserProgressManager.shouldShowProgressionPopup();
          if (shouldShow) {
            setShowProgressionPopup(true);
          }
          
          // Проверяем завершение программы
          if (UserProgressManager.isProgramCompleted(program, progress.daysCompleted)) {
            if (program.nextProgramId) {
              setShowCompletionPopup(true);
            }
          }
        }
      }
      
      // Загружаем текущий уровень боли
      const today = new Date().toISOString().split('T')[0];
      const todayPainStatus = await AsyncStorage.getItem(`painStatus_${today}`);
      let painLevel: PainLevel = 'none';
      
      if (todayPainStatus) {
        painLevel = JSON.parse(todayPainStatus).level;
      } else {
        const lastStatus = await AsyncStorage.getItem('lastPainStatus');
        if (lastStatus) {
          painLevel = JSON.parse(lastStatus).level;
        }
      }
      
      setCurrentPainLevel(painLevel);

      // ИСПОЛЬЗУЕМ НОВУЮ СИСТЕМУ: берем упражнения напрямую из rehabProgram
      if (!progress || !program) {
        console.warn('[DayPlan] No progress or program found, using fallback');
        const fallbackExercises = createDayPlan(painLevel, settings);
        setExercises(fallbackExercises);
        return;
      }

      console.log(`[DayPlan] Using rehab program: ${program.nameRu} (${program.id})`);

      // Получаем настройки текущей недели
      const currentWeekSettings = UserProgressManager.getCurrentWeekSettings(program, progress.currentWeek);
      console.log(`[DayPlan] Week ${progress.currentWeek} settings:`, currentWeekSettings);

      // Получаем упражнения из программы и применяем настройки текущей недели
      let programExercises = await Promise.all(
        program.exercises
          .filter(ex => ex.isEnabled)
          .sort((a, b) => a.order - b.order)
          .map(async (ex) => {
            // 1. Базовые настройки упражнения
            const mergedSettings = { ...ex.settings };
            
            // 2. Применяем недельные настройки из программы
            if (currentWeekSettings.holdTime !== undefined) mergedSettings.holdTime = currentWeekSettings.holdTime;
            if (currentWeekSettings.repsSchema !== undefined) mergedSettings.repsSchema = currentWeekSettings.repsSchema;
            if (currentWeekSettings.restTime !== undefined) mergedSettings.restTime = currentWeekSettings.restTime;
            if (currentWeekSettings.dynamicReps !== undefined) mergedSettings.dynamicReps = currentWeekSettings.dynamicReps;
            if (currentWeekSettings.dynamicSets !== undefined) mergedSettings.dynamicSets = currentWeekSettings.dynamicSets;
            if (currentWeekSettings.rollingDuration !== undefined) mergedSettings.rollingDuration = currentWeekSettings.rollingDuration;
            if (currentWeekSettings.rollingSessions !== undefined) mergedSettings.rollingSessions = currentWeekSettings.rollingSessions;
            if (currentWeekSettings.walkDuration !== undefined) mergedSettings.walkDuration = currentWeekSettings.walkDuration;
            if (currentWeekSettings.walkSessions !== undefined) mergedSettings.walkSessions = currentWeekSettings.walkSessions;
            
            // 3. ⚙️ ПРИМЕНЯЕМ РУЧНЫЕ НАСТРОЙКИ (самый высокий приоритет!)
            try {
              const manualSettingsKey = `manual_exercise_settings_${ex.exerciseId}`;
              const manualSettingsJson = await AsyncStorage.getItem(manualSettingsKey);
              
              if (manualSettingsJson) {
                const manualSettings = JSON.parse(manualSettingsJson);
                console.log(`[DayPlan] ⚙️ Manual settings applied for ${ex.exerciseId}`);
                // Применяем ручные настройки поверх всех остальных
                Object.assign(mergedSettings, manualSettings);
              }
            } catch (error) {
              console.error(`[DayPlan] Error loading manual settings for ${ex.exerciseId}:`, error);
            }
            
            return {
              ...ex,
              settings: mergedSettings,
            };
          })
      );
      
      console.log(`[DayPlan] Loaded ${programExercises.length} exercises with week ${progress.currentWeek} settings`);
      console.log(`[DayPlan] Schema: ${currentWeekSettings.repsSchema?.join('-') || 'default'}`);

      const savedExercises = await AsyncStorage.getItem(`exercises_${today}`);
      let completedExerciseIds: string[] = [];

      console.log(`[DayPlan] Saved exercises exist:`, !!savedExercises);

      // Проверяем, совпадает ли сохраненная программа с текущей
      if (savedExercises && progress) {
        const oldExercises = JSON.parse(savedExercises);
        const savedProgramId = oldExercises[0]?.extendedData?.programId;
        
        console.log(`[DayPlan] Saved program ID: ${savedProgramId}`);
        console.log(`[DayPlan] Current program ID: ${progress.currentProgramId}`);
        
        // Если программа изменилась - очищаем упражнения
        if (savedProgramId && savedProgramId !== progress.currentProgramId) {
          console.log(`[DayPlan] ✅ Program changed! Clearing exercises from ${savedProgramId} to ${progress.currentProgramId}`);
          await AsyncStorage.removeItem(`exercises_${today}`);
          completedExerciseIds = [];
        } else {
          console.log(`[DayPlan] ℹ️ Same program, keeping completed exercises`);
          // Программа не изменилась - берем завершенные ID
          completedExerciseIds = oldExercises
            .filter((ex: Exercise) => ex.completed)
            .map((ex: Exercise) => {
              return ex.extendedData?.exerciseId || ex.id;
            });
          console.log(`[DayPlan] Completed exercises:`, completedExerciseIds);
        }
      } else {
        console.log(`[DayPlan] ℹ️ No saved exercises, generating fresh`);
      }

      const dayExercises = await convertProgramExercisesToLegacy(
        programExercises,
        completedExerciseIds,
        progress?.currentProgramId
      );

      console.log(`[DayPlan] Day plan loaded with ${dayExercises.length} exercises:`);
      dayExercises.forEach((ex, idx) => {
        console.log(`  ${idx + 1}. ${ex.name} - ${ex.description}`);
      });

      await AsyncStorage.setItem(`exercises_${today}`, JSON.stringify(dayExercises));
      setExercises(dayExercises);
      
      // Проверяем был ли день уже завершен сегодня
      const dayCompletedFlag = await AsyncStorage.getItem(`day_completed_${today}`);
      setDayAlreadyCompleted(dayCompletedFlag === 'true');
      
      if (dayCompletedFlag === 'true') {
        console.log('[DayPlan] ✅ Day already completed today');
      } else {
        console.log('[DayPlan] ℹ️ Day not yet completed');
      }
    } catch (error) {
      console.error('[DayPlan] Error loading day plan:', error);
      setExercises(createDayPlan('none', settings));
      setActiveProgramName('Базовая программа');
    }
  }, [settings]);

  useFocusEffect(
    useCallback(() => {
      if (settings) {
        loadDayPlan();
      }
    }, [settings, loadDayPlan])
  );

  // Автоматическая проверка завершения дня
  useEffect(() => {
    const checkDayCompletion = async () => {
      // Проверяем: есть ли упражнения, все ли завершены, и не был ли день уже отмечен
      const hasExercises = exercises.length > 0;
      const allCompleted = hasExercises && exercises.every(ex => ex.completed);
      
      if (allCompleted && !dayAlreadyCompleted) {
        console.log('[DayPlan] 🎉 All exercises completed! Marking day as completed...');
        await handleDayCompletion();
      }
    };
    
    checkDayCompletion();
  }, [exercises, dayAlreadyCompleted]);

  const handleDayCompletion = async () => {
    try {
      if (!rehabProgram || !userProgress) {
        console.warn('[DayPlan] Cannot complete day: missing program or progress');
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Отмечаем день как завершенный
      await UserProgressManager.markDayCompleted();
      await AsyncStorage.setItem(`day_completed_${today}`, 'true');
      setDayAlreadyCompleted(true);
      
      console.log('[DayPlan] ✅ Day marked as completed');
      
      // Показываем поздравление
      setShowDayCompletionMessage(true);
      
      // Перезагружаем прогресс для обновления UI
      const updatedProgress = await UserProgressManager.getProgress();
      setUserProgress(updatedProgress);
      
      // Проверяем нужно ли показать popup прогрессии
      const shouldShowProgression = await UserProgressManager.shouldShowProgressionPopup();
      if (shouldShowProgression) {
        console.log('[DayPlan] 📊 Should show progression popup');
        // Задержка чтобы сначала показать поздравление
        setTimeout(() => {
          setShowDayCompletionMessage(false);
          setShowProgressionPopup(true);
        }, 2000);
      } else {
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
          setShowDayCompletionMessage(false);
        }, 3000);
      }
      
      // Проверяем завершение программы
      if (updatedProgress && UserProgressManager.isProgramCompleted(rehabProgram, updatedProgress.daysCompleted)) {
        if (rehabProgram.nextProgramId) {
          console.log('[DayPlan] 🎆 Program completed!');
          setTimeout(() => {
            setShowCompletionPopup(true);
          }, shouldShowProgression ? 4000 : 3000);
        }
      }
    } catch (error) {
      console.error('[DayPlan] Error completing day:', error);
    }
  };

  const createDayPlan = (painLevel: PainLevel, userSettings: UserSettings | null = null): Exercise[] => {
    const plan: Exercise[] = [];

    if (painLevel !== 'acute') {
      plan.push({
        id: 'curl_up',
        name: EXERCISE_DATA.curl_up.name,
        description: '7с × 3-2-1, отдых 15с',
        completed: false,
        visible: true,
      });

      plan.push({
        id: 'side_plank',
        name: EXERCISE_DATA.side_plank.name,
        description: '7с × 3-2-1, отдых 15с',
        completed: false,
        visible: true,
      });

      plan.push({
        id: 'bird_dog',
        name: EXERCISE_DATA.bird_dog.name,
        description: '7с × 3-2-1, отдых 15с',
        completed: false,
        visible: true,
      });
    }

    plan.push({
      id: 'walk',
      name: EXERCISE_DATA.walk.name,
      description: painLevel === 'acute' ? 'По состоянию' : '5 мин × 3 сессии',
      completed: false,
      visible: true,
    });

    return plan;
  };

  const startExercise = (exercise: Exercise) => {
    navigation.navigate('ExerciseExecution', {
      exerciseType: exercise.id,
      exerciseName: exercise.name,
    });
  };

  const isExerciseCompleted = (exercise: Exercise): boolean => {
    return exercise.completed || false;
  };

  const handleAcceptProgression = async () => {
    if (!rehabProgram || !userProgress) return;
    
    const nextWeek = userProgress.currentWeek + 1;
    await UserProgressManager.acceptProgression(rehabProgram, nextWeek);
    await UserProgressManager.markProgressionPopupShown();
    setShowProgressionPopup(false);
    await loadDayPlan();
  };

  const handleDeclineProgression = async () => {
    if (!rehabProgram || !userProgress) return;
    
    const suggestedWeek = userProgress.currentWeek + 1;
    await UserProgressManager.declineProgression(rehabProgram, suggestedWeek);
    await UserProgressManager.markProgressionPopupShown();
    setShowProgressionPopup(false);
  };

  const handleSwitchToNextProgram = async () => {
    if (!rehabProgram || !rehabProgram.nextProgramId) return;
    
    await UserProgressManager.switchProgram(rehabProgram.nextProgramId);
    setShowCompletionPopup(false);
    await loadDayPlan();
  };

  const handleStayOnCurrentProgram = () => {
    setShowCompletionPopup(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка плана...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>План На День</Text>

        {/* Программа и прогресс */}
        {rehabProgram && userProgress && (
          <View style={styles.programContainer}>
            <View style={styles.programHeader}>
              <Text style={styles.programIcon}>{rehabProgram.icon}</Text>
              <Text style={styles.programName}>{rehabProgram.nameRu}</Text>
            </View>
            
            {rehabProgram.durationDays !== -1 && (
              <>
                <Text style={styles.programProgress}>
                  День {userProgress.daysCompleted} из {rehabProgram.durationDays}
                </Text>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${UserProgressManager.getProgramProgress(rehabProgram, userProgress.daysCompleted)}%` }
                    ]} 
                  />
                </View>
              </>
            )}
            
            <Text style={styles.weekInfo}>
              📊 Неделя {userProgress.currentWeek} • Подходы: {
                UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).repsSchema.join('-')
              }
            </Text>
            
            {userProgress.currentStreak > 0 && (
              <Text style={styles.streakInfo}>
                🔥 Серия: {userProgress.currentStreak} {userProgress.currentStreak === 1 ? 'день' : 'дней'}
              </Text>
            )}
          </View>
        )}

        {/* Рекомендации */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsText}>
            {PAIN_RECOMMENDATIONS[currentPainLevel]}
          </Text>
        </View>

        {/* Список упражнений */}
        <View style={styles.exercisesContainer}>
          {exercises.map((exercise, index) => (
            <View key={exercise.extendedData?.exerciseId || `${exercise.id}-${index}`} style={styles.exerciseRow}>
              <View style={styles.progressIndicator}>
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: isExerciseCompleted(exercise)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.SCALE_COLOR,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressCircle,
                    {
                      backgroundColor: isExerciseCompleted(exercise)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.WHITE,
                      borderColor: isExerciseCompleted(exercise)
                        ? COLORS.PRIMARY_ACCENT
                        : COLORS.SCALE_COLOR,
                    },
                  ]}
                >
                  {isExerciseCompleted(exercise) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.exerciseCard,
                  selectedExercise === (exercise.extendedData?.exerciseId || exercise.id) && styles.selectedCard,
                ]}
                onPress={() => {
                  const exerciseKey = exercise.extendedData?.exerciseId || exercise.id;
                  setSelectedExercise(
                    selectedExercise === exerciseKey ? null : exerciseKey
                  );
                }}
                disabled={isExerciseCompleted(exercise)}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDescription}>
                    {exercise.description}
                  </Text>
                </View>

                {selectedExercise === (exercise.extendedData?.exerciseId || exercise.id) && !isExerciseCompleted(exercise) && (
                  <View style={styles.startButtonContainer}>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => startExercise(exercise)}
                    >
                      <Text style={styles.startButtonText}>СТАРТ</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Приведенная информация носит справочный характер. Если вам требуется 
          медицинская консультация или постановка диагноза, обратитесь к специалисту.
        </Text>
      </ScrollView>

      {/* Weekly Progression Popup */}
      <Modal
        visible={showProgressionPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProgressionPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Отличная работа!</Text>
            
            <Text style={styles.modalText}>
              Вы выполняли программу 7 дней подряд! Готовы увеличить нагрузку?
            </Text>
            
            {rehabProgram && userProgress && (
              <>
                <View style={styles.settingsComparison}>
                  <Text style={styles.comparisonLabel}>Текущие настройки:</Text>
                  <Text style={styles.comparisonValue}>
                    • Подходы: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).repsSchema.join('-')}
                  </Text>
                  <Text style={styles.comparisonValue}>
                    • Удержание: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).holdTime || 7} секунд
                  </Text>
                  <Text style={styles.comparisonValue}>
                    • Отдых: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).restTime || 15} секунд
                  </Text>
                </View>
                
                <View style={styles.settingsComparison}>
                  <Text style={styles.comparisonLabel}>Новые настройки:</Text>
                  <Text style={[styles.comparisonValue, styles.highlightedValue]}>
                    • Подходы: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek + 1).repsSchema.join('-')} ⬆️
                  </Text>
                  <Text style={[styles.comparisonValue, styles.highlightedValue]}>
                    • Удержание: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek + 1).holdTime || 7} секунд
                  </Text>
                  <Text style={[styles.comparisonValue, styles.highlightedValue]}>
                    • Отдых: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek + 1).restTime || 15} секунд
                  </Text>
                </View>
              </>
            )}
            
            <Text style={styles.modalHint}>
              Вы можете отклонить, если чувствуете дискомфорт
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.declineButton]}
                onPress={handleDeclineProgression}
              >
                <Text style={styles.modalButtonText}>Нет, оставить</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={handleAcceptProgression}
              >
                <Text style={styles.modalButtonText}>Да, увеличить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Program Completion Popup */}
      <Modal
        visible={showCompletionPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎊 Поздравляем!</Text>
            
            <Text style={styles.modalText}>
              Вы завершили программу{'\n'}
              <Text style={styles.boldText}>"{rehabProgram?.nameRu}"</Text>
            </Text>
            
            {rehabProgram && userProgress && (
              <Text style={styles.modalText}>
                {userProgress.daysCompleted} дней выполнено ✓
              </Text>
            )}
            
            {rehabProgram?.nextProgramId && (
              <>
                <Text style={styles.modalText}>
                  Вы готовы перейти на следующий уровень:
                </Text>
                
                <View style={styles.nextProgramPreview}>
                  <Text style={styles.nextProgramTitle}>
                    📈 {rehabProgram.nextProgramId === 'rehabilitation_consolidation' ? 'Закрепление результата' : 
                       rehabProgram.nextProgramId === 'rehabilitation_maintenance' ? 'Профилактика' : 'Следующая программа'}
                  </Text>
                  <Text style={styles.nextProgramDescription}>
                    Что изменится:{'\n'}
                    • Новые упражнения{'\n'}
                    • Увеличенная нагрузка{'\n'}
                    • Больше разнообразия
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.declineButton]}
                onPress={handleStayOnCurrentProgram}
              >
                <Text style={styles.modalButtonText}>Остаться</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={handleSwitchToNextProgram}
              >
                <Text style={styles.modalButtonText}>Начать новую</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Day Completion Message */}
      <Modal
        visible={showDayCompletionMessage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDayCompletionMessage(false)}
      >
        <View style={styles.completionOverlay}>
          <View style={styles.completionMessage}>
            <Text style={styles.completionIcon}>🎉</Text>
            <Text style={styles.completionTitle}>Поздравляем!</Text>
            <Text style={styles.completionText}>
              День выполнен
            </Text>
            {userProgress && (
              <Text style={styles.completionStreakText}>
                🔥 Серия: {userProgress.currentStreak} дней
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 15,
  },
  programContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  programIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  programProgress: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 4,
  },
  weekInfo: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  streakInfo: {
    fontSize: 13,
    color: COLORS.PRIMARY_ACCENT,
    fontWeight: '600',
  },
  recommendationsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'left',
  },
  exercisesContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  exerciseRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  progressIndicator: {
    alignItems: 'center',
    marginRight: 15,
    marginTop: 10,
  },
  progressLine: {
    width: 3,
    height: 60,
    marginBottom: -30,
  },
  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    shadowColor: COLORS.PRIMARY_ACCENT,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  cardContent: {
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    lineHeight: 18,
    minHeight: 50,
  },
  startButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  settingsComparison: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  highlightedValue: {
    color: COLORS.PRIMARY_ACCENT,
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.SCALE_COLOR,
  },
  acceptButton: {
    backgroundColor: COLORS.CTA_BUTTON,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  nextProgramPreview: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  nextProgramTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  nextProgramDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  // Day Completion Message styles
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionMessage: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  completionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  completionText: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  completionStreakText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY_ACCENT,
  },
});

export default DayPlanScreen;
