import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Импорт экранов (будут созданы далее)
import PainTrackerScreen from './src/screens/PainTrackerScreen';
import DayPlanScreen from './src/screens/DayPlanScreen';
import ExerciseExecutionScreen from './src/screens/ExerciseExecutionScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Импорт типов
import { RootStackParamList, TabParamList } from './src/types';
import { COLORS } from './src/constants/colors';

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
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
