import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([IndexController, UserController]);

app.listen();
