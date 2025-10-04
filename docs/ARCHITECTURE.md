# Back Rehab - Architecture

## 🏗 Общая архитектура

Приложение построено на **компонентно-ориентированной архитектуре** с использованием следующих паттернов:

- **React Hooks** - основной способ управления состоянием и побочными эффектами
- **Context API** - для глобального состояния (онбординг)
- **Custom Hooks** - инкапсуляция бизнес-логики (настройки, таймеры, звуки)
- **AsyncStorage** - персистентность данных локально на устройстве
- **Firebase Messaging** - push-уведомления

## 📁 Структура папок

```
BackRehabFinal/
├── src/
│   ├── App.tsx                      # Главный компонент приложения
│   ├── NotificationService.js       # Сервис уведомлений (Firebase)
│   │
│   ├── screens/                     # Экраны приложения
│   │   ├── onboarding/             # Онбординг (7 экранов)
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── MedicalDisclaimerScreen.tsx
│   │   │   ├── PainLevelScreen.tsx
│   │   │   ├── PainApproachScreen.tsx
│   │   │   ├── ExercisePreviewScreen.tsx
│   │   │   ├── NotificationSetupScreen.tsx
│   │   │   ├── ReadyScreen.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── DayPlanScreen.tsx        # Главный экран с планом дня
│   │   ├── ExerciseExecutionScreen.tsx  # Выполнение упражнения
│   │   ├── PainTrackerScreen.tsx    # Трекер боли
│   │   ├── SettingsMainScreen.tsx   # Главное меню настроек
│   │   ├── ExerciseSettingsScreen.tsx   # Настройка упражнений
│   │   ├── NotificationsScreen.tsx  # Управление уведомлениями
│   │   ├── FeedbackScreen.tsx       # Обратная связь
│   │   ├── UserAgreementScreen.tsx  # Пользовательское соглашение
│   │   └── PrivacyPolicyScreen.tsx  # Политика конфиденциальности
│   │
│   ├── components/                  # Переиспользуемые компоненты
│   │   ├── ui/                     # Базовые UI элементы (пусто)
│   │   ├── settings/               # Компоненты настроек (пусто)
│   │   ├── CustomButton.tsx        # Кастомная кнопка
│   │   ├── ExerciseCard.tsx        # Карточка упражнения
│   │   ├── ExerciseAnimation.tsx   # Анимация/видео упражнения
│   │   ├── ExerciseParameters.tsx  # Настройка параметров упражнения
│   │   ├── SetsProgress.tsx        # Прогресс подходов
│   │   ├── PainLevelCard.tsx       # Карточка выбора уровня боли
│   │   ├── NotificationCard.tsx    # Карточка уведомления
│   │   ├── LoadingComponents.tsx   # Компоненты загрузки
│   │   └── index.ts
│   │
│   ├── navigation/                  # Навигация
│   │   ├── OnboardingNavigator.tsx  # Stack навигация онбординга
│   │   └── SettingsStackNavigator.tsx  # Stack навигация настроек
│   │
│   ├── contexts/                    # React Context
│   │   ├── OnboardingContext.tsx    # Контекст онбординга
│   │   └── index.ts
│   │
│   ├── hooks/                       # Custom Hooks
│   │   ├── sound/
│   │   │   └── useSounds.ts        # Управление звуками
│   │   ├── useUserSettings.ts      # Управление настройками пользователя
│   │   ├── useExerciseTimer.ts     # Таймер для упражнений
│   │   └── index.ts
│   │
│   ├── constants/                   # Константы
│   │   ├── exercises/
│   │   │   ├── animations.ts       # Анимации упражнений
│   │   │   └── descriptions.ts     # Описания упражнений
│   │   ├── colors.ts               # Цветовая палитра
│   │   ├── translations.ts         # Локализация
│   │   ├── onboardingContent.ts    # Контент онбординга
│   │   └── index.ts
│   │
│   ├── types/                       # TypeScript типы
│   │   └── index.ts                # Все типы приложения
│   │
│   ├── utils/                       # Утилиты
│   │   ├── storage.ts              # Работа с AsyncStorage
│   │   ├── onboardingUtils.ts      # Утилиты онбординга
│   │   ├── errorHandling.ts        # Обработка ошибок
│   │   └── index.ts
│   │
│   ├── theme/                       # Темизация (пусто)
│   └── assets/                      # Медиа файлы (изображения, звуки, видео)
│
├── android/                         # Android нативный код
├── ios/                             # iOS нативный код
├── docs/                            # Документация
├── App.tsx                          # Корневой файл приложения
└── index.js                         # Entry point
```

