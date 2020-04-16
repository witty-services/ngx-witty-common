import {PathContext} from '../../common/path/path-context';

export const HTTP_RESOURCE_METADATA_KEY: string = 'httpResource';

export interface HttpResourceContext extends PathContext {
}

export function HttpResource(params: HttpResourceContext): any {
  return (target: any): void => {
    Reflect.defineMetadata(HTTP_RESOURCE_METADATA_KEY, params, target);
  };
}
