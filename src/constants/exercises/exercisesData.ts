import { ExerciseInfo, MuscleGroup, ExerciseDifficulty, ExerciseExecutionType } from '../../types';

/**
 * База данных всех упражнений приложения
 * 
 * Категоризация по мышечным группам:
 * - abs: Прямая мышца живота
 * - obliques: Косые мышцы живота
 * - core_stability: Стабилизаторы кора
 * - glutes: Ягодичные мышцы
 * - back: Мышцы спины
 * - hip_flexors: Сгибатели бедра
 * - hamstrings: Задняя поверхность бедра
 * - quads: Квадрицепс
 * - calves: Икроножные
 * - full_body: Все тело
 * - mobility: Мобильность/растяжка
 * - walk: Ходьба
 */

export const EXERCISES_DATABASE: Record<string, ExerciseInfo> = {
  // ========== УПРАЖНЕНИЯ ДЛЯ ПРЯМОЙ МЫШЦЫ ЖИВОТА ==========
  curl_up: {
    id: 'curl_up',
    nameRu: 'Модифицированное скручивание',
    nameEn: 'Modified Curl Up',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['core_stability'],
    difficulty: 'easy',
    executionType: 'hold',
    videoFile: 'curl_up.mp4',
    preparationVideoFile: 'curl_up_begginning.mp4',
    shortDescription: 'Укрепление прямой мышцы живота с минимальной нагрузкой на позвоночник',
    fullDescription: `Это упражнение предназначено для тренировки прямой мышцы живота (rectus abdominis). Оно помогает укрепить корпус, обеспечивая при этом минимальную нагрузку на позвоночник.

Исходное положение:
1. Лягте на спину на ровную, твердую поверхность.
2. Согните одну ногу в колене так, чтобы стопа стояла на полу.
3. Разместите обе руки под поясницей ладонями вниз.

Техника выполнения:
1. Напрягите мышцы кора, как будто готовитесь к удару в живот.
2. На выдохе медленно приподнимите голову и плечи от пола.
3. Поднимайтесь только на несколько сантиметров.
4. Избегайте сгибания шеи и не отрывайте поясницу от пола.
5. Задержитесь в верхней точке на заданное время.`,
    recommendedForPainLevels: [1, 2, 3, 4],
    defaultSettings: {
      holdTime: 8,
      repsSchema: [3, 2, 1],
      restTime: 15,
    },
    progressionPath: ['curl_up', 'dotyagivania'],
  },
  
  dotyagivania: {
    id: 'dotyagivania',
    nameRu: 'Дотягивания',
    nameEn: 'Vertical Crunch',
    primaryMuscles: ['abs'],
    difficulty: 'medium',
    executionType: 'reps',
    videoFile: 'dotyagivania.mp4',
    shortDescription: 'Укрепление мышц живота с вертикальным движением',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      holdTime: 3,
      repsSchema: [10, 8, 6],
      restTime: 20,
    },
  },
  
  // ========== УПРАЖНЕНИЯ ДЛЯ КОСЫХ МЫШЦ ==========
  side_plank: {
    id: 'side_plank',
    nameRu: 'Боковая планка',
    nameEn: 'Side Plank',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['core_stability'],
    difficulty: 'easy',
    executionType: 'hold',
    videoFile: 'side_plank.mp4',
    shortDescription: 'Укрепление мышц-стабилизаторов корпуса',
    fullDescription: `Это упражнение эффективно укрепляет мышцы-стабилизаторы корпуса, оберегая позвоночник от высоких нагрузок.

Исходное положение:
1. Лягте на бок, опираясь на локоть и предплечье.
2. Локоть должен находиться строго под плечом.
3. Ноги выпрямите.

Техника выполнения:
1. Создайте напряжение в мышцах живота.
2. Медленно поднимите бедра от пола.
3. Ваше тело должно образовать прямую линию от головы до пяток.
4. Не прогибайтесь в пояснице и не позволяйте тазу опускаться.
5. Задержитесь в этом положении на заданное время.`,
    recommendedForPainLevels: [1, 2, 3, 4],
    defaultSettings: {
      holdTime: 8,
      repsSchema: [3, 2, 1],
      restTime: 15,
    },
    progressionPath: ['side_plank', 'side_plank_lvl2', 'side_plank_lvl3'],
  },
  
  side_plank_lvl2: {
    id: 'side_plank_lvl2',
    nameRu: 'Боковая планка (средний уровень)',
    nameEn: 'Staggered-Foot Side Bridge',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['core_stability', 'glutes'],
    difficulty: 'medium',
    executionType: 'hold',
    videoFile: 'side_plank_lvl2.mp4',
    shortDescription: 'Усложненный вариант боковой планки',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      holdTime: 10,
      repsSchema: [3, 2, 1],
      restTime: 20,
    },
    progressionPath: ['side_plank', 'side_plank_lvl2', 'side_plank_lvl3'],
  },
  
  side_plank_lvl3: {
    id: 'side_plank_lvl3',
    nameRu: 'Боковая планка (продвинутый уровень)',
    nameEn: 'Feet-Stacked Side Bridge',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['core_stability', 'glutes'],
    difficulty: 'hard',
    executionType: 'hold',
    videoFile: 'side_plank_lvl3.mp4',
    shortDescription: 'Продвинутый вариант боковой планки с подъемом ноги',
    recommendedForPainLevels: [1, 2],
    defaultSettings: {
      holdTime: 12,
      repsSchema: [3, 3, 2],
      restTime: 25,
    },
    progressionPath: ['side_plank', 'side_plank_lvl2', 'side_plank_lvl3'],
  },
  
  // ========== УПРАЖНЕНИЯ ДЛЯ СТАБИЛИЗАТОРОВ КОРА ==========
  bird_dog: {
    id: 'bird_dog',
    nameRu: 'Птица-собака',
    nameEn: 'Bird-Dog',
    primaryMuscles: ['core_stability'],
    secondaryMuscles: ['back', 'glutes'],
    difficulty: 'easy',
    executionType: 'hold',
    videoFile: 'bird_dog.mp4',
    shortDescription: 'Повышение выносливости мышц кора, стабильность позвоночника',
    fullDescription: `Это упражнение помогает повысить выносливость мышц кора, обеспечивая стабильность позвоночника.

Исходное положение:
1. Встаньте на четвереньки.
2. Руки строго под плечами, колени под бедрами.
3. Спина в нейтральном положении.

Техника выполнения:
1. Напрягите мышцы кора.
2. Медленно вытяните одну руку вперед, а противоположную ногу назад.
3. Не поднимайте конечности слишком высоко.
4. Не допускайте поворота или наклона таза или плеч.
5. Задержитесь в этом положении на заданное время.`,
    recommendedForPainLevels: [1, 2, 3, 4],
    defaultSettings: {
      holdTime: 8,
      repsSchema: [3, 2, 1],
      restTime: 15,
    },
  },
  
  dead_bug: {
    id: 'dead_bug',
    nameRu: 'Мертвый жук',
    nameEn: 'Dead Bug',
    primaryMuscles: ['core_stability', 'abs'],
    difficulty: 'easy',
    executionType: 'hold',
    videoFile: 'dead_bug.mp4',
    shortDescription: 'Укрепление мышц кора с безопасным положением спины',
    recommendedForPainLevels: [4, 5],
    defaultSettings: {
      holdTime: 6,
      repsSchema: [4, 3, 2],
      restTime: 15,
    },
  },
  
  pryamaya_planka: {
    id: 'pryamaya_planka',
    nameRu: 'Прямая планка',
    nameEn: 'Front Plank',
    primaryMuscles: ['core_stability', 'abs'],
    secondaryMuscles: ['back', 'glutes'],
    difficulty: 'medium',
    executionType: 'hold',
    videoFile: 'pryamaya_planka.mp4',
    shortDescription: 'Классическая планка для укрепления всего кора',
    recommendedForPainLevels: [1, 2],
    defaultSettings: {
      holdTime: 20,
      repsSchema: [3, 2, 1],
      restTime: 30,
    },
  },
  
  // ========== УПРАЖНЕНИЯ ДЛЯ ЯГОДИЦ ==========
  tazovy_most: {
    id: 'tazovy_most',
    nameRu: 'Тазовый мост (стандартный)',
    nameEn: 'Glute Bridge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'core_stability'],
    difficulty: 'medium',
    executionType: 'hold',
    videoFile: 'tazovy_most.mp4',
    shortDescription: 'Укрепление ягодичных мышц и задней цепи',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      holdTime: 10,
      repsSchema: [5, 4, 3],
      restTime: 20,
    },
    progressionPath: ['tazovy_most', 'tazovy_most_disk', 'tazovy_most_odna_noga'],
  },
  
  tazovy_most_disk: {
    id: 'tazovy_most_disk',
    nameRu: 'Тазовый мост с отягощением',
    nameEn: 'Weighted Glute Bridge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    difficulty: 'hard',
    executionType: 'hold',
    videoFile: 'tazovy_most_disk.mp4',
    shortDescription: 'Тазовый мост с дополнительным весом',
    recommendedForPainLevels: [1, 2],
    defaultSettings: {
      holdTime: 8,
      repsSchema: [5, 4, 3],
      restTime: 25,
    },
    progressionPath: ['tazovy_most', 'tazovy_most_disk', 'tazovy_most_odna_noga'],
  },
  
  tazovy_most_odna_noga: {
    id: 'tazovy_most_odna_noga',
    nameRu: 'Тазовый мост на одной ноге',
    nameEn: 'Single-Leg Glute Bridge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'core_stability'],
    difficulty: 'hard',
    executionType: 'hold',
    videoFile: 'tazovy_most_odna_noga.mp4',
    alternativeVideoFile: 'tazovy_most_drugaya_noga.mp4',  // Видео для другой ноги
    shortDescription: 'Усложненный тазовый мост на одной ноге',
    recommendedForPainLevels: [1, 2],
    defaultSettings: {
      holdTime: 8,
      repsSchema: [4, 3, 2],
      restTime: 25,
    },
    progressionPath: ['tazovy_most', 'tazovy_most_disk', 'tazovy_most_odna_noga'],
  },
  
  tazovy_most_resina: {
    id: 'tazovy_most_resina',
    nameRu: 'Тазовый мост с резиновым эспандером',
    nameEn: 'Banded Glute Bridge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hip_flexors'],
    difficulty: 'hard',
    executionType: 'hold',
    videoFile: 'tazovy_most_resina.mp4',
    shortDescription: 'Тазовый мост с дополнительным сопротивлением',
    recommendedForPainLevels: [1, 2],
    defaultSettings: {
      holdTime: 10,
      repsSchema: [5, 4, 3],
      restTime: 25,
    },
  },
  
  // ========== УПРАЖНЕНИЯ ДЛЯ МОБИЛЬНОСТИ ==========
  koshka: {
    id: 'koshka',
    nameRu: 'Кошечка (Кошка-корова)',
    nameEn: 'Cat-Cow',
    primaryMuscles: ['mobility', 'back'],
    difficulty: 'easy',
    executionType: 'dynamic',
    videoFile: 'koshka.mp4',
    shortDescription: 'Мягкая мобилизация позвоночника, улучшение гибкости',
    recommendedForPainLevels: [4, 5],
    defaultSettings: {
      dynamicReps: 10,
      dynamicSets: 2,
      restTime: 15,
    },
  },
  
  posa_rebenka: {
    id: 'posa_rebenka',
    nameRu: 'Поза ребенка',
    nameEn: "Child's Pose (Balasana)",
    primaryMuscles: ['mobility', 'back'],
    secondaryMuscles: ['glutes'],
    difficulty: 'easy',
    executionType: 'hold',
    videoFile: 'posa_rebenka.mp4',
    shortDescription: 'Расслабление и растяжка спины, снятие напряжения',
    recommendedForPainLevels: [4, 5],
    defaultSettings: {
      holdTime: 30,
      repsSchema: [2, 1],
      restTime: 10,
    },
  },
  
  // ========== ДИНАМИЧЕСКИЕ УПРАЖНЕНИЯ ==========
  bear_walk: {
    id: 'bear_walk',
    nameRu: 'Медвежья походка',
    nameEn: 'Bear Crawl',
    primaryMuscles: ['full_body'],
    secondaryMuscles: ['core_stability', 'glutes'],
    difficulty: 'medium',
    executionType: 'dynamic',
    videoFile: 'bear_walk.mp4',
    shortDescription: 'Комплексное упражнение для укрепления всего тела',
    recommendedForPainLevels: [1, 2],
    defaultSettings: {
      dynamicReps: 10,  // шагов вперед-назад
      dynamicSets: 3,
      restTime: 30,
    },
  },
  
  podem_kolenei: {
    id: 'podem_kolenei',
    nameRu: 'Подъем коленей',
    nameEn: 'Knees-Up',
    primaryMuscles: ['abs', 'hip_flexors'],
    difficulty: 'medium',
    executionType: 'reps',
    videoFile: 'podem kolenei.mp4',
    shortDescription: 'Укрепление нижней части пресса',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      holdTime: 3,
      repsSchema: [10, 8, 6],
      restTime: 20,
    },
  },
  
  // ========== ХОДЬБА ==========
  walk: {
    id: 'walk',
    nameRu: 'Ходьба',
    nameEn: 'Walk',
    primaryMuscles: ['walk'],
    difficulty: 'easy',
    executionType: 'walk',
    videoFile: 'walk_sample.mp4',
    shortDescription: 'Питание межпозвонковых дисков, восстановление здоровья спины',
    fullDescription: `Ходьба позволяет обеспечить питание межпозвонковых дисков и восстановить их здоровье.

Техника выполнения:
1. Держите спину прямо в нейтральном положении.
2. Делайте короткие, но быстрые шаги.
3. Двигайте руками в такт ходьбе.
4. Смотрите прямо перед собой.

Длительность: Начните с коротких прогулок по 5-10 минут. Важно, чтобы ходьба не вызывала боль.`,
    recommendedForPainLevels: [1, 2, 3, 5],
    defaultSettings: {
      walkDuration: 5,
      walkSessions: 1,
    },
  },
  
  // ========== САМОМАССАЖ ==========
  prokatka_ass: {
    id: 'prokatka_ass',
    nameRu: 'Самомассаж ягодиц на ролле',
    nameEn: 'Gluteal Foam Roll',
    primaryMuscles: ['glutes'],
    difficulty: 'easy',
    executionType: 'foam_rolling',
    videoFile: 'prokatka_ass.mp4',
    shortDescription: 'Расслабление и массаж ягодичных мышц',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      rollingDuration: 60,
      rollingSessions: 1,
    },
  },
  
  prokatka_bedro: {
    id: 'prokatka_bedro',
    nameRu: 'Самомассаж бедра на ролле',
    nameEn: 'Lateral Thigh Foam Roll',
    primaryMuscles: ['quads', 'hamstrings'],
    difficulty: 'easy',
    executionType: 'foam_rolling',
    videoFile: 'prokatka_bedro.mp4',
    shortDescription: 'Массаж квадрицепса и бицепса бедра',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      rollingDuration: 60,
      rollingSessions: 1,
    },
  },
  
  prokatka_ikri: {
    id: 'prokatka_ikri',
    nameRu: 'Самомассаж икр на ролле',
    nameEn: 'Calf Foam Roll',
    primaryMuscles: ['calves'],
    difficulty: 'easy',
    executionType: 'foam_rolling',
    videoFile: 'prokatka_ikri.mp4',
    shortDescription: 'Расслабление икроножных мышц',
    recommendedForPainLevels: [1, 2, 3],
    defaultSettings: {
      rollingDuration: 60,
      rollingSessions: 1,
    },
  },
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

