import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, ExtendedExerciseSettings } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import UserProgressManager from '../utils/userProgressManager';
import RehabProgramLoader from '../utils/rehabProgramLoader';
import { getExerciseById } from '../constants/exercises/exercisesData';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ManualExerciseSettings'>;
type RoutePropType = RouteProp<RootStackParamList, 'ManualExerciseSettings'>;

// Готовые схемы повторений
const REPS_SCHEMAS = [
  { label: 'Пирамида (3-2-1)', description: 'Рекомендуемая схема для новичков.', value: [3, 2, 1] },
  { label: 'Пирамида (4-3-2)', description: 'Для тех, кто уже освоил базовый уровень.', value: [4, 3, 2] },
  { label: 'Пирамида (5-3-2)', description: 'Для тех, кто уже освоил базовый уровень.', value: [5, 3, 2] },
  { label: 'Пирамида (6-4-2)', description: 'Для опытных пользователей.', value: [6, 4, 2] },
  { label: 'Пирамида (8-6-4)', description: 'Для продвинутых пользователей.', value: [8, 6, 4] },
  { label: 'Пирамида (10-8-6)', description: 'Для экспертов.', value: [10, 8, 6] },
];

// Компонент слайдера
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  recommendation?: string;
  onValueChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  recommendation,
  onValueChange,
}) => {
  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleDecrease = () => {
    if (value > min) {
      onValueChange(value - step);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onValueChange(value + step);
    }
  };

  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity
        onPress={() => setShowRecommendation(!showRecommendation)}
        style={styles.labelContainer}
      >
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.infoIcon}>ⓘ</Text>
      </TouchableOpacity>
      
      {showRecommendation && recommendation && (
        <Text style={styles.recommendation}>{recommendation}</Text>
      )}

      <View style={styles.sliderControls}>
        <TouchableOpacity
          style={[styles.sliderButton, value <= min && styles.disabledButton]}
          onPress={handleDecrease}
          disabled={value <= min}
        >
          <Text style={styles.sliderButtonText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.sliderValue}>
          {value}{suffix}
        </Text>

        <TouchableOpacity
          style={[styles.sliderButton, value >= max && styles.disabledButton]}
          onPress={handleIncrease}
          disabled={value >= max}
        >
          <Text style={styles.sliderButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ManualExerciseSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { exerciseId, exerciseName } = route.params;

  const [defaultSettings, setDefaultSettings] = useState<ExtendedExerciseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [executionType, setExecutionType] = useState<string>('hold');

  // Для hold/reps упражнений
  const [holdTime, setHoldTime] = useState(7);
  const [restTime, setRestTime] = useState(15);
  const [selectedSchemaType, setSelectedSchemaType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customSchema, setCustomSchema] = useState([3, 2, 1]);

  // Для dynamic упражнений
  const [dynamicReps, setDynamicReps] = useState(10);
  const [dynamicSets, setDynamicSets] = useState(2);
  const [dynamicRestTime, setDynamicRestTime] = useState(15);

  // Для foam_rolling
  const [rollingDuration, setRollingDuration] = useState(60);
  const [rollingSessions, setRollingSessions] = useState(2);
  const [rollingRestTime, setRollingRestTime] = useState(30);

  // Для walk
  const [walkDuration, setWalkDuration] = useState(5);
  const [walkSessions, setWalkSessions] = useState(3);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const progress = await UserProgressManager.getProgress();
      if (!progress) {
        Alert.alert('Ошибка', 'Не удалось загрузить прогресс');
        navigation.goBack();
        return;
      }

      const program = await RehabProgramLoader.getProgramById(progress.currentProgramId);
      if (!program) {
        Alert.alert('Ошибка', 'Не удалось загрузить программу');
        navigation.goBack();
        return;
      }

      // Определяем тип упражнения
      const exerciseInfo = getExerciseById(exerciseId);
      if (exerciseInfo) {
        setExecutionType(exerciseInfo.executionType);
      }

      // Получаем текущие настройки (с учетом weekly progression и manual overrides)
      const currentSettings = await UserProgressManager.getExerciseSettings(program, exerciseId);
      
      // Получаем базовые настройки для кнопки "сброс"
      const exerciseInProgram = program.exercises.find(e => e.exerciseId === exerciseId);
      if (exerciseInProgram) {
        const weekSettings = UserProgressManager.getCurrentWeekSettings(program, progress.currentWeek);
        const merged = { ...exerciseInProgram.settings };
        
        if (weekSettings.holdTime !== undefined) merged.holdTime = weekSettings.holdTime;
        if (weekSettings.repsSchema !== undefined) merged.repsSchema = weekSettings.repsSchema;
        if (weekSettings.restTime !== undefined) merged.restTime = weekSettings.restTime;
        if (weekSettings.dynamicReps !== undefined) merged.dynamicReps = weekSettings.dynamicReps;
        if (weekSettings.dynamicSets !== undefined) merged.dynamicSets = weekSettings.dynamicSets;
        if (weekSettings.rollingDuration !== undefined) merged.rollingDuration = weekSettings.rollingDuration;
        if (weekSettings.rollingSessions !== undefined) merged.rollingSessions = weekSettings.rollingSessions;
        if (weekSettings.walkDuration !== undefined) merged.walkDuration = weekSettings.walkDuration;
        if (weekSettings.walkSessions !== undefined) merged.walkSessions = weekSettings.walkSessions;
        
        setDefaultSettings(merged);
      }

      // Заполняем поля в зависимости от типа упражнения
      if (exerciseInfo) {
        if (exerciseInfo.executionType === 'hold' || exerciseInfo.executionType === 'reps') {
          setHoldTime(currentSettings.holdTime || 7);
          setRestTime(currentSettings.restTime || 15);
          
          const schema = currentSettings.repsSchema || [3, 2, 1];
          const matchingPreset = REPS_SCHEMAS.findIndex(
            s => JSON.stringify(s.value) === JSON.stringify(schema)
          );
          
          if (matchingPreset !== -1) {
            setSelectedSchemaType('preset');
            setSelectedPresetIndex(matchingPreset);
          } else {
            setSelectedSchemaType('custom');
            setCustomSchema(schema);
          }
        } else if (exerciseInfo.executionType === 'dynamic') {
          setDynamicReps(currentSettings.dynamicReps || 10);
          setDynamicSets(currentSettings.dynamicSets || 2);
          setDynamicRestTime(currentSettings.restTime || 15);
        } else if (exerciseInfo.executionType === 'foam_rolling') {
          setRollingDuration(currentSettings.rollingDuration || 60);
          setRollingSessions(currentSettings.rollingSessions || 2);
          setRollingRestTime(currentSettings.restTime || 30);
        } else if (exerciseInfo.executionType === 'walk') {
          setWalkDuration(currentSettings.walkDuration || 5);
          setWalkSessions(currentSettings.walkSessions || 3);
        }
      }

      console.log('[ManualSettings] Loaded settings for:', exerciseId);
    } catch (error) {
      console.error('[ManualSettings] Error loading settings:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const exerciseInfo = getExerciseById(exerciseId);
      if (!exerciseInfo) {
        Alert.alert('Ошибка', 'Упражнение не найдено');
        return;
      }

      let newSettings: ExtendedExerciseSettings = {};

      // Формируем настройки в зависимости от типа
      if (exerciseInfo.executionType === 'hold' || exerciseInfo.executionType === 'reps') {
        const schema = selectedSchemaType === 'preset' 
          ? REPS_SCHEMAS[selectedPresetIndex].value 
          : customSchema;
        
        newSettings = {
          holdTime,
          repsSchema: schema,
          restTime,
        };
      } else if (exerciseInfo.executionType === 'dynamic') {
        newSettings = {
          dynamicReps,
          dynamicSets,
          restTime: dynamicRestTime,
        };
      } else if (exerciseInfo.executionType === 'foam_rolling') {
        newSettings = {
          rollingDuration,
          rollingSessions,
          restTime: rollingRestTime,
        };
      } else if (exerciseInfo.executionType === 'walk') {
        newSettings = {
          walkDuration,
          walkSessions,
        };
      }

      // Сохраняем в manual overrides (для UserProgressManager)
      await UserProgressManager.setManualOverride(exerciseId, newSettings);
      
      // ⚙️ Также сохраняем в AsyncStorage (для прямого доступа)
      const manualSettingsKey = `manual_exercise_settings_${exerciseId}`;
      await AsyncStorage.setItem(manualSettingsKey, JSON.stringify(newSettings));

      console.log('[ManualSettings] Settings saved for:', exerciseId);

      Alert.alert(
        'Успешно!',
        'Настройки сохранены. Auto-progression отключен для этого упражнения.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('[ManualSettings] Error saving:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Сбросить настройки?',
      'Это вернёт упражнение к настройкам программы для текущей недели.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserProgressManager.clearManualOverride(exerciseId);
              
              // ⚙️ ВАЖНО: также очищаем из AsyncStorage
              const manualSettingsKey = `manual_exercise_settings_${exerciseId}`;
              await AsyncStorage.removeItem(manualSettingsKey);

              if (defaultSettings) {
                // Восстанавливаем значения из программы
                const exerciseInfo = getExerciseById(exerciseId);
                if (exerciseInfo) {
                  if (exerciseInfo.executionType === 'hold' || exerciseInfo.executionType === 'reps') {
                    setHoldTime(defaultSettings.holdTime || 7);
                    setRestTime(defaultSettings.restTime || 15);
                    
                    const schema = defaultSettings.repsSchema || [3, 2, 1];
                    const matchingPreset = REPS_SCHEMAS.findIndex(
                      s => JSON.stringify(s.value) === JSON.stringify(schema)
                    );
                    
                    if (matchingPreset !== -1) {
                      setSelectedSchemaType('preset');
                      setSelectedPresetIndex(matchingPreset);
                    } else {
                      setSelectedSchemaType('custom');
                      setCustomSchema(schema);
                    }
                  } else if (exerciseInfo.executionType === 'dynamic') {
                    setDynamicReps(defaultSettings.dynamicReps || 10);
                    setDynamicSets(defaultSettings.dynamicSets || 2);
                    setDynamicRestTime(defaultSettings.restTime || 15);
                  } else if (exerciseInfo.executionType === 'foam_rolling') {
                    setRollingDuration(defaultSettings.rollingDuration || 60);
                    setRollingSessions(defaultSettings.rollingSessions || 2);
                    setRollingRestTime(defaultSettings.restTime || 30);
                  } else if (exerciseInfo.executionType === 'walk') {
                    setWalkDuration(defaultSettings.walkDuration || 5);
                    setWalkSessions(defaultSettings.walkSessions || 3);
                  }
                }
              }

              console.log('[ManualSettings] Cleared manual override for:', exerciseId);
              Alert.alert('Успешно!', 'Настройки сброшены к значениям программы');
            } catch (error) {
              console.error('[ManualSettings] Error resetting:', error);
              Alert.alert('Ошибка', 'Не удалось сбросить настройки');
            }
          },
        },
      ]
    );
  };

  const updateCustomSchemaSet = (index: number, value: string) => {
    const newSchema = [...customSchema];
    const numValue = parseInt(value, 10) || 0;
    newSchema[index] = Math.min(Math.max(numValue, 0), 30);
    setCustomSchema(newSchema);
  };

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки упражнения</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 После сохранения auto-progression будет отключен для этого упражнения. 
            Используйте кнопку "Сбросить", чтобы вернуться к автоматической прогрессии.
          </Text>
        </View>

        {/* Hold/Reps упражнения */}
        {(executionType === 'hold' || executionType === 'reps') && (
          <View style={styles.section}>
            <Slider
              label="Время удержания"
              value={holdTime}
              min={3}
              max={30}
              suffix=" сек"
              recommendation="Для начала рекомендуется 7 секунд, так как это оптимальное время для тренировки выносливости."
              onValueChange={setHoldTime}
            />

            {/* Схема повторений */}
            <View style={styles.schemaContainer}>
              <Text style={styles.sliderLabel}>Схема Повторений</Text>

              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    selectedSchemaType === 'preset' && styles.selectedRadioOption,
                  ]}
                  onPress={() => setSelectedSchemaType('preset')}
                >
                  <View style={styles.radioButton}>
                    {selectedSchemaType === 'preset' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioLabel}>Готовые схемы</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    selectedSchemaType === 'custom' && styles.selectedRadioOption,
                  ]}
                  onPress={() => setSelectedSchemaType('custom')}
                >
                  <View style={styles.radioButton}>
                    {selectedSchemaType === 'custom' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioLabel}>Произвольная схема</Text>
                </TouchableOpacity>
              </View>

              {selectedSchemaType === 'preset' ? (
                <View style={styles.presetContainer}>
                  {REPS_SCHEMAS.map((schema, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.presetOption,
                        selectedPresetIndex === index && styles.selectedPresetOption,
                      ]}
                      onPress={() => setSelectedPresetIndex(index)}
                    >
                      <Text style={styles.presetLabel}>{schema.label}</Text>
                      <Text style={styles.presetDescription}>{schema.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.customSchemaContainer}>
                  <Text style={styles.customSchemaLabel}>
                    Введите количество повторений для каждого подхода:
                  </Text>
                  <View style={styles.customInputs}>
                    {[0, 1, 2].map((index) => (
                      <View key={index} style={styles.customInputContainer}>
                        <Text style={styles.customInputLabel}>Подход {index + 1}:</Text>
                        <TextInput
                          style={styles.customInput}
                          value={customSchema[index]?.toString() || '0'}
                          onChangeText={(value) => updateCustomSchemaSet(index, value)}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Slider
              label="Пауза между подходами"
              value={restTime}
              min={5}
              max={30}
              suffix=" сек"
              recommendation="Короткие паузы (10-15 секунд) являются ключом к развитию выносливости."
              onValueChange={setRestTime}
            />
          </View>
        )}

        {/* Dynamic упражнения */}
        {executionType === 'dynamic' && (
          <View style={styles.section}>
            <Slider
              label="Повторений в подходе"
              value={dynamicReps}
              min={5}
              max={30}
              recommendation="Начните с 10 повторений и постепенно увеличивайте."
              onValueChange={setDynamicReps}
            />

            <Slider
              label="Количество подходов"
              value={dynamicSets}
              min={1}
              max={5}
              recommendation="2-3 подхода оптимально для начала."
              onValueChange={setDynamicSets}
            />

            <Slider
              label="Пауза между подходами"
              value={dynamicRestTime}
              min={10}
              max={60}
              suffix=" сек"
              recommendation="15-30 секунд отдыха достаточно."
              onValueChange={setDynamicRestTime}
            />
          </View>
        )}

        {/* Foam Rolling */}
        {executionType === 'foam_rolling' && (
          <View style={styles.section}>
            <Slider
              label="Длительность прокатки"
              value={rollingDuration}
              min={30}
              max={120}
              suffix=" сек"
              recommendation="60 секунд оптимально для расслабления мышц."
              onValueChange={setRollingDuration}
            />

            <Slider
              label="Количество сессий"
              value={rollingSessions}
              min={1}
              max={5}
              recommendation="2-3 сессии достаточно."
              onValueChange={setRollingSessions}
            />

            <Slider
              label="Пауза между сессиями"
              value={rollingRestTime}
              min={15}
              max={60}
              suffix=" сек"
              recommendation="30 секунд отдыха между сессиями."
              onValueChange={setRollingRestTime}
            />
          </View>
        )}

        {/* Walk */}
        {executionType === 'walk' && (
          <View style={styles.section}>
            <Slider
              label="Длительность сессии"
              value={walkDuration}
              min={1}
              max={60}
              suffix=" мин"
              recommendation="Начинайте с 5-10 минут. Постепенно увеличивайте время."
              onValueChange={setWalkDuration}
            />

            <Slider
              label="Количество сессий"
              value={walkSessions}
              min={1}
              max={5}
              recommendation="3 коротких сессии в день эффективнее одной длинной."
              onValueChange={setWalkSessions}
            />
          </View>
        )}

        {/* Настройки программы */}
        {defaultSettings && (
          <View style={styles.defaultContainer}>
            <Text style={styles.defaultTitle}>Настройки программы:</Text>
            {(executionType === 'hold' || executionType === 'reps') && (
              <>
                <Text style={styles.defaultText}>
                  • Схема: {defaultSettings.repsSchema?.join('-')}
                </Text>
                <Text style={styles.defaultText}>
                  • Удержание: {defaultSettings.holdTime}с
                </Text>
                <Text style={styles.defaultText}>
                  • Отдых: {defaultSettings.restTime}с
                </Text>
              </>
            )}
            {executionType === 'dynamic' && (
              <>
                <Text style={styles.defaultText}>
                  • Повторений: {defaultSettings.dynamicReps}
                </Text>
                <Text style={styles.defaultText}>
                  • Подходов: {defaultSettings.dynamicSets}
                </Text>
                <Text style={styles.defaultText}>
                  • Отдых: {defaultSettings.restTime}с
                </Text>
              </>
            )}
            {executionType === 'foam_rolling' && (
              <>
                <Text style={styles.defaultText}>
                  • Длительность: {defaultSettings.rollingDuration}с
                </Text>
                <Text style={styles.defaultText}>
                  • Сессий: {defaultSettings.rollingSessions}
                </Text>
                <Text style={styles.defaultText}>
                  • Отдых: {defaultSettings.restTime}с
                </Text>
              </>
            )}
            {executionType === 'walk' && (
              <>
                <Text style={styles.defaultText}>
                  • Длительность: {defaultSettings.walkDuration} мин
                </Text>
                <Text style={styles.defaultText}>
                  • Сессий: {defaultSettings.walkSessions}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Кнопки */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
            <Text style={styles.buttonText}>🔄 Сбросить</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={[styles.buttonText, styles.saveButtonText]}>✓ Сохранить</Text>
          </TouchableOpacity>
        </View>

        {/* Медицинское предупреждение */}
        <Text style={styles.disclaimer}>
          Приведенная информация носит справочный характер. Если вам требуется 
          медицинская консультация или постановка диагноза, обратитесь к специалисту.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sliderContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  infoIcon: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.6,
  },
  recommendation: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: 15,
    lineHeight: 16,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PROGRESS_ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_INACTIVE,
  },
  sliderButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: 30,
    minWidth: 80,
    textAlign: 'center',
  },
  schemaContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  radioGroup: {
    marginVertical: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedRadioOption: {
    opacity: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY_ACCENT,
  },
  radioLabel: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  presetContainer: {
    marginTop: 10,
  },
  presetOption: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.SCALE_COLOR,
    marginBottom: 10,
  },
  selectedPresetOption: {
    borderColor: COLORS.PRIMARY_ACCENT,
    backgroundColor: COLORS.SCALE_COLOR,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  presetDescription: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  customSchemaContainer: {
    marginTop: 10,
  },
  customSchemaLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
  },
  customInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customInputContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  customInputLabel: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  customInput: {
    borderWidth: 1,
    borderColor: COLORS.SCALE_COLOR,
    borderRadius: 8,
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    width: '100%',
  },
  defaultContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  defaultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  defaultText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    marginBottom: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: COLORS.SCALE_COLOR,
  },
  saveButton: {
    backgroundColor: COLORS.CTA_BUTTON,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButtonText: {
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
});

export default ManualExerciseSettingsScreen;
