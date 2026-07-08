import { CLIENT_KEY, CLIENT_SECRET } from '@config';
import { API_BASE_URL } from '@config';
import { logger } from '@utils/logger';
import axios from 'axios';
import qs from 'qs';

import { HttpException } from '@/exceptions/HttpException';

interface Token {
  access_token: string;
  expires_in: number;
}

function isToken(value: unknown): value is Token {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const token = value as Record<string, unknown>;

  return (
    typeof token.access_token === 'string' &&
    token.access_token.length > 0 &&
    typeof token.expires_in === 'number' &&
    Number.isFinite(token.expires_in) &&
    token.expires_in > 0
  );
}

// NOTE: save token in memory only for now
let c_access_token = '';
let c_token_expires = 0;

class ApiTokenService {
  public async getToken(): Promise<string> {
    if (Date.now() >= c_token_expires) {
      logger.info('Getting oauth API token');
      await this.fetchToken();
    }
    return c_access_token;
  }

  public setToken(token: Token): void {
    c_access_token = token.access_token;
    // NOTE: Set timestamp for when we need to refresh minus 10 seconds for margin
    c_token_expires = Date.now() + (token.expires_in * 1000 - 10000);

    logger.info(`Token valid for: ${token.expires_in}`);
    logger.info(`Current time: ${new Date().toISOString()}`);
    logger.info(`Token expires at: ${new Date(c_token_expires).toISOString()}`);
  }

  public async fetchToken(): Promise<string> {
    const authString = Buffer.from(`${CLIENT_KEY}:${CLIENT_SECRET}`, 'utf-8').toString('base64');

    try {
      const { data } = await axios<unknown>({
        timeout: 30000, // NOTE: milliseconds
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + authString,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify({
          grant_type: 'client_credentials',
        }),
        url: `${API_BASE_URL}/token`,
      });

      if (!isToken(data)) throw new HttpException(502, 'Bad Gateway');

      this.setToken(data);

      return await this.getToken();
    } catch (error) {
      logger.error(`Failed to fetch JWT access token: ${JSON.stringify(error)}`);
      throw new HttpException(502, 'Bad Gateway');
    }
  }
}

export default ApiTokenService;
