// Константы для ExerciseExecutionScreen
import { ExerciseType } from '../types';

// По умолчанию для ошибок загрузки
export const DEFAULT_PLACEHOLDER = require('../assets/videos/curl_up.mp4');

// Пути к анимационным файлам
export const EXERCISE_ANIMATIONS: Record<ExerciseType, any> = {
  curl_up: require('../assets/videos/curl_up.mp4'),
  side_plank: require('../assets/videos/side_plank.mp4'),
  bird_dog: require('../assets/videos/bird_dog.mp4'),
  walk: require('../assets/videos/walk.mp4'),
};

/**
 * Динамическая загрузка видео для всех упражнений
 */
export const getExerciseVideo = (exerciseId: string): any => {
  console.log('[getExerciseVideo] Input exerciseId:', exerciseId);
  
  const videoMap: Record<string, any> = {
    'curl_up': require('../assets/videos/curl_up.mp4'),
    'side_plank': require('../assets/videos/side_plank.mp4'),
    'side_plank_lvl2': require('../assets/videos/side_plank_lvl2.mp4'),
    'side_plank_lvl3': require('../assets/videos/side_plank_lvl3.mp4'),
    'bird_dog': require('../assets/videos/bird_dog.mp4'),
    'dead_bug': require('../assets/videos/dead_bug.mp4'),
    'pryamaya_planka': require('../assets/videos/pryamaya_planka.mp4'),
    'tazovy_most': require('../assets/videos/tazovy_most.mp4'),
    'tazovy_most_disk': require('../assets/videos/tazovy_most_disk.mp4'),
    'tazovy_most_odna_noga': require('../assets/videos/tazovy_most_odna_noga.mp4'),
    'tazovy_most_resina': require('../assets/videos/tazovy_most_resina.mp4'),
    'koshka': require('../assets/videos/koshka.mp4'),
    'posa_rebenka': require('../assets/videos/posa_rebenka.mp4'),
    'bear_walk': require('../assets/videos/bear_walk.mp4'),
    'podem_kolenei': require('../assets/videos/podem kolenei.mp4'),
    'walk': require('../assets/videos/walk_sample.mp4'),
    'prokatka_ass': require('../assets/videos/prokatka_ass.mp4'),
    'prokatka_bedro': require('../assets/videos/prokatka_bedro.mp4'),
    'prokatka_ikri': require('../assets/videos/prokatka_ikri.mp4'),
    'dotyagivania': require('../assets/videos/dotyagivania.mp4'),
  };
  
  const video = videoMap[exerciseId];
  
  if (video) {
    console.log('[getExerciseVideo] Video found for:', exerciseId);
    return video;
  } else {
    console.warn('[getExerciseVideo] Video NOT found for:', exerciseId, '- using placeholder');
    return DEFAULT_PLACEHOLDER;
  }
};

// Надписи для каждого упражнения
const EXERCISE_INSTRUCTIONS: Record<ExerciseType, Record<string, string>> = {
  curl_up: {
    prepare: 'Приготовьтесь',
    start: 'Поднимите голову и плечи',
    hold: 'Удерживайте положение',
    miniRest: 'Опустите голову и плечи',
    rest: 'Отдых',
    completed: 'Упражнение завершено!'
  },
  side_plank: {
    prepare: 'Приготовьтесь',
    start: 'Поднимите таз вверх',
    hold: 'Удерживайте положение',
    miniRest: 'Опустите таз',
    rest: 'Отдых',
    completed: 'Упражнение завершено!'
  },
  bird_dog: {
    prepare: 'Приготовьтесь',
    start: 'Поднимите руку и ногу',
    startScheme1: 'Поднимите левую руку и правую ногу',
    startScheme2: 'Поднимите правую руку и левую ногу',
    hold: 'Удерживайте положение',
    miniRest: 'Опустите руку и ногу',
    miniRestScheme1: 'Опустите левую руку и правую ногу',
    miniRestScheme2: 'Опустите правую руку и левую ногу',
    rest: 'Отдых',
    schemeCompleted: 'Первая схема завершена! Нажмите СТАРТ для второй схемы',
    completed: 'Упражнение завершено!'
  },
  walk: {
    prepare: 'Приготовьтесь к выполнению упражнения',
    start: 'Начните ходьбу. Держите спину ровно.',
    hold: 'Продолжайте ходьбу. Держите спину ровно.',
    miniRest: '',
    rest: '',
    completed: 'Упражнение завершено!'
  }
};

// Универсальные инструкции для новых упражнений
const DEFAULT_INSTRUCTIONS: Record<string, string> = {
  prepare: 'Приготовьтесь',
  start: 'Выполняйте упражнение',
  hold: 'Удерживайте положение',
  miniRest: 'Отдых',
  rest: 'Отдых',
  rolling: 'Прокатывайте мышцу',
  completed: 'Упражнение завершено!'
};

/**
 * Функция получения инструкций с fallback
 */
export const getInstructions = (exerciseId: string): Record<string, string> => {
  if (exerciseId in EXERCISE_INSTRUCTIONS) {
    return EXERCISE_INSTRUCTIONS[exerciseId as ExerciseType];
  }
  return DEFAULT_INSTRUCTIONS;
};
