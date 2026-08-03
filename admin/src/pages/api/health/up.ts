import { createHealthConfig, isHealthRequestAuthorized } from '@config/health-config';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let healthConfig: ReturnType<typeof createHealthConfig>;

  try {
    healthConfig = createHealthConfig(process.env);
  } catch {
    res.status(500).send({ status: 'MISCONFIGURED' });
    return;
  }

  if (!isHealthRequestAuthorized(req.headers.authorization ?? null, healthConfig)) {
    res.status(401).send('NOT_AUTHORIZED');
    return;
  }

  try {
    const health = await axios
      .get<unknown>(healthConfig.backendHealthUrl, { timeout: healthConfig.requestTimeoutMs })
      .then((response) => response.data);

    res.status(200).send(health);
  } catch {
    res.status(503).send({ status: 'UNAVAILABLE' });
  }
}
