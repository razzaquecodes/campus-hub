import { Env } from '@/lib/env';

export const API_CONFIG = {
  get BASE_URL() {
    return Env.apiUrl;
  }
};

