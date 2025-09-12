import { useEffect, useState } from 'react';
import Sound from 'react-native-sound';
import { ExerciseType } from '../types';

// Новые типы звуков согласно таблице
export type SoundType = 
  | 'prepare'      // Подготовка (5 сек)
  | 'start'        // Начало упражнения
  | 'hold'         // Удержание (только если время > 10 сек)
  | 'finish'       // Мини-отдых (3 сек)
  | 'rest'         // Отдых между подходами
  | 'completed';   // Завершение

interface SoundMap {
  [key: string]: Sound | null;
}

// Пути к звуковым файлам для каждого упражнения
const SOUND_FILES: Record<ExerciseType, Record<SoundType, string>> = {
  curl_up: {
    prepare: 'prepare.mp3',        // Общий файл для всех
    start: 'start_curl_up.mp3',    // Уникальный для curl_up
    hold: 'hold.mp3',              // Общий файл для всех
    finish: 'finish_curl_up.mp3',  // Уникальный для curl_up
    rest: 'rest.mp3',              // Общий файл для всех
    completed: 'complete.mp3',     // Общий файл для всех
  },
  side_plank: {
    prepare: 'prepare.mp3',           // Общий файл для всех
    start: 'start_side_plank.mp3',    // Уникальный для side_plank
    hold: 'hold.mp3',                 // Общий файл для всех
    finish: 'finish_side_plank.mp3',  // Уникальный для side_plank
    rest: 'rest.mp3',                 // Общий файл для всех
    completed: 'complete.mp3',        // Общий файл для всех
  },
  bird_dog: {
    prepare: 'prepare.mp3',         // Общий файл для всех
    start: 'bird_dog_start.mp3',    // Уникальный для bird_dog
    hold: 'hold.mp3',               // Общий файл для всех
    finish: 'bird_dog_finish.mp3',  // Уникальный для bird_dog
    rest: 'rest.mp3',               // Общий файл для всех
    completed: 'complete.mp3',      // Общий файл для всех
  },
  // Для ходьбы - специальные звуки
  walk: {
    prepare: 'prepare.mp3',
    start: 'walk_start.mp3',     // Уникальный звук для начала ходьбы
    hold: 'warning.mp3',
    finish: 'warning.mp3',
    rest: 'rest.mp3',
    completed: 'complete.mp3',   // Звук завершения
  },
};

export const useSounds = (exerciseType: ExerciseType) => {
  const [sounds, setSounds] = useState<SoundMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    Sound.setCategory('Playback');
    loadSounds();

    return () => {
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.release();
        }
      });
    };
  }, [exerciseType]);

  const loadSounds = async () => {
    const loadedSounds: SoundMap = {};
    let loadCount = 0;
    const exerciseSounds = SOUND_FILES[exerciseType];
    const totalSounds = Object.keys(exerciseSounds).length;

    const onLoadComplete = () => {
      loadCount++;
      if (loadCount === totalSounds) {
        setSounds(loadedSounds);
        setIsLoaded(true);
      }
    };

    Object.entries(exerciseSounds).forEach(([type, filename]) => {
      const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log(`Ошибка загрузки звука ${filename}:`, error);
          loadedSounds[type] = null;
        } else {
          console.log(`Звук ${filename} загружен успешно`);
          loadedSounds[type] = sound;
        }
        onLoadComplete();
      });
    });
  };

  const playSound = (type: SoundType, volume: number = 1.0) => {
    if (!isSoundEnabled || !isLoaded) {
      return;
    }

    const sound = sounds[type];
    if (sound) {
      sound.setVolume(volume);
      sound.play((success) => {
        if (!success) {
          console.log(`Ошибка воспроизведения звука ${type}`);
        }
      });
    } else {
      console.log(`Звук ${type} не загружен`);
    }
  };

  const toggleSoundEnabled = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const stopAllSounds = () => {
    Object.values(sounds).forEach(sound => {
      if (sound) {
        sound.stop();
      }
    });
  };

  return {
    playSound,
    isSoundEnabled,
    toggleSoundEnabled,
    stopAllSounds,
    isLoaded,
  };
};
