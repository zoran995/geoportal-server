import { z } from 'zod';

export const portSchema = z.coerce.number().int().min(0).max(65535);