## 🖥 Детальное описание экранов

### Основные экраны

| Экран | Файл | Назначение |
|-------|------|------------|
| **План дня** | `DayPlanScreen.tsx` | Главный экран. Отображает карточки упражнений на день с кнопками запуска |
| **Выполнение упражнения** | `ExerciseExecutionScreen.tsx` | Экран выполнения упражнения с таймером, счётчиком подходов, анимацией и звуками |
| **Трекер боли** | `PainTrackerScreen.tsx` | Отслеживание уровня боли с визуальными карточками (5 уровней) |
| **Главные настройки** | `SettingsMainScreen.tsx` | Главное меню настроек с навигацией к подразделам |
| **Настройки упражнений** | `ExerciseSettingsScreen.tsx` | Настройка параметров: holdTime, repsSchema, restTime, walkSettings |
| **Настройки уведомлений** | `NotificationsScreen.tsx` | Управление тремя типами уведомлений (включение/выключение, время) |
| **Обратная связь** | `FeedbackScreen.tsx` | Форма обратной связи |
| **Пользовательское соглашение** | `UserAgreementScreen.tsx` | Текст пользовательского соглашения |
| **Политика конфиденциальности** | `PrivacyPolicyScreen.tsx` | Текст политики конфиденциальности |

### Онбординг экраны (7 шагов)

| Порядок | Экран | Файл | Назначение |
|---------|-------|------|------------|
| 1 | **Приветствие** | `WelcomeScreen.tsx` | Приветственный экран с описанием приложения |
| 2 | **Медицинский дисклеймер** | `MedicalDisclaimerScreen.tsx` | Предупреждение о консультации с врачом |
| 3 | **Уровень боли** | `PainLevelScreen.tsx` | Первичная оценка уровня боли пользователя |
| 4 | **Подход к боли** | `PainApproachScreen.tsx` | Объяснение подхода к работе с болью |
| 5 | **Превью упражнений** | `ExercisePreviewScreen.tsx` | Знакомство с упражнениями |
| 6 | **Настройка уведомлений** | `NotificationSetupScreen.tsx` | Настройка времени уведомлений |
| 7 | **Готовность** | `ReadyScreen.tsx` | Финальный экран перед началом использования |

## 🧩 Компоненты

### UI компоненты

| Компонент | Файл | Описание |
|-----------|------|----------|
| **CustomButton** | `CustomButton.tsx` | Переиспользуемая кнопка с кастомными стилями |
| **ExerciseCard** | `ExerciseCard.tsx` | Карточка упражнения для отображения в списке (название, параметры, кнопка старта) |
| **ExerciseAnimation** | `ExerciseAnimation.tsx` | Компонент для отображения анимации/видео упражнения |
| **ExerciseParameters** | `ExerciseParameters.tsx` | Компонент для настройки параметров упражнения (слайдеры, инпуты) |
| **SetsProgress** | `SetsProgress.tsx` | Визуализация прогресса выполнения подходов |
| **PainLevelCard** | `PainLevelCard.tsx` | Карточка для выбора уровня боли (визуальная кнопка) |
| **NotificationCard** | `NotificationCard.tsx` | Карточка настройки одного типа уведомлений |
| **LoadingComponents** | `LoadingComponents.tsx` | Компоненты состояний загрузки |

### Папки компонентов

- `components/ui/` - предназначена для базовых UI элементов (пока пустая)
- `components/settings/` - предназначена для компонентов настроек (пока пустая)

## 🪝 Custom Hooks

### useUserSettings

**Файл:** `src/hooks/useUserSettings.ts`

**Назначение:** Управление настройками пользователя с автоматической синхронизацией через global listeners.

**Возвращает:**
```typescript
{
  settings: UserSettings | null;    // Текущие настройки
  loading: boolean;                 // Статус загрузки
  error: string | null;             // Ошибки
  loadSettings: () => Promise<void>; // Загрузка настроек
  saveSettings: (newSettings: UserSettings) => Promise<void>; // Сохранение
}
```

**Особенности:**
- Глобальные listeners для синхронизации изменений между экранами
- Функция `triggerSettingsUpdate()` для принудительного обновления
- Default настройки:
  ```typescript
  {
    exerciseSettings: {
      holdTime: 7,
      repsSchema: [3, 2, 1],
      restTime: 15
    },
    walkSettings: {
      duration: 5,
      sessions: 3
    },
    notificationSettings: {
      exerciseReminders: { enabled: true, time: { hour: 9, minute: 0 } },
      spineHygieneTips: { enabled: true, time: { hour: 14, minute: 0 } },
      educationalMessages: { enabled: true, time: { hour: 20, minute: 0 } }
    }
  }
  ```

