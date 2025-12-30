# PowerShell скрипт для добавления загрузки ручных настроек в DayPlanScreen.tsx
# ВЕРСИЯ 2 - более точный поиск

$filePath = "C:\Projects\BackRehabFinal\src\screens\DayPlanScreen.tsx"

Write-Host "=== PATCHING DayPlanScreen.tsx V2 ===" -ForegroundColor Cyan
Write-Host "Adding manual settings loading..." -ForegroundColor Yellow

# Читаем файл
$content = Get-Content $filePath -Raw -Encoding UTF8

# Ищем строку начала блока
if ($content -match "let programExercises = program\.exercises") {
    Write-Host "✓ Found programExercises block!" -ForegroundColor Green
    
    # Старый код - ТОЧНОЕ совпадение из файла (строки 135-151)
    $oldCode = @'
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

    # Новый код с async и ручными настройками
    $newCode = @'
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

    # Проверяем точное совпадение
    if ($content.Contains($oldCode)) {
        Write-Host "✓ Exact match found - applying patch..." -ForegroundColor Green
        
        # Заменяем
        $newContent = $content.Replace($oldCode, $newCode)
        
        # Сохраняем с UTF-8 BOM (как исходный файл)
        $utf8BOM = New-Object System.Text.UTF8Encoding $true
        [System.IO.File]::WriteAllText($filePath, $newContent, $utf8BOM)
        
        Write-Host "✓ File patched successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "CHANGES:" -ForegroundColor Cyan
        Write-Host "  • Changed .map(ex => {" -ForegroundColor White
        Write-Host "    to .map(async (ex) => {" -ForegroundColor White
        Write-Host "  • Wrapped in Promise.all()" -ForegroundColor White
        Write-Host "  • Added manual settings loading" -ForegroundColor White
        Write-Host ""
        Write-Host "RELOAD APP NOW!" -ForegroundColor Yellow
        
    } else {
        Write-Host "✗ Exact match not found" -ForegroundColor Red
        Write-Host "Trying to show you where the code is..." -ForegroundColor Yellow
        
        # Показываем контекст
        $lines = $content -split "`n"
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "let programExercises = program\.exercises") {
                Write-Host ""
                Write-Host "Found at line $($i + 1):" -ForegroundColor Cyan
                Write-Host "---" -ForegroundColor Gray
                for ($j = $i; $j -lt [Math]::Min($i + 25, $lines.Length); $j++) {
                    Write-Host "$($j + 1): $($lines[$j])"
                }
                Write-Host "---" -ForegroundColor Gray
                break
            }
        }
        
        Write-Host ""
        Write-Host "MANUAL FIX REQUIRED:" -ForegroundColor Yellow
        Write-Host "Find line with 'let programExercises = program.exercises'" -ForegroundColor White
        Write-Host "And change .map(ex => { to .map(async (ex) => {" -ForegroundColor White
        Write-Host "Then add manual settings loading inside the map" -ForegroundColor White
    }
    
} else {
    Write-Host "✗ Could not find programExercises line" -ForegroundColor Red
    Write-Host "File structure may be different" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== PATCH COMPLETE ===" -ForegroundColor Cyan
