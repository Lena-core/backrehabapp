// Навигатор для экранов онбординга

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { OnboardingStackParamList } from '../types';
import { COLORS } from '../constants';

// Импорт экранов онбординга
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import MedicalDisclaimerScreen from '../screens/onboarding/MedicalDisclaimerScreen';
import PainApproachScreen from '../screens/onboarding/PainApproachScreen';
import PainLevelScreen from '../screens/onboarding/PainLevelScreen';
import ExercisePreviewScreen from '../screens/onboarding/ExercisePreviewScreen';
import NotificationSetupScreen from '../screens/onboarding/NotificationSetupScreen';
import ReadyScreen from '../screens/onboarding/ReadyScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress,
          },
        }),
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="MedicalDisclaimer" 
        component={MedicalDisclaimerScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="PainApproach" 
        component={PainApproachScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="PainLevel" 
        component={PainLevelScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="ExercisePreview" 
        component={ExercisePreviewScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="NotificationSetup" 
        component={NotificationSetupScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Ready" 
        component={ReadyScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
