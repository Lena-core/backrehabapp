import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, TrainingProgram } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { getPresetPrograms, getActiveProgram, setActiveProgram } from '../utils/programLoader';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProgramSelection'>;

const ProgramSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [activeProgram, setActiveProgramState] = useState<TrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const [presetPrograms, currentActiveProgram] = await Promise.all([
        getPresetPrograms(),
        getActiveProgram(),
      ]);
      setPrograms(presetPrograms);
      setActiveProgramState(currentActiveProgram);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProgram = async (program: TrainingProgram) => {
    try {
      setSaving(true);
      await setActiveProgram(program.id);
      setActiveProgramState(program);
      
      setTimeout(() => {
        setSaving(false);
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Error setting active program:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY_ACCENT} />
          <Text style={styles.loadingText}>Загрузка программ...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Выбор программы</Text>
        <Text style={styles.subtitle}>
          Выберите программу тренировок, которая подходит вашему уровню
        </Text>

        <View style={styles.programsContainer}>
          {programs.map((program) => {
            const isActive = activeProgram?.id === program.id;
            
            return (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.programCard,
                  isActive && styles.programCardActive,
                ]}
                onPress={() => handleSelectProgram(program)}
                disabled={saving}
              >
                <View style={styles.programHeader}>
                  <Text style={styles.programIcon}>{program.icon}</Text>
                  <View style={styles.programTitleContainer}>
                    <Text style={styles.programName}>{program.nameRu}</Text>
                    {program.adaptToPainLevel && (
                      <Text style={styles.adaptiveBadge}>📊 Адаптивная</Text>
                    )}
                  </View>
                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeText}>✓</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.programDescription}>{program.description}</Text>

                <View style={styles.programFooter}>
                  <Text style={styles.exerciseCount}>
                    {program.exercises.filter(ex => ex.isEnabled).length} упражнений
                  </Text>
                  {program.createdAt && (
                    <Text style={styles.dateText}>
                      Создана: {new Date(program.createdAt).toLocaleDateString('ru-RU')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Вы можете изменить программу в любое время. Настройки упражнений сохраняются для каждой программы отдельно.
          </Text>
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.savingText}>Сохранение...</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  programsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  programCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programCardActive: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    shadowColor: COLORS.PRIMARY_ACCENT,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  programTitleContainer: {
    flex: 1,
  },
  programName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  adaptiveBadge: {
    fontSize: 11,
    color: COLORS.PRIMARY_ACCENT,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.CTA_BUTTON,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  programDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 12,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.SCALE_COLOR,
  },
  exerciseCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.5,
  },
  infoContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY_ACCENT,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default ProgramSelectionScreen;
