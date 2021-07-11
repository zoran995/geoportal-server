import { HttpModule as BaseHttpModule, HttpService } from '@nestjs/axios';
import { Logger, Module, OnModuleInit } from '@nestjs/common';

@Module({
  imports: [BaseHttpModule],
  exports: [BaseHttpModule],
})
export class HttpModule implements OnModuleInit {
  private readonly logger = new Logger(HttpModule.name);

  constructor(private readonly httpService: HttpService) {}

  public onModuleInit(): any {
    // Add request interceptor and response interceptor to log request infos
    const axios = this.httpService.axiosRef;
    axios.interceptors.request.use(function (config) {
      config['metadata'] = { ...config['metadata'], startDate: new Date() };
      return config;
    });
    axios.interceptors.response.use(
      (response) => {
        const { config } = response;
        config['metadata'] = { ...config['metadata'], endDate: new Date() };
        const duration =
          config['metadata'].endDate.getTime() -
          config['metadata'].startDate.getTime();

        // Log some request infos.
        this.logger.verbose(
          `${config.method.toUpperCase()} ${config.url} ${duration}ms`,
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
