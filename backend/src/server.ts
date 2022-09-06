import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import { AuthController } from '@controllers/auth.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([
  AuthController,
  IndexController,
  UserController,
]);

app.listen();
