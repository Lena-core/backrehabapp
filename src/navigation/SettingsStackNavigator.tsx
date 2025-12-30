import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsStackParamList } from '../types';
import { COLORS } from '../constants/colors';

// Импорт экранов настроек
import SettingsMainScreen from '../screens/SettingsMainScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import UserAgreementScreen from '../screens/UserAgreementScreen';
import TestInfrastructureScreen from '../screens/TestInfrastructureScreen';

const SettingsStack = createStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator: React.FC = () => {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.WHITE,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.TEXT_PRIMARY,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsMainScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          title: 'Уведомления',
          headerTitleAlign: 'center',
        }}
      />
      <SettingsStack.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{ 
          title: 'Обратная связь',
          headerTitleAlign: 'center',
        }}
      />
      <SettingsStack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ 
          title: 'Политика конфиденциальности',
          headerTitleAlign: 'center',
        }}
      />
      <SettingsStack.Screen 
        name="UserAgreement" 
        component={UserAgreementScreen}
        options={{ 
          title: 'Пользовательское соглашение',
          headerTitleAlign: 'center',
        }}
      />
      <SettingsStack.Screen 
        name="TestInfrastructure" 
        component={TestInfrastructureScreen}
        options={{ 
          title: '🧪 Тестирование',
          headerTitleAlign: 'center',
        }}
      />
    </SettingsStack.Navigator>
  );
};

export default SettingsStackNavigator;
