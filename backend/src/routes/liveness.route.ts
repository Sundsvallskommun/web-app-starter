import type { Request, Response } from 'express';

/**
 * Liveness response for container probes. Deliberately free of external calls and
 * dependency checks so the probe reports whether this process can serve traffic,
 * not whether downstream services are healthy. Use `/health/up` for the full chain.
 */
export function livenessHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: 'OK' });
}
