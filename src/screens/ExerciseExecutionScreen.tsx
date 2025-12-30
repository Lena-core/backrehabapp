import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
// @ts-ignore - игнорируем типы для react-native-video
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { ExerciseType, RootStackParamList } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { EXERCISE_DESCRIPTIONS } from '../constants/exercises/descriptions';
import { useSounds } from '../hooks';
import { useUserSettings } from '../hooks/useUserSettings';
import { useExerciseExecution } from '../hooks/useExerciseExecution';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ExerciseExecutionRouteProp = RouteProp<RootStackParamList, 'ExerciseExecution'>;

const ExerciseExecutionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseExecutionRouteProp>();
  const { exerciseType, exerciseName } = route.params;

  const { playSound, isSoundEnabled, toggleSoundEnabled } = useSounds(exerciseType);
  const { settings } = useUserSettings();
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  // ⚙️ ИСПОЛЬЗУЕМ ХУК useExerciseExecution - ВСЯ ЛОГИКА ВНУТРИ
  const {
    currentExerciseId,
    executionType,
    exerciseSettings,
    videoSource,
    isLoadingVideo,
    exerciseProgress,
    buttonState,
    timer,
    videoPlaybackState,
    videoRef,
    startExercise,
    formatTime,
    handleVideoLoad,
    handleVideoProgress,
    handleVideoEnd,
  } = useExerciseExecution({
    exerciseType,
    exerciseName,
    settings,
    playSound,
  });

  if (!settings || isLoadingVideo) {
    return (
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gifContainer}>
        <Video
          key={currentExerciseId}
          ref={videoRef}
          source={videoSource}
          style={styles.backgroundGif}
          resizeMode="contain"
          repeat={exerciseType === 'walk' || executionType === 'dynamic' || executionType === 'foam_rolling'}
          muted={true}
          paused={exerciseType === 'walk' ? false : videoPlaybackState.paused}
          poster=""
          ignoreSilentSwitch="ignore"
          playWhenInactive={true}
          playInBackground={false}
          onLoad={handleVideoLoad}
          onProgress={handleVideoProgress}
          onEnd={handleVideoEnd}
          onError={(error) => console.log('Video error:', error)}
          progressUpdateInterval={50}
        />
        
        {exerciseType === 'walk' ? (
          <LinearGradient
            colors={['rgba(147, 148, 143, 1)', 'rgba(147, 148, 143, 0.95)', 'rgba(147, 148, 143, 0)', 'rgba(147, 148, 143, 0)', 'rgba(147, 148, 143, 0)', 'rgba(147, 148, 143, 0.95)', 'rgba(147, 148, 143, 1)']}
            locations={[0, 0.25, 0.3, 0.5, 0.7, 0.75, 1]}
            style={styles.gradientVignette}
            pointerEvents="none"
          />
        ) : (
          <LinearGradient
            colors={['rgba(147, 148, 143, 1)', 'rgba(147, 148, 143, 0.95)', 'rgba(147, 148, 143, 0)', 'rgba(147, 148, 143, 0)', 'rgba(147, 148, 143, 0)', 'rgba(147, 148, 143, 0.95)', 'rgba(147, 148, 143, 1)']}
            locations={[0, 0.35, 0.37, 0.5, 0.63, 0.65, 1]}
            style={styles.gradientVignette}
            pointerEvents="none"
          />
        )}
        
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.4)']}
          locations={[0, 0.08, 0.15, 0.5, 0.85, 0.92, 1]}
          style={styles.gradientVignette}
          pointerEvents="none"
        />
      </View>
      
      <View style={styles.contentOverlay}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.titleWithInfoContainer} onPress={() => setShowDescriptionModal(true)}>
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.infoIcon}>ⓘ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.soundToggle, { backgroundColor: isSoundEnabled ? COLORS.PRIMARY_ACCENT : COLORS.SECONDARY_ACCENT }]} onPress={toggleSoundEnabled}>
            <Text style={styles.soundToggleText}>{isSoundEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsButton} onPress={() => { navigation.navigate('ManualExerciseSettings', { exerciseId: currentExerciseId, exerciseName: exerciseName }); }}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomContent}>
          {((timer.phase === 'prepare' && !timer.isRunning) || timer.phase === 'schemeCompleted') && buttonState !== 'completed' && (
            <View style={styles.timerContainer}>
              <TouchableOpacity style={styles.startButton} onPress={startExercise}>
                <Text style={styles.startButtonText}>{buttonState === 'continue' ? 'ПРОДОЛЖИТЬ' : 'СТАРТ'}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {buttonState === 'completed' && (
            <View style={styles.timerContainer}>
              <Text style={[styles.startButtonText, { fontSize: 24, color: COLORS.PRIMARY_ACCENT }]}>ВЫПОЛНЕНО</Text>
            </View>
          )}

          {(timer.isRunning || timer.phase === 'completed') && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{exerciseType === 'walk' ? formatTime(timer.currentTime) : timer.currentTime.toString()}</Text>
              <Text style={styles.instructionText}>{timer.instruction}</Text>
            </View>
          )}

          {exerciseType !== 'walk' && (
            <View>
              {executionType === 'foam_rolling' && exerciseSettings ? (
                <View style={styles.setsProgress}>
                  {Array.from({ length: exerciseSettings.rollingSessions || 2 }, (_, index) => (
                    <View key={index} style={[styles.setCircle, { backgroundColor: (index < timer.currentSession - 1) || timer.phase === 'completed' ? COLORS.PRIMARY_ACCENT : (index === timer.currentSession - 1 && timer.isRunning) ? COLORS.PRIMARY_ACCENT : COLORS.WHITE, borderColor: COLORS.PRIMARY_ACCENT }]}>
                      {((index < timer.currentSession - 1) || timer.phase === 'completed') && (<Text style={styles.checkmark}>✓</Text>)}
                    </View>
                  ))}
                </View>
              ) : executionType === 'dynamic' && exerciseSettings ? (
                <View style={styles.setsProgress}>
                  {Array.from({ length: exerciseSettings.dynamicSets || 2 }, (_, index) => (
                    <View key={index} style={[styles.setCircle, { backgroundColor: (index < timer.currentSet - 1) || timer.phase === 'completed' ? COLORS.PRIMARY_ACCENT : (index === timer.currentSet - 1 && timer.isRunning) ? COLORS.PRIMARY_ACCENT : COLORS.WHITE, borderColor: COLORS.PRIMARY_ACCENT }]}>
                      {((index < timer.currentSet - 1) || timer.phase === 'completed') && (<Text style={styles.checkmark}>✓</Text>)}
                    </View>
                  ))}
                </View>
              ) : exerciseType === 'bird_dog' ? (
                <View>
                  <View style={styles.schemeContainer}>
                    <Text style={styles.schemeLabel}>Левая рука + правая нога</Text>
                    <View style={styles.setsProgress}>
                      {Array.from({ length: (exerciseSettings?.repsSchema || settings.exerciseSettings.repsSchema).length }, (_, index) => (
                        <View key={`scheme1-${index}`} style={[styles.setCircle, { backgroundColor: (timer.schemeOneCompleted) || (exerciseProgress?.schemeOneCompleted) || (timer.currentScheme === 1 && index < timer.currentSet - 1) || (timer.currentScheme === 1 && index < (exerciseProgress?.completedSets || 0)) ? COLORS.PRIMARY_ACCENT : (timer.currentScheme === 1 && index === timer.currentSet - 1 && timer.isRunning) ? COLORS.PRIMARY_ACCENT : COLORS.WHITE, borderColor: COLORS.PRIMARY_ACCENT }]}>
                          {((timer.schemeOneCompleted) || (exerciseProgress?.schemeOneCompleted) || (timer.currentScheme === 1 && index < timer.currentSet - 1) || (timer.currentScheme === 1 && index < (exerciseProgress?.completedSets || 0))) && (<Text style={styles.checkmark}>✓</Text>)}
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.schemeContainer}>
                    <Text style={styles.schemeLabel}>Правая рука + левая нога</Text>
                    <View style={styles.setsProgress}>
                      {Array.from({ length: (exerciseSettings?.repsSchema || settings.exerciseSettings.repsSchema).length }, (_, index) => (
                        <View key={`scheme2-${index}`} style={[styles.setCircle, { backgroundColor: (timer.phase === 'completed') || (timer.currentScheme === 2 && index < timer.currentSet - 1) || (timer.currentScheme === 2 && index < (exerciseProgress?.completedSets || 0)) ? COLORS.PRIMARY_ACCENT : (timer.currentScheme === 2 && index === timer.currentSet - 1 && timer.isRunning) ? COLORS.PRIMARY_ACCENT : COLORS.WHITE, borderColor: COLORS.PRIMARY_ACCENT }]}>
                          {((timer.phase === 'completed') || (timer.currentScheme === 2 && index < timer.currentSet - 1) || (timer.currentScheme === 2 && index < (exerciseProgress?.completedSets || 0))) && (<Text style={styles.checkmark}>✓</Text>)}
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.setsProgress}>
                  {Array.from({ length: (exerciseSettings?.repsSchema || settings.exerciseSettings.repsSchema).length }, (_, index) => (
                    <View key={index} style={[styles.setCircle, { backgroundColor: (index < (exerciseProgress?.completedSets || 0)) || (index < timer.currentSet - 1) || timer.phase === 'completed' ? COLORS.PRIMARY_ACCENT : (index === timer.currentSet - 1 && timer.isRunning) ? COLORS.PRIMARY_ACCENT : COLORS.WHITE, borderColor: COLORS.PRIMARY_ACCENT }]}>
                      {((index < (exerciseProgress?.completedSets || 0)) || (index < timer.currentSet - 1) || timer.phase === 'completed') && (<Text style={styles.checkmark}>✓</Text>)}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.parametersContainer}>
            {executionType === 'foam_rolling' && exerciseSettings ? (
              <>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Длительность прокатки</Text><Text style={styles.parameterValue}>{exerciseSettings.rollingDuration || 60} сек</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Количество сессий</Text><Text style={styles.parameterValue}>{exerciseSettings.rollingSessions || 2}</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Отдых</Text><Text style={styles.parameterValue}>{exerciseSettings.restTime || 30} сек</Text></View>
              </>
            ) : executionType === 'dynamic' && exerciseSettings ? (
              <>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Повторений в подходе</Text><Text style={styles.parameterValue}>{exerciseSettings.dynamicReps || 10}</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Количество подходов</Text><Text style={styles.parameterValue}>{exerciseSettings.dynamicSets || 2}</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Отдых</Text><Text style={styles.parameterValue}>{exerciseSettings.restTime || 15} сек</Text></View>
              </>
            ) : exerciseType === 'walk' ? (
              <>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Длительность сессии</Text><Text style={styles.parameterValue}>{exerciseSettings?.walkDuration || settings.walkSettings.duration} мин</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Количество сессий</Text><Text style={styles.parameterValue}>{exerciseSettings?.walkSessions || settings.walkSettings.sessions}</Text></View>
              </>
            ) : (
              <>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Время удержания</Text><Text style={styles.parameterValue}>{exerciseSettings?.holdTime || settings.exerciseSettings.holdTime} сек</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Схема</Text><Text style={styles.parameterValue}>{(exerciseSettings?.repsSchema || settings.exerciseSettings.repsSchema).join('-')}</Text></View>
                <View style={styles.parameter}><Text style={styles.parameterLabel}>Отдых</Text><Text style={styles.parameterValue}>{exerciseSettings?.restTime || settings.exerciseSettings.restTime} сек</Text></View>
              </>
            )}
          </View>

          <Text style={styles.disclaimer}>
            Приведенная информация носит справочный характер. Если вам требуется медицинская консультация или постановка диагноза, обратитесь к специалисту.
          </Text>
        </View>
      </View>

      <Modal visible={showDescriptionModal} transparent={true} animationType="fade" onRequestClose={() => setShowDescriptionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Описание упражнения</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowDescriptionModal(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalDescriptionText}>{EXERCISE_DESCRIPTIONS[exerciseType]}</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDescriptionModal(false)}>
                <Text style={styles.modalCloseButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#93948f' },
  gifContainer: { position: 'absolute', top: 0, left: 0, width: screenWidth, height: screenHeight, zIndex: 0 },
  backgroundGif: { width: screenWidth, height: screenHeight, position: 'absolute', top: 0, zIndex: 0 },
  contentOverlay: { flex: 1, position: 'relative', zIndex: 3 },
  gradientVignette: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: COLORS.TEXT_PRIMARY },
  headerContainer: { position: 'absolute', top: 10, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 20, zIndex: 4 },
  backButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 24, color: COLORS.WHITE, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  titleWithInfoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', marginHorizontal: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.WHITE, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  infoIcon: { fontSize: 16, color: COLORS.WHITE, marginLeft: 10, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  soundToggle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, marginLeft: 8 },
  soundToggleText: { fontSize: 20 },
  settingsButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.WHITE, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, marginLeft: 8 },
  settingsButtonText: { fontSize: 20 },
  bottomContent: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 30, zIndex: 4 },
  timerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  timerText: { fontSize: 56, fontWeight: 'bold', color: COLORS.WHITE, marginBottom: 10, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  instructionText: { fontSize: 16, color: COLORS.WHITE, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  startButton: { backgroundColor: COLORS.CTA_BUTTON, width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  startButtonText: { fontSize: 20, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, letterSpacing: 1 },
  setsProgress: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  schemeContainer: { marginBottom: 15 },
  schemeLabel: { fontSize: 12, color: COLORS.WHITE, textAlign: 'center', marginBottom: 8, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  setCircle: { width: 35, height: 35, borderRadius: 17.5, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  checkmark: { color: COLORS.WHITE, fontSize: 14, fontWeight: 'bold' },
  parametersContainer: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 15, padding: 15, marginBottom: 15 },
  parameter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  parameterLabel: { fontSize: 14, color: COLORS.WHITE, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  parameterValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.WHITE, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  disclaimer: { fontSize: 10, color: COLORS.WHITE, textAlign: 'center', lineHeight: 14, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: COLORS.WHITE, borderRadius: 20, padding: 0, maxHeight: '80%', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.SCALE_COLOR },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, flex: 1 },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.SCALE_COLOR, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 16, color: COLORS.TEXT_PRIMARY, fontWeight: 'bold' },
  modalDescriptionText: { fontSize: 16, lineHeight: 24, color: COLORS.TEXT_PRIMARY, padding: 20 },
  modalCloseButton: { backgroundColor: COLORS.CTA_BUTTON, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, alignSelf: 'center', marginHorizontal: 20, marginBottom: 20 },
  modalCloseButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY, textAlign: 'center' },
});

export default ExerciseExecutionScreen;
