import { Controller, Body, Req, Get, Post, UseBefore, Res, Patch } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import authMiddleware from '@middlewares/auth.middleware';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { HttpException } from '@/exceptions/HttpException';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

interface UserData {
  name: string;
}

@Controller()
export class UserController {
  @Get('/me')
  @OpenAPI({ summary: 'Return current user' })
  @UseBefore(authMiddleware)
  async getUser(@Req() req: RequestWithUser, @Res() response: any): Promise<UserData> {
    const { name } = req.user;

    if (!name) {
      throw new HttpException(400, 'Bad Request');
    }

    const userData: UserData = {
      name: name,
    };

    return response.send({ data: userData, message: 'success' });
  }
}
