import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Импорт экранов
import PainTrackerScreen from './src/screens/PainTrackerScreen';
import DayPlanScreen from './src/screens/DayPlanScreen';
import ExerciseExecutionScreen from './src/screens/ExerciseExecutionScreen';
import SettingsStackNavigator from './src/navigation/SettingsStackNavigator';

// Импорт типов
import { RootStackParamList, TabParamList } from './src/types';
import { COLORS } from './src/constants/colors';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// Импорт сервиса уведомлений
import NotificationService from './src/NotificationService';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Основная навигация с вкладками
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Profile') {
            iconName = 'sentiment-satisfied';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.SECONDARY_ACCENT,
        tabBarInactiveTintColor: COLORS.TEXT_INACTIVE,
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopWidth: 1,
          borderTopColor: COLORS.PRIMARY_ACCENT,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DayPlanScreen}
        options={{
          title: 'План дня',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PainTrackerScreen}
        options={{
          title: 'Самочувствие',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStackNavigator}
        options={{
          title: 'Настройки',
        }}
      />
    </Tab.Navigator>
  );
}

// Главная навигация приложения
function App(): JSX.Element {
  // Firebase push уведомления и локальные уведомления
  useEffect(() => {
    console.log('App.tsx: Component mounted!');
    console.log('App.tsx: Setting up notifications...');
    
    const setupNotifications = async () => {
      // Инициализация NotificationService
      try {
        console.log('App.tsx: Initializing NotificationService...');
        const initialized = await NotificationService.initialize();
        if (initialized) {
          console.log('App.tsx: NotificationService initialized successfully');
          
          // Запрашиваем разрешения
          const permissionsGranted = await NotificationService.requestPermissions();
          console.log('App.tsx: Permissions granted:', permissionsGranted);
          
          // Загружаем сохраненные настройки и планируем уведомления
          const savedSettings = await NotificationService.loadNotificationSettings();
          if (savedSettings) {
            console.log('App.tsx: Loaded saved notification settings, scheduling notifications...');
            await NotificationService.scheduleNotificationsFromSettings(savedSettings);
          } else {
            console.log('App.tsx: No saved notification settings found');
          }
        } else {
          console.error('App.tsx: Failed to initialize NotificationService');
        }
      } catch (error) {
        console.error('App.tsx: Error initializing NotificationService:', error);
      }
      try {
        // Запрашиваем разрешение
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          console.log('App.tsx: Permission granted');
          
          // Получаем FCM токен
          const token = await messaging().getToken();
          if (token) {
            console.log('App.tsx: FCM Token:', token);
            
            // Foreground уведомления
            messaging().onMessage(async remoteMessage => {
              console.log('App.tsx: Notification in foreground:', remoteMessage);
              if (remoteMessage.notification) {
                Alert.alert(
                  remoteMessage.notification.title || 'Уведомление',
                  remoteMessage.notification.body || '',
                  [{ text: 'OK' }]
                );
              }
            });
            
            // Background уведомления
            messaging().onNotificationOpenedApp(remoteMessage => {
              console.log('App.tsx: App opened from notification:', remoteMessage);
            });
            
            // Quit state уведомления
            const initialNotification = await messaging().getInitialNotification();
            if (initialNotification) {
              console.log('App.tsx: App opened from quit state:', initialNotification);
            }
            
            console.log('App.tsx: Firebase notifications setup complete!');
          }
        } else {
          console.log('App.tsx: Notification permission denied');
        }
      } catch (error) {
        console.log('App.tsx: Error setting up notifications:', error);
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="ExerciseExecution" 
          component={ExerciseExecutionScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
