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
import { UserSettings } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useUserSettings } from '../hooks/useUserSettings';

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

const REPS_SCHEMAS = [
  { label: 'Пирамида (3-2-1)', description: 'Рекомендуемая схема для новичков.', value: [3, 2, 1] },
  { label: 'Пирамида (4-3-2)', description: 'Для тех, кто уже освоил базовый уровень.', value: [4, 3, 2] },
  { label: 'Пирамида (5-3-2)', description: 'Для тех, кто уже освоил базовый уровень.', value: [5, 3, 2] },
  { label: 'Пирамида (6-4-2)', description: 'Для опытных пользователей с хорошей выносливостью.', value: [6, 4, 2] },
];

const SettingsScreen: React.FC = () => {
  const { settings, loading, saveSettings } = useUserSettings();
  
  const [localSettings, setLocalSettings] = useState<UserSettings>({
    exerciseSettings: {
      holdTime: 7,
      repsSchema: [3, 2, 1],
      restTime: 15,
    },
    walkSettings: {
      duration: 5,
      sessions: 3,
    },
  });

  const [selectedSchemaType, setSelectedSchemaType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customSchema, setCustomSchema] = useState([3, 2, 1]);

  // Обновляем локальные настройки когда получаем данные из хука
  useEffect(() => {
    if (settings) {
      console.log('Settings loaded in SettingsScreen:', settings);
      setLocalSettings(settings);
      
      // Определяем тип схемы
      const matchingPreset = REPS_SCHEMAS.findIndex(
        schema => JSON.stringify(schema.value) === JSON.stringify(settings.exerciseSettings.repsSchema)
      );
      
      if (matchingPreset !== -1) {
        setSelectedSchemaType('preset');
        setSelectedPresetIndex(matchingPreset);
      } else {
        setSelectedSchemaType('custom');
        setCustomSchema(settings.exerciseSettings.repsSchema);
      }
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      const updatedSettings = {
        ...localSettings,
        exerciseSettings: {
          ...localSettings.exerciseSettings,
          repsSchema: selectedSchemaType === 'preset' 
            ? REPS_SCHEMAS[selectedPresetIndex].value 
            : customSchema,
        },
      };
      
      console.log('Saving updated settings:', updatedSettings);
      await saveSettings(updatedSettings);
      
      Alert.alert('Успешно', 'Настройки сохранены! План упражнений обновлен.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  const updateCustomSchemaSet = (index: number, value: string) => {
    const newSchema = [...customSchema];
    const numValue = parseInt(value, 10) || 0;
    newSchema[index] = Math.min(Math.max(numValue, 0), 30);
    setCustomSchema(newSchema);
  };

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка настроек...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Настройки упражнений "Большой тройки" */}
        <View style={styles.section}>
          <Slider
            label="Время удержания"
            value={localSettings.exerciseSettings.holdTime}
            min={3}
            max={10}
            suffix=" сек"
            recommendation="Для начала рекомендуется 7 секунд, так как это оптимальное время для тренировки выносливости."
            onValueChange={(value) =>
              setLocalSettings({
                ...localSettings,
                exerciseSettings: { ...localSettings.exerciseSettings, holdTime: value },
              })
            }
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
            value={localSettings.exerciseSettings.restTime}
            min={5}
            max={30}
            suffix=" сек"
            recommendation="Короткие паузы (10-15 секунд) являются ключом к развитию выносливости."
            onValueChange={(value) =>
              setLocalSettings({
                ...localSettings,
                exerciseSettings: { ...localSettings.exerciseSettings, restTime: value },
              })
            }
          />
        </View>

        {/* Настройки ходьбы */}
        <View style={styles.section}>
          <Slider
            label="Длительность сессии"
            value={localSettings.walkSettings.duration}
            min={1}
            max={60}
            suffix=" мин"
            recommendation="Начинайте с 5-10 минут. Постепенно увеличивайте время, но только если ходьба не вызывает боль."
            onValueChange={(value) =>
              setLocalSettings({
                ...localSettings,
                walkSettings: { ...localSettings.walkSettings, duration: value },
              })
            }
          />

          <Slider
            label="Количество сессий"
            value={localSettings.walkSettings.sessions}
            min={1}
            max={5}
            recommendation="Начинать с 3 коротких сессий в день. Несколько коротких прогулок эффективнее, чем одна длительная, для питания межпозвонковых дисков."
            onValueChange={(value) =>
              setLocalSettings({
                ...localSettings,
                walkSettings: { ...localSettings.walkSettings, sessions: value },
              })
            }
          />
        </View>

        {/* Кнопка сохранения */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Text style={styles.saveButtonText}>Сохранить Настройки</Text>
        </TouchableOpacity>

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
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
    marginBottom: 20,
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
  saveButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
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

export default SettingsScreen;
