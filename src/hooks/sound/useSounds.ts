import { useEffect, useState } from 'react';
import Sound from 'react-native-sound';

// Типы звуков для разных событий таймера
export type SoundType = 
  | 'prepare'      // Звук начала подготовки
  | 'start'        // Звук начала упражнения
  | 'rest'         // Звук перехода к отдыху
  | 'nextSet'      // Звук перехода к следующему подходу
  | 'complete'     // Звук завершения упражнения
  | 'warning'      // Предупреждающий звук (за 3 секунды до конца)
  | 'tick';        // Звук секунды (опционально)

interface SoundMap {
  [key: string]: Sound | null;
}

// Пути к звуковым файлам
const SOUND_FILES: Record<SoundType, string> = {
  prepare: 'prepare.mp3',
  start: 'start.mp3', 
  rest: 'rest.mp3',
  nextSet: 'next_set.mp3',
  complete: 'complete.mp3',
  warning: 'warning.mp3',
  tick: 'tick.mp3',
};

export const useSounds = () => {
  const [sounds, setSounds] = useState<SoundMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    // Включаем воспроизведение звуков для React Native
    Sound.setCategory('Playback');
    loadSounds();

    return () => {
      // Освобождаем ресурсы при размонтировании
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.release();
        }
      });
    };
  }, []);

  const loadSounds = async () => {
    const loadedSounds: SoundMap = {};
    let loadCount = 0;
    const totalSounds = Object.keys(SOUND_FILES).length;

    const onLoadComplete = () => {
      loadCount++;
      if (loadCount === totalSounds) {
        setSounds(loadedSounds);
        setIsLoaded(true);
      }
    };

    // Загружаем все звуковые файлы
    Object.entries(SOUND_FILES).forEach(([type, filename]) => {
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
