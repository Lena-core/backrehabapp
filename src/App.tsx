import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';

// Импорт экранов (будут созданы далее)
import PainTrackerScreen from './screens/PainTrackerScreen';
import DayPlanScreen from './screens/DayPlanScreen';
import ExerciseExecutionScreen from './screens/ExerciseExecutionScreen';
import SettingsScreen from './screens/SettingsScreen';

// Импорт типов
import { RootStackParamList, TabParamList } from './types';
import { COLORS } from './constants/colors';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Основная навигация с вкладками
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.SECONDARY_ACCENT,
        tabBarInactiveTintColor: COLORS.TEXT_INACTIVE,
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DayPlanScreen}
        options={{
          title: 'План дня',
          // Здесь можно добавить иконки когда они будут готовы
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={PainTrackerScreen}
        options={{
          title: 'Трекер боли',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Настройки',
        }}
      />
    </Tab.Navigator>
  );
}

// Главная навигация приложения
function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="ExerciseExecution" 
          component={ExerciseExecutionScreen}
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: COLORS.WHITE,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: COLORS.TEXT_PRIMARY,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
