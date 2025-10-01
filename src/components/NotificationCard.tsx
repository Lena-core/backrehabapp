// Компонент карточки настройки уведомления

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS } from '../constants';
import { NotificationTime } from '../types';

interface NotificationCardProps {
  title: string;
  description: string;
  enabled: boolean;
  time: NotificationTime;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: NotificationTime) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  description,
  enabled,
  time,
  onToggle,
  onTimeChange,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleTimePress = () => {
    if (enabled) {
      setShowTimePicker(true);
    }
  };

  // Простой выбор времени (часы)
  const handleHourChange = (increment: boolean) => {
    if (!enabled) return;
    
    let newHour = time.hour;
    if (increment) {
      newHour = (newHour + 1) % 24;
    } else {
      newHour = (newHour - 1 + 24) % 24;
    }
    
    onTimeChange({ ...time, hour: newHour });
  };

  // Простой выбор времени (минуты)
  const handleMinuteChange = (increment: boolean) => {
    if (!enabled) return;
    
    let newMinute = time.minute;
    if (increment) {
      newMinute = (newMinute + 15) % 60;
    } else {
      newMinute = (newMinute - 15 + 60) % 60;
    }
    
    onTimeChange({ ...time, minute: newMinute });
  };

  return (
    <View style={[styles.card, !enabled && styles.cardDisabled]}>
      {/* Заголовок и описание */}
      <View style={styles.header}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        {/* Переключатель */}
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ 
            false: COLORS.TEXT_INACTIVE, 
            true: COLORS.CTA_BUTTON 
          }}
          thumbColor={enabled ? COLORS.WHITE : COLORS.WHITE}
          ios_backgroundColor={COLORS.TEXT_INACTIVE}
        />
      </View>

      {/* Выбор времени */}
      {enabled && (
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Время уведомления:</Text>
          
          <View style={styles.timePicker}>
            {/* Часы */}
            <View style={styles.timeSection}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => handleHourChange(true)}
              >
                <Text style={styles.timeButtonText}>▲</Text>
              </TouchableOpacity>
              
              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {time.hour.toString().padStart(2, '0')}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => handleHourChange(false)}
              >
                <Text style={styles.timeButtonText}>▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            {/* Минуты */}
            <View style={styles.timeSection}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => handleMinuteChange(true)}
              >
                <Text style={styles.timeButtonText}>▲</Text>
              </TouchableOpacity>
              
              <View style={styles.timeDisplay}>
                <Text style={styles.timeText}>
                  {time.minute.toString().padStart(2, '0')}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => handleMinuteChange(false)}
              >
                <Text style={styles.timeButtonText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    lineHeight: 18,
  },
  timeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.SCALE_COLOR,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSection: {
    alignItems: 'center',
  },
  timeButton: {
    padding: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: COLORS.SECONDARY_ACCENT,
    fontWeight: 'bold',
  },
  timeDisplay: {
    backgroundColor: COLORS.SCALE_COLOR,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: 8,
  },
});

export default NotificationCard;
