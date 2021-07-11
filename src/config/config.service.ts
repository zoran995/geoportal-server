import { Inject, Injectable } from '@nestjs/common';
import { ConfigService, NoInferType } from '@nestjs/config';
import get from 'lodash.get';
import { YARGS_CONFIG_LOADER } from 'src/config/yargs-config/yargs-config.constants';

@Injectable()
export class CustomConfigService<K = Record<string, any>> {
  constructor(
    @Inject(YARGS_CONFIG_LOADER)
    private readonly yargsConfigService: any,
    @Inject('NestConfigService')
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath - name of the configParameter
   * @param defaultValue - default value of config parameter
   */
  get<T = any>(propertyPath: keyof K): T | undefined;
  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath - name of the configParameter
   * @param defaultValue - default value of config parameter
   */
  get<T = any>(propertyPath: keyof K, defaultValue: NoInferType<T>): T;
  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath - name of the configParameter
   * @param defaultValue - default value of config parameter
   */
  get<T = any>(propertyPath: keyof K, defaultValue?: T): T | undefined {
    const yargsValue = this.getFromYargs(propertyPath);
    if (yargsValue !== undefined) {
      return yargsValue;
    }
    const configValue = this.configService.get<T>(
      <string>propertyPath,
      defaultValue,
    );
    if (configValue !== undefined) {
      return configValue;
    }

    return defaultValue;
  }

  private getFromYargs<T = any>(propertyPath: keyof K): T | undefined {
    const yargValue = get(this.yargsConfigService, propertyPath);

    return yargValue as unknown as T;
  }
}
