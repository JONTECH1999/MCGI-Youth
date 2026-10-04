import { LandingPageConfig } from '../types/landingPage';

export const LOCAL_OF_ASCOVILLE = 'Local of Ascoville';

export const normalizeRecordLocations = <T extends { location?: string }>(records: T[]): T[] =>
  records.map((record) => ({ ...record, location: LOCAL_OF_ASCOVILLE }));

export const normalizeLandingPageLocation = (config: LandingPageConfig): LandingPageConfig => ({
  ...config,
  contactLocation: LOCAL_OF_ASCOVILLE,
});