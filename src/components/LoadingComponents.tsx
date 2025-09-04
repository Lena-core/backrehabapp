import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/colors';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = 'Загрузка...',
  style,
  textStyle,
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, style]}>
      <LinearGradient colors={GRADIENTS.MAIN_BACKGROUND} style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY_ACCENT} />
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </LinearGradient>
    </View>
  );
};

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = COLORS.SCALE_COLOR,
  progressColor = COLORS.PRIMARY_ACCENT,
  style,
  animated = true,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[
        styles.progressContainer,
        { height, backgroundColor },
        style,
      ]}
    >
      <View
        style={[
          styles.progressBar,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: progressColor,
            height: height - 2,
          },
        ]}
      />
    </View>
  );
};

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 60,
  strokeWidth = 6,
  backgroundColor = COLORS.SCALE_COLOR,
  progressColor = COLORS.PRIMARY_ACCENT,
  showPercentage = true,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      <View
        style={[
          styles.circularProgress,
          {
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.circularProgressActive,
            {
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              borderTopColor: backgroundColor,
              transform: [{ rotate: `${clampedProgress * 360}deg` }],
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentageText}>{percentage}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    borderRadius: 3,
    margin: 1,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularProgressActive: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
});

export { LoadingOverlay, ProgressBar, CircularProgress };