### useExerciseTimer

**Файл:** `src/hooks/useExerciseTimer.ts`

**Назначение:** Управление таймером для выполнения упражнений (hold time, rest time, подходы).

### useSounds

**Файл:** `src/hooks/sound/useSounds.ts`

**Назначение:** Управление звуковыми сигналами в приложении (react-native-sound).

## 🌐 Contexts

### OnboardingContext

**Файл:** `src/contexts/OnboardingContext.tsx`

**Назначение:** Глобальное состояние онбординга для определения, прошёл ли пользователь первичную настройку.

**Состояние:**
```typescript
{
  hasCompletedOnboarding: boolean;  // Завершён ли онбординг
  isLoading: boolean;               // Загрузка статуса
  completeOnboarding: () => Promise<void>; // Завершение онбординга
}
```

**Использование:**
- Проверяет ключ `@onboarding_completed` в AsyncStorage
- Показывает OnboardingNavigator или TabNavigator в зависимости от статуса

## 🛠 Utils (Утилиты)

### storage.ts

**Файл:** `src/utils/storage.ts`

**Назначение:** Утилиты для работы с AsyncStorage.

**Storage Keys:**
```typescript
STORAGE_KEYS = {
  LAST_PAIN_STATUS: 'lastPainStatus',           // Последний статус боли
  PAIN_STATUS_PREFIX: 'painStatus_',            // Префикс для записей боли по датам
  EXERCISES_PREFIX: 'exercises_',               // Префикс для упражнений
  USER_SETTINGS: 'userSettings',                // Настройки пользователя
}
```

**Основные функции:**
- `getCurrentDateString()` - возвращает дату в формате YYYY-MM-DD
- `getTodayPainStatus()` - получает уровень боли за сегодня
- Сохранение/загрузка PainStatus по датам

### onboardingUtils.ts

**Файл:** `src/utils/onboardingUtils.ts`

**Назначение:** Утилиты для работы с онбордингом (проверка статуса, сохранение).

### errorHandling.ts

**Файл:** `src/utils/errorHandling.ts`

**Назначение:** Централизованная обработка ошибок в приложении.

## 📦 Constants (Константы)

### colors.ts

**Файл:** `src/constants/colors.ts`

**Назначение:** Цветовая палитра приложения.

**Основные цвета:**
- `PRIMARY_ACCENT` - основной акцентный цвет
- `SECONDARY_ACCENT` - вторичный акцентный цвет
- `TEXT_INACTIVE` - цвет неактивного текста
- `WHITE` - белый фон

### translations.ts

**Файл:** `src/constants/translations.ts`

**Назначение:** Все текстовые строки приложения для локализации (русский язык).

### onboardingContent.ts

**Файл:** `src/constants/onboardingContent.ts`

**Назначение:** Контент для экранов онбординга (тексты, описания).

### exercises/animations.ts

**Файл:** `src/constants/exercises/animations.ts`

**Назначение:** Анимации/видео для упражнений.

### exercises/descriptions.ts

**Файл:** `src/constants/exercises/descriptions.ts`

**Назначение:** Текстовые описания упражнений, инструкции.

## 🗺 Навигация

### Структура навигации

```
RootStack (Stack.Navigator)
├── Onboarding (Stack) - если не завершён
│   ├── Welcome
│   ├── MedicalDisclaimer
│   ├── PainLevel
│   ├── PainApproach
│   ├── ExercisePreview
│   ├── NotificationSetup
│   └── Ready
│
└── MainApp (Tab.Navigator) - если завершён
    ├── Home (Tab) - DayPlanScreen
    │   └── ExerciseExecution (Modal/Stack)
    │
    ├── Profile (Tab) - PainTrackerScreen
    │
    └── Settings (Tab) - SettingsStackNavigator
        ├── SettingsMain
        ├── ExerciseSettings
        ├── Notifications
        ├── Feedback
        ├── UserAgreement
        └── PrivacyPolicy
```

### Навигационные параметры

```typescript
// Root Stack
type RootStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
  ExerciseExecution: { exerciseId: string };
};

// Tab Navigator
type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};
```

### OnboardingNavigator.tsx

