import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/colors';
import { DayHistory } from '../types';
import { getDayHistory, getTodayPainStatus, getCurrentDateString } from '../utils/storage';
import { getPainLevelColor } from '../utils/storage';
import HorizontalCalendar from '../components/HorizontalCalendar';
import DayActivityCard from '../components/DayActivityCard';
import PainStatistics from '../components/PainStatistics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PAIN_ICONS } from '../assets/icons';

type TabType = 'calendar' | 'statistics';

const PAIN_LEVEL_LABELS = {
  none: 'Все хорошо',
  mild: 'Немного болит',
  moderate: 'Болит',
  severe: 'Сильно болит',
  acute: 'Острая боль',
};

const DiaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString());
  const [dayHistory, setDayHistory] = useState<DayHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPainLevel, setCurrentPainLevel] = useState<string>('none');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Обновление данных при возврате на экран
  useFocusEffect(
    React.useCallback(() => {
      loadCurrentPainLevel();
      loadDayHistory();
    }, [selectedDate])
  );

  // Загрузка текущего уровня боли
  useEffect(() => {
    loadCurrentPainLevel();
  }, []);

  // Загрузка истории при изменении выбранной даты
  useEffect(() => {
    loadDayHistory();
  }, [selectedDate]);

  const loadCurrentPainLevel = async () => {
    try {
      const painLevel = await getTodayPainStatus();
      setCurrentPainLevel(painLevel);
    } catch (error) {
      console.error('Error loading pain level:', error);
    }
  };

  const loadDayHistory = async () => {
    setLoading(true);
    try {
      const history = await getDayHistory(selectedDate);
      setDayHistory(history);
    } catch (error) {
      console.error('Error loading day history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handlePainLevelPress = () => {
    // Навигация на экран PainTracker
    // @ts-ignore - навигация может быть не типизирована полностью
    navigation.navigate('Profile');
  };

  const formatCurrentDate = (): string => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('ru-RU', { month: 'long' });
    const year = today.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getPainIcon = (level: string) => {
    switch (level) {
      case 'none':
        return PAIN_ICONS.none;
      case 'mild':
        return PAIN_ICONS.mild;
      case 'moderate':
        return PAIN_ICONS.moderate;
      case 'severe':
        return PAIN_ICONS.severe;
      case 'acute':
        return PAIN_ICONS.acute;
      default:
        return PAIN_ICONS.none;
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Дневник</Text>
          <Text style={styles.dateText}>{formatCurrentDate()}</Text>
        </View>

        {/* Текущий уровень боли */}
        <TouchableOpacity
          style={[
            styles.painLevelCard,
            { backgroundColor: getPainLevelColor(currentPainLevel as any) }
          ]}
          onPress={handlePainLevelPress}
          activeOpacity={0.8}
        >
          <Image 
            source={getPainIcon(currentPainLevel)} 
            style={styles.painIcon}
            resizeMode="contain"
          />
          <Text style={styles.painLevelLabel}>Уровень боли сегодня</Text>
          <Text style={styles.painLevelValue}>
            {PAIN_LEVEL_LABELS[currentPainLevel as keyof typeof PAIN_LEVEL_LABELS]}
          </Text>
          <Text style={styles.painLevelHint}>Нажмите, чтобы изменить</Text>
        </TouchableOpacity>

        {/* Вкладки */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'calendar' && styles.activeTab
            ]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'calendar' && styles.activeTabText
            ]}>
              Календарь
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'statistics' && styles.activeTab
            ]}
            onPress={() => setActiveTab('statistics')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'statistics' && styles.activeTabText
            ]}>
              Статистика
            </Text>
          </TouchableOpacity>
        </View>

        {/* Контент вкладок */}
        {activeTab === 'calendar' && (
          <View style={styles.content}>
            {/* Горизонтальный календарь */}
            <HorizontalCalendar
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {/* Активность за выбранный день */}
            <DayActivityCard
              dayHistory={dayHistory}
              loading={loading}
            />
          </View>
        )}

        {activeTab === 'statistics' && (
          <View style={styles.content}>
            <PainStatistics currentMonth={currentMonth} />
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.TEXT_INACTIVE,
  },
  painLevelCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  painIcon: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  painLevelLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  painLevelValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  painLevelHint: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY_ACCENT,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_INACTIVE,
  },
  activeTabText: {
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  placeholderContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.TEXT_INACTIVE,
    textAlign: 'center',
  },
});

export default DiaryScreen;
