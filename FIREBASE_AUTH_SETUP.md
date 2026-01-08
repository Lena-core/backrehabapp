# Настройка Firebase авторизации для автоматической загрузки APK

## Проблема
Firebase CLI не может выполнить интерактивную авторизацию через Claude Code, так как требуется открытие браузера.

## Решения

### Вариант 1: Генерация CI токена (Рекомендуется для быстрого старта)

1. Откройте **обычный терминал** (PowerShell или CMD) на вашем компьютере

2. Выполните команду для генерации токена:
```bash
firebase login:ci
```

3. Откроется браузер для авторизации - войдите в свой Google аккаунт

4. После успешной авторизации в терминале появится токен, например:
```
1//0example-token-here
```

5. Скопируйте этот токен и установите переменную окружения:

**Windows PowerShell:**
```powershell
$env:FIREBASE_TOKEN="1//0example-token-here"
```

**Windows CMD:**
```cmd
set FIREBASE_TOKEN=1//0example-token-here
```

**Для постоянного использования** (добавить в системные переменные):
- Откройте "Система" → "Дополнительные параметры системы" → "Переменные среды"
- Создайте новую переменную `FIREBASE_TOKEN` со значением токена

6. После установки токена скажите мне: **"загрузи APK"**

### Вариант 2: Service Account (Рекомендуется для продакшена)

1. Откройте Google Cloud Console: https://console.cloud.google.com/

2. Выберите проект **back-rehab**

3. Перейдите в "IAM & Admin" → "Service Accounts"

4. Создайте новый Service Account:
   - Name: `firebase-app-distribution`
   - Role: `Firebase App Distribution Admin`

5. Создайте JSON ключ:
   - Нажмите на созданный Service Account
   - Перейдите в "Keys" → "Add Key" → "Create new key"
   - Выберите JSON формат
   - Сохраните файл в безопасное место, например: `C:\Projects\BackRehabFinal\firebase-key.json`

6. Я обновлю конфигурацию gradle для использования Service Account

7. **ВАЖНО**: Добавьте `firebase-key.json` в `.gitignore`, чтобы не закоммитить секретный ключ!

### Вариант 3: Авторизация в обычном терминале

1. Откройте **обычный PowerShell/CMD** (не через Claude Code)

2. Перейдите в директорию проекта:
```bash
cd C:\Projects\BackRehabFinal
```

3. Выполните авторизацию:
```bash
firebase login
```

4. После успешной авторизации, я смогу использовать ваши credentials для загрузки

## Проверка авторизации

После выполнения одного из вариантов, проверьте:

```bash
firebase projects:list
```

Должен отобразиться список ваших проектов, включая **back-rehab**.

## Следующие шаги

После настройки авторизации, я смогу автоматически:

1. ✅ Собирать APK
2. ✅ Загружать в Firebase App Distribution
3. ✅ Отправлять уведомления тестерам

Просто скажите: **"Собери и загрузи APK"** или **"загрузи последний APK"**

## Текущий статус

- ✅ Firebase App Distribution настроен в gradle
- ✅ Скрипты автоматизации созданы
- ⏳ Требуется авторизация (один из вариантов выше)
- ⏳ Требуется создание группы тестеров в Firebase Console

## Полезные ссылки

- Firebase Console: https://console.firebase.google.com/project/back-rehab
- Google Cloud Console: https://console.cloud.google.com/
- Firebase CLI документация: https://firebase.google.com/docs/cli
