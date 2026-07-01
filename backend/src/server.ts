import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import { createSessionStore } from '@utils/session-store';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';

validateEnv();

(async () => {
  const sessionStore = await createSessionStore();

  const app = new App([IndexController, UserController, HealthController], sessionStore);

  app.listen();
})();
