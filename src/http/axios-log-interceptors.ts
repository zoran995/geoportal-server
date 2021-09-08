import { HttpService } from '@nestjs/axios';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class AxiosLogInterceptor implements OnModuleInit {
  private readonly logger: LoggerService = new LoggerService('Axios');

  constructor(private readonly httpService: HttpService) {}

  public onModuleInit() {
    this.registerInterceptors();
  }

  private registerInterceptors() {
    const axiosInstance = this.httpService.axiosRef;

    axiosInstance.interceptors.request.use(function (config: any) {
      config['metadata'] = { ...config['metadata'], startDate: new Date() };
      return config;
    });

    axiosInstance.interceptors.response.use(
      (response) => {
        const { config }: any = response;
        config['metadata'] = { ...config['metadata'], endDate: new Date() };
        const duration =
          config['metadata'].endDate.getTime() -
          config['metadata'].startDate.getTime();

        // Log some request infos.
        this.logger.verbose(
          `${config.method?.toUpperCase()} ${config.url} ${duration}ms`,
        );

        return response;
      },
      (error) => {
        this.logger.error(error);
        return Promise.reject(error);
      },
    );
  }
}
