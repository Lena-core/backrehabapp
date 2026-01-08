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
      weeklyAdjustedSettings: {},
      progressionHistory: [],
      programHistory: [],
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
    
    // НЕ переключаем неделю автоматически!
    // Неделя переключается ТОЛЬКО через acceptProgression()
    // Это позволяет показать popup прогрессии
    
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
   * ПРИОРИТЕТ: manual overrides > weeklyAdjustedSettings > weekly progression > base settings
   */
  static async getExerciseSettings(
    program: RehabProgram,
    exerciseId: string
  ): Promise<ExtendedExerciseSettings> {
    const progress = await this.getProgress();
    
    // 1. ВЫСШИЙ ПРИОРИТЕТ: ручные изменения
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
    
    // Если нет прогресса, возвращаем базовые настройки
    if (!progress) {
      return baseSettings;
    }
    
    // 2. СРЕДНИЙ ПРИОРИТЕТ: weeklyAdjustedSettings (когда прогрессия была принята с manual overrides)
    if (progress.weeklyAdjustedSettings?.[progress.currentWeek]?.[exerciseId]) {
      console.log(`[UserProgressManager] Using weekly adjusted settings for ${exerciseId}, week ${progress.currentWeek}`);
      return progress.weeklyAdjustedSettings[progress.currentWeek][exerciseId];
    }
    
    // 3. НИЗКИЙ ПРИОРИТЕТ: weekly progression из программы
    if (program.weeklyProgression.length > 0) {
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
    
    // 4. ПОСЛЕДНИЙ ВАРИАНТ: базовые настройки
    return baseSettings;
  }

  /**
   * Проверить, нужно ли показать popup прогрессии
   */
  static async shouldShowProgressionPopup(): Promise<boolean> {
    const progress = await this.getProgress();
    if (!progress) return false;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Не показываем попап если уже показывали сегодня
    if (progress.lastProgressionPopupDate === today) {
      return false;
    }
    
    // Показываем popup когда пользователь завершил ровно N недель
    // Например: currentWeek=1, daysCompleted=7 -> показать popup перехода на неделю 2
    const hasCompletedCurrentWeek = progress.daysCompleted === progress.currentWeek * 7;
    
    // Показываем только если есть что предложить (дни > 0)
    return hasCompletedCurrentWeek && progress.daysCompleted > 0;
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
   * 🆕 Применить прогрессию к текущим настройкам упражнения
   * @param currentSettings - текущие настройки (с учетом manual overrides)
   * @param progressionMultiplier - множитель прогрессии (например, 1.1 для +10%)
   */
  static applyProgressionToSettings(
    currentSettings: ExtendedExerciseSettings,
    progressionMultiplier: number = 1.1
  ): ExtendedExerciseSettings {
    const newSettings: ExtendedExerciseSettings = { ...currentSettings };
    
    // Применяем прогрессию к разным типам настроек
    if (currentSettings.holdTime !== undefined) {
      newSettings.holdTime = Math.round(currentSettings.holdTime * progressionMultiplier);
    }
    
    if (currentSettings.repsSchema !== undefined) {
      newSettings.repsSchema = currentSettings.repsSchema.map(
        r => Math.round(r * progressionMultiplier)
      );
    }
    
    // Rest time можно не увеличивать или даже немного уменьшать
    if (currentSettings.restTime !== undefined) {
      // Оставляем как есть или немного уменьшаем
      newSettings.restTime = Math.max(5, Math.round(currentSettings.restTime * 0.95));
    }
    
    if (currentSettings.dynamicReps !== undefined) {
      newSettings.dynamicReps = Math.round(currentSettings.dynamicReps * progressionMultiplier);
    }
    
    if (currentSettings.dynamicSets !== undefined) {
      newSettings.dynamicSets = Math.round(currentSettings.dynamicSets * progressionMultiplier);
    }
    
    if (currentSettings.rollingDuration !== undefined) {
      newSettings.rollingDuration = Math.round(currentSettings.rollingDuration * progressionMultiplier);
    }
    
    if (currentSettings.rollingSessions !== undefined) {
      newSettings.rollingSessions = Math.round(currentSettings.rollingSessions * progressionMultiplier);
    }
    
    if (currentSettings.walkDuration !== undefined) {
      newSettings.walkDuration = Math.round(currentSettings.walkDuration * progressionMultiplier);
    }
    
    if (currentSettings.walkSessions !== undefined) {
      newSettings.walkSessions = Math.round(currentSettings.walkSessions * progressionMultiplier);
    }
    
    return newSettings;
  }

  /**
   * Принять предложение прогрессии
   * 🔥 ИСПРАВЛЕНО: Теперь применяет прогрессию к ТЕКУЩИМ настройкам (с учетом manual overrides)
   */
  static async acceptProgression(
    program: RehabProgram,
    newWeek: number
  ): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    const previousSettings = this.getCurrentWeekSettings(program, progress.currentWeek);
    const newSettings = this.getCurrentWeekSettings(program, newWeek);
    
    // 🆕 ГЛАВНОЕ ИЗМЕНЕНИЕ: Применяем прогрессию к ТЕКУЩИМ настройкам каждого упражнения
    const adjustedSettings: { [exerciseId: string]: ExtendedExerciseSettings } = {};
    
    for (const exercise of program.exercises) {
      // Получаем ТЕКУЩИЕ настройки (с учетом manual overrides)
      const currentSettings = await this.getExerciseSettings(program, exercise.exerciseId);
      
      // Применяем прогрессию (+10%)
      const progressedSettings = this.applyProgressionToSettings(currentSettings, 1.1);
      
      adjustedSettings[exercise.exerciseId] = progressedSettings;
      
      console.log(`[UserProgressManager] Progression for ${exercise.exerciseId}:`, {
        current: currentSettings.repsSchema || currentSettings.holdTime,
        new: progressedSettings.repsSchema || progressedSettings.holdTime,
      });
    }
    
    // Сохраняем скорректированные настройки для новой недели
    if (!progress.weeklyAdjustedSettings) {
      progress.weeklyAdjustedSettings = {};
    }
    progress.weeklyAdjustedSettings[newWeek] = adjustedSettings;
    
    // Очищаем manual overrides (они стали базовыми для новой недели)
    progress.manualOverrides = {};
    
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
    console.log(`[UserProgressManager] ✅ Progression accepted: week ${newWeek}, manual overrides cleared`);
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

  // ============ 🆕 НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БОЛЬЮ И ИСТОРИЕЙ ПРОГРАММ ============

  /**
   * 🆕 Снизить текущие настройки всех упражнений на указанный процент
   * Используется когда пользователь чувствует боль/дискомфорт
   * @param program - текущая программа
   * @param reductionPercent - процент снижения (0.25 = -25%)
   */
  static async reduceCurrentSettings(
    program: RehabProgram,
    reductionPercent: number = 0.25
  ): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) return;
    
    console.log(`[UserProgressManager] 🔻 Reducing settings by ${reductionPercent * 100}%`);
    
    // Для каждого упражнения уменьшаем ТЕКУЩИЕ настройки
    for (const exercise of program.exercises) {
      const currentSettings = await this.getExerciseSettings(program, exercise.exerciseId);
      
      const reducedSettings: ExtendedExerciseSettings = { ...currentSettings };
      
      // Уменьшаем нагрузку
      if (currentSettings.holdTime !== undefined) {
        reducedSettings.holdTime = Math.max(3, Math.round(currentSettings.holdTime * (1 - reductionPercent)));
      }
      
      if (currentSettings.repsSchema !== undefined) {
        reducedSettings.repsSchema = currentSettings.repsSchema.map(
          r => Math.max(1, Math.round(r * (1 - reductionPercent)))
        );
      }
      
      // Увеличиваем время отдыха (+25%)
      if (currentSettings.restTime !== undefined) {
        reducedSettings.restTime = Math.min(30, Math.round(currentSettings.restTime * (1 + reductionPercent)));
      }
      
      if (currentSettings.dynamicReps !== undefined) {
        reducedSettings.dynamicReps = Math.max(1, Math.round(currentSettings.dynamicReps * (1 - reductionPercent)));
      }
      
      if (currentSettings.dynamicSets !== undefined) {
        reducedSettings.dynamicSets = Math.max(1, Math.round(currentSettings.dynamicSets * (1 - reductionPercent)));
      }
      
      if (currentSettings.rollingDuration !== undefined) {
        reducedSettings.rollingDuration = Math.max(30, Math.round(currentSettings.rollingDuration * (1 - reductionPercent)));
      }
      
      if (currentSettings.walkDuration !== undefined) {
        reducedSettings.walkDuration = Math.max(5, Math.round(currentSettings.walkDuration * (1 - reductionPercent)));
      }
      
      // Сохраняем как manual override
      await this.setManualOverride(exercise.exerciseId, reducedSettings);
      
      console.log(`[UserProgressManager]   ${exercise.exerciseId}: ${JSON.stringify(currentSettings.repsSchema || currentSettings.holdTime)} → ${JSON.stringify(reducedSettings.repsSchema || reducedSettings.holdTime)}`);
    }
    
    console.log('[UserProgressManager] ✅ Settings reduced successfully');
  }

  /**
   * 🆕 Переключиться на программу с сохранением истории
   * @param newProgramId - ID новой программы
   */
  static async switchProgramWithHistory(newProgramId: string): Promise<void> {
    const progress = await this.getProgress();
    if (!progress) {
      await this.initializeProgress(newProgramId);
      return;
    }
    
    // Сохраняем текущую программу в историю
    if (!progress.programHistory) {
      progress.programHistory = [];
    }
    
    progress.programHistory.push({
      programId: progress.currentProgramId,
      startDate: progress.programStartDate || new Date().toISOString(),
      endDate: new Date().toISOString(),
      completed: false,
      week: progress.currentWeek,
    });
    
    console.log(`[UserProgressManager] 💾 Saved ${progress.currentProgramId} to history`);
    
    // Переключаемся на новую программу
    await this.initializeProgress(newProgramId);
    
    // Восстанавливаем историю
    const newProgress = await this.getProgress();
    if (newProgress) {
      newProgress.programHistory = progress.programHistory;
      await this.saveProgress(newProgress);
    }
    
    console.log(`[UserProgressManager] ✅ Switched to program ${newProgramId}`);
  }

  /**
   * 🆕 Вернуться к предыдущей программе
   */
  static async returnToPreviousProgram(): Promise<boolean> {
    const progress = await this.getProgress();
    if (!progress || !progress.programHistory || progress.programHistory.length === 0) {
      console.log('[UserProgressManager] ⚠️ No previous program in history');
      return false;
    }
    
    // Берем последнюю программу из истории
    const previousEntry = progress.programHistory[progress.programHistory.length - 1];
    
    console.log(`[UserProgressManager] ⬅️ Returning to ${previousEntry.programId}, week ${previousEntry.week}`);
    
    // Переключаемся
    await this.initializeProgress(previousEntry.programId);
    
    const newProgress = await this.getProgress();
    if (newProgress) {
      // Восстанавливаем неделю (опционально)
      newProgress.currentWeek = previousEntry.week || 1;
      
      // Удаляем из истории
      progress.programHistory.pop();
      newProgress.programHistory = progress.programHistory;
      
      await this.saveProgress(newProgress);
      
      console.log('[UserProgressManager] ✅ Successfully returned to previous program');
      return true;
    }
    
    return false;
  }

  /**
   * 🆕 Проверить, можно ли вернуться к предыдущей программе
   */
  static async canReturnToPreviousProgram(): Promise<boolean> {
    const progress = await this.getProgress();
    return !!(progress?.programHistory && progress.programHistory.length > 0);
  }

  /**
   * 🆕 Получить историю программ
   */
  static async getProgramHistory() {
    const progress = await this.getProgress();
    return progress?.programHistory || [];
  }
}

export default UserProgressManager;
