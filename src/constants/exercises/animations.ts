import { ExerciseType } from '../../types';

// Пути к анимационным файлам
export const EXERCISE_ANIMATIONS: Record<ExerciseType, any> = {
  curl_up: require('../../assets/animations/curl_up.gif'),
  side_plank: require('../../assets/animations/side_plank.gif'),
  bird_dog: require('../../assets/animations/bird_dog.gif'), 
  walk: require('../../assets/animations/walk.gif'),
};

// Альтернативные пути для Android assets
export const EXERCISE_ANIMATIONS_URI: Record<ExerciseType, string> = {
  curl_up: 'file:///android_asset/animations/curl_up.gif',
  side_plank: 'file:///android_asset/animations/side_plank.gif', 
  bird_dog: 'file:///android_asset/animations/bird_dog.gif',
  walk: 'file:///android_asset/animations/walk.gif',
};

// Fallback анимация
export const DEFAULT_PLACEHOLDER = require('../../assets/animations/curl_up.gif');
