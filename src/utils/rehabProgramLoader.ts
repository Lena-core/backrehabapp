import AsyncStorage from '@react-native-async-storage/async-storage';
import { RehabProgram } from '../types';
import rehabProgramsJson from '../assets/rehabPrograms.json';

const REHAB_PROGRAMS_KEY = '@rehab_programs';
const REHAB_PROGRAMS_VERSION_KEY = '@rehab_programs_version';

/**
 * Загрузчик программ реабилитации
 */
export class RehabProgramLoader {
  
  /**
   * Инициализировать программы из JSON
   */
  static async initializePrograms(): Promise<void> {
    try {
      const currentVersion = await AsyncStorage.getItem(REHAB_PROGRAMS_VERSION_KEY);
      const jsonVersion = rehabProgramsJson.version;
      
      if (currentVersion !== jsonVersion) {
        await AsyncStorage.setItem(REHAB_PROGRAMS_KEY, JSON.stringify(rehabProgramsJson.programs));
        await AsyncStorage.setItem(REHAB_PROGRAMS_VERSION_KEY, jsonVersion);
        console.log(`[RehabProgramLoader] Programs initialized to version ${jsonVersion}`);
      } else {
        console.log('[RehabProgramLoader] Programs are up to date');
      }
    } catch (error) {
      console.error('[RehabProgramLoader] Error initializing programs:', error);
      await AsyncStorage.setItem(REHAB_PROGRAMS_KEY, JSON.stringify(rehabProgramsJson.programs));
      await AsyncStorage.setItem(REHAB_PROGRAMS_VERSION_KEY, rehabProgramsJson.version);
    }
  }

  /**
   * Получить все программы
   */
  static async getAllPrograms(): Promise<RehabProgram[]> {
    try {
      const stored = await AsyncStorage.getItem(REHAB_PROGRAMS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return rehabProgramsJson.programs as RehabProgram[];
    } catch (error) {
      console.error('[RehabProgramLoader] Error loading programs:', error);
      return rehabProgramsJson.programs as RehabProgram[];
    }
  }

  /**
   * Получить программу по ID
   */
  static async getProgramById(id: string): Promise<RehabProgram | null> {
    try {
      const programs = await this.getAllPrograms();
      return programs.find(p => p.id === id) || null;
    } catch (error) {
      console.error('[RehabProgramLoader] Error loading program by ID:', error);
      return null;
    }
  }

  /**
   * Получить программы по фазе
   */
  static async getProgramsByPhase(phase: string): Promise<RehabProgram[]> {
    try {
      const programs = await this.getAllPrograms();
      return programs.filter(p => p.phase === phase);
    } catch (error) {
      console.error('[RehabProgramLoader] Error loading programs by phase:', error);
      return [];
    }
  }
}

export default RehabProgramLoader;
