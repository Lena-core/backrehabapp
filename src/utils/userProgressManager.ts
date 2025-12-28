import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, RehabProgram, WeeklyProgression, ExtendedExerciseSettings } from '../types';

const USER_PROGRESS_KEY = '@user_progress';

/**
 * Менеджер для работы с прогрессом пользователя в программе реабилитации
 */
export class UserProgressManager {
  
  /**
   * Получить прогресс пользователя
   */
  static async getProgress(): Promise<UserProgress | null> {
    try {
      const stored = await AsyncStorage.getItem(USER_PROGRESS_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('[UserProgressManager] Error loading progress:', error);
      return null;
    }
  }

  /**
   * Сохранить прогресс пользователя
   */
  static async saveProgress(progress: UserProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(progress));
      console.log('[UserProgressManager] Progress saved:', progress);
    } catch (error) {
      console.error('[UserProgressManager] Error saving progress:', error);
      throw error;
    }
  }

  /**
   * Инициализировать прогресс для новой программы
   */
  static async initializeProgress(programId: string): Promise<UserProgress> {
    const progress: UserProgress = {
      currentProgramId: programId,
      programStartDate: new Date().toISOString(),
      daysCompleted: 0,
      currentWeek: 1,
      manualOverrides: {},
      progressionHistory: [],
      missedDays: [],
      currentStreak: 0,
      longestStreak: 0,
    };
    
    await this.saveProgress(progress);
    console.log('[UserProgressManager] Progress initialized for program:', programId);
    return progress;
  }

  /**
   * Отметить день как выполненный
   */
  static async markDayCompleted(date?: string): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) {
      console.warn('[UserProgressManager] No progress found');
      return;
    }

    const today = date || new Date().toISOString().split('T')[0];
    
    // Увеличиваем счетчик дней
    progress.daysCompleted += 1;
    
    // Обновляем streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (progress.missedDays.includes(yesterdayStr)) {
      // Streak прервался
      progress.currentStreak = 1;
    } else {
      // Продолжаем streak
      progress.currentStreak += 1;
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak;
      }
    }
    
    // Убираем сегодняшний день из пропущенных (если был)
    progress.missedDays = progress.missedDays.filter(d => d !== today);
    
    // Вычисляем текущую неделю
    const daysSinceStart = progress.daysCompleted;
    progress.currentWeek = Math.ceil(daysSinceStart / 7);
    
    await this.saveProgress(progress);
    console.log(`[UserProgressManager] Day ${progress.daysCompleted} completed, week ${progress.currentWeek}, streak ${progress.currentStreak}`);
  }

  /**
   * Отметить день как пропущенный
   */
  static async markDayMissed(date?: string): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;

    const today = date || new Date().toISOString().split('T')[0];
    
    if (!progress.missedDays.includes(today)) {
      progress.missedDays.push(today);
      progress.currentStreak = 0; // Обнуляем streak
      await this.saveProgress(progress);
      console.log(`[UserProgressManager] Day ${today} marked as missed`);
    }
  }

  /**
   * Получить настройки для текущей недели программы
   */
  static getCurrentWeekSettings(
    program: RehabProgram,
    currentWeek: number
  ): WeeklyProgression {
    // Находим настройки для текущей недели
    const weekSettings = program.weeklyProgression.find(p => p.week === currentWeek);
    
    if (weekSettings) {
      return weekSettings;
    }
    
    // Если для текущей недели нет настроек, берем последние доступные
    const lastWeek = program.weeklyProgression[program.weeklyProgression.length - 1];
    return lastWeek || program.weeklyProgression[0];
  }

  /**
   * Получить настройки для упражнения с учетом weekly progression и manual overrides
   */
  static async getExerciseSettings(
    program: RehabProgram,
    exerciseId: string
  ): Promise<ExtendedExerciseSettings> {
    const progress = await this.getProgress();
    
    // Проверяем ручные изменения
    if (progress?.manualOverrides[exerciseId]) {
      console.log(`[UserProgressManager] Using manual override for ${exerciseId}`);
      return progress.manualOverrides[exerciseId];
    }
    
    // Получаем базовые настройки упражнения из программы
    const exerciseInProgram = program.exercises.find(e => e.exerciseId === exerciseId);
    if (!exerciseInProgram) {
      throw new Error(`Exercise ${exerciseId} not found in program ${program.id}`);
    }
    
    const baseSettings = exerciseInProgram.settings;
    
    // Если нет прогресса или weekly progression пустой, возвращаем базовые настройки
    if (!progress || program.weeklyProgression.length === 0) {
      return baseSettings;
    }
    
    // Получаем настройки для текущей недели
    const weekSettings = this.getCurrentWeekSettings(program, progress.currentWeek);
    
    // Объединяем базовые настройки с weekly progression
    const mergedSettings: ExtendedExerciseSettings = {
      ...baseSettings,
      ...(weekSettings.holdTime !== undefined && { holdTime: weekSettings.holdTime }),
      ...(weekSettings.repsSchema !== undefined && { repsSchema: weekSettings.repsSchema }),
      ...(weekSettings.restTime !== undefined && { restTime: weekSettings.restTime }),
      ...(weekSettings.dynamicReps !== undefined && { dynamicReps: weekSettings.dynamicReps }),
      ...(weekSettings.dynamicSets !== undefined && { dynamicSets: weekSettings.dynamicSets }),
      ...(weekSettings.rollingDuration !== undefined && { rollingDuration: weekSettings.rollingDuration }),
      ...(weekSettings.rollingSessions !== undefined && { rollingSessions: weekSettings.rollingSessions }),
      ...(weekSettings.walkDuration !== undefined && { walkDuration: weekSettings.walkDuration }),
      ...(weekSettings.walkSessions !== undefined && { walkSessions: weekSettings.walkSessions }),
    };
    
    return mergedSettings;
  }

  /**
   * Проверить, нужно ли показать popup прогрессии
   */
  static async shouldShowProgressionPopup(): Promise<boolean> {
    const progress = await this.getProgress();
    if (!progress) return false;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Показываем popup только раз в неделю (каждые 7 дней)
    const daysSinceLastPopup = progress.lastProgressionPopupDate
      ? this.daysBetween(progress.lastProgressionPopupDate, today)
      : 7;
    
    // Показываем если прошло >= 7 дней и текущая неделя кратна 7
    return daysSinceLastPopup >= 7 && progress.daysCompleted % 7 === 0 && progress.daysCompleted > 0;
  }

  /**
   * Отметить что popup прогрессии был показан
   */
  static async markProgressionPopupShown(): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    progress.lastProgressionPopupDate = new Date().toISOString().split('T')[0];
    await this.saveProgress(progress);
  }

  /**
   * Принять предложение прогрессии
   */
  static async acceptProgression(
    program: RehabProgram,
    newWeek: number
  ): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    const previousSettings = this.getCurrentWeekSettings(program, progress.currentWeek);
    const newSettings = this.getCurrentWeekSettings(program, newWeek);
    
    // Сохраняем в историю
    progress.progressionHistory.push({
      date: new Date().toISOString().split('T')[0],
      week: newWeek,
      accepted: true,
      previousSettings,
      newSettings,
    });
    
    progress.currentWeek = newWeek;
    
    await this.saveProgress(progress);
    console.log(`[UserProgressManager] Progression accepted: week ${newWeek}`);
  }

  /**
   * Отклонить предложение прогрессии
   */
  static async declineProgression(
    program: RehabProgram,
    suggestedWeek: number
  ): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    const currentSettings = this.getCurrentWeekSettings(program, progress.currentWeek);
    const suggestedSettings = this.getCurrentWeekSettings(program, suggestedWeek);
    
    // Сохраняем в историю
    progress.progressionHistory.push({
      date: new Date().toISOString().split('T')[0],
      week: suggestedWeek,
      accepted: false,
      previousSettings: currentSettings,
      newSettings: suggestedSettings,
    });
    
    // Неделя остается прежней
    
    await this.saveProgress(progress);
    console.log(`[UserProgressManager] Progression declined: staying on week ${progress.currentWeek}`);
  }

  /**
   * Установить ручные настройки для упражнения (отключает auto-progression)
   */
  static async setManualOverride(
    exerciseId: string,
    settings: ExtendedExerciseSettings
  ): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    progress.manualOverrides[exerciseId] = settings;
    await this.saveProgress(progress);
    console.log(`[UserProgressManager] Manual override set for ${exerciseId}`);
  }

  /**
   * Удалить ручные настройки (вернуться к auto-progression)
   */
  static async clearManualOverride(exerciseId: string): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    delete progress.manualOverrides[exerciseId];
    await this.saveProgress(progress);
    console.log(`[UserProgressManager] Manual override cleared for ${exerciseId}`);
  }

  /**
   * Откатиться на N недель назад
   */
  static async rollbackWeeks(weeksBack: number): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    const newWeek = Math.max(1, progress.currentWeek - weeksBack);
    progress.currentWeek = newWeek;
    
    await this.saveProgress(progress);
    console.log(`[UserProgressManager] Rolled back to week ${newWeek}`);
  }

  /**
   * Переключить программу
   */
  static async switchProgram(newProgramId: string): Promise<void> {
    // Инициализируем новый прогресс
    await this.initializeProgress(newProgramId);
    console.log(`[UserProgressManager] Switched to program ${newProgramId}`);
  }

  /**
   * Проверить, завершена ли программа
   */
  static isProgramCompleted(program: RehabProgram, daysCompleted: number): boolean {
    if (program.durationDays === -1) {
      // Unlimited программа никогда не завершается
      return false;
    }
    
    return daysCompleted >= program.durationDays;
  }

  /**
   * Получить прогресс программы в процентах
   */
  static getProgramProgress(program: RehabProgram, daysCompleted: number): number {
    if (program.durationDays === -1) {
      return 0; // Для unlimited программ прогресс не показываем
    }
    
    return Math.min(100, Math.round((daysCompleted / program.durationDays) * 100));
  }

  /**
   * Вспомогательная функция: количество дней между двумя датами
   */
  private static daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Получить дни до конца программы
   */
  static getDaysRemaining(program: RehabProgram, daysCompleted: number): number {
    if (program.durationDays === -1) {
      return -1; // Unlimited
    }
    
    return Math.max(0, program.durationDays - daysCompleted);
  }

  /**
   * Получить общее количество недель в программе
   */
  static getTotalWeeks(program: RehabProgram): number {
    if (program.durationDays === -1) {
      return program.weeklyProgression.length; // Для unlimited показываем количество доступных недель
    }
    
    return Math.ceil(program.durationDays / 7);
  }
}

export default UserProgressManager;
