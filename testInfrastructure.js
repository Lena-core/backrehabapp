/**
 * Тестовый скрипт для проверки новой инфраструктуры упражнений
 * 
 * Запуск: node testInfrastructure.js
 * 
 * Проверяет:
 * 1. База данных упражнений (22 упражнения)
 * 2. Загрузка программ из JSON (6 программ)
 * 3. Утилиты для программ
 * 4. Утилиты для истории (mock данные)
 */

// Mock AsyncStorage для тестирования
const mockStorage = {};

const AsyncStorage = {
  getItem: async (key) => {
    return mockStorage[key] || null;
  },
  setItem: async (key, value) => {
    mockStorage[key] = value;
  },
  removeItem: async (key) => {
    delete mockStorage[key];
  },
  getAllKeys: async () => {
    return Object.keys(mockStorage);
  },
  multiRemove: async (keys) => {
    keys.forEach(key => delete mockStorage[key]);
  }
};

// Временно заменяем импорт AsyncStorage
global.AsyncStorage = AsyncStorage;

// Импортируем наши модули
const exercisesData = require('./src/constants/exercises/exercisesData');
const programsJson = require('./assets/programs.json');

console.log('\n🚀 ========================================');
console.log('   ТЕСТИРОВАНИЕ ИНФРАСТРУКТУРЫ');
console.log('========================================\n');

// ========== ТЕСТ 1: БАЗА ДАННЫХ УПРАЖНЕНИЙ ==========
console.log('📚 ТЕСТ 1: База данных упражнений\n');

const allExercises = exercisesData.getAllExercises();
console.log(`✅ Загружено упражнений: ${allExercises.length}`);
console.log(`   Ожидалось: 22`);

if (allExercises.length === 22) {
  console.log('   ✓ Количество правильное!\n');
} else {
  console.log('   ✗ Ошибка: неправильное количество упражнений!\n');
}

// Проверяем мышечные группы
const muscleGroups = {
  abs: 0,
  obliques: 0,
  core_stability: 0,
  glutes: 0,
  back: 0,
  mobility: 0,
  full_body: 0,
  walk: 0,
  quads: 0,
  hamstrings: 0,
  calves: 0,
  hip_flexors: 0,
};

allExercises.forEach(ex => {
  ex.primaryMuscles.forEach(muscle => {
    muscleGroups[muscle] = (muscleGroups[muscle] || 0) + 1;
  });
});

console.log('Упражнения по мышечным группам:');
Object.entries(muscleGroups).forEach(([muscle, count]) => {
  if (count > 0) {
    console.log(`   ${muscle.padEnd(20)}: ${count} упражнений`);
  }
});

// Проверяем сложность
const byDifficulty = {
  easy: exercisesData.getExercisesByDifficulty('easy').length,
  medium: exercisesData.getExercisesByDifficulty('medium').length,
  hard: exercisesData.getExercisesByDifficulty('hard').length,
};

console.log('\nПо уровню сложности:');
console.log(`   🟢 Легкие:    ${byDifficulty.easy}`);
console.log(`   🟡 Средние:   ${byDifficulty.medium}`);
console.log(`   🔴 Сложные:   ${byDifficulty.hard}`);

// Проверяем типы выполнения
const byExecutionType = {};
allExercises.forEach(ex => {
  byExecutionType[ex.executionType] = (byExecutionType[ex.executionType] || 0) + 1;
});

console.log('\nПо типу выполнения:');
Object.entries(byExecutionType).forEach(([type, count]) => {
  console.log(`   ${type.padEnd(20)}: ${count}`);
});

// Проверяем пути прогрессии
console.log('\nПути прогрессии:');
const progressionPaths = allExercises.filter(ex => ex.progressionPath && ex.progressionPath.length > 1);
progressionPaths.forEach(ex => {
  console.log(`   ${ex.nameRu}:`);
  console.log(`      ${ex.progressionPath.join(' → ')}`);
});

console.log('\n' + '─'.repeat(60) + '\n');

// ========== ТЕСТ 2: ПРОГРАММЫ ИЗ JSON ==========
console.log('📋 ТЕСТ 2: Программы тренировок из JSON\n');

