import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { auth } from 'express-oauth2-jwt-bearer';
import { z } from 'zod';
import { db } from './db.js';
import { AuthGuard } from './login/AuthGuard.js';
import { AuthUser } from './login/AuthUser.js';
import { ProfileService } from './login/ProfileService.js';
import { SqliteSchoolRepository } from './repositories/SqliteSchoolRepository.js';
import { SqliteUserRepository } from './repositories/SqliteUserRepository.js';
import { SCHOOL_YEARS, ACTIVITY_TYPES, PRONOUNS } from './types.js';
import { AppError } from './domain/errors.js';
import { SqliteActivityRepository } from './repositories/SqliteActivityRepository.js';
import { SqliteJoinRequestRepository } from './repositories/SqliteJoinRequestRepository.js';
import { ActivityService } from './activities/ActivityService.js';
import { activityAPI } from './activities/activityAPI.js';
import { JoinRequestService } from './joinRequests/JoinRequestService.js';
import { joinRequestAPI } from './joinRequests/joinRequestAPI.js';
import { RecommendationService } from './recommendations/RecommendationService.js';
import { ConsoleEmailService } from './notifications/EmailService.js';
import { NotificationService } from './notifications/NotificationService.js';
import { ResendEmailService } from './notifications/ResendEmailService.js';
import { schoolAPI } from './schools/schoolAPI.js';
import { supabase, SupabaseActivityRepository, SupabaseJoinRequestRepository, SupabaseSchoolRepository, SupabaseUserRepository } from './repositories/SupabaseRepositories.js';
import type { UserRepository } from './repositories/UserRepository.js';
import type { SchoolRepository } from './repositories/SchoolRepository.js';
import type { ActivityRepository } from './repositories/ActivityRepository.js';
import type { JoinRequestRepository } from './repositories/JoinRequestRepository.js';

const app = express();
const frontendOrigins = process.env.FRONTEND_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const client = useSupabase ? supabase() : null;
const users: UserRepository = client ? new SupabaseUserRepository(client) : new SqliteUserRepository(db);
const schools: SchoolRepository = client ? new SupabaseSchoolRepository(client) : new SqliteSchoolRepository(db);
const activities: ActivityRepository = client ? new SupabaseActivityRepository(client) : new SqliteActivityRepository(db);
const joinRequests: JoinRequestRepository = client ? new SupabaseJoinRequestRepository(client) : new SqliteJoinRequestRepository(db);
const activityService = new ActivityService(activities, users);
const emailService = process.env.RESEND_API_KEY && process.env.EMAIL_FROM
  ? new ResendEmailService(process.env.EMAIL_FROM)
  : new ConsoleEmailService();
const notifications = new NotificationService(emailService);
const service = new ProfileService(users, schools, notifications);
const joinRequestService = new JoinRequestService(
  joinRequests,
  activities,
  users,
  notifications,
);
const recommendations = new RecommendationService(activities, users);


const profileSchema = z.object({
  schoolId: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  pronoun: z.enum(PRONOUNS).nullable().optional(),
  schoolYear: z.enum(SCHOOL_YEARS),
  major: z.string().max(100).nullable().optional(),
  hobbies: z.array(z.string().trim().min(1).max(50)).max(20),
  interestedTypes: z.array(z.enum(ACTIVITY_TYPES)).max(ACTIVITY_TYPES.length),
});


app.use(cors({ origin: frontendOrigins?.length ? frontendOrigins : true }));
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

if (process.env.AUTH0_ISSUER_BASE_URL && process.env.AUTH0_AUDIENCE) {
  app.use(
    auth({
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
      audience: process.env.AUTH0_AUDIENCE,
      tokenSigningAlg: 'RS256',
    }),
  );
}

const requireConfiguredAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (!process.env.AUTH0_ISSUER_BASE_URL || !process.env.AUTH0_AUDIENCE) {
    res.status(503).json({ error: 'Authentication is not configured' });
    return;
  }
  AuthGuard.requireAccountEmail(req, res, next);
};


const serialize = (user: Awaited<ReturnType<ProfileService['get']>>) =>
  user && {
    id: user.id,
    email: user.email,
    schoolId: user.schoolId,
    name: user.name,
    pronoun: user.pronoun,
    schoolYear: user.schoolYear,
    major: user.major,
    hobbies: user.hobbies,
    interestedTypes: user.interestedTypes,
  };


app.get('/api/profile', requireConfiguredAuth, async (_req, res, next) => {
  try {
    res.json({ data: serialize(await service.get(res.locals.user as AuthUser)) });
  } catch (e) {
    next(e);
  }
});

app.put('/api/profile', requireConfiguredAuth, async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body);
    res.json({ data: serialize(await service.save(res.locals.user as AuthUser, input)) });
  } catch (e) {
    next(e);
  }
});

app.use('/api/activities', activityAPI(activityService, requireConfiguredAuth));
app.use('/api/join-requests', joinRequestAPI(joinRequestService, requireConfiguredAuth));
app.use('/api/schools', schoolAPI(schools));

app.get('/api/recommendations', requireConfiguredAuth, async (req, res, next) => {
  try {
    res.json({ data: await recommendations.forUser(res.locals.user as AuthUser) });
  } catch (e) {
    next(e);
  }
});


const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Request failed:', error);
  // express-oauth2-jwt-bearer reports missing/invalid bearer tokens through
  // next(error). Preserve its HTTP status instead of turning auth failures
  // into an unrelated 500 response.
  const status =
    typeof error?.status === 'number'
      ? error.status
      : typeof error?.statusCode === 'number'
        ? error.statusCode
        : undefined;
  if (status === 401) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (status === 403) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid request', details: error.issues });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  // A user can change Auth0 accounts while keeping the same email.
  // SQLite rejects that duplicate email, so return a useful client error
  // instead of hiding it behind a generic 500 response.
  if (
    error instanceof Error &&
    (error.message.includes('UNIQUE constraint failed: users.email') ||
      (error as Error & { code?: string }).code === '23505' && error.message.includes('users_email_key')))
  {
    res.status(409).json({ error: 'A profile already exists for this email address' });
    return;
  }
  res.status(500).json({ error: 'Unexpected server error' });
};

app.use(errors);


const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

export default app;
