# Инструкция по удалению пустых папок

## Следующие папки пустые и не используются в проекте:

1. `src/services/`
2. `src/theme/`
3. `src/components/ui/`
4. `src/components/settings/`
5. `src/constants/sound/`

## Как удалить (выберите один способ):

### Способ 1: Через PowerShell
```powershell
cd C:\Projects\BackRehabFinal

Remove-Item -Path "src\services" -Force
Remove-Item -Path "src\theme" -Force
Remove-Item -Path "src\components\ui" -Force
Remove-Item -Path "src\components\settings" -Force
Remove-Item -Path "src\constants\sound" -Force
```

### Способ 2: Через проводник Windows
1. Откройте папку `C:\Projects\BackRehabFinal\src`
2. Удалите следующие пустые папки:
   - services
   - theme
   - components/ui
   - components/settings
   - constants/sound

### Способ 3: Через VS Code
1. Откройте проект в VS Code
2. В Explorer найдите и удалите перечисленные папки

## Почему эти папки не используются:
- **services/** - изначально планировалась для сервисов, но не заполнена
- **theme/** - не используется, стили хранятся в constants/colors.ts
- **components/ui/** - не содержит UI компонентов
- **components/settings/** - не содержит компонентов настроек
- **constants/sound/** - пустая папка

**Дата создания:** 2024-12-25