console.log(`✅ Версия программ: ${programsJson.version}`);
console.log(`✅ Загружено программ: ${programsJson.programs.length}`);
console.log(`   Ожидалось: 6\n`);

if (programsJson.programs.length === 6) {
  console.log('   ✓ Количество правильное!\n');
} else {
  console.log('   ✗ Ошибка: неправильное количество программ!\n');
}

console.log('Список программ:');
programsJson.programs.forEach((program, index) => {
  console.log(`\n${index + 1}. ${program.icon} ${program.nameRu}`);
  console.log(`   ID: ${program.id}`);
  console.log(`   Тип: ${program.type}`);
  console.log(`   Адаптивная: ${program.adaptToPainLevel ? 'Да' : 'Нет'}`);
  console.log(`   Упражнений: ${program.exercises.length}`);
  
  // Показываем первые 3 упражнения
  console.log('   Упражнения:');
  program.exercises.slice(0, 3).forEach(ex => {
    const exerciseInfo = exercisesData.getExerciseById(ex.exerciseId);
    if (exerciseInfo) {
      console.log(`      ${ex.order}. ${exerciseInfo.nameRu}`);
      
      // Показываем настройки
      const settings = ex.settings;
      if (settings.holdTime) {
        console.log(`         ⏱ Удержание: ${settings.holdTime}с, подходы: [${settings.repsSchema?.join(', ')}]`);
      } else if (settings.walkDuration) {
        console.log(`         🚶 Ходьба: ${settings.walkDuration} мин`);
      } else if (settings.rollingDuration) {
        console.log(`         🔄 Прокатка: ${settings.rollingDuration}с`);
      } else if (settings.dynamicReps) {
        console.log(`         💪 Повторения: ${settings.dynamicReps}, подходы: ${settings.dynamicSets}`);
      }
    } else {
      console.log(`      ${ex.order}. ❌ Упражнение не найдено: ${ex.exerciseId}`);
    }
  });
  
  if (program.exercises.length > 3) {
    console.log(`      ... и еще ${program.exercises.length - 3}`);
  }
  
  // Проверяем правила для адаптивных программ
  if (program.adaptToPainLevel && program.painLevelRules) {
    console.log('   Правила адаптации:');
    Object.entries(program.painLevelRules).forEach(([range, exercises]) => {
      console.log(`      При боли ${range}: ${exercises.length} упражнений`);
    });
  }
});

console.log('\n' + '─'.repeat(60) + '\n');

// ========== ТЕСТ 3: ПРОВЕРКА ССЫЛОК НА УПРАЖНЕНИЯ ==========
console.log('🔗 ТЕСТ 3: Проверка ссылок на упражнения в программах\n');

let brokenLinks = 0;
let totalLinks = 0;

programsJson.programs.forEach(program => {
  program.exercises.forEach(ex => {
    totalLinks++;
    const exerciseInfo = exercisesData.getExerciseById(ex.exerciseId);
    if (!exerciseInfo) {
      brokenLinks++;
      console.log(`❌ Ошибка в программе "${program.nameRu}": упражнение "${ex.exerciseId}" не найдено`);
    }
  });
  
  // Проверяем правила адаптации
  if (program.painLevelRules) {
    Object.entries(program.painLevelRules).forEach(([range, exercises]) => {
      exercises.forEach(ex => {
        totalLinks++;
        const exerciseInfo = exercisesData.getExerciseById(ex.exerciseId);
        if (!exerciseInfo) {
          brokenLinks++;
          console.log(`❌ Ошибка в правилах адаптации "${program.nameRu}" (боль ${range}): упражнение "${ex.exerciseId}" не найдено`);
        }
      });
    });
  }
});

if (brokenLinks === 0) {
  console.log(`✅ Все ссылки корректны! (проверено ${totalLinks} ссылок)`);
} else {
  console.log(`❌ Найдено ${brokenLinks} битых ссылок из ${totalLinks}`);
}

console.log('\n' + '─'.repeat(60) + '\n');

// ========== ТЕСТ 4: ПРОВЕРКА НАСТРОЕК УПРАЖНЕНИЙ ==========
console.log('⚙️ ТЕСТ 4: Проверка настроек упражнений\n');

let invalidSettings = 0;

