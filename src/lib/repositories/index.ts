import {
  ICompetitionRepository,
  IRegistrationRepository,
  ISubmissionRepository,
  IScoreRepository,
  IUserRepository,
} from './types';
import {
  MockCompetitionRepository,
  MockRegistrationRepository,
  MockSubmissionRepository,
  MockScoreRepository,
  MockUserRepository,
} from './mock';
import {
  SupabaseCompetitionRepository,
  SupabaseRegistrationRepository,
  SupabaseSubmissionRepository,
  SupabaseScoreRepository,
  SupabaseUserRepository,
} from './supabase';

import { isSupabaseLive } from '../supabase/status';
export { isSupabaseLive };

// Singletons Repository Provider
const mockCompRepo = new MockCompetitionRepository();
const mockRegRepo = new MockRegistrationRepository();
const mockSubRepo = new MockSubmissionRepository();
const mockScoreRepo = new MockScoreRepository();
const mockUserRepo = new MockUserRepository();

const supaCompRepo = new SupabaseCompetitionRepository();
const supaRegRepo = new SupabaseRegistrationRepository();
const supaSubRepo = new SupabaseSubmissionRepository();
const supaScoreRepo = new SupabaseScoreRepository();
const supaUserRepo = new SupabaseUserRepository();

export const competitionRepository: ICompetitionRepository = isSupabaseLive()
  ? supaCompRepo
  : mockCompRepo;

export const registrationRepository: IRegistrationRepository = isSupabaseLive()
  ? supaRegRepo
  : mockRegRepo;

export const submissionRepository: ISubmissionRepository = isSupabaseLive()
  ? supaSubRepo
  : mockSubRepo;

export const scoreRepository: IScoreRepository = isSupabaseLive()
  ? supaScoreRepo
  : mockScoreRepo;

export const userRepository: IUserRepository = isSupabaseLive()
  ? supaUserRepo
  : mockUserRepo;

export * from './types';
