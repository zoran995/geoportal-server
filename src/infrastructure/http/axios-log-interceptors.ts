import { HttpService } from '@nestjs/axios';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';

import { LoggerService } from 'src/infrastructure/logger/index.js';

type AxiosRequestConfigMetadata = AxiosRequestConfig<unknown> & {
  metadata?: {
    startDate?: Date;
    endDate?: Date;
  };
};

@Injectable()
export class AxiosLogInterceptor implements OnModuleInit {
  private readonly logger: LoggerService = new LoggerService('Axios');

  constructor(private readonly httpService: HttpService) {}

  public onModuleInit() {
    this.registerInterceptors();
  }

  private registerInterceptors() {
    const axiosInstance = this.httpService.axiosRef;

    axiosInstance.interceptors.request.use(function (
      config: AxiosRequestConfigMetadata,
    ) {
      config.metadata = { ...config.metadata, startDate: new Date() };
      return config as AxiosRequestConfigMetadata & {
        headers: AxiosRequestHeaders;
      };
    });

    axiosInstance.interceptors.response.use(
      (response) => {
        const { config }: { config: AxiosRequestConfigMetadata } = response;
        config.metadata = { ...config.metadata, endDate: new Date() };
        const duration =
          config.metadata.endDate && config.metadata.startDate
            ? config.metadata.endDate?.getTime() -
              config.metadata.startDate?.getTime()
            : undefined;

        // Log some request infos.
        this.logger.verbose(
          `${config.method?.toUpperCase()} ${config.url} ${duration}ms`,
        );

        return response;
      },
      (error) => {
        this.logger.error(error);
        return Promise.reject(error as Error);
      },
    );
  }
}
