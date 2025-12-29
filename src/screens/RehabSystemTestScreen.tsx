import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/colors';
import { RehabProgram, UserProgress, WeeklyProgression } from '../types';
import RehabProgramLoader from '../utils/rehabProgramLoader';
import UserProgressManager from '../utils/userProgressManager';

const RehabSystemTestScreen: React.FC = () => {
  const [programs, setPrograms] = useState<RehabProgram[]>([]);
  const [currentProgram, setCurrentProgram] = useState<RehabProgram | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentWeekSettings, setCurrentWeekSettings] = useState<WeeklyProgression | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Инициализация программ
      await RehabProgramLoader.initializePrograms();
      
      // Загрузка всех программ
      const allPrograms = await RehabProgramLoader.getAllPrograms();
      setPrograms(allPrograms);
      
      // Загрузка прогресса
      let userProgress = await UserProgressManager.getProgress();
      
      if (!userProgress) {
        // Если прогресса нет, инициализируем с первой программой
        userProgress = await UserProgressManager.initializeProgress(allPrograms[0].id);
      }
      
      setProgress(userProgress);
      
      // Загрузка текущей программы
      const program = await RehabProgramLoader.getProgramById(userProgress.currentProgramId);
      setCurrentProgram(program);
      
      if (program) {
        // Получаем настройки текущей недели
        const weekSettings = UserProgressManager.getCurrentWeekSettings(program, userProgress.currentWeek);
        setCurrentWeekSettings(weekSettings);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDayCompleted = async () => {
    await UserProgressManager.markDayCompleted();
    await loadData();
    
    // Проверяем, нужно ли показать подсказку о popup
    const shouldShow = await UserProgressManager.shouldShowProgressionPopup();
    
    if (shouldShow) {
      Alert.alert(
        'День выполнен!',
        '🎉 Вы завершили неделю! Вернитесь на главный экран ("План на день") чтобы увидеть popup прогрессии!'
      );
    } else {
      Alert.alert('Успешно', 'День отмечен как выполненный!');
    }
  };

  const handleAcceptProgression = async () => {
    if (!currentProgram || !progress) return;
    
    const nextWeek = progress.currentWeek + 1;
    await UserProgressManager.acceptProgression(currentProgram, nextWeek);
    await loadData();
    Alert.alert('Прогрессия', `Переход на неделю ${nextWeek}!`);
  };

  const handleSwitchProgram = async (programId: string) => {
    await UserProgressManager.switchProgram(programId);
    await loadData();
    Alert.alert('Программа изменена', 'Прогресс сброшен');
  };

  const handleRollback = async () => {
    await UserProgressManager.rollbackWeeks(1);
    await loadData();
    Alert.alert('Откат', 'Откат на 1 неделю назад');
  };

  const handleReset = async () => {
    if (!programs[0]) return;
    await UserProgressManager.switchProgram(programs[0].id);
    await loadData();
    Alert.alert('Сброс', 'Прогресс полностью сброшен');
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
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Тест Системы Реабилитации</Text>

        {/* Текущая программа */}
        {currentProgram && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Текущая программа</Text>
            <View style={styles.card}>
              <Text style={styles.programIcon}>{currentProgram.icon}</Text>
              <Text style={styles.programName}>{currentProgram.nameRu}</Text>
              <Text style={styles.programPhase}>Фаза: {currentProgram.phase}</Text>
              <Text style={styles.programDuration}>
                Длительность: {currentProgram.durationDays === -1 ? 'Unlimited' : `${currentProgram.durationDays} дней`}
              </Text>
            </View>
          </View>
        )}

        {/* Прогресс */}
        {progress && currentProgram && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Прогресс</Text>
            <View style={styles.card}>
              <Text style={styles.progressText}>День: {progress.daysCompleted}</Text>
              <Text style={styles.progressText}>Неделя: {progress.currentWeek}</Text>
              <Text style={styles.progressText}>Streak: {progress.currentStreak} дней</Text>
              <Text style={styles.progressText}>
                Прогресс: {UserProgressManager.getProgramProgress(currentProgram, progress.daysCompleted)}%
              </Text>
              {currentProgram.durationDays !== -1 && (
                <Text style={styles.progressText}>
                  Осталось: {UserProgressManager.getDaysRemaining(currentProgram, progress.daysCompleted)} дней
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Текущие настройки недели */}
        {currentWeekSettings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Настройки текущей недели</Text>
            <View style={styles.card}>
              <Text style={styles.settingsText}>Схема: {currentWeekSettings.repsSchema.join('-')}</Text>
              {currentWeekSettings.holdTime && (
                <Text style={styles.settingsText}>Удержание: {currentWeekSettings.holdTime}с</Text>
              )}
              {currentWeekSettings.restTime && (
                <Text style={styles.settingsText}>Отдых: {currentWeekSettings.restTime}с</Text>
              )}
            </View>
          </View>
        )}

        {/* Действия */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Действия</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleMarkDayCompleted}>
            <Text style={styles.buttonText}>✓ Отметить день выполненным</Text>
          </TouchableOpacity>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Чтобы увидеть popup прогрессии: отметьте 7 дней подряд, затем вернитесь на главный экран ("План на день")
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAcceptProgression}>
            <Text style={styles.buttonText}>⬆️ Перейти на следующую неделю (без popup)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleRollback}>
            <Text style={styles.buttonText}>⬅️ Откат на неделю назад</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleReset}>
            <Text style={styles.buttonText}>🔄 Сбросить прогресс</Text>
          </TouchableOpacity>
        </View>

        {/* Список программ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Доступные программы</Text>
          {programs.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={[
                styles.programCard,
                progress?.currentProgramId === program.id && styles.activeProgram
              ]}
              onPress={() => handleSwitchProgram(program.id)}
            >
              <Text style={styles.programCardIcon}>{program.icon}</Text>
              <View style={styles.programCardContent}>
                <Text style={styles.programCardName}>{program.nameRu}</Text>
                <Text style={styles.programCardPhase}>{program.phase}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* История прогрессии */}
        {progress && progress.progressionHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>История прогрессии</Text>
            {progress.progressionHistory.slice(-5).reverse().map((entry, index) => (
              <View key={index} style={styles.historyCard}>
                <Text style={styles.historyText}>
                  {entry.date}: Неделя {entry.week} - {entry.accepted ? '✓ Принято' : '✗ Отклонено'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  programPhase: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 2,
  },
  programDuration: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  settingsText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  button: {
    backgroundColor: COLORS.CTA_BUTTON,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  programCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeProgram: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderWidth: 2,
    borderColor: COLORS.CTA_BUTTON,
  },
  programCardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  programCardContent: {
    flex: 1,
  },
  programCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  programCardPhase: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  historyCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  infoBox: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18,
  },
});

export default RehabSystemTestScreen;
