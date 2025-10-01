import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import messaging from '@react-native-firebase/messaging';

// Импорт экранов
import PainTrackerScreen from './screens/PainTrackerScreen';
import DayPlanScreen from './screens/DayPlanScreen';
import ExerciseExecutionScreen from './screens/ExerciseExecutionScreen';
import SettingsStackNavigator from './navigation/SettingsStackNavigator';
import OnboardingNavigator from './navigation/OnboardingNavigator';

// Импорт типов
import { RootStackParamList, TabParamList } from './types';
import { COLORS } from './constants/colors';

// Импорт контекста
import { OnboardingProvider, useOnboarding } from './contexts';

// Импорт сервиса уведомлений
import NotificationService from './NotificationService';

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
function AppNavigator(): JSX.Element {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();

  // Инициализация уведомлений
  useEffect(() => {
    console.log('App: Component mounted!');
    console.log('App: Setting up notifications...');
    
    const setupNotifications = async () => {
      // Инициализация NotificationService
      try {
        console.log('App: Initializing NotificationService...');
        const initialized = await NotificationService.initialize();
        if (initialized) {
          console.log('App: NotificationService initialized successfully');
          
          // Запрашиваем разрешения
          const permissionsGranted = await NotificationService.requestPermissions();
          console.log('App: Permissions granted:', permissionsGranted);
          
          // Загружаем сохраненные настройки и планируем уведомления
          const savedSettings = await NotificationService.loadNotificationSettings();
          if (savedSettings) {
            console.log('App: Loaded saved notification settings, scheduling notifications...');
            await NotificationService.scheduleNotificationsFromSettings(savedSettings);
          } else {
            console.log('App: No saved notification settings found');
          }
        } else {
          console.error('App: Failed to initialize NotificationService');
        }
      } catch (error) {
        console.error('App: Error initializing NotificationService:', error);
      }

      // Firebase push уведомления
      try {
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          console.log('App: Firebase permission granted');
          
          const token = await messaging().getToken();
          if (token) {
            console.log('App: FCM Token:', token);
            
            // Foreground уведомления
            messaging().onMessage(async remoteMessage => {
              console.log('App: Notification in foreground:', remoteMessage);
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
              console.log('App: App opened from notification:', remoteMessage);
            });
            
            // Quit state уведомления
            const initialNotification = await messaging().getInitialNotification();
            if (initialNotification) {
              console.log('App: App opened from quit state:', initialNotification);
            }
            
            console.log('App: Firebase notifications setup complete!');
          }
        } else {
          console.log('App: Firebase notification permission denied');
        }
      } catch (error) {
        console.log('App: Error setting up Firebase notifications:', error);
      }
    };
    
    setupNotifications();
  }, []);

  // Показываем loading screen пока проверяем статус онбординга
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.CTA_BUTTON} />
      </View>
    );
  }

  // Если онбординг не завершен - показываем онбординг
  if (!hasCompletedOnboarding) {
    return <OnboardingNavigator />;
  }

  // Иначе показываем основное приложение
  return (
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
  );
}

function App(): JSX.Element {
  return (
    <OnboardingProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_TOP,
  },
});

export default App;
