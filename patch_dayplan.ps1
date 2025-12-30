# PowerShell скрипт для добавления загрузки ручных настроек в DayPlanScreen.tsx

$filePath = "C:\Projects\BackRehabFinal\src\screens\DayPlanScreen.tsx"

Write-Host "=== PATCHING DayPlanScreen.tsx ===" -ForegroundColor Cyan
Write-Host "Adding manual settings loading..." -ForegroundColor Yellow

# Читаем файл
$content = Get-Content $filePath -Raw -Encoding UTF8

# Старый код (для поиска)
$oldCode = @'
      // Получаем упражнения из программы и применяем настройки текущей недели
      let programExercises = program.exercises
        .filter(ex => ex.isEnabled)
        .sort((a, b) => a.order - b.order)
        .map(ex => {
          // Мержим ТОЛЬКО релевантные поля настроек (исключаем week)
          const mergedSettings = { ...ex.settings };
          
          if (currentWeekSettings.holdTime !== undefined) mergedSettings.holdTime = currentWeekSettings.holdTime;
          if (currentWeekSettings.repsSchema !== undefined) mergedSettings.repsSchema = currentWeekSettings.repsSchema;
          if (currentWeekSettings.restTime !== undefined) mergedSettings.restTime = currentWeekSettings.restTime;
          if (currentWeekSettings.dynamicReps !== undefined) mergedSettings.dynamicReps = currentWeekSettings.dynamicReps;
          if (currentWeekSettings.dynamicSets !== undefined) mergedSettings.dynamicSets = currentWeekSettings.dynamicSets;
          if (currentWeekSettings.rollingDuration !== undefined) mergedSettings.rollingDuration = currentWeekSettings.rollingDuration;
          if (currentWeekSettings.rollingSessions !== undefined) mergedSettings.rollingSessions = currentWeekSettings.rollingSessions;
          if (currentWeekSettings.walkDuration !== undefined) mergedSettings.walkDuration = currentWeekSettings.walkDuration;
          if (currentWeekSettings.walkSessions !== undefined) mergedSettings.walkSessions = currentWeekSettings.walkSessions;
          
          return {
            ...ex,
            settings: mergedSettings,
          };
        });
'@

# Новый код (с async и manual settings)
$newCode = @'
      // Получаем упражнения из программы и применяем настройки текущей недели
      let programExercises = await Promise.all(
        program.exercises
          .filter(ex => ex.isEnabled)
          .sort((a, b) => a.order - b.order)
          .map(async (ex) => {
            // 1. Базовые настройки упражнения
            const mergedSettings = { ...ex.settings };
            
            // 2. Применяем недельные настройки из программы
            if (currentWeekSettings.holdTime !== undefined) mergedSettings.holdTime = currentWeekSettings.holdTime;
            if (currentWeekSettings.repsSchema !== undefined) mergedSettings.repsSchema = currentWeekSettings.repsSchema;
            if (currentWeekSettings.restTime !== undefined) mergedSettings.restTime = currentWeekSettings.restTime;
            if (currentWeekSettings.dynamicReps !== undefined) mergedSettings.dynamicReps = currentWeekSettings.dynamicReps;
            if (currentWeekSettings.dynamicSets !== undefined) mergedSettings.dynamicSets = currentWeekSettings.dynamicSets;
            if (currentWeekSettings.rollingDuration !== undefined) mergedSettings.rollingDuration = currentWeekSettings.rollingDuration;
            if (currentWeekSettings.rollingSessions !== undefined) mergedSettings.rollingSessions = currentWeekSettings.rollingSessions;
            if (currentWeekSettings.walkDuration !== undefined) mergedSettings.walkDuration = currentWeekSettings.walkDuration;
            if (currentWeekSettings.walkSessions !== undefined) mergedSettings.walkSessions = currentWeekSettings.walkSessions;
            
            // 3. ⚙️ ПРИМЕНЯЕМ РУЧНЫЕ НАСТРОЙКИ (самый высокий приоритет!)
            try {
              const manualSettingsKey = `manual_exercise_settings_${ex.exerciseId}`;
              const manualSettingsJson = await AsyncStorage.getItem(manualSettingsKey);
              
              if (manualSettingsJson) {
                const manualSettings = JSON.parse(manualSettingsJson);
                console.log(`[DayPlan] ⚙️ Applying manual settings for ${ex.exerciseId}:`, manualSettings);
                // Применяем ручные настройки поверх всех остальных
                Object.assign(mergedSettings, manualSettings);
              }
            } catch (error) {
              console.error(`[DayPlan] Error loading manual settings for ${ex.exerciseId}:`, error);
            }
            
            return {
              ...ex,
              settings: mergedSettings,
            };
          })
      );
'@

# Проверяем, найден ли старый код
if ($content -match [regex]::Escape($oldCode)) {
    Write-Host "✓ Found old code block" -ForegroundColor Green
    
    # Заменяем
    $newContent = $content -replace [regex]::Escape($oldCode), $newCode
    
    # Сохраняем
    $newContent | Set-Content $filePath -Encoding UTF8 -NoNewline
    
    Write-Host "✓ File patched successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "CHANGES MADE:" -ForegroundColor Cyan
    Write-Host "  • Added async/await to programExercises mapping" -ForegroundColor White
    Write-Host "  • Added manual settings loading from AsyncStorage" -ForegroundColor White
    Write-Host "  • Manual settings now override program settings" -ForegroundColor White
    Write-Host ""
    Write-Host "NOW:" -ForegroundColor Yellow
    Write-Host "  1. Reload app (R, R)" -ForegroundColor White
    Write-Host "  2. Change exercise settings manually" -ForegroundColor White
    Write-Host "  3. Go back to Day Plan - settings will update!" -ForegroundColor White
    
} else {
    Write-Host "✗ Could not find old code block" -ForegroundColor Red
    Write-Host "File may have been already patched or modified" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Searching for similar patterns..." -ForegroundColor Cyan
    
    # Проверяем альтернативные паттерны
    if ($content -match "let programExercises = await Promise.all") {
        Write-Host "✓ File already contains Promise.all - likely already patched!" -ForegroundColor Green
    } elseif ($content -match "let programExercises = program\.exercises") {
        Write-Host "✓ Found programExercises declaration but pattern doesn't match" -ForegroundColor Yellow
        Write-Host "Manual intervention may be required" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Could not find programExercises declaration at all" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== PATCH COMPLETE ===" -ForegroundColor Cyan
