import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { RehabProgram } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useOnboarding } from '../contexts';
import RehabProgramLoader from '../utils/rehabProgramLoader';
import UserProgressManager from '../utils/userProgressManager';

const RehabProgramOnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useOnboarding();
  
  const [step, setStep] = useState<'pain_check' | 'program_selection'>('pain_check');
  const [hasAcutePain, setHasAcutePain] = useState<boolean | null>(null);
  const [programs, setPrograms] = useState<RehabProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<RehabProgram | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      await RehabProgramLoader.initializePrograms();
      const allPrograms = await RehabProgramLoader.getAllPrograms();
      setPrograms(allPrograms);
    } catch (error) {
      console.error('Error loading programs:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить программы');
    }
  };

  const handlePainResponse = (hasPain: boolean) => {
    setHasAcutePain(hasPain);
    
    if (hasPain) {
      // Если есть острая боль, сразу выбираем программу ремедиации
      const acuteProgram = programs.find(p => p.phase === 'acute');
      if (acuteProgram) {
        setSelectedProgram(acuteProgram);
      }
    }
    
    setStep('program_selection');
  };

  const handleProgramSelect = (program: RehabProgram) => {
    setSelectedProgram(program);
  };

  const handleStartProgram = async () => {
    if (!selectedProgram) {
      Alert.alert('Ошибка', 'Выберите программу');
      return;
    }
    
    try {
      setLoading(true);
      
      // Инициализируем прогресс для выбранной программы
      await UserProgressManager.initializeProgress(selectedProgram.id);
      
      // Завершаем онбординг - навигация произойдет автоматически
      await completeOnboarding();
      
    } catch (error) {
      console.error('Error starting program:', error);
      Alert.alert('Ошибка', 'Не удалось начать программу');
    } finally {
      setLoading(false);
    }
  };

  const getProgramsByPhase = () => {
    if (hasAcutePain) {
      return programs.filter(p => p.phase === 'acute');
    }
    return programs.filter(p => p.phase !== 'acute');
  };

  const getPhaseDescription = (phase: string): string => {
    const descriptions: Record<string, string> = {
      acute: 'Специальная программа для снятия острой боли. Легкие упражнения и частая ходьба.',
      start: 'Базовая программа "большой тройки" для укрепления мышц спины. Длительность: 60 дней.',
      consolidation: 'Программа для закрепления результатов с увеличенной нагрузкой. Длительность: 60 дней.',
      maintenance: 'Программа поддержания формы и профилактики. Можно выполнять постоянно.',
    };
    return descriptions[phase] || '';
  };

  if (step === 'pain_check') {
    return (
      <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>🏥 Оценка состояния</Text>
          
          <Text style={styles.question}>
            Испытываете ли вы сейчас{'\n'}острую боль в спине?
          </Text>
          
          <Text style={styles.hint}>
            (прострел, невозможно двигаться,{'\n'}сильный дискомфорт)
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handlePainResponse(true)}
            >
              <Text style={styles.optionIcon}>😣</Text>
              <Text style={styles.optionTitle}>Да, боль сильная</Text>
              <Text style={styles.optionDescription}>
                Начнем с программы ремедиации для снятия острой боли
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handlePainResponse(false)}
            >
              <Text style={styles.optionIcon}>😌</Text>
              <Text style={styles.optionTitle}>Нет, боли нет или легкая</Text>
              <Text style={styles.optionDescription}>
                Выберем программу в зависимости от вашего опыта
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.CONTENT_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {hasAcutePain ? (
          <>
            <Text style={styles.title}>🏥 Программа ремедиации</Text>
            <Text style={styles.subtitle}>
              Для вас подобрана специальная программа для снятия острой боли
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>📚 Выбор программы</Text>
            <Text style={styles.subtitle}>
              Выберите программу в зависимости от вашего опыта реабилитации
            </Text>
          </>
        )}
        
        <View style={styles.programsContainer}>
          {getProgramsByPhase().map((program) => (
            <TouchableOpacity
              key={program.id}
              style={[
                styles.programCard,
                selectedProgram?.id === program.id && styles.selectedProgramCard
              ]}
              onPress={() => handleProgramSelect(program)}
            >
              <View style={styles.programCardHeader}>
                <Text style={styles.programCardIcon}>{program.icon}</Text>
                <Text style={styles.programCardName}>{program.nameRu}</Text>
              </View>
              
              <Text style={styles.programCardDescription}>
                {getPhaseDescription(program.phase)}
              </Text>
              
              {program.durationDays !== -1 && (
                <Text style={styles.programCardDuration}>
                  Длительность: {program.durationDays} дней
                </Text>
              )}
              
              {program.weeklyProgression.length > 0 && (
                <Text style={styles.programCardProgression}>
                  {program.weeklyProgression.length} недель прогрессии
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {selectedProgram && (
          <View style={styles.selectedProgramInfo}>
            <Text style={styles.selectedProgramTitle}>
              Вы выбрали: {selectedProgram.nameRu}
            </Text>
            <Text style={styles.selectedProgramText}>
              {selectedProgram.description}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.startButton,
            !selectedProgram && styles.disabledButton
          ]}
          onPress={handleStartProgram}
          disabled={!selectedProgram || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.TEXT_PRIMARY} />
          ) : (
            <Text style={styles.startButtonText}>
              {loading ? 'Загрузка...' : 'Начать программу'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 30,
    lineHeight: 22,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  hint: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  programsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  programCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedProgramCard: {
    borderColor: COLORS.PRIMARY_ACCENT,
    backgroundColor: COLORS.PRIMARY_ACCENT,
  },
  programCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programCardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  programCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  programCardDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
  programCardDuration: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: 4,
  },
  programCardProgression: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  selectedProgramInfo: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  selectedProgramTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  selectedProgramText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.8,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: COLORS.CTA_BUTTON,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default RehabProgramOnboardingScreen;
