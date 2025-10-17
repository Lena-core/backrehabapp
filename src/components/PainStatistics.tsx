import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { PainLevel } from '../types';
import { getMonthHistory } from '../utils/storage';

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_WIDTH = screenWidth - 60;
const GRAPH_HEIGHT = 200;
const BAR_WIDTH = 20; // Увеличили ширину столбца
const BAR_SPACING = 8; // Расстояние между столбцами

interface PainStatisticsProps {
  currentMonth: Date;
}

const PAIN_LEVEL_VALUES: Record<PainLevel, number> = {
  acute: 5,
  severe: 4,
  moderate: 3,
  mild: 2,
  none: 1,
};

const PAIN_LEVEL_COLORS: Record<number, string> = {
  5: COLORS.PAIN_ACUTE,
  4: COLORS.PAIN_SEVERE,
  3: COLORS.PAIN_MODERATE,
  2: COLORS.PAIN_MILD,
  1: COLORS.PAIN_NONE,
};

const PAIN_LEVEL_LABELS: Record<number, string> = {
  5: 'Острая боль',
  4: 'Сильно болит',
  3: 'Болит',
  2: 'Немного болит',
  1: 'Всё хорошо',
};

const PainStatistics: React.FC<PainStatisticsProps> = ({ currentMonth }) => {
  const [painData, setPainData] = useState<{ day: number; value: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    loadPainData();
  }, [currentMonth]);

  const loadPainData = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const history = await getMonthHistory(year, month);
      
      const data = history.map(day => {
        const dayNumber = new Date(day.date).getDate();
        const value = day.painLevel ? PAIN_LEVEL_VALUES[day.painLevel] : null;
        return { day: dayNumber, value };
      });
      
      setPainData(data);
      
      // Прокручиваем к последним 7 дням перед текущим днём (включая текущий)
      setTimeout(() => {
        if (scrollViewRef.current && data.length > 0) {
          const today = new Date();
          const currentDay = today.getDate();
          const currentMonthCheck = today.getMonth() === currentMonth.getMonth() && 
                                   today.getFullYear() === currentMonth.getFullYear();
          
          if (currentMonthCheck) {
            // Если это текущий месяц, показываем 7 дней до сегодня включительно
            const totalBarWidth = BAR_WIDTH + (BAR_SPACING * 2);
            const targetDay = Math.max(0, currentDay - 7);
            const scrollPosition = Math.max(0, targetDay * totalBarWidth);
            scrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
          } else {
            // Если это не текущий месяц, показываем последние 7 дней месяца
            const totalBarWidth = BAR_WIDTH + (BAR_SPACING * 2);
            const scrollPosition = Math.max(0, (data.length - 7) * totalBarWidth);
            scrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error loading pain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = () => {
    if (painData.length === 0) return null;

    const maxDay = painData.length;
    const barSpacing = GRAPH_WIDTH / maxDay;

    // Фильтруем точки с данными
    const dataPoints = painData.filter(point => point.value !== null);
    
    if (dataPoints.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Нет данных за этот период</Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartWrapper}>
          <View style={styles.chartContainer}>
            {/* Горизонтальные цветные линии сетки */}
            <View style={styles.gridContainer}>
              {[5, 4, 3, 2, 1].map((level, index) => (
                <View
                  key={level}
                  style={[
                    styles.gridLine,
                    {
                      backgroundColor: PAIN_LEVEL_COLORS[level],
                      opacity: 0.15,
                    }
                  ]}
                />
              ))}
            </View>

            {/* Столбцы */}
            <View style={styles.barsContainer}>
              {painData.map((point, index) => {
                if (!point.value) return (
                  <View key={index} style={styles.emptyBar} />
                );

                const barHeight = (point.value / 5) * GRAPH_HEIGHT;
                const color = PAIN_LEVEL_COLORS[point.value];

                return (
                  <View key={index} style={styles.barWrapper}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: color,
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Подписи дней внизу */}
          <View style={styles.daysLabelsContainer}>
            {painData.map((point, index) => (
              <View key={index} style={styles.dayLabelWrapper}>
                <Text style={styles.dayLabel}>{point.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка статистики...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>График уровня боли</Text>
      <Text style={styles.subtitle}>
        {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
      </Text>
      
      {renderBarChart()}

      {/* Легенда */}
      <View style={styles.legend}>
        <View style={styles.legendItems}>
          {[
            { level: 5, label: 'Острая боль' },
            { level: 4, label: 'Сильно болит' },
            { level: 3, label: 'Болит' },
            { level: 2, label: 'Немного болит' },
            { level: 1, label: 'Всё хорошо' },
          ].map(item => (
            <View key={item.level} style={styles.legendItem}>
              <View style={[
                styles.legendColor,
                { backgroundColor: PAIN_LEVEL_COLORS[item.level] }
              ]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_INACTIVE,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_INACTIVE,
    textAlign: 'center',
    paddingVertical: 40,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  chartWrapper: {
    marginBottom: 20,
  },
  chartContainer: {
    height: GRAPH_HEIGHT,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 2,
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: GRAPH_HEIGHT,
    paddingHorizontal: 5,
  },
  barWrapper: {
    alignItems: 'center',
    marginHorizontal: BAR_SPACING,
  },
  barContainer: {
    width: BAR_WIDTH,
    height: GRAPH_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  emptyBar: {
    width: BAR_WIDTH,
    height: GRAPH_HEIGHT,
    marginHorizontal: BAR_SPACING,
  },
  daysLabelsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginTop: 8,
  },
  dayLabelWrapper: {
    width: BAR_WIDTH + (BAR_SPACING * 2),
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 10,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  legend: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.SCALE_COLOR,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'column',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 10,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  noDataContainer: {
    height: GRAPH_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.TEXT_INACTIVE,
  },
});

export default PainStatistics;
