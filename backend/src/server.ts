import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { HealthController } from './controllers/health.controller';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([IndexController, UserController, HealthController]);

app.listen();
