# Back Rehab - Project Overview

## 📱 О проекте

**Back Rehab** - мобильное приложение для реабилитации спины через систему упражнений. Приложение помогает пользователям выполнять специализированные упражнения с правильными параметрами и отслеживать своё состояние.

## 🛠 Технологический стек

### Основа
- **React Native**: 0.81.1
- **TypeScript**: 5.8.3
- **React**: 19.1.0

### Навигация
- `@react-navigation/native`: 7.1.17
- `@react-navigation/bottom-tabs`: 7.4.7
- `@react-navigation/stack`: 7.4.8
- `react-native-screens`: 4.16.0
- `react-native-gesture-handler`: 2.28.0
- `react-native-safe-area-context`: 5.6.1

### Хранение данных
- `@react-native-async-storage/async-storage`: 2.2.0

### Уведомления
- `@react-native-firebase/app`: 23.3.1
- `@react-native-firebase/messaging`: 23.3.1
- `react-native-push-notification`: 8.1.1

### Медиа
- `react-native-sound`: 0.12.0
- `react-native-video`: 6.16.1

### UI
- `react-native-linear-gradient`: 2.8.3
- `react-native-vector-icons`: 10.3.0

## 🎯 Основные функции

### 1. Трекер боли (Pain Tracker)
- 5 уровней боли: `none`, `mild`, `moderate`, `severe`, `acute`
- История замеров с датами и временными метками
- Визуальные карточки для выбора уровня боли

### 2. План дня (Day Plan)
- Главный экран с упражнениями на день
- Карточки упражнений с параметрами
- Кнопка запуска выполнения упражнения

### 3. Выполнение упражнений (Exercise Execution)
- Таймер для удержания позы
- Счётчик подходов и повторений
- Отображение анимации/видео упражнения
- Звуковые сигналы и обратная связь
- Прогресс выполнения (SetsProgress)

### 4. Настройки упражнений
**ExerciseSettings:**
- `holdTime`: время удержания позы (3-10 секунд)
- `repsSchema`: схема подходов (например [3, 2, 1])
- `restTime`: время отдыха между подходами (5-30 секунд)

**WalkSettings:**
- `duration`: продолжительность прогулки (1-60 минут)
- `sessions`: количество сессий (1-5)

### 5. Система уведомлений
**3 типа уведомлений:**
- `exerciseReminders` - напоминания об упражнениях
- `spineHygieneTips` - советы о гигиене позвоночника
- `educationalMessages` - образовательные сообщения

**Каждое уведомление включает:**
- Включение/выключение (`enabled`)
- Время (`hour`, `minute`)

### 6. Onboarding
- Первичная настройка при запуске приложения
- Контекст `OnboardingContext` для управления состоянием
- Проверка `@onboarding_completed` в AsyncStorage

## 🗂 Структура навигации

```
RootStack
├── Onboarding (если не завершён)
└── TabNavigator (главная навигация)
    ├── Home (План дня) - DayPlanScreen
    ├── Profile (Самочувствие) - PainTrackerScreen
    └── Settings (Настройки) - SettingsStackNavigator
        ├── SettingsMain
        ├── ExerciseSettings
        ├── Notifications
        ├── Feedback
        ├── UserAgreement
        └── PrivacyPolicy
```

### Stack навигация для выполнения упражнений
- ExerciseExecutionScreen - открывается поверх табов

## 💾 Хранение данных

### AsyncStorage ключи
- `@user_settings` - настройки пользователя (ExerciseSettings, WalkSettings)
- `@onboarding_completed` - статус завершения onboarding (boolean)
- `@pain_history` - история замеров боли (массив PainStatus)
- `@notification_settings` - настройки уведомлений (NotificationSettings)

### Firebase
- **Firebase Messaging** - push-уведомления
- Токен FCM сохраняется при инициализации
- Обработка уведомлений в фоне и на переднем плане

## 🎨 Основные типы данных

```typescript
// Уровни боли
type PainLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'acute';

// Статус боли
interface PainStatus {
  level: PainLevel;
  date: string;
  timestamp: number;
}

// Настройки упражнений
interface ExerciseSettings {
  holdTime: number;      // 3-10 секунд
  repsSchema: number[];  // [3, 2, 1]
  restTime: number;      // 5-30 секунд
}

// Настройки прогулок
interface WalkSettings {
  duration: number;      // 1-60 минут
  sessions: number;      // 1-5 сессий
}

// Время уведомления
interface NotificationTime {
  hour: number;    // 0-23
  minute: number;  // 0-59
}

// Конфигурация уведомления
interface NotificationConfig {
  enabled: boolean;
  time: NotificationTime;
}

// Настройки всех уведомлений
interface NotificationSettings {
  exerciseReminders: NotificationConfig;
  spineHygieneTips: NotificationConfig;
  educationalMessages: NotificationConfig;
}
```

## 🔧 Среда разработки

- **IDE**: Visual Studio Code
- **Terminal**: PowerShell
- **Тестирование**: Metro bundler + USB подключение к физическому устройству
- **Платформы**: Android и iOS
- **Путь проекта**: `C:\Projects\BackRehabFinal`

## 📦 Команды для запуска

```bash
# Запуск Metro
npm start

# Запуск на Android
npm run android

# Запуск на iOS
npm run ios
bundle exec pod install  # если нужно обновить pods
```

## 🎯 Ключевые экраны

| Экран | Описание |
|-------|----------|
| `DayPlanScreen` | Главный экран с планом дня и упражнениями |
| `ExerciseExecutionScreen` | Выполнение упражнения с таймером |
| `PainTrackerScreen` | Трекинг уровня боли |
| `SettingsMainScreen` | Главное меню настроек |
| `ExerciseSettingsScreen` | Настройка параметров упражнений |
| `NotificationsScreen` | Управление уведомлениями |
| `FeedbackScreen` | Обратная связь |
| `OnboardingNavigator` | Первичная настройка приложения |

## 📚 Локализация

- Используется файл `translations.ts` для текстов
- Поддержка русского языка

## 🎨 Цветовая схема

Определена в `src/constants/colors.ts`:
- `PRIMARY_ACCENT` - основной акцент
- `SECONDARY_ACCENT` - вторичный акцент
- `TEXT_INACTIVE` - неактивный текст
- `WHITE` - белый фон

---

**Дата создания**: 2025-10-04
**Версия приложения**: 0.0.1
