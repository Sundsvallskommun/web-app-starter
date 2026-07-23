import { IndexController } from '@controllers/index.controller';
import { logger } from '@utils/logger';
import { closeRedisClient } from '@utils/redis';
import { createSessionStore } from '@utils/session-store';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { HealthController } from './controllers/health.controller';
import { UserController } from './controllers/user.controller';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function startServer(): Promise<void> {
  validateEnv();

  const sessionStore = await createSessionStore();
  const app = new App([IndexController, UserController, HealthController], sessionStore);
  const server = app.listen();
  let shutdownStarted = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;
    logger.info(`Received ${signal}; shutting down`);

    server.close(error => {
      void closeRedisClient()
        .then(() => {
          if (error) {
            logger.error(`HTTP server shutdown failed: ${error.message}`);
            process.exitCode = 1;
          }
        })
        .catch((redisError: unknown) => {
          logger.error(`Redis shutdown failed: ${errorMessage(redisError)}`);
          process.exitCode = 1;
        });
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) {
  void startServer().catch((error: unknown) => {
    logger.error(`Server startup failed: ${errorMessage(error)}`);
    process.exitCode = 1;
  });
}
