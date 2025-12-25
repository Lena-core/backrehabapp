# Устаревшие файлы

Эта папка содержит неиспользуемые файлы-дубликаты, которые были перемещены сюда в процессе рефакторинга.

## Файлы в этой папке:

### Экраны (Screens):
1. **ExerciseExecutionScreen.broken.tsx** - сломанная версия экрана выполнения упражнений
2. **ExerciseExecutionScreen.clean.tsx** - черновик экрана выполнения упражнений
3. **ExerciseExecutionScreen.minimal.tsx** - минимальная версия экрана выполнения упражнений
4. **ExerciseExecutionScreen.old.tsx** - старая версия экрана выполнения упражнений
5. **PainTrackerScreenLocalized.tsx** - неиспользуемая локализованная версия трекера боли

### Компоненты (Components):
6. **ExerciseAnimation.tsx** - компонент отображения анимации упражнений (не используется)
7. **ExerciseParameters.tsx** - компонент отображения параметров упражнений (не используется)
8. **SetsProgress.tsx** - компонент прогресса подходов (не используется)

### Утилиты (Utils):
9. **errorHandling.ts** - ПОЛНЫЙ ФАЙЛ с функциями обработки ошибок (не используется)

## Статус:
✅ Эти файлы НЕ используются в коде приложения
✅ Активный файл: `src/screens/ExerciseExecutionScreen.tsx`
✅ Активный файл: `src/screens/PainTrackerScreen.tsx`
✅ Активные компоненты перечислены в `src/components/index.ts`
✅ Активные утилиты: `src/utils/storage.ts`, `src/utils/onboardingUtils.ts`

## Удаленные функции из активных файлов:

### Из storage.ts (удалено 5 функций):
- `getUserSettings()` - заменена на хук `useUserSettings`
- `saveUserSettings()` - заменена на хук `useUserSettings`
- `formatTime()` - не используется
- `getPainLevelRecommendation()` - не используется
- `clearAllData()` - отладочная функция

### Из onboardingUtils.ts (удалено 5 функций):
- `getSettingsExplanation()` - не используется
- `getAllRecommendations()` - не используется
- `validateExerciseSettings()` - не используется
- `validateWalkSettings()` - не используется
- `calculateExerciseDuration()` - не используется

**Примечание:** Функции `shouldShowExercises()`, `formatExerciseSettingsDescription()`, `formatWalkSettingsDescription()` были восстановлены в onboardingUtils.ts, так как используются в ExercisePreviewScreen.

## Действия:
Вы можете безопасно удалить всю папку `deprecated_files` вместе со всем содержимым.

**Дата перемещения:** 2024-12-25
**Всего удалено:** 8 файлов + 1 полный файл utils + 10 неиспользуемых функций
