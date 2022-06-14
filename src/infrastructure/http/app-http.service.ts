import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

type Unarray<T> = T extends Array<infer U> ? U : T;

@Injectable()
export class AppHttpService {
  constructor(private readonly http: HttpService) {}

  get<T = any>(
    type: ClassConstructor<Unarray<T>>,
    url: string,
    config?: AxiosRequestConfig,
  ): Observable<AxiosResponse<T>> {
    return this.http.get<string>(url, config).pipe(
      map((m): any => {
        const transformed = plainToInstance(type, JSON.parse(m.data), {
          enableImplicitConversion: true,
        });

        return { ...m, data: transformed };
      }),
    );
  }
}
