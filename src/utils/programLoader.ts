import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingProgram, ProgramExercise, ExtendedExerciseSettings } from '../types';
import programsJson from '../assets/programs.json';

// ========== КЛЮЧИ ХРАНЕНИЯ ==========
const PROGRAMS_STORAGE_KEY = '@training_programs';
const PROGRAMS_VERSION_KEY = '@programs_version';
const USER_SETTINGS_KEY = 'userSettings';

// ========== ИНИЦИАЛИЗАЦИЯ ПРОГРАММ ==========

/**
 * Инициализировать программы из JSON
 * Вызывается при первом запуске приложения или при обновлении версии
 */
export const initializePrograms = async (): Promise<void> => {
  try {
    const currentVersion = await AsyncStorage.getItem(PROGRAMS_VERSION_KEY);
    const jsonVersion = programsJson.version;
    
    if (currentVersion !== jsonVersion) {
      // Версия изменилась или это первый запуск - загружаем из JSON
      await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programsJson.programs));
      await AsyncStorage.setItem(PROGRAMS_VERSION_KEY, jsonVersion);
      console.log(`Programs initialized/updated to version ${jsonVersion}`);
    } else {
      console.log('Programs are up to date');
    }
  } catch (error) {
    console.error('Error initializing programs:', error);
    // В случае ошибки используем JSON как fallback
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programsJson.programs));
    await AsyncStorage.setItem(PROGRAMS_VERSION_KEY, programsJson.version);
  }
};

// ========== ПОЛУЧЕНИЕ ПРОГРАММ ==========

/**
 * Получить все программы
 */
export const getAllPrograms = async (): Promise<TrainingProgram[]> => {
  try {
    const stored = await AsyncStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Если нет в storage - вернуть из JSON (fallback)
    return programsJson.programs as TrainingProgram[];
  } catch (error) {
    console.error('Error loading programs:', error);
    return programsJson.programs as TrainingProgram[];
  }
};

/**
 * Получить программу по ID
 */
export const getProgramById = async (id: string): Promise<TrainingProgram | null> => {
  try {
    const programs = await getAllPrograms();
    return programs.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error loading program by ID:', error);
    return null;
  }
};

/**
 * Получить только готовые (preset) программы
 */
export const getPresetPrograms = async (): Promise<TrainingProgram[]> => {
  try {
    const programs = await getAllPrograms();
    return programs.filter(p => p.type === 'preset');
  } catch (error) {
    console.error('Error loading preset programs:', error);
    return [];
  }
};

/**
 * Получить только кастомные программы
 */
export const getCustomPrograms = async (): Promise<TrainingProgram[]> => {
  try {
    const programs = await getAllPrograms();
    return programs.filter(p => p.type === 'custom');
  } catch (error) {
    console.error('Error loading custom programs:', error);
    return [];
  }
};

// ========== АКТИВНАЯ ПРОГРАММА ==========

/**
 * Получить активную программу пользователя
 */
export const getActiveProgram = async (): Promise<TrainingProgram | null> => {
  try {
    const userSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    if (!userSettings) {
      // Если нет настроек - устанавливаем базовую адаптивную программу по умолчанию
      await setActiveProgram('basic_adaptive');
      return await getProgramById('basic_adaptive');
    }
    
    const settings = JSON.parse(userSettings);
    const activeProgramId = settings.activeProgramId;
    
    if (!activeProgramId) {
      // Если не установлена активная программа - устанавливаем базовую
      await setActiveProgram('basic_adaptive');
      return await getProgramById('basic_adaptive');
    }
    
    return await getProgramById(activeProgramId);
  } catch (error) {
    console.error('Error getting active program:', error);
    return null;
  }
};

/**
 * Установить активную программу
 */
export const setActiveProgram = async (programId: string): Promise<void> => {
  try {
    const userSettings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    const settings = userSettings ? JSON.parse(userSettings) : {};
    
    settings.activeProgramId = programId;
    
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    console.log(`Active program set to: ${programId}`);
  } catch (error) {
    console.error('Error setting active program:', error);
    throw error;
  }
};

// ========== УПРАЖНЕНИЯ В ПРОГРАММЕ ==========

/**
 * Получить упражнения активной программы с учетом уровня боли
 */
export const getActiveProgramExercises = async (
  painLevel?: number
): Promise<ProgramExercise[]> => {
  try {
    const program = await getActiveProgram();
    if (!program) return [];
    
    // Если программа адаптивная и указан уровень боли
    if (program.adaptToPainLevel && painLevel && program.painLevelRules) {
      // Ищем подходящее правило
      for (const [range, exercises] of Object.entries(program.painLevelRules)) {
        if (isInPainLevelRange(painLevel, range)) {
          return exercises.filter(ex => ex.isEnabled);
        }
      }
    }
    
    // Возвращаем обычные упражнения программы
    return program.exercises.filter(ex => ex.isEnabled).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting active program exercises:', error);
    return [];
  }
};

