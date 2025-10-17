import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { DayHistory, PainLevel } from '../types';
import { getPainLevelColor, savePainStatus, updateDayPainLevel } from '../utils/storage';
import { PAIN_ICONS } from '../assets/icons';

interface DayActivityCardProps {
  dayHistory: DayHistory | null;
  loading: boolean;
  onPainLevelChange?: () => void; // Колбэк для обновления данных
}

const PAIN_LEVEL_LABELS: Record<PainLevel, string> = {
  none: 'Все хорошо',
  mild: 'Немного болит',
  moderate: 'Болит',
  severe: 'Сильно болит',
  acute: 'Острая боль',
};

const EXERCISE_NAMES: Record<string, string> = {
  curl_up: 'Скручивания',
  side_plank: 'Боковая планка',
  bird_dog: 'Птица-собака',
  walk: 'Прогулка',
};

const DayActivityCard: React.FC<DayActivityCardProps> = ({ dayHistory, loading, onPainLevelChange }) => {
  const [showPainModal, setShowPainModal] = React.useState(false);
  const [selectedPainLevel, setSelectedPainLevel] = React.useState<PainLevel | null>(null);
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!dayHistory || (dayHistory.painLevel === null && dayHistory.exercises.length === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.noActivityText}>Нет активности за этот день</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('ru-RU', { month: 'long' });
    return `${day} ${month}`;
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Группировка упражнений по типу
  const groupedExercises = dayHistory.exercises.reduce((acc, exercise) => {
    const key = exercise.exerciseId;
    if (!acc[key]) {
      acc[key] = {
        exerciseId: exercise.exerciseId,
        exerciseName: EXERCISE_NAMES[exercise.exerciseId] || exercise.exerciseName,
        totalSets: 0,
        lastCompletedAt: exercise.completedAt,
        holdTime: exercise.holdTime,
        repsSchema: exercise.repsSchema,
        restTime: exercise.restTime,
      };
    }
    acc[key].totalSets += exercise.totalSets;
    // Обновляем время последнего выполнения
    if (new Date(exercise.completedAt) > new Date(acc[key].lastCompletedAt)) {
      acc[key].lastCompletedAt = exercise.completedAt;
    }
    return acc;
  }, {} as Record<string, {
    exerciseId: string;
    exerciseName: string;
    totalSets: number;
    lastCompletedAt: string;
    holdTime: number;
    repsSchema: number[];
    restTime: number;
  }>);

  const groupedExercisesArray = Object.values(groupedExercises);

  const getPainIcon = (level: PainLevel) => {
    switch (level) {
      case 'none':
        return PAIN_ICONS.none;
      case 'mild':
        return PAIN_ICONS.mild;
      case 'moderate':
        return PAIN_ICONS.moderate;
      case 'severe':
        return PAIN_ICONS.severe;
      case 'acute':
        return PAIN_ICONS.acute;
      default:
        return PAIN_ICONS.none;
    }
  };

  const handlePainLevelPress = () => {
    if (dayHistory?.painLevel) {
      setSelectedPainLevel(dayHistory.painLevel);
    }
    setShowPainModal(true);
  };

  const handlePainLevelSelect = async (level: PainLevel) => {
    if (!dayHistory) return;

    try {
      // Обновляем уровень боли в истории
      await updateDayPainLevel(dayHistory.date, level);
      
      // Если это сегодня, обновляем также текущий статус
      const today = new Date().toISOString().split('T')[0];
      if (dayHistory.date === today) {
        await savePainStatus(level);
      }
      
      setShowPainModal(false);
      
      // Вызываем колбэк для обновления данных
      if (onPainLevelChange) {
        onPainLevelChange();
      }
    } catch (error) {
      console.error('Error updating pain level:', error);
    }
  };

  const renderPainModal = () => {
    const painOptions: { level: PainLevel; label: string }[] = [
      { level: 'none', label: 'Всё хорошо' },
      { level: 'mild', label: 'Немного болит' },
      { level: 'moderate', label: 'Болит' },
      { level: 'severe', label: 'Сильно болит' },
      { level: 'acute', label: 'Острая боль' },
    ];

    return (
      <Modal
        visible={showPainModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPainModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Изменить уровень боли</Text>
            
            {painOptions.map((option) => (
              <TouchableOpacity
                key={option.level}
                style={[
                  styles.painOption,
                  { backgroundColor: getPainLevelColor(option.level) },
                  selectedPainLevel === option.level && styles.painOptionSelected,
                ]}
                onPress={() => handlePainLevelSelect(option.level)}
              >
                <Image 
                  source={getPainIcon(option.level)} 
                  style={styles.painOptionIcon}
                  resizeMode="contain"
                />
                <Text style={styles.painOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPainModal(false)}
            >
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Дата */}
      <Text style={styles.dateText}>{formatDate(dayHistory.date)}</Text>

      {/* Уровень боли */}
      {dayHistory.painLevel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уровень боли</Text>
          <TouchableOpacity
            style={[
              styles.painCard,
              { backgroundColor: getPainLevelColor(dayHistory.painLevel) }
            ]}
            onPress={handlePainLevelPress}
            activeOpacity={0.7}
          >
            <Image 
              source={getPainIcon(dayHistory.painLevel)} 
              style={styles.painIcon}
              resizeMode="contain"
            />
            <Text style={styles.painLabel}>
              {PAIN_LEVEL_LABELS[dayHistory.painLevel]}
            </Text>
            <Text style={styles.painEditHint}>Нажмите, чтобы изменить</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Выполненные упражнения */}
      {groupedExercisesArray.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Выполненные упражнения ({groupedExercisesArray.length})
          </Text>
          {groupedExercisesArray.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              {/* Название и время */}
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>
                  {exercise.exerciseName}
                </Text>
                <Text style={styles.exerciseTime}>
                  {formatTime(exercise.lastCompletedAt)}
                </Text>
              </View>

              {/* Параметры упражнения */}
              {exercise.exerciseId !== 'walk' && (
                <View style={styles.parametersContainer}>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Время удержания:</Text>
                    <Text style={styles.parameterValue}>{exercise.holdTime} сек</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Схема:</Text>
                    <Text style={styles.parameterValue}>
                      {exercise.repsSchema.join('-')}
                    </Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Отдых:</Text>
                    <Text style={styles.parameterValue}>{exercise.restTime} сек</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Подходов выполнено:</Text>
                    <Text style={styles.parameterValue}>{exercise.totalSets}</Text>
                  </View>
                </View>
              )}

              {/* Для прогулки */}
              {exercise.exerciseId === 'walk' && (
                <View style={styles.parametersContainer}>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Прогулка завершена</Text>
                    <Text style={styles.parameterValue}>✓</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    {renderPainModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_INACTIVE,
    textAlign: 'center',
    paddingVertical: 40,
  },
  noActivityText: {
    fontSize: 16,
    color: COLORS.TEXT_INACTIVE,
    textAlign: 'center',
    paddingVertical: 40,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  painCard: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  painIcon: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  painLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  exerciseCard: {
    backgroundColor: COLORS.CONTENT_BACKGROUND,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.SCALE_COLOR,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  exerciseTime: {
    fontSize: 14,
    color: COLORS.TEXT_INACTIVE,
  },
  parametersContainer: {
    marginTop: 5,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  parameterLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default DayActivityCard;
