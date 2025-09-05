import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface SetsProgressProps {
  totalSets: number;
  currentSet: number;
  isCompleted: boolean;
}

export const SetsProgress: React.FC<SetsProgressProps> = ({
  totalSets,
  currentSet,
  isCompleted,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSets }, (_, index) => (
        <View
          key={index}
          style={[
            styles.setCircle,
            {
              backgroundColor: 
                index < currentSet - 1 || isCompleted
                  ? COLORS.PRIMARY_ACCENT
                  : index === currentSet - 1
                  ? COLORS.PRIMARY_ACCENT
                  : COLORS.WHITE,
              borderColor: COLORS.PRIMARY_ACCENT,
            },
          ]}
        >
          {index < currentSet - 1 && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  setCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
