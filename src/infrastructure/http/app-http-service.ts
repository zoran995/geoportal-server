import { Inject, Injectable } from '@nestjs/common';
import type { Got, OptionsOfJSONResponseBody } from 'got';

import { GOT_INSTANCE_TOKEN } from './constants.js';

@Injectable()
export class AppHttpService {
  constructor(@Inject(GOT_INSTANCE_TOKEN) private readonly got: Got) {}

  async get<T>(url: string, options?: OptionsOfJSONResponseBody) {
    return this.got.get<T>(url, options).json<T>();
  }

  async post<T>(
    url: string,
    body?: object,
    options?: OptionsOfJSONResponseBody,
  ) {
    return this.got.post<T>(url, { json: body, ...options }).json<T>();
  }

  async patch<T>(
    url: string,
    body?: object,
    options?: OptionsOfJSONResponseBody,
  ) {
    return this.got.patch<T>(url, { json: body, ...options }).json<T>();
  }

  async put<T>(
    url: string,
    body?: object,
    options?: OptionsOfJSONResponseBody,
  ) {
    return this.got.put<T>(url, { json: body, ...options }).json<T>();
  }

  async delete<T>(url: string, options?: OptionsOfJSONResponseBody) {
    return this.got.delete<T>(url, options).json<T>();
  }
}
