import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { CalendarDay } from '../types';
import { getMonthHistory, getCurrentDateString } from '../utils/storage';

const { width: screenWidth } = Dimensions.get('window');
const DAY_SIZE = (screenWidth - 60) / 7; // 7 дней в неделю, учитывая отступы

interface HorizontalCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({ onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = getCurrentDateString();

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const data = await getMonthHistory(year, month);
      setCalendarDays(data);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayNumber = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.getDate().toString();
  };

  const getFirstDayOfMonth = (): number => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const dayIndex = firstDay.getDay();
    // Конвертируем: воскресенье (0) становится 6, понедельник (1) становится 0
    return dayIndex === 0 ? 6 : dayIndex - 1;
  };

  const renderCalendarGrid = () => {
    const firstDayIndex = getFirstDayOfMonth();
    const emptyDays = Array(firstDayIndex).fill(null);
    const allCells = [...emptyDays, ...calendarDays];

    // Разбиваем на недели (по 7 дней)
    const weeks: (CalendarDay | null)[][] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(allCells.slice(i, i + 7));
    }

    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.weekRow}>
        {week.map((day, dayIndex) => {
          if (!day) {
            return <View key={`empty-${dayIndex}`} style={styles.dayCell} />;
          }

          const isToday = day.date === todayStr;
          const isSelected = day.date === selectedDate;
          const hasActivity = day.hasActivity;

          return (
            <TouchableOpacity
              key={day.date}
              style={styles.dayCell}
              onPress={() => onDateSelect(day.date)}
            >
              <View style={[
                styles.dayContent,
                isSelected && styles.selectedDay,
                hasActivity && !isSelected && styles.activityDay,
              ]}>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.selectedText,
                  !hasActivity && !isToday && styles.inactiveText,
                ]}>
                  {getDayNumber(day.date)}
                </Text>
                {isToday && <View style={styles.todayDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка календаря...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Заголовок месяца с навигацией */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthText}>
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        
        <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Заголовки дней недели */}
      <View style={styles.weekDaysHeader}>
        {DAY_NAMES_SHORT.map((dayName, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* Сетка календаря */}
      <View style={styles.calendarGrid}>
        {renderCalendarGrid()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navButton: {
    padding: 10,
    width: 40,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_INACTIVE,
  },
  calendarGrid: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContent: {
    width: DAY_SIZE - 8,
    height: DAY_SIZE - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: COLORS.CALENDAR_SELECTED_BG,
  },
  activityDay: {
    backgroundColor: COLORS.CALENDAR_ACTIVE_DAY,
    opacity: 0.2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.CALENDAR_DAY_TEXT,
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.CALENDAR_TODAY_DOT,
  },
  selectedText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  inactiveText: {
    color: COLORS.CALENDAR_INACTIVE_TEXT,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.TEXT_INACTIVE,
    textAlign: 'center',
    padding: 20,
  },
});

export default HorizontalCalendar;
