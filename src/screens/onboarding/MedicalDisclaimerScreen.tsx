// Экран медицинских противопоказаний

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { OnboardingStackParamList } from '../../types';
import { COLORS, GRADIENTS, MEDICAL_DISCLAIMER } from '../../constants';
import { useOnboarding } from '../../contexts';
import CustomButton from '../../components/CustomButton';

const { width, height } = Dimensions.get('window');

type MedicalDisclaimerNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'MedicalDisclaimer'
>;

const MedicalDisclaimerScreen: React.FC = () => {
  const navigation = useNavigation<MedicalDisclaimerNavigationProp>();
  const { setAcknowledgedDisclaimer } = useOnboarding();
  const [isChecked, setIsChecked] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (isChecked) {
      setAcknowledgedDisclaimer(true);
      navigation.navigate('PainApproach');
    }
  };

  const toggleCheckbox = () => {
    setIsChecked(!isChecked);
  };

  return (
    <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
      <View style={styles.content}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>{MEDICAL_DISCLAIMER.title}</Text>
          <Text style={styles.subtitle}>{MEDICAL_DISCLAIMER.subtitle}</Text>
        </View>

        {/* Список противопоказаний */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {MEDICAL_DISCLAIMER.contraindications.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.itemContainer}>
                  <View style={styles.bullet} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Дисклеймер */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              {MEDICAL_DISCLAIMER.disclaimer}
            </Text>
          </View>
        </ScrollView>

        {/* Чекбокс */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={toggleCheckbox}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
            {isChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            {MEDICAL_DISCLAIMER.checkboxLabel}
          </Text>
        </TouchableOpacity>

        {/* Кнопки навигации */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={MEDICAL_DISCLAIMER.backButton}
            onPress={handleBack}
            variant="outline"
            size="medium"
            style={styles.backButton}
          />
          <CustomButton
            title="Далее"
            onPress={handleContinue}
            variant="primary"
            size="medium"
            disabled={!isChecked}
            style={styles.continueButton}
          />
        </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    marginTop: 7,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  disclaimerContainer: {
    backgroundColor: COLORS.PAIN_ACUTE,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.TEXT_INACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.CTA_BUTTON,
    borderColor: COLORS.CTA_BUTTON,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 20,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default MedicalDisclaimerScreen;
