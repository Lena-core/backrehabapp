import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { SettingsStackParamList } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';

type SettingsMainScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

interface SettingsMenuItem {
  id: string;
  title: string;
  description: string;
  screen: keyof SettingsStackParamList;
  icon: string;
}

const settingsMenuItems: SettingsMenuItem[] = [
  {
    id: 'exercises',
    title: 'Упражнения',
    description: 'Настройка параметров упражнений и ходьбы',
    screen: 'ExerciseSettings',
    icon: '🏃‍♀️',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Управление push-уведомлениями',
    screen: 'Notifications',
    icon: '🔔',
  },
  {
    id: 'feedback',
    title: 'Обратная связь',
    description: 'Отправить отзыв или предложение',
    screen: 'Feedback',
    icon: '💬',
  },
  {
    id: 'privacy',
    title: 'Политика конфиденциальности',
    description: 'Информация о защите данных',
    screen: 'PrivacyPolicy',
    icon: '🔒',
  },
  {
    id: 'agreement',
    title: 'Пользовательское соглашение',
    description: 'Условия использования приложения',
    screen: 'UserAgreement',
    icon: '📋',
  },
];

const SettingsMainScreen: React.FC = () => {
  const navigation = useNavigation<SettingsMainScreenNavigationProp>();

  const handleMenuItemPress = (screen: keyof SettingsStackParamList) => {
    navigation.navigate(screen);
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Настройки</Text>
          <Text style={styles.headerSubtitle}>
            Настройте приложение под свои потребности
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {settingsMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemIcon}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
                <View style={styles.menuItemArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Медицинское предупреждение */}
        <Text style={styles.disclaimer}>
          Приведенная информация носит справочный характер. Если вам требуется 
          медицинская консультация или постановка диагноза, обратитесь к специалисту.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: 30,
  },
  menuItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  menuItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.SCALE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.6,
    lineHeight: 18,
  },
  menuItemArrow: {
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.3,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
    marginTop: 20,
  },
});

export default SettingsMainScreen;
