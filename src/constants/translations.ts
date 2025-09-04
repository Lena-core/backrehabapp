// Локализация для приложения Back Rehab

export type Language = 'ru' | 'en';

interface Translations {
  // Pain Tracker Screen
  painTracker: {
    title: string;
    painLevels: {
      none: string;
      mild: string;
      moderate: string;
      severe: string;
      acute: string;
    };
    saveButton: string;
  };
  
  // Day Plan Screen  
  dayPlan: {
    title: string;
    recommendations: Record<string, string>;
    exercises: {
      curlUp: string;
      sidePlank: string;
      birdDog: string;
      walk: string;
    };
    startButton: string;
  };
  
  // Exercise Execution Screen
  exerciseExecution: {
    holdTime: string;
    schema: string;
    restTime: string;
    sessionDuration: string;
    numberOfSessions: string;
    completed: string;
  };
  
  // Settings Screen
  settings: {
    title: string;
    exerciseSettings: string;
    walkSettings: string;
    saveButton: string;
  };
  
  // Common
  common: {
    disclaimer: string;
    loading: string;
    error: string;
  };
}

const translations: Record<Language, Translations> = {
  ru: {
    painTracker: {
      title: 'Как Самочувствие?',
      painLevels: {
        none: 'Все хорошо',
        mild: 'Немного болит', 
        moderate: 'Болит',
        severe: 'Сильно болит',
        acute: 'Острая боль',
      },
      saveButton: 'Сохранить',
    },
    dayPlan: {
      title: 'План На День',
      recommendations: {
        none: 'Важно выполнить все упражнения, это укрепит мышцы спины и снизит риск рецидивов в будущем.',
        mild: 'При выполнении упражнений не переусердствуйте, опирайтесь на свои ощущения.',
        moderate: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
        severe: 'Опирайтесь на свои ощущения. Снизьте количество повторов упражнений до минимального. Обязательно походите.',
        acute: 'Рекомендуется отдохнуть от упражнений и подождать, когда боль снизится. Походите, если состояние это позволяет.',
      },
      exercises: {
        curlUp: 'Модифицированное скручивание',
        sidePlank: 'Боковая планка',
        birdDog: 'Птица-собака', 
        walk: 'Ходьба',
      },
      startButton: 'СТАРТ',
    },
    exerciseExecution: {
      holdTime: 'Время удержания',
      schema: 'Схема',
      restTime: 'Отдых',
      sessionDuration: 'Длительность сессии',
      numberOfSessions: 'Количество сессий',
      completed: 'Упражнение завершено. Отлично поработали.',
    },
    settings: {
      title: 'Настройки',
      exerciseSettings: 'Настройки Упражнений',
      walkSettings: 'Настройки Ходьбы',
      saveButton: 'Сохранить Настройки',
    },
    common: {
      disclaimer: 'Приведенная информация носит справочный характер. Если вам требуется медицинская консультация или постановка диагноза, обратитесь к специалисту.',
      loading: 'Загрузка...',
      error: 'Ошибка',
    },
  },
  
  en: {
    painTracker: {
      title: 'How Are You Feeling?',
      painLevels: {
        none: 'All Good',
        mild: 'Slightly Hurts',
        moderate: 'Hurts', 
        severe: 'Hurts Badly',
        acute: 'Acute Pain',
      },
      saveButton: 'Save',
    },
    dayPlan: {
      title: 'Daily Plan',
      recommendations: {
        none: 'It\'s important to complete all exercises to strengthen back muscles and reduce risk of future relapses.',
        mild: 'Don\'t overdo the exercises, listen to your body.',
        moderate: 'Listen to your body. Reduce repetitions to minimum. Make sure to walk.',
        severe: 'Listen to your body. Reduce repetitions to minimum. Make sure to walk.',
        acute: 'It\'s recommended to rest from exercises and wait for pain to subside. Walk if condition allows.',
      },
      exercises: {
        curlUp: 'Modified Curl-up',
        sidePlank: 'Side Plank',
        birdDog: 'Bird Dog',
        walk: 'Walking',
      },
      startButton: 'START',
    },
    exerciseExecution: {
      holdTime: 'Hold Time',
      schema: 'Schema',
      restTime: 'Rest Time',
      sessionDuration: 'Session Duration',
      numberOfSessions: 'Number of Sessions',
      completed: 'Exercise completed. Great job!',
    },
    settings: {
      title: 'Settings',
      exerciseSettings: 'Exercise Settings',
      walkSettings: 'Walking Settings',
      saveButton: 'Save Settings',
    },
    common: {
      disclaimer: 'This information is for reference only. If you need medical consultation or diagnosis, please consult a specialist.',
      loading: 'Loading...',
      error: 'Error',
    },
  },
};

// Хук для использования переводов
export const useTranslations = (language: Language = 'ru') => {
  return translations[language];
};

// Определение языка системы
export const getSystemLanguage = (): Language => {
  const systemLang = require('react-native').NativeModules.I18nManager?.localeIdentifier || 'ru';
  return systemLang.startsWith('en') ? 'en' : 'ru';
};
