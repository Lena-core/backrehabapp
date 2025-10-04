// Экран превью упражнений и настроек - Шаг 2/4

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList, ExerciseSettings, WalkSettings } from '../../types';
import { 
  COLORS, 
  GRADIENTS, 
  EXERCISE_PREVIEW_SCREEN, 
  PAIN_LEVEL_RECOMMENDATIONS,
} from '../../constants';
import { useOnboarding } from '../../contexts';
import { CustomButton } from '../../components';
import { 
  shouldShowExercises,
  formatExerciseSettingsDescription,
  formatWalkSettingsDescription,
} from '../../utils/onboardingUtils';

const { width } = Dimensions.get('window');

type ExercisePreviewNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'ExercisePreview'
>;

// Компонент Slider для настроек
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onValueChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onValueChange,
}) => {
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
      <Text style={styles.sliderLabel}>{label}</Text>
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

// Пресеты схем повторений
const REPS_SCHEMAS = [
  { label: 'Произвольная (2)', value: [2] },
  { label: 'Пирамида (3-2-1)', value: [3, 2, 1] },
  { label: 'Пирамида (4-3-2)', value: [4, 3, 2] },
  { label: 'Пирамида (5-3-2)', value: [5, 3, 2] },
  { label: 'Пирамида (6-4-2)', value: [6, 4, 2] },
];

const ExercisePreviewScreen: React.FC = () => {
  const navigation = useNavigation<ExercisePreviewNavigationProp>();
  const { onboardingData, setExerciseSettings, setWalkSettings } = useOnboarding();

  // Проверяем наличие данных
  if (!onboardingData) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  const painLevel = onboardingData.painLevel;
  const showExercises = shouldShowExercises(painLevel);

  // Состояние чекбокса "Изменить настройки"
  const [customizeSettings, setCustomizeSettings] = useState(false);

  // Локальное состояние настроек
  const [localExerciseSettings, setLocalExerciseSettings] = useState<ExerciseSettings>(
    onboardingData.exerciseSettings
  );
  const [localWalkSettings, setLocalWalkSettings] = useState<WalkSettings>(
    onboardingData.walkSettings
  );

  // Определяем выбранную схему повторений
  const [selectedSchemaIndex, setSelectedSchemaIndex] = useState(() => {
    const index = REPS_SCHEMAS.findIndex(
      schema => JSON.stringify(schema.value) === JSON.stringify(onboardingData.exerciseSettings.repsSchema)
    );
    return index !== -1 ? index : 1; // По умолчанию 3-2-1
  });

  // Обновление настроек упражнений
  const updateExerciseSetting = (key: keyof ExerciseSettings, value: any) => {
    const updated = { ...localExerciseSettings, [key]: value };
    setLocalExerciseSettings(updated);
    setExerciseSettings(updated);
  };

  // Обновление настроек ходьбы
  const updateWalkSetting = (key: keyof WalkSettings, value: number) => {
    const updated = { ...localWalkSettings, [key]: value };
    setLocalWalkSettings(updated);
    setWalkSettings(updated);
  };

  // Изменение схемы повторений
  const handleSchemaChange = (index: number) => {
    setSelectedSchemaIndex(index);
    updateExerciseSetting('repsSchema', REPS_SCHEMAS[index].value);
  };

  // Переключение чекбокса
  const toggleCustomize = () => {
    setCustomizeSettings(!customizeSettings);
  };

  const handleContinue = () => {
    navigation.navigate('NotificationSetup');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Ваша программа</Text>
          <Text style={styles.headerSubtitle}>
            Мы начнем с самых безопасных упражнений для стабилизации позвоночника, постепенно усложняя программу в зависимости от самочувствия.
          </Text>
        </View>

        {/* Контент */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Блок с упражнениями Большой Тройки */}
          {showExercises && (
            <View style={styles.bigThreeContainer}>
              <View style={styles.exercisesList}>
                <View style={styles.exerciseItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.exerciseName}>Модифицированное скручивание</Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.exerciseName}>Боковой мост</Text>
                </View>
                <View style={styles.exerciseItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.exerciseName}>Птица-собака</Text>
                </View>
              </View>
            </View>
          )}

          {/* Предупреждение для острой боли */}
          {!showExercises && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>
                {EXERCISE_PREVIEW_SCREEN.acuteWarning.title}
              </Text>
              <Text style={styles.warningMessage}>
                {EXERCISE_PREVIEW_SCREEN.acuteWarning.message}
              </Text>
            </View>
          )}

          {/* Рекомендации по уровню боли */}
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Рекомендации</Text>
            <Text style={styles.recommendationsText}>
              {PAIN_LEVEL_RECOMMENDATIONS[painLevel]}
            </Text>
          </View>

          {/* Рекомендуемая программа */}
          <View style={styles.programContainer}>
            {/* Упражнения "Большой Тройки" */}
            {showExercises && (
              <View style={styles.programCard}>
                <Text style={styles.programLabel}>Упражнения "Большой Тройки"</Text>
                <Text style={styles.programValue}>
                  {localExerciseSettings.repsSchema.length} подхода: {localExerciseSettings.repsSchema.map((reps, index) => 
                    index === localExerciseSettings.repsSchema.length - 1 
                      ? `${reps} повторени${reps === 1 ? 'е' : reps < 5 ? 'я' : 'й'}` 
                      : `${reps} повторени${reps === 1 ? 'е' : reps < 5 ? 'я' : 'й'} - отдых - `
                  ).join('')}
                </Text>
                <Text style={styles.programValue}>
                  время статического удержания: {localExerciseSettings.holdTime} сек
                </Text>
                <Text style={styles.programValue}>
                  отдых: {localExerciseSettings.restTime} сек
                </Text>
              </View>
            )}

            {/* Ходьба */}
            <View style={styles.programCard}>
              <Text style={styles.programLabel}>Ходьба</Text>
              <Text style={styles.programValue}>
                {formatWalkSettingsDescription(localWalkSettings)}
              </Text>
              {!showExercises && (
                <Text style={styles.programNote}>Если не вызывает боли</Text>
              )}
            </View>
          </View>

          {/* Объяснение пирамидки */}
          {showExercises && (
            <View style={styles.pyramidExplanation}>
              <Text style={styles.pyramidTitle}>
                📊 Почему мы делаем подходы «пирамидкой»?
              </Text>
              <Text style={styles.pyramidText}>
                Мы используем схему нисходящей пирамиды (например, 6-4-2 повторения). Это позволяет выработать выносливость, сохраняя идеальную технику и не допуская усталости, которая может привести к боли.
              </Text>
            </View>
          )}

          {/* Чекбокс "Изменить настройки" */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={toggleCustomize}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, customizeSettings && styles.checkboxChecked]}>
              {customizeSettings && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Изменить настройки программы
            </Text>
          </TouchableOpacity>

          {/* Редактируемые настройки (показываются только если чекбокс активен) */}
          {customizeSettings && (
            <>
              {showExercises && (
                <View style={styles.settingsContainer}>
                  <Text style={styles.sectionTitle}>Настройки упражнений</Text>
                  
                  {/* Время удержания */}
                  <View style={styles.settingCard}>
                    <Slider
                      label="Время удержания"
                      value={localExerciseSettings.holdTime}
                      min={3}
                      max={10}
                      step={1}
                      suffix=" сек"
                      onValueChange={(value) => updateExerciseSetting('holdTime', value)}
                    />
                  </View>

                  {/* Схема повторений */}
                  <View style={styles.settingCard}>
                    <Text style={styles.settingLabel}>Схема повторений</Text>
                    <View style={styles.schemaContainer}>
                      {REPS_SCHEMAS.map((schema, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.schemaButton,
                            selectedSchemaIndex === index && styles.schemaButtonSelected,
                          ]}
                          onPress={() => handleSchemaChange(index)}
                        >
                          <Text
                            style={[
                              styles.schemaButtonText,
                              selectedSchemaIndex === index && styles.schemaButtonTextSelected,
                            ]}
                          >
                            {schema.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Время отдыха */}
                  <View style={styles.settingCard}>
                    <Slider
                      label="Время отдыха между подходами"
                      value={localExerciseSettings.restTime}
                      min={5}
                      max={30}
                      step={5}
                      suffix=" сек"
                      onValueChange={(value) => updateExerciseSetting('restTime', value)}
                    />
                  </View>
                </View>
              )}

              {/* Настройки ходьбы */}
              <View style={styles.settingsContainer}>
                <Text style={styles.sectionTitle}>Настройки ходьбы</Text>
                
                {/* Длительность ходьбы */}
                <View style={styles.settingCard}>
                  <Slider
                    label="Длительность одной сессии"
                    value={localWalkSettings.duration}
                    min={1}
                    max={60}
                    step={5}
                    suffix=" мин"
                    onValueChange={(value) => updateWalkSetting('duration', value)}
                  />
                </View>

                {/* Количество сессий */}
                <View style={styles.settingCard}>
                  <Slider
                    label="Количество сессий в день"
                    value={localWalkSettings.sessions}
                    min={1}
                    max={5}
                    step={1}
                    suffix=""
                    onValueChange={(value) => updateWalkSetting('sessions', value)}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Кнопки навигации */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={EXERCISE_PREVIEW_SCREEN.backButton}
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
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  warningContainer: {
    backgroundColor: COLORS.PAIN_ACUTE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  warningMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  recommendationsContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.TEXT_PRIMARY,
    whiteSpace: 'pre-line',
  },
  // Блок "Большая тройка"
  bigThreeContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exercisesList: {
    marginBottom: 0,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 20,
    color: COLORS.CTA_BUTTON,
    marginRight: 12,
    fontWeight: 'bold',
  },
  exerciseName: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  pyramidExplanation: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  pyramidTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  pyramidText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.9,
  },
  // Рекомендуемая программа
  programContainer: {
    marginBottom: 20,
  },
  programCard: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.CTA_BUTTON,
  },
  programLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  programValue: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.9,
  },
  programNote: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Чекбокс
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.TEXT_INACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.CTA_BUTTON,
    borderColor: COLORS.CTA_BUTTON,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  // Редактируемые настройки
  settingsContainer: {
    marginBottom: 20,
  },
  settingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  // Slider стили
  sliderContainer: {
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.CTA_BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT_INACTIVE,
    opacity: 0.5,
  },
  sliderButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    minWidth: 80,
    textAlign: 'center',
  },
  // Схема повторений
  schemaContainer: {
    gap: 8,
  },
  schemaButton: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  schemaButtonSelected: {
    backgroundColor: COLORS.CTA_BUTTON,
    borderColor: COLORS.TEXT_PRIMARY,
  },
  schemaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  schemaButtonTextSelected: {
    fontWeight: '600',
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
});

export default ExercisePreviewScreen;