/**
 * Проверить, входит ли уровень боли в диапазон
 * Например: painLevel=4, range="4-5" -> true
 */
const isInPainLevelRange = (painLevel: number, range: string): boolean => {
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(Number);
    return painLevel >= min && painLevel <= max;
  }
  return painLevel === Number(range);
};

// ========== ОБНОВЛЕНИЕ ПРОГРАММ ==========

/**
 * Обновить настройки упражнения в программе
 */
export const updateExerciseSettings = async (
  programId: string,
  exerciseId: string,
  newSettings: Partial<ExtendedExerciseSettings>
): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const programIndex = programs.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const program = programs[programIndex];
    const exerciseIndex = program.exercises.findIndex(e => e.exerciseId === exerciseId);
    
    if (exerciseIndex === -1) {
      throw new Error(`Exercise not found in program: ${exerciseId}`);
    }
    
    // Обновляем настройки
    program.exercises[exerciseIndex].settings = {
      ...program.exercises[exerciseIndex].settings,
      ...newSettings,
    };
    
    program.updatedAt = new Date().toISOString();
    
    programs[programIndex] = program;
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    
    console.log(`Exercise settings updated: ${exerciseId} in program ${programId}`);
  } catch (error) {
    console.error('Error updating exercise settings:', error);
    throw error;
  }
};

/**
 * Обертка для updateExerciseSettings (для совместимости)
 */
export const updateProgramExerciseSettings = updateExerciseSettings;

/**
 * Включить/выключить упражнение в программе
 */
export const toggleExerciseInProgram = async (
  programId: string,
  exerciseId: string,
  isEnabled: boolean
): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const programIndex = programs.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const program = programs[programIndex];
    const exerciseIndex = program.exercises.findIndex(e => e.exerciseId === exerciseId);
    
    if (exerciseIndex !== -1) {
      program.exercises[exerciseIndex].isEnabled = isEnabled;
      program.updatedAt = new Date().toISOString();
      
      programs[programIndex] = program;
      await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
      
      console.log(`Exercise ${isEnabled ? 'enabled' : 'disabled'}: ${exerciseId}`);
    }
  } catch (error) {
    console.error('Error toggling exercise:', error);
    throw error;
  }
};

/**
 * Добавить упражнение в программу
 */
export const addExerciseToProgram = async (
  programId: string,
  exerciseId: string,
  settings: ExtendedExerciseSettings
): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const programIndex = programs.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const program = programs[programIndex];
    
    // Проверяем, нет ли уже такого упражнения
    const existingIndex = program.exercises.findIndex(e => e.exerciseId === exerciseId);
    if (existingIndex !== -1) {
      throw new Error(`Exercise already exists in program: ${exerciseId}`);
    }
    
    // Определяем order (следующий после максимального)
    const maxOrder = program.exercises.reduce((max, ex) => Math.max(max, ex.order), 0);
    
    const newExercise: ProgramExercise = {
      exerciseId,
      settings,
      order: maxOrder + 1,
      isEnabled: true,
    };
    
    program.exercises.push(newExercise);
    program.updatedAt = new Date().toISOString();
    
    programs[programIndex] = program;
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    
    console.log(`Exercise added to program: ${exerciseId}`);
  } catch (error) {
    console.error('Error adding exercise to program:', error);
    throw error;
  }
};

/**
 * Удалить упражнение из программы
 */
export const removeExerciseFromProgram = async (
  programId: string,
  exerciseId: string
): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const programIndex = programs.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const program = programs[programIndex];
    program.exercises = program.exercises.filter(e => e.exerciseId !== exerciseId);
    
    // Переупорядочиваем order
    program.exercises.sort((a, b) => a.order - b.order);
    program.exercises.forEach((ex, index) => {
      ex.order = index + 1;
    });
    
    program.updatedAt = new Date().toISOString();
    
    programs[programIndex] = program;
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    
    console.log(`Exercise removed from program: ${exerciseId}`);
  } catch (error) {
    console.error('Error removing exercise from program:', error);
    throw error;
  }
};

/**
 * Изменить порядок упражнений в программе
 */
export const reorderExercises = async (
  programId: string,
  newOrder: string[] // Массив exerciseId в новом порядке
): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const programIndex = programs.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const program = programs[programIndex];
    
    // Обновляем order согласно новому порядку
    newOrder.forEach((exerciseId, index) => {
      const exercise = program.exercises.find(e => e.exerciseId === exerciseId);
      if (exercise) {
        exercise.order = index + 1;
      }
    });
    
    program.exercises.sort((a, b) => a.order - b.order);
    program.updatedAt = new Date().toISOString();
    
    programs[programIndex] = program;
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    
    console.log('Exercises reordered successfully');
  } catch (error) {
    console.error('Error reordering exercises:', error);
    throw error;
  }
};

