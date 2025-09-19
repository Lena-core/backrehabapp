import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/colors';

const UserAgreementScreen: React.FC = () => {
  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📋</Text>
        </View>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          Здесь будут размещены условия использования приложения 
          и правила взаимодействия с сервисом.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.SCALE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY_ACCENT,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default UserAgreementScreen;
