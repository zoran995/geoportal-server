import type { ProxyConfigType } from './config/schema/proxy-config.dto';

export interface ProxyOptions extends ProxyConfigType {
  basicAuthentication: boolean;
}
