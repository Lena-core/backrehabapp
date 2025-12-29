import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, ProgramExercise, ExtendedExerciseSettings, RehabProgram, UserProgress } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import RehabProgramLoader from '../utils/rehabProgramLoader';
import UserProgressManager from '../utils/userProgressManager';
import { getExerciseById } from '../constants/exercises/exercisesData';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProgramExerciseSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [rehabProgram, setRehabProgram] = useState<RehabProgram | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingExercise, setEditingExercise] = useState<ProgramExercise | null>(null);
  const [editingSettings, setEditingSettings] = useState<ExtendedExerciseSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const progress = await UserProgressManager.getProgress();
      setUserProgress(progress);
      
      if (progress) {
        const program = await RehabProgramLoader.getProgramById(progress.currentProgramId);
        setRehabProgram(program);
        
        if (program) {
          setExercises(program.exercises.filter(e => e.isEnabled));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExercise = async (exercise: ProgramExercise) => {
    if (!rehabProgram) return;
    
    // Получаем текущие настройки с учетом weekly progression и manual overrides
    const currentSettings = await UserProgressManager.getExerciseSettings(
      rehabProgram,
      exercise.exerciseId
    );
    
    setEditingExercise(exercise);
    setEditingSettings(currentSettings);
  };

  const handleSaveSettings = async () => {
    if (!editingExercise || !editingSettings) return;
    
    try {
      setSaving(true);
      
      // Сохраняем как manual override (отключает auto-progression для этого упражнения)
      await UserProgressManager.setManualOverride(
        editingExercise.exerciseId,
        editingSettings
      );
      
      Alert.alert('Успешно', 'Настройки сохранены. Auto-progression отключен для этого упражнения.');
      
      setEditingExercise(null);
      setEditingSettings(null);
      await loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleClearManualOverride = async (exerciseId: string) => {
    try {
      await UserProgressManager.clearManualOverride(exerciseId);
      Alert.alert('Успешно', 'Ручные настройки сброшены. Auto-progression включен.');
      await loadData();
    } catch (error) {
      console.error('Error clearing override:', error);
      Alert.alert('Ошибка', 'Не удалось сбросить настройки');
    }
  };

  const handleRollbackWeek = async () => {
    Alert.alert(
      'Откат на неделю назад',
      'Вы уверены? Настройки всех упражнений вернутся к предыдущей неделе.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Откатить',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserProgressManager.rollbackWeeks(1);
              Alert.alert('Успешно', 'Откат выполнен');
              await loadData();
            } catch (error) {
              console.error('Error rolling back:', error);
              Alert.alert('Ошибка', 'Не удалось выполнить откат');
            }
          },
        },
      ]
    );
  };

  const handleResetToWeek1 = async () => {
    Alert.alert(
      'Сброс до начала программы',
      'Вы уверены? Все настройки вернутся к неделе 1.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            if (!userProgress) return;
            
            try {
              await UserProgressManager.rollbackWeeks(userProgress.currentWeek - 1);
              Alert.alert('Успешно', 'Настройки сброшены до недели 1');
              await loadData();
            } catch (error) {
              console.error('Error resetting:', error);
              Alert.alert('Ошибка', 'Не удалось сбросить настройки');
            }
          },
        },
      ]
    );
  };

  const getExecutionTypeLabel = (exercise: ProgramExercise): string => {
    const exerciseInfo = getExerciseById(exercise.exerciseId);
    if (!exerciseInfo) return 'unknown';
    
    const typeLabels: Record<string, string> = {
      hold: 'Удержание',
      reps: 'Повторения',
      dynamic: 'Динамика',
      foam_rolling: 'Прокатка',
      walk: 'Ходьба',
    };
    
    return typeLabels[exerciseInfo.executionType] || exerciseInfo.executionType;
  };

  const getSettingsSummary = (settings: ExtendedExerciseSettings, exerciseId: string): string => {
    const exerciseInfo = getExerciseById(exerciseId);
    if (!exerciseInfo) return '';
    
    switch (exerciseInfo.executionType) {
      case 'hold':
      case 'reps':
        return `${settings.holdTime}с × ${settings.repsSchema.join('-')}, отдых ${settings.restTime}с`;
      case 'dynamic':
        return `${settings.dynamicReps} повт. × ${settings.dynamicSets} подх., отдых ${settings.restTime}с`;
      case 'foam_rolling':
        return `${settings.rollingDuration}с × ${settings.rollingSessions} сессии, отдых ${settings.restTime}с`;
      case 'walk':
        return `${settings.walkDuration} мин × ${settings.walkSessions} сессии`;
      default:
        return '';
    }
  };

  const isManualOverride = (exerciseId: string): boolean => {
    return userProgress?.manualOverrides[exerciseId] !== undefined;
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
        <Text style={styles.headerTitle}>Настройки упражнений</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Информация о программе */}
        {rehabProgram && userProgress && (
          <View style={styles.programInfo}>
            <View style={styles.programHeader}>
              <Text style={styles.programIcon}>{rehabProgram.icon}</Text>
              <Text style={styles.programName}>{rehabProgram.nameRu}</Text>
            </View>
            <Text style={styles.programPhase}>
              Неделя {userProgress.currentWeek} из {UserProgressManager.getTotalWeeks(rehabProgram)} • День {userProgress.daysCompleted}
            </Text>
          </View>
        )}

        {/* История прогрессии */}
        {rehabProgram && userProgress && userProgress.progressionHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>История прогрессии</Text>
            
            {userProgress.progressionHistory.slice(-5).reverse().map((entry, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={[
                    styles.historyStatus,
                    entry.accepted ? styles.acceptedStatus : styles.declinedStatus
                  ]}>
                    {entry.accepted ? '✓ Принято' : '✗ Отклонено'}
                  </Text>
                </View>
                <Text style={styles.historyWeek}>Неделя {entry.week}</Text>
                {entry.newSettings && (
                  <Text style={styles.historySettings}>
                    {entry.newSettings.repsSchema.join('-')}, {entry.newSettings.holdTime}с, отдых {entry.newSettings.restTime}с
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Текущая неделя */}
        {rehabProgram && userProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Настройки текущей недели</Text>
            
            <View style={styles.currentWeekCard}>
              <Text style={styles.currentWeekLabel}>
                Неделя {userProgress.currentWeek}
              </Text>
              <Text style={styles.currentWeekSettings}>
                Подходы: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).repsSchema.join('-')}
              </Text>
              <Text style={styles.currentWeekSettings}>
                Удержание: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).holdTime}с
              </Text>
              <Text style={styles.currentWeekSettings}>
                Отдых: {UserProgressManager.getCurrentWeekSettings(rehabProgram, userProgress.currentWeek).restTime}с
              </Text>
            </View>
          </View>
        )}

        {/* Действия с неделями */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Чувствуете дискомфорт?</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRollbackWeek}
            disabled={!userProgress || userProgress.currentWeek <= 1}
          >
            <Text style={styles.actionButtonText}>⬅️ Откатиться на неделю назад</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleResetToWeek1}
            disabled={!userProgress || userProgress.currentWeek <= 1}
          >
            <Text style={styles.actionButtonText}>🔄 Сбросить до начала программы</Text>
          </TouchableOpacity>
        </View>

        {/* Упражнения */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Упражнения</Text>
          
          {exercises.map((exercise) => {
            const exerciseInfo = getExerciseById(exercise.exerciseId);
            const hasManualOverride = isManualOverride(exercise.exerciseId);
            
            return (
              <View key={exercise.exerciseId} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>
                    {exerciseInfo?.nameRu || exercise.exerciseId}
                  </Text>
                  {hasManualOverride && (
                    <View style={styles.manualBadge}>
                      <Text style={styles.manualBadgeText}>⚠️ Ручные</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.exerciseType}>
                  {getExecutionTypeLabel(exercise)}
                </Text>
                
                <Text style={styles.exerciseSettings}>
                  {getSettingsSummary(exercise.settings, exercise.exerciseId)}
                </Text>
                
                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditExercise(exercise)}
                  >
                    <Text style={styles.editButtonText}>Настроить вручную</Text>
                  </TouchableOpacity>
                  
                  {hasManualOverride && (
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => handleClearManualOverride(exercise.exerciseId)}
                    >
                      <Text style={styles.resetButtonText}>Вернуть auto</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal для редактирования */}
      <Modal
        visible={editingExercise !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Настройки упражнения</Text>
            
            {editingExercise && (
              <Text style={styles.modalExerciseName}>
                {getExerciseById(editingExercise.exerciseId)?.nameRu || editingExercise.exerciseId}
              </Text>
            )}
            
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                💡 После изменения auto-progression будет отключен для этого упражнения
              </Text>
            </View>
            
            {editingSettings && editingExercise && (
              <View style={styles.settingsEditor}>
                {/* Здесь можно добавить интерфейс редактирования, пока просто показываем текущие */}
                <Text style={styles.settingsLabel}>Текущие настройки:</Text>
                <Text style={styles.settingsValue}>
                  {getSettingsSummary(editingSettings, editingExercise.exerciseId)}
                </Text>
                
                <Text style={styles.settingsHint}>
                  (Полный редактор настроек будет добавлен позже)
                </Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingExercise(null)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSettings}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Text>
              </TouchableOpacity>
            </View>
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
  scrollView: {
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
  programInfo: {
    margin: 20,
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  programIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  programPhase: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  historyStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  acceptedStatus: {
    color: '#4caf50',
  },
  declinedStatus: {
    color: '#f44336',
  },
  historyWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  historySettings: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
  },
  currentWeekCard: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
  },
  currentWeekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  currentWeekSettings: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  exerciseCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  manualBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  manualBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f57c00',
  },
  exerciseType: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: 6,
  },
  exerciseSettings: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.CTA_BUTTON,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  resetButton: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
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
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  modalExerciseName: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: '#f57c00',
    lineHeight: 18,
  },
  settingsEditor: {
    marginBottom: 20,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  settingsValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  settingsHint: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.6,
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
  cancelButton: {
    backgroundColor: COLORS.SCALE_COLOR,
  },
  saveButton: {
    backgroundColor: COLORS.CTA_BUTTON,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default ProgramExerciseSettingsScreen;
