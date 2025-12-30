# Simple patch script for DayPlanScreen.tsx
$filePath = "C:\Projects\BackRehabFinal\src\screens\DayPlanScreen.tsx"

Write-Host "=== SIMPLE PATCH SCRIPT ===" -ForegroundColor Cyan

# Read file
$content = Get-Content $filePath -Raw -Encoding UTF8

# Find and replace - simple string replace
$find = "      let programExercises = program.exercises"
$replaceWith = "      let programExercises = await Promise.all(program.exercises"

if ($content -match [regex]::Escape($find)) {
    Write-Host "✓ Found target line!" -ForegroundColor Green
    
    # Step 1: Change let programExercises = program.exercises to await Promise.all(
    $content = $content.Replace($find, $replaceWith)
    
    # Step 2: Change .map(ex => { to .map(async (ex) => {
    $content = $content.Replace(".map(ex => {", ".map(async (ex) => {")
    
    # Step 3: Change comment
    $content = $content.Replace("          // Мержим ТОЛЬКО релевантные поля настроек (исключаем week)", "            // 1. Базовые настройки упражнения")
    
    # Step 4: Add closing parenthesis after the map
    $oldEnd = @"
          return {
            ...ex,
            settings: mergedSettings,
          };
        });
"@
    
    $newEnd = @"
            // 3. Применяем ручные настройки (самый высокий приоритет!)
            try {
              const manualSettingsKey = `manual_exercise_settings_`${ex.exerciseId}``;
              const manualSettingsJson = await AsyncStorage.getItem(manualSettingsKey);
              
              if (manualSettingsJson) {
                const manualSettings = JSON.parse(manualSettingsJson);
                console.log(`[DayPlan] ⚙️ Applying manual settings for `${ex.exerciseId}:`, manualSettings);
                Object.assign(mergedSettings, manualSettings);
              }
            } catch (error) {
              console.error(`[DayPlan] Error loading manual settings for `${ex.exerciseId}:`, error);
            }
            
            return {
              ...ex,
              settings: mergedSettings,
            };
          })
      );
"@
    
    $content = $content.Replace($oldEnd, $newEnd)
    
    # Save
    $utf8BOM = New-Object System.Text.UTF8Encoding $true
    [System.IO.File]::WriteAllText($filePath, $content, $utf8BOM)
    
    Write-Host "✓ Patch applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "CHANGES MADE:" -ForegroundColor Cyan
    Write-Host "  • Added Promise.all wrapper" -ForegroundColor White
    Write-Host "  • Changed map to async map" -ForegroundColor White
    Write-Host "  • Added manual settings loading" -ForegroundColor White
    Write-Host ""
    Write-Host "NOW: Reload app (R, R)" -ForegroundColor Yellow
    
} else {
    Write-Host "✗ Could not find target line" -ForegroundColor Red
    Write-Host "File may have already been patched" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Cyan
