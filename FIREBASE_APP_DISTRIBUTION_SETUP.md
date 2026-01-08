# Настройка Firebase App Distribution

## Что было сделано

✅ Добавлен Firebase App Distribution Gradle плагин
✅ Настроена конфигурация в `android/app/build.gradle`
✅ Созданы скрипты для автоматической сборки и загрузки

## Что нужно сделать для завершения настройки

### Шаг 1: Установка Firebase CLI

Установите Firebase CLI одним из способов:

**Через npm (рекомендуется):**
```bash
npm install -g firebase-tools
```

**Через Chocolatey (Windows):**
```bash
choco install firebase-cli
```

**Скачать напрямую:**
https://firebase.google.com/docs/cli#install_the_firebase_cli

### Шаг 2: Авторизация в Firebase

После установки CLI выполните:
```bash
firebase login
```

Откроется браузер для авторизации через Google аккаунт.

### Шаг 3: Настройка тестеров в Firebase Console

1. Откройте Firebase Console: https://console.firebase.google.com/
2. Выберите ваш проект: **back-rehab**
3. Перейдите в **App Distribution** в левом меню
4. Нажмите **Get started** (если это первый раз)
5. Создайте группу тестеров:
   - Нажмите на вкладку **Testers & Groups**
   - Нажмите **Add Group**
   - Назовите группу: **testers**
   - Добавьте email адреса тестеров
   - Нажмите **Save**

### Шаг 4: Первая загрузка APK

После завершения настройки, вы можете загрузить APK двумя способами:

#### Способ 1: Через PowerShell скрипт (рекомендуется)
```powershell
.\build_and_distribute.ps1
```

#### Способ 2: Через Bash скрипт
```bash
./build_and_distribute.sh
```

#### Способ 3: Вручную
```bash
cd android
.\gradlew assembleRelease
.\gradlew appDistributionUploadRelease
```

## Автоматическое использование Claude Code

После настройки я (Claude Code) смогу автоматически:

1. ✅ Собирать APK файл
2. ✅ Загружать его в Firebase App Distribution
3. ✅ Тестировщики автоматически получат уведомление о новой версии

Просто скажите мне: **"Собери и загрузи APK"**, и я выполню всю работу!

## Конфигурация

Текущие настройки в `android/app/build.gradle`:

```gradle
firebaseAppDistribution {
    releaseNotes = "Автоматическая сборка для тестирования"
    groups = "testers"
}
```

### Дополнительные настройки (опционально)

Вы можете изменить конфигурацию:

```gradle
firebaseAppDistribution {
    releaseNotes = "Описание изменений в новой версии"
    releaseNotesFile = "/path/to/releasenotes.txt"
    groups = "testers, qa-team, developers"
    testers = "tester1@example.com, tester2@example.com"
    serviceCredentialsFile = "/path/to/serviceAccountKey.json" // Для CI/CD
}
```

## Troubleshooting

### Ошибка аутентификации
```bash
firebase login --reauth
```

### Ошибка при загрузке
Убедитесь что:
- Вы авторизованы в Firebase CLI
- Группа "testers" создана в Firebase Console
- У вас есть права на проект в Firebase

### Проверка статуса
```bash
firebase projects:list
```

## Полезные команды

```bash
# Список проектов
firebase projects:list

# Выбор проекта
firebase use back-rehab

# Выход из аккаунта
firebase logout

# Повторная авторизация
firebase login
```

## Информация о проекте

- **Project ID**: back-rehab
- **Package Name**: com.backrehabfinal
- **App ID**: 1:762497964544:android:e3a28cdc73bf971d7296e5

---

После завершения настройки, вы сможете автоматически распространять обновления приложения среди тестеров без необходимости вручную отправлять APK файлы!
