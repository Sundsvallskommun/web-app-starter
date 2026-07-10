import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { UserApiResponse } from '@/responses/user.response';

@Controller()
export class UserController {
  @Get('/me')
  @OpenAPI({
    summary: 'Return current user',
  })
  @ResponseSchema(UserApiResponse)
  @UseBefore(authMiddleware)
  getUser(@Req() req: RequestWithUser): UserApiResponse {
    const { name, username } = req.user;

    if (!name) {
      throw new HttpException(400, 'Bad Request');
    }

    return { data: { name, username }, message: 'success' };
  }
}