/**
 * Получить информацию об упражнении по ID
 */
export const getExerciseById = (id: string): ExerciseInfo | undefined => {
  return EXERCISES_DATABASE[id];
};

/**
 * Получить все упражнения, задействующие конкретную мышечную группу
 */
export const getExercisesByMuscleGroup = (muscle: MuscleGroup): ExerciseInfo[] => {
  return Object.values(EXERCISES_DATABASE).filter(
    ex => ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles?.includes(muscle)
  );
};

/**
 * Получить упражнения по уровню сложности
 */
export const getExercisesByDifficulty = (difficulty: ExerciseDifficulty): ExerciseInfo[] => {
  return Object.values(EXERCISES_DATABASE).filter(ex => ex.difficulty === difficulty);
};

/**
 * Получить упражнения, рекомендованные для конкретного уровня боли
 */
export const getExercisesForPainLevel = (painLevel: number): ExerciseInfo[] => {
  return Object.values(EXERCISES_DATABASE).filter(
    ex => ex.recommendedForPainLevels.includes(painLevel)
  );
};

/**
 * Получить путь прогрессии для упражнения
 */
export const getProgressionPath = (exerciseId: string): string[] => {
  const exercise = EXERCISES_DATABASE[exerciseId];
  return exercise?.progressionPath || [exerciseId];
};

/**
 * Получить все упражнения (массив)
 */
export const getAllExercises = (): ExerciseInfo[] => {
  return Object.values(EXERCISES_DATABASE);
};

/**
 * Получить количество упражнений
 */
export const getTotalExercisesCount = (): number => {
  return Object.keys(EXERCISES_DATABASE).length;
};
