import { apiURL } from '@utils/api-url';
import axios, { type AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
}

type ApiRequestOptions = Omit<AxiosRequestConfig, 'data' | 'method' | 'url'>;

const handleError = (error: unknown): never => {
  const currentPath = globalThis.location?.pathname ?? '';

  if (
    axios.isAxiosError<ApiResponse>(error) &&
    error.response?.status === 401 &&
    currentPath &&
    !currentPath.includes('login')
  ) {
    globalThis.location.href = `/login?path=${currentPath}&failMessage=${error.response.data.message}`;
  }

  throw error;
};

const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

const get = <T>(url: string, options?: ApiRequestOptions) =>
  axios.get<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);

const post = <T>(url: string, data: unknown, options?: ApiRequestOptions) => {
  return axios.post<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const remove = <T>(url: string, options?: ApiRequestOptions) => {
  return axios.delete<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);
};

const patch = <T>(url: string, data: unknown, options?: ApiRequestOptions) => {
  return axios.patch<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const put = <T>(url: string, data: unknown, options?: ApiRequestOptions) => {
  return axios.put<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

export const apiService = { get, post, put, patch, delete: remove };