// ========== КАСТОМНЫЕ ПРОГРАММЫ ==========

/**
 * Создать кастомную программу
 */
export const createCustomProgram = async (
  name: string,
  description: string,
  exercises: ProgramExercise[]
): Promise<string> => {
  try {
    const programs = await getAllPrograms();
    
    const customProgram: TrainingProgram = {
      id: `custom_${Date.now()}`,
      nameRu: name,
      nameEn: name,
      description: description,
      type: 'custom',
      adaptToPainLevel: false,
      exercises: exercises.map((ex, index) => ({
        ...ex,
        order: index + 1,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    programs.push(customProgram);
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    
    console.log(`Custom program created: ${customProgram.id}`);
    return customProgram.id;
  } catch (error) {
    console.error('Error creating custom program:', error);
    throw error;
  }
};

/**
 * Обновить кастомную программу
 */
export const updateCustomProgram = async (
  programId: string,
  updates: {
    name?: string;
    description?: string;
    exercises?: ProgramExercise[];
  }
): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const programIndex = programs.findIndex(p => p.id === programId);
    
    if (programIndex === -1) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const program = programs[programIndex];
    
    if (program.type !== 'custom') {
      throw new Error('Cannot update preset program');
    }
    
    if (updates.name) {
      program.nameRu = updates.name;
      program.nameEn = updates.name;
    }
    
    if (updates.description) {
      program.description = updates.description;
    }
    
    if (updates.exercises) {
      program.exercises = updates.exercises.map((ex, index) => ({
        ...ex,
        order: index + 1,
      }));
    }
    
    program.updatedAt = new Date().toISOString();
    
    programs[programIndex] = program;
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
    
    console.log(`Custom program updated: ${programId}`);
  } catch (error) {
    console.error('Error updating custom program:', error);
    throw error;
  }
};

/**
 * Удалить кастомную программу
 */
export const deleteCustomProgram = async (programId: string): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const program = programs.find(p => p.id === programId);
    
    if (!program) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    if (program.type !== 'custom') {
      throw new Error('Cannot delete preset program');
    }
    
    // Проверяем, не активна ли эта программа
    const activeProgram = await getActiveProgram();
    if (activeProgram?.id === programId) {
      // Переключаем на базовую программу
      await setActiveProgram('basic_adaptive');
    }
    
    const filtered = programs.filter(p => p.id !== programId);
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(filtered));
    
    console.log(`Custom program deleted: ${programId}`);
  } catch (error) {
    console.error('Error deleting program:', error);
    throw error;
  }
};

/**
 * Дублировать программу (создать кастомную копию)
 */
export const duplicateProgram = async (
  programId: string,
  newName?: string
): Promise<string> => {
  try {
    const sourceProgram = await getProgramById(programId);
    if (!sourceProgram) {
      throw new Error(`Program not found: ${programId}`);
    }
    
    const name = newName || `${sourceProgram.nameRu} (копия)`;
    
    return await createCustomProgram(
      name,
      sourceProgram.description,
      sourceProgram.exercises
    );
  } catch (error) {
    console.error('Error duplicating program:', error);
    throw error;
  }
};

// ========== РУЧНОЕ ОБНОВЛЕНИЕ ==========

/**
 * Перезагрузить программы из JSON (для ручного обновления)
 */
export const reloadProgramsFromJson = async (): Promise<void> => {
  try {
    // Сохраняем кастомные программы
    const customPrograms = await getCustomPrograms();
    
    // Загружаем preset программы из JSON
    const presetPrograms = programsJson.programs as TrainingProgram[];
    
    // Объединяем preset и custom программы
    const allPrograms = [...presetPrograms, ...customPrograms];
    
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(allPrograms));
    await AsyncStorage.setItem(PROGRAMS_VERSION_KEY, programsJson.version);
    
    console.log('Programs manually reloaded from JSON');
  } catch (error) {
    console.error('Error reloading programs from JSON:', error);
    throw error;
  }
};

/**
 * Сбросить все программы к значениям по умолчанию
 */
export const resetProgramsToDefaults = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programsJson.programs));
    await AsyncStorage.setItem(PROGRAMS_VERSION_KEY, programsJson.version);
    
    // Устанавливаем базовую программу как активную
    await setActiveProgram('basic_adaptive');
    
    console.log('Programs reset to defaults');
  } catch (error) {
    console.error('Error resetting programs:', error);
    throw error;
  }
};
