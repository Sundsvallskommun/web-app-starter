import { UserController } from '@/controllers/user.controller';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { UserApiResponse } from '@/responses/user.response';
import { Response } from 'express';

describe('UserController', () => {
  it('returns only selected response fields for /me payload', async () => {
    const controller = new UserController();
    const send = jest.fn();
    const response = { send } as unknown as Response<UserApiResponse>;
    const request = {
      user: {
        name: 'Alice',
        username: 'alice',
        email: 'alice@example.org',
        role: 'admin',
      },
    } as unknown as RequestWithUser;

    await controller.getUser(request, response);

    expect(send).toHaveBeenCalledWith({
      data: {
        name: 'Alice',
        username: 'alice',
      },
      message: 'success',
    });
  });

  it('throws a bad request when name is missing', async () => {
    const controller = new UserController();
    const send = jest.fn();
    const response = { send } as unknown as Response<UserApiResponse>;
    const request = {
      user: {
        name: '',
        username: 'alice',
      },
    } as unknown as RequestWithUser;

    await expect(controller.getUser(request, response)).rejects.toMatchObject({ status: 400, message: 'Bad Request' });
  });
});
