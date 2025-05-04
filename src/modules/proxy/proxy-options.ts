import type { ProxyConfigType } from './config/schema/proxy-config.dto.js';

export interface ProxyOptions extends ProxyConfigType {
  basicAuthentication: boolean;
}
