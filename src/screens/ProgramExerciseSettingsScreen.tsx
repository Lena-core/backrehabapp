import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, TrainingProgram, ProgramExercise, ExtendedExerciseSettings } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { getActiveProgram, updateProgramExerciseSettings } from '../utils/programLoader';
import { getExerciseById } from '../constants/exercises/exercisesData';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProgramExerciseSettings'>;

const REPS_SCHEMAS = [
  { label: '3-2-1', value: [3, 2, 1] },
  { label: '4-3-2', value: [4, 3, 2] },
  { label: '5-3-2', value: [5, 3, 2] },
  { label: '6-4-2', value: [6, 4, 2] },
];

const ProgramExerciseSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<TrainingProgram | null>(null);
  const [editingExercise, setEditingExercise] = useState<ProgramExercise | null>(null);
  const [editingSettings, setEditingSettings] = useState<ExtendedExerciseSettings>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProgram();
    }, [])
  );

  const loadProgram = async () => {
    try {
      setLoading(true);
      const program = await getActiveProgram();
      setActiveProgram(program);
    } catch (error) {
      console.error('Error loading program:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить программу');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExercise = (exercise: ProgramExercise) => {
    setEditingExercise(exercise);
    setEditingSettings({ ...exercise.settings });
  };

  const handleSaveSettings = async () => {
    if (!editingExercise || !activeProgram) return;

    try {
      setSaving(true);
      await updateProgramExerciseSettings(
        activeProgram.id,
        editingExercise.exerciseId,
        editingSettings
      );
      
      // Обновляем локальное состояние
      const updatedProgram = {
        ...activeProgram,
        exercises: activeProgram.exercises.map(ex =>
          ex.exerciseId === editingExercise.exerciseId
            ? { ...ex, settings: editingSettings }
            : ex
        ),
      };
      setActiveProgram(updatedProgram);
      setEditingExercise(null);
      
      Alert.alert('Успешно', 'Настройки сохранены');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingsEditor = () => {
    if (!editingExercise) return null;

    const exerciseInfo = getExerciseById(editingExercise.exerciseId);
    if (!exerciseInfo) return null;

    const { executionType } = exerciseInfo;

    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{exerciseInfo.nameRu}</Text>
            <Text style={styles.modalSubtitle}>Тип: {executionType}</Text>

            <ScrollView style={styles.settingsScroll}>
              {/* Hold/Reps упражнения */}
              {(executionType === 'hold' || executionType === 'reps') && (
                <>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Время удержания (сек)</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          holdTime: Math.max(3, (editingSettings.holdTime || 7) - 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.holdTime || 7}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          holdTime: Math.min(30, (editingSettings.holdTime || 7) + 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Схема повторений</Text>
                    {REPS_SCHEMAS.map((schema, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.schemaOption,
                          JSON.stringify(editingSettings.repsSchema) === JSON.stringify(schema.value) &&
                            styles.selectedSchemaOption,
                        ]}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          repsSchema: schema.value,
                        })}
                      >
                        <Text style={styles.schemaLabel}>{schema.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Отдых между подходами (сек)</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          restTime: Math.max(5, (editingSettings.restTime || 15) - 5),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.restTime || 15}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          restTime: Math.min(60, (editingSettings.restTime || 15) + 5),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Walk упражнения */}
              {executionType === 'walk' && (
                <>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Длительность (мин)</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          walkDuration: Math.max(1, (editingSettings.walkDuration || 5) - 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.walkDuration || 5}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          walkDuration: Math.min(60, (editingSettings.walkDuration || 5) + 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Количество сессий</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          walkSessions: Math.max(1, (editingSettings.walkSessions || 1) - 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.walkSessions || 1}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          walkSessions: Math.min(5, (editingSettings.walkSessions || 1) + 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Foam Rolling упражнения */}
              {executionType === 'foam_rolling' && (
                <>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Длительность прокатки (сек)</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          rollingDuration: Math.max(30, (editingSettings.rollingDuration || 60) - 10),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.rollingDuration || 60}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          rollingDuration: Math.min(180, (editingSettings.rollingDuration || 60) + 10),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Количество сессий</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          rollingSessions: Math.max(1, (editingSettings.rollingSessions || 1) - 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.rollingSessions || 1}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          rollingSessions: Math.min(3, (editingSettings.rollingSessions || 1) + 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Dynamic упражнения */}
              {executionType === 'dynamic' && (
                <>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Количество повторений</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          dynamicReps: Math.max(5, (editingSettings.dynamicReps || 10) - 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.dynamicReps || 10}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          dynamicReps: Math.min(30, (editingSettings.dynamicReps || 10) + 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Количество подходов</Text>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          dynamicSets: Math.max(1, (editingSettings.dynamicSets || 2) - 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{editingSettings.dynamicSets || 2}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEditingSettings({
                          ...editingSettings,
                          dynamicSets: Math.min(5, (editingSettings.dynamicSets || 2) + 1),
                        })}
                      >
                        <Text style={styles.counterButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingExercise(null)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSettings}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY_ACCENT} />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!activeProgram) {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Программа не найдена</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Настройки упражнений</Text>
        <Text style={styles.programName}>📋 {activeProgram.nameRu}</Text>

        <View style={styles.exercisesContainer}>
          {activeProgram.exercises
            .filter(ex => ex.isEnabled)
            .map((exercise) => {
              const exerciseInfo = getExerciseById(exercise.exerciseId);
              if (!exerciseInfo) return null;

              const { settings } = exercise;
              let settingsText = '';

              switch (exerciseInfo.executionType) {
                case 'hold':
                case 'reps':
                  settingsText = `${settings.holdTime || 7}с × ${settings.repsSchema?.join('-') || '3-2-1'}, отдых ${settings.restTime || 15}с`;
                  break;
                case 'walk':
                  settingsText = `${settings.walkDuration || 5} мин × ${settings.walkSessions || 1} сессия`;
                  break;
                case 'foam_rolling':
                  settingsText = `${settings.rollingDuration || 60}с × ${settings.rollingSessions || 1} сессия`;
                  break;
                case 'dynamic':
                  settingsText = `${settings.dynamicReps || 10} повторений × ${settings.dynamicSets || 2} подхода`;
                  break;
              }

              return (
                <TouchableOpacity
                  key={exercise.exerciseId}
                  style={styles.exerciseCard}
                  onPress={() => handleEditExercise(exercise)}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exerciseInfo.nameRu}</Text>
                    <Text style={styles.exerciseType}>{exerciseInfo.executionType}</Text>
                  </View>
                  <Text style={styles.exerciseSettings}>{settingsText}</Text>
                  <View style={styles.editIcon}>
                    <Text style={styles.editIconText}>✏️</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        <Text style={styles.infoText}>
          💡 Изменения настроек применяются только к текущей программе
        </Text>
      </ScrollView>

      {renderSettingsEditor()}
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  programName: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  exercisesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseCard: {
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  exerciseType: {
    fontSize: 11,
    color: COLORS.PRIMARY_ACCENT,
    backgroundColor: COLORS.SCALE_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  exerciseSettings: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: 4,
  },
  editIcon: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  editIconText: {
    fontSize: 20,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    opacity: 0.7,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.6,
    marginBottom: 20,
  },
  settingsScroll: {
    maxHeight: 400,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: 30,
    minWidth: 60,
    textAlign: 'center',
  },
  schemaOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SCALE_COLOR,
    marginBottom: 8,
  },
  selectedSchemaOption: {
    borderColor: COLORS.PRIMARY_ACCENT,
    backgroundColor: COLORS.SCALE_COLOR,
  },
  schemaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.SCALE_COLOR,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    backgroundColor: COLORS.CTA_BUTTON,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default ProgramExerciseSettingsScreen;