**Назначение:** Stack навигация для 7 экранов онбординга.

### SettingsStackNavigator.tsx

**Назначение:** Stack навигация внутри таба Settings для вложенных экранов настроек.

## 🔔 NotificationService

**Файл:** `src/NotificationService.js`

**Назначение:** Сервис для работы с push-уведомлениями через Firebase Messaging.

**Функции:**
- Инициализация Firebase Messaging
- Запрос разрешений на уведомления
- Получение FCM токена
- Планирование локальных уведомлений (3 типа)
- Обработка уведомлений на переднем плане и в фоне
- Отмена уведомлений

**Используемые библиотеки:**
- `@react-native-firebase/messaging`
- `react-native-push-notification`

## 🎯 Паттерны кода

### 1. Default Settings Pattern

Каждый hook с настройками предоставляет default значения:

```typescript
const getDefaultSettings = (): UserSettings => ({
  exerciseSettings: { holdTime: 7, repsSchema: [3, 2, 1], restTime: 15 },
  walkSettings: { duration: 5, sessions: 3 },
  notificationSettings: { /* ... */ }
});
```

### 2. Global Listeners Pattern

Для синхронизации состояния между компонентами используются глобальные listeners:

```typescript
const settingsListeners: SettingsListener[] = [];

const notifySettingsChanged = () => {
  settingsListeners.forEach(listener => listener());
};

export const triggerSettingsUpdate = () => {
  notifySettingsChanged();
};
```

### 3. Error Handling Pattern

Все асинхронные операции обёрнуты в try-catch:

```typescript
try {
  const data = await AsyncStorage.getItem(key);
  // ...
} catch (error) {
  console.error('Error:', error);
  setError('Error message');
}
```

### 4. Date Formatting Pattern

Даты хранятся в формате YYYY-MM-DD:

```typescript
const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};
```

### 5. AsyncStorage Keys Pattern

Все ключи определены в константах:

```typescript
STORAGE_KEYS = {
  LAST_PAIN_STATUS: 'lastPainStatus',
  PAIN_STATUS_PREFIX: 'painStatus_',  // + дата
  USER_SETTINGS: 'userSettings',
};
```

## 💾 AsyncStorage Structure

### Ключи и значения

| Ключ | Тип | Описание |
|------|-----|----------|
| `@onboarding_completed` | `boolean` | Завершён ли онбординг |
| `lastPainStatus` | `PainStatus` | Последний статус боли |
| `painStatus_YYYY-MM-DD` | `PainStatus` | Статус боли за конкретную дату |
| `exercises_YYYY-MM-DD` | `Exercise[]` | Выполненные упражнения за дату |
| `userSettings` | `UserSettings` | Все настройки пользователя |

### Формат данных

```typescript
// PainStatus
{
  level: 'none' | 'mild' | 'moderate' | 'severe' | 'acute',
  date: '2025-10-04',
  timestamp: 1728000000000
}

// UserSettings
{
  exerciseSettings: {
    holdTime: 7,
    repsSchema: [3, 2, 1],
    restTime: 15
  },
  walkSettings: {
    duration: 5,
    sessions: 3
  },
  notificationSettings: {
    exerciseReminders: { enabled: true, time: { hour: 9, minute: 0 } },
    spineHygieneTips: { enabled: true, time: { hour: 14, minute: 0 } },
    educationalMessages: { enabled: true, time: { hour: 20, minute: 0 } }
  }
}
```

## 🔄 Data Flow

### Загрузка настроек
```
App Start → OnboardingContext.checkOnboarding()
         → useUserSettings.loadSettings()
         → AsyncStorage.getItem('userSettings')
         → Parse JSON or use defaults
         → setState(settings)
```

### Сохранение настроек
```
User changes settings → saveSettings(newSettings)
                     → AsyncStorage.setItem('userSettings', JSON.stringify(settings))
                     → triggerSettingsUpdate()
                     → notifySettingsChanged()
                     → All listeners refresh their state
```

### Трекинг боли
```
User selects pain level → PainTrackerScreen
                       → Create PainStatus object
                       → AsyncStorage.setItem('painStatus_YYYY-MM-DD', JSON)
                       → AsyncStorage.setItem('lastPainStatus', JSON)
```

## 🎨 Theme System

В данный момент `src/theme/` пустая, но предназначена для:
- Централизованного управления темой
- Возможной поддержки тёмной темы в будущем
- Styled components или theme provider

---

**Дата создания**: 2025-10-04
**Версия**: 0.0.1
