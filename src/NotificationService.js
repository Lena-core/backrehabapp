import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { PermissionsAndroid } from 'react-native';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.scheduledNotifications = new Map();
    console.log('NotificationService: Constructor initialized');
  }

  // Инициализация сервиса
  async initialize() {
    try {
      console.log('NotificationService: Starting initialization...');
      
      // Конфигурация PushNotification
      PushNotification.configure({
        // Обработчик уведомлений в foreground
        onNotification: function (notification) {
          console.log('NotificationService: Notification received:', notification);
        },
        
        // Разрешения для iOS
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        
        // Запрос разрешений при запуске (iOS)
        requestPermissions: Platform.OS === 'ios',
      });
      
      // Создаем канал для Android
      PushNotification.createChannel(
        {
          channelId: 'backrehab-default',
          channelName: 'BackRehab Notifications',
          channelDescription: 'Уведомления приложения BackRehab',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`NotificationService: Channel created: ${created}`)
      );
      
      this.isInitialized = true;
      console.log('NotificationService: Initialization complete');
      return true;
    } catch (error) {
      console.error('NotificationService: Initialization failed:', error);
      return false;
    }
  }

  // Запрос разрешений на уведомления
  async requestPermissions() {
    try {
      console.log('NotificationService: Requesting permissions...');
      
      if (Platform.OS === 'android') {
        // Android 13+: разрешение на POST_NOTIFICATIONS
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('NotificationService: POST_NOTIFICATIONS permission denied');
            return false;
          }
        }
        
        // Android 12+: проверяем разрешение SCHEDULE_EXACT_ALARM
        // Это разрешение пользователь должен предоставить в настройках
        if (Platform.Version >= 31) {
          console.log('NotificationService: SCHEDULE_EXACT_ALARM permission required for Android 12+');
          console.log('NotificationService: This permission is granted via AndroidManifest.xml');
        }
        
        return true;
      } else if (Platform.OS === 'ios') {
        // iOS: разрешения запрашиваются автоматически в configure()
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('NotificationService: Permission request failed:', error);
      return false;
    }
  }

  // Планирование уведомлений на основе настроек
  async scheduleNotificationsFromSettings(notificationSettings) {
    try {
      console.log('NotificationService: Scheduling notifications from settings:', notificationSettings);
      
      // Очищаем существующие уведомления
      await this.cancelAllScheduledNotifications();
      
      // Планируем уведомления для каждого типа
      for (const [type, config] of Object.entries(notificationSettings)) {
        if (config.enabled) {
          await this.scheduleNotification(type, config.time);
        }
      }
      
      console.log('NotificationService: All notifications scheduled successfully');
      return true;
    } catch (error) {
      console.error('NotificationService: Failed to schedule notifications:', error);
      return false;
    }
  }

  // Планирование одного уведомления
  async scheduleNotification(notificationType, time) {
    try {
      const notificationConfig = this.getNotificationConfig(notificationType);
      
      // Генерируем числовой ID на основе типа (важно для Android)
      const typeIds = {
        exerciseReminders: 1000,
        spineHygieneTips: 2000,
        educationalMessages: 3000
      };
      const notificationId = typeIds[notificationType] || 9999;
      
      console.log(`NotificationService: Scheduling ${notificationType} (ID: ${notificationId}) at ${time.hour}:${time.minute}`);
      
      // Создаем дату для уведомления
      const scheduledDate = new Date();
      scheduledDate.setHours(time.hour, time.minute, 0, 0);
      
      console.log(`NotificationService: Current time: ${new Date().toLocaleString()}`);
      console.log(`NotificationService: Scheduled time: ${scheduledDate.toLocaleString()}`);
      
      // Если время уже прошло сегодня, планируем на завтра
      if (scheduledDate.getTime() < Date.now()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        console.log(`NotificationService: Time passed today, scheduling for tomorrow: ${scheduledDate.toLocaleString()}`);
      }

      // Планируем уведомление
      PushNotification.localNotificationSchedule({
        id: notificationId.toString(), // Преобразуем в строку
        title: notificationConfig.title,
        message: notificationConfig.body,
        date: scheduledDate,
        repeatType: 'day', // Повторяется каждый день
        channelId: 'backrehab-default', // Канал для Android
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300,
        allowWhileIdle: true, // Важно для Android - позволяет уведомлениям работать в режиме сна
      });

      // Сохраняем информацию об уведомлении
      this.scheduledNotifications.set(notificationId, {
        id: notificationId,
        type: notificationType,
        title: notificationConfig.title,
        body: notificationConfig.body,
        scheduledTime: time,
        isActive: true,
        scheduledDate: scheduledDate.toISOString()
      });

      console.log(`NotificationService: Successfully scheduled ${notificationType} with ID ${notificationId}`);
      console.log(`NotificationService: Notification will fire at: ${scheduledDate.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error(`NotificationService: Failed to schedule ${notificationType}:`, error);
      return null;
    }
  }

  // Отмена всех запланированных уведомлений
  async cancelAllScheduledNotifications() {
    try {
      console.log('NotificationService: Canceling all scheduled notifications');
      
      // Отменяем все уведомления
      PushNotification.cancelAllLocalNotifications();
      
      // Очищаем локальный реестр
      this.scheduledNotifications.clear();
      
      console.log('NotificationService: All notifications canceled');
      return true;
    } catch (error) {
      console.error('NotificationService: Failed to cancel notifications:', error);
      return false;
    }
  }

  // Отмена уведомления по ID
  async cancelNotification(notificationId) {
    try {
      console.log(`NotificationService: Canceling notification ${notificationId}`);
      
      // Отменяем уведомление по ID
      PushNotification.cancelLocalNotifications({id: notificationId});
      
      this.scheduledNotifications.delete(notificationId);
      
      console.log(`NotificationService: Notification ${notificationId} canceled`);
      return true;
    } catch (error) {
      console.error(`NotificationService: Failed to cancel notification ${notificationId}:`, error);
      return false;
    }
  }

  // Получение конфигурации уведомления по типу
  getNotificationConfig(notificationType) {
    const configs = {
      exerciseReminders: {
        title: '💪 Время тренировки!',
        body: 'Не забудьте выполнить упражнения для укрепления спины. Всего 10-15 минут в день!',
        icon: 'exercise'
      },
      spineHygieneTips: {
        title: '🧘‍♀️ Позаботьтесь о спине',
        body: 'Проверьте свою осанку! Сделайте небольшую разминку и потянитесь.',
        icon: 'health'
      },
      educationalMessages: {
        title: '🎓 Знания о здоровье',
        body: 'Новые исследования показывают важность регулярной физической активности для здоровья позвоночника.',
        icon: 'education'
      }
    };

    return configs[notificationType] || {
      title: 'BackRehab',
      body: 'У вас есть новое уведомление',
      icon: 'default'
    };
  }

  // Получение всех активных уведомлений
  getScheduledNotifications() {
    return Array.from(this.scheduledNotifications.values());
  }

  // Проверка статуса инициализации
  isServiceInitialized() {
    return this.isInitialized;
  }

  // Отправка тестового уведомления
  async sendTestNotification() {
    try {
      console.log('NotificationService: Sending test notification');
      
      // Отправляем немедленное уведомление
      PushNotification.localNotification({
        id: 'test-notification',
        title: '🏃‍♂️ BackRehab Test',
        message: 'Тестовое уведомление работает!',
        channelId: 'backrehab-default',
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300
      });
      
      return true;
    } catch (error) {
      console.error('NotificationService: Failed to send test notification:', error);
      return false;
    }
  }

  // Сохранение настроек уведомлений в AsyncStorage  
  async saveNotificationSettings(settings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('NotificationService: Settings saved successfully');
      return true;
    } catch (error) {
      console.error('NotificationService: Failed to save settings:', error);
      return false;
    }
  }

  // Загрузка настроек уведомлений из AsyncStorage
  async loadNotificationSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem('notificationSettings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        console.log('NotificationService: Settings loaded:', settings);
        return settings;
      }
      return null;
    } catch (error) {
      console.error('NotificationService: Failed to load settings:', error);
      return null;
    }
  }
}

// Экспортируем единственный экземпляр (Singleton)
const notificationService = new NotificationService();
export default notificationService;

console.log('NotificationService: Module loaded successfully');
