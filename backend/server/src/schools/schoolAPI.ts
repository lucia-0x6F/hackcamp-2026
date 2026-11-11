import { Router } from 'express';
import type { SchoolRepository } from '../repositories/SchoolRepository.js';

/** Returns the schools available in the profile dropdown. */
export function schoolAPI(schools: SchoolRepository) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try { res.json({ data: (await schools.list()).map(({ id, name }) => ({ id, name })) }); }
    catch (error) { next(error); }
  });

  return router;
}