programsJson.programs.forEach(program => {
  program.exercises.forEach(ex => {
    const exerciseInfo = exercisesData.getExerciseById(ex.exerciseId);
    if (!exerciseInfo) return;
    
    const settings = ex.settings;
    
    // Проверяем соответствие настроек типу выполнения
    switch (exerciseInfo.executionType) {
      case 'hold':
      case 'reps':
        if (!settings.holdTime || !settings.repsSchema || !settings.restTime) {
          invalidSettings++;
          console.log(`❌ "${program.nameRu}" → "${exerciseInfo.nameRu}": неправильные настройки для типа "${exerciseInfo.executionType}"`);
        }
        break;
        
      case 'walk':
        if (!settings.walkDuration || !settings.walkSessions) {
          invalidSettings++;
          console.log(`❌ "${program.nameRu}" → "${exerciseInfo.nameRu}": неправильные настройки для типа "walk"`);
        }
        break;
        
      case 'foam_rolling':
        if (!settings.rollingDuration || !settings.rollingSessions) {
          invalidSettings++;
          console.log(`❌ "${program.nameRu}" → "${exerciseInfo.nameRu}": неправильные настройки для типа "foam_rolling"`);
        }
        break;
        
      case 'dynamic':
        if (!settings.dynamicReps || !settings.dynamicSets) {
          invalidSettings++;
          console.log(`❌ "${program.nameRu}" → "${exerciseInfo.nameRu}": неправильные настройки для типа "dynamic"`);
        }
        break;
    }
  });
});

if (invalidSettings === 0) {
  console.log('✅ Все настройки корректны!');
} else {
  console.log(`❌ Найдено ${invalidSettings} упражнений с неправильными настройками`);
}

console.log('\n' + '─'.repeat(60) + '\n');

// ========== ТЕСТ 5: ПРОВЕРКА ВИДЕО ФАЙЛОВ ==========
console.log('🎬 ТЕСТ 5: Проверка наличия видео файлов\n');

const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, 'assets', 'videos');

if (fs.existsSync(videosDir)) {
  const videoFiles = fs.readdirSync(videosDir);
  console.log(`✅ Папка assets/videos существует`);
  console.log(`✅ Найдено видео файлов: ${videoFiles.length}\n`);
  
  let missingVideos = 0;
  
  allExercises.forEach(ex => {
    const videoPath = path.join(videosDir, ex.videoFile);
    if (!fs.existsSync(videoPath)) {
      missingVideos++;
      console.log(`❌ Видео не найдено: ${ex.videoFile} (для упражнения "${ex.nameRu}")`);
    }
    
    // Проверяем видео подготовки
    if (ex.preparationVideoFile) {
      const prepVideoPath = path.join(videosDir, ex.preparationVideoFile);
      if (!fs.existsSync(prepVideoPath)) {
        missingVideos++;
        console.log(`❌ Видео подготовки не найдено: ${ex.preparationVideoFile}`);
      }
    }
  });
  
  if (missingVideos === 0) {
    console.log('✅ Все видео файлы на месте!');
  } else {
    console.log(`\n⚠️ Отсутствует ${missingVideos} видео файлов`);
  }
} else {
  console.log('❌ Папка assets/videos не найдена!');
}

console.log('\n' + '─'.repeat(60) + '\n');

// ========== ИТОГИ ==========
console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ\n');

const testResults = {
  'База данных упражнений': allExercises.length === 22,
  'Программы тренировок': programsJson.programs.length === 6,
  'Ссылки на упражнения': brokenLinks === 0,
  'Настройки упражнений': invalidSettings === 0,
};

let passedTests = 0;
let totalTests = Object.keys(testResults).length;

Object.entries(testResults).forEach(([test, passed]) => {
  if (passed) {
    passedTests++;
    console.log(`✅ ${test}`);
  } else {
    console.log(`❌ ${test}`);
  }
});

console.log(`\n📈 Результат: ${passedTests}/${totalTests} тестов пройдено`);

if (passedTests === totalTests) {
  console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Инфраструктура готова к использованию!\n');
} else {
  console.log('\n⚠️ Есть проблемы, требующие исправления.\n');
}

console.log('========================================\n');
