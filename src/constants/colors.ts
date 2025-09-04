// Цветовая палитра согласно ТЗ
export const COLORS = {
  // Основные цвета
  WHITE: '#FFFFFF',
  BACKGROUND_TOP: '#FFFFFF',
  BACKGROUND_BOTTOM: '#FEF5DA',
  CONTENT_BACKGROUND: '#FEFDF8',
  
  // Цвета для уровней боли
  PAIN_ACUTE: '#F2B2A5',      // Острая боль (розово-персиковый)
  PAIN_SEVERE: '#B6C5E1',     // Сильно болит (серо-голубой)
  PAIN_MODERATE: '#E0EBEB',   // Болит (светло-голубой)
  PAIN_MILD: '#F5EACF',       // Немного болит (светло-бежевый)
  PAIN_NONE: '#FDE7B1',       // Все хорошо (бледно-желтый)
  
  // Акцентные цвета
  PRIMARY_ACCENT: '#FDE7B1',  // Основной акцент (бледно-желтый)
  SECONDARY_ACCENT: '#F2B2A5', // Вторичный акцент (розово-персиковый)
  CTA_BUTTON: '#FEE370',      // Кнопки действий (желтый)
  SCALE_COLOR: '#F9EEBC',     // Цвет шкалы боли
  PROGRESS_ACTIVE: '#FEFB71A', // Активный прогресс
  
  // Цвета текста
  TEXT_PRIMARY: '#2D2D2D',    // Основной текст (темно-серый)
  TEXT_INACTIVE: '#D6D6D6',   // Неактивные элементы (серый)
};

// Градиенты
export const GRADIENTS = {
  MAIN_BACKGROUND: [COLORS.WHITE, COLORS.BACKGROUND_BOTTOM],
  CONTENT_BACKGROUND: [COLORS.CONTENT_BACKGROUND, COLORS.BACKGROUND_BOTTOM],
};
