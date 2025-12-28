import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';

// Импорты для тестирования
import {
  EXERCISES_DATABASE,
  getAllExercises,
  getExercisesByDifficulty,
  getExercisesByMuscleGroup,
  getExercisesForPainLevel,
} from '../constants/exercises/exercisesData';

import {
  initializePrograms,
  getAllPrograms,
  getProgramById,
  getActiveProgram,
} from '../utils/programLoader';

import {
  getOverallStatistics,
} from '../utils/exerciseHistory';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const TestInfrastructureScreen = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTest = (test: TestResult) => {
    setTests(prev => [...prev, test]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    // ========== ТЕСТ 1: БАЗА ДАННЫХ УПРАЖНЕНИЙ ==========
    try {
      const allExercises = getAllExercises();
      const expectedCount = 20;

      addTest({
        name: 'База данных упражнений',
        status: allExercises.length === expectedCount ? 'success' : 'error',
        message: `Загружено ${allExercises.length} упражнений (ожидалось ${expectedCount})`,
        details: {
          total: allExercises.length,
          easy: getExercisesByDifficulty('easy').length,
          medium: getExercisesByDifficulty('medium').length,
          hard: getExercisesByDifficulty('hard').length,
        },
      });
    } catch (error: any) {
      addTest({
        name: 'База данных упражнений',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 2: МЫШЕЧНЫЕ ГРУППЫ ==========
    try {
      const muscleGroups = ['abs', 'obliques', 'core_stability', 'glutes', 'back', 'mobility'];
      let totalExercisesByMuscle = 0;

      muscleGroups.forEach(muscle => {
        const exercises = getExercisesByMuscleGroup(muscle as any);
        totalExercisesByMuscle += exercises.length;
      });

      addTest({
        name: 'Категоризация по мышцам',
        status: 'success',
        message: `Проверено ${muscleGroups.length} мышечных групп`,
        details: muscleGroups.map(muscle => ({
          muscle,
          count: getExercisesByMuscleGroup(muscle as any).length,
        })),
      });
    } catch (error: any) {
      addTest({
        name: 'Категоризация по мышцам',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 3: УРОВНИ БОЛИ ==========
    try {
      const painLevels = [1, 2, 3, 4, 5];
      const results = painLevels.map(level => ({
        level,
        count: getExercisesForPainLevel(level).length,
      }));

      addTest({
        name: 'Рекомендации по уровням боли',
        status: 'success',
        message: `Проверено ${painLevels.length} уровней боли`,
        details: results,
      });
    } catch (error: any) {
      addTest({
        name: 'Рекомендации по уровням боли',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 4: ИНИЦИАЛИЗАЦИЯ ПРОГРАММ ==========
    try {
      await initializePrograms();
      addTest({
        name: 'Инициализация программ',
        status: 'success',
        message: 'Программы успешно загружены из JSON',
      });
    } catch (error: any) {
      addTest({
        name: 'Инициализация программ',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 5: ЗАГРУЗКА ПРОГРАММ ==========
    try {
      const programs = await getAllPrograms();
      const expectedCount = 6;

      addTest({
        name: 'Загрузка программ',
        status: programs.length === expectedCount ? 'success' : 'error',
        message: `Загружено ${programs.length} программ (ожидалось ${expectedCount})`,
        details: programs.map(p => ({
          id: p.id,
          name: p.nameRu,
          exercisesCount: p.exercises.length,
          type: p.type,
        })),
      });
    } catch (error: any) {
      addTest({
        name: 'Загрузка программ',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 6: ПРОВЕРКА ССЫЛОК ==========
    try {
      const programs = await getAllPrograms();
      let brokenLinks = 0;
      let totalLinks = 0;

      programs.forEach(program => {
        program.exercises.forEach(ex => {
          totalLinks++;
          if (!EXERCISES_DATABASE[ex.exerciseId]) {
            brokenLinks++;
          }
        });
      });

      addTest({
        name: 'Проверка ссылок на упражнения',
        status: brokenLinks === 0 ? 'success' : 'error',
        message: `Проверено ${totalLinks} ссылок, битых: ${brokenLinks}`,
      });
    } catch (error: any) {
      addTest({
        name: 'Проверка ссылок на упражнения',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 7: АКТИВНАЯ ПРОГРАММА ==========
    try {
      const activeProgram = await getActiveProgram();

      addTest({
        name: 'Активная программа',
        status: activeProgram ? 'success' : 'error',
        message: activeProgram
          ? `Активна: ${activeProgram.nameRu} (${activeProgram.exercises.length} упражнений)`
          : 'Активная программа не установлена',
        details: activeProgram ? {
          id: activeProgram.id,
          name: activeProgram.nameRu,
          adaptive: activeProgram.adaptToPainLevel,
        } : undefined,
      });
    } catch (error: any) {
      addTest({
        name: 'Активная программа',
        status: 'error',
        message: error.message,
      });
    }

    // ========== ТЕСТ 8: СТАТИСТИКА ==========
    try {
      const stats = await getOverallStatistics();

      addTest({
        name: 'Система истории',
        status: 'success',
        message: `Выполнено упражнений: ${stats.totalExecutions}`,
        details: stats,
      });
    } catch (error: any) {
      addTest({
        name: 'Система истории',
        status: 'error',
        message: error.message,
      });
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#FFC107';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Тестирование инфраструктуры</Text>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Запустить тесты</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {tests.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Нажмите "Запустить тесты" для проверки инфраструктуры
            </Text>
          </View>
        )}

        {tests.map((test, index) => (
          <View key={index} style={styles.testCard}>
            <View style={styles.testHeader}>
              <Text style={styles.testIcon}>{getStatusIcon(test.status)}</Text>
              <Text style={styles.testName}>{test.name}</Text>
            </View>
            <Text style={styles.testMessage}>{test.message}</Text>

            {test.details && (
              <View style={styles.details}>
                <Text style={styles.detailsTitle}>Детали:</Text>
                <Text style={styles.detailsText}>
                  {JSON.stringify(test.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}

        {tests.length > 0 && !isRunning && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Итоги:</Text>
            <Text style={styles.summaryText}>
              ✅ Успешно: {tests.filter(t => t.status === 'success').length}
            </Text>
            <Text style={styles.summaryText}>
              ❌ Ошибок: {tests.filter(t => t.status === 'error').length}
            </Text>
            <Text style={styles.summaryText}>Всего: {tests.length}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  testMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  details: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  summary: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
});

export default TestInfrastructureScreen;
