import {PropertyKeyConfiguration} from '../common/decorator/property-key-configuration';
import {Observable} from 'rxjs';
import {AbstractRepository} from '../repository/abstract.repository';
import {NgxRepositoryModule} from '../ngx-repository.module';
import {Type} from '@angular/core';
import {ORIGINAL_QUERY_METADATA_KEY} from '../normalizer/path.denormalizer';
import {getSoftCacheContextConfiguration, hasSoftCache, setSoftCache, SoftCacheContextConfiguration} from './soft-cache.decorator';
import {CacheScope} from '../common/decorator/cache-scope.enum';
import {RequestCacheRegistry} from '../common/decorator/request-cache.registry';
import {getHardCacheContextConfiguration, HardCacheContextConfiguration, hasHardCache, setHardCache} from './hard-cache.decorator';

/**
 * @ignore
 */
export const SUB_COLLECTION_METADATA_KEY: string = 'subCollections';

/**
 * @ignore
 */
export const SUB_COLLECTION_OBS_METADATA_KEY: string = 'subCollectionObs';

export interface SubCollectionContext<T> {

  resourceType: () => new(...args: any[]) => T;

  params?: (model: any, query?: any) => any;

  repository?: () => Type<AbstractRepository<T, any, any, any>>;
}

/**
 * @ignore
 */
export interface SubCollectionContextConfiguration<T = any> extends SubCollectionContext<T>, PropertyKeyConfiguration {
}

export function SubCollection<T>(subCollectionContext: SubCollectionContext<T>): any {
  return (target: object, propertyKey: string) => {
    const subCollectionContextConfiguration: SubCollectionContextConfiguration = {propertyKey, ...subCollectionContext};
    Reflect.defineMetadata(SUB_COLLECTION_METADATA_KEY, subCollectionContextConfiguration, target, propertyKey);

    Object.defineProperty(target.constructor.prototype, propertyKey, {
      get(): Observable<any> {
        if (Reflect.hasOwnMetadata(SUB_COLLECTION_OBS_METADATA_KEY, this, propertyKey)) {
          return Reflect.getOwnMetadata(SUB_COLLECTION_OBS_METADATA_KEY, this, propertyKey);
        }

        const obs$: Observable<any> = makeSubCollectionSoftCached<T>(this, propertyKey, subCollectionContext)
          || makeSubCollectionHardCached<T>(this, propertyKey, subCollectionContext)
          || makeSubCollection<T>(this, subCollectionContext);

        Reflect.defineMetadata(SUB_COLLECTION_OBS_METADATA_KEY, obs$, this, propertyKey);

        return obs$;
      },
      set: () => void 0,
      enumerable: true,
      configurable: true
    });
  };
}

function makeSubCollectionSoftCached<T>(target: any, propertyKey: string, subCollectionContext: SubCollectionContext<T>): Observable<any> {
  if (!hasSoftCache(target, propertyKey)) {
    return null;
  }

  const softCacheContextConfiguration: SoftCacheContextConfiguration = getSoftCacheContextConfiguration(target, propertyKey);
  let obs$: Observable<any> = null;

  switch (softCacheContextConfiguration.scope) {
    case CacheScope.REQUEST:
      obs$ = RequestCacheRegistry.findCache<T>(
        NgxRepositoryModule.getNgxRepositoryService().getRepository(subCollectionContext.resourceType(), subCollectionContext.repository ? subCollectionContext.repository() : null),
        subCollectionContext.params ? subCollectionContext.params(target, Reflect.getOwnMetadata(ORIGINAL_QUERY_METADATA_KEY, target)) : null
      );

      if (!obs$) {
        obs$ = setSoftCache(makeSubCollection(target, subCollectionContext), target, propertyKey);
        RequestCacheRegistry.addCache<T>(
          NgxRepositoryModule.getNgxRepositoryService().getRepository(subCollectionContext.resourceType(), subCollectionContext.repository ? subCollectionContext.repository() : null),
          subCollectionContext.params ? subCollectionContext.params(target, Reflect.getOwnMetadata(ORIGINAL_QUERY_METADATA_KEY, target)) : null,
          obs$
        );
      }

      break;

    case CacheScope.INSTANCE:
      throw new Error('SoftCache INSTANCE scope is not implemented yet.');

    case CacheScope.FIELD:
      obs$ = setSoftCache(makeSubCollection(target, subCollectionContext), target, propertyKey);
      break;
  }

  return obs$;
}

function makeSubCollectionHardCached<T>(target: any, propertyKey: string, subCollectionContext: SubCollectionContext<T>): Observable<any> {
  if (!hasHardCache(target, propertyKey)) {
    return null;
  }

  const hardCacheContextConfiguration: HardCacheContextConfiguration = getHardCacheContextConfiguration(target, propertyKey);
  let obs$: Observable<any> = null;

  switch (hardCacheContextConfiguration.scope) {
    case CacheScope.REQUEST:
      obs$ = RequestCacheRegistry.findCache<T>(
        NgxRepositoryModule.getNgxRepositoryService().getRepository(subCollectionContext.resourceType(), subCollectionContext.repository ? subCollectionContext.repository() : null),
        subCollectionContext.params ? subCollectionContext.params(target, Reflect.getOwnMetadata(ORIGINAL_QUERY_METADATA_KEY, target)) : null
      );

      if (!obs$) {
        obs$ = setHardCache(makeSubCollection(target, subCollectionContext), target, propertyKey);
        RequestCacheRegistry.addCache<T>(
          NgxRepositoryModule.getNgxRepositoryService().getRepository(subCollectionContext.resourceType(), subCollectionContext.repository ? subCollectionContext.repository() : null),
          subCollectionContext.params ? subCollectionContext.params(target, Reflect.getOwnMetadata(ORIGINAL_QUERY_METADATA_KEY, target)) : null,
          obs$
        );
      }

      break;

    case CacheScope.INSTANCE:
      throw new Error('HardCache INSTANCE scope is not implemented yet.');

    case CacheScope.FIELD:
      obs$ = setHardCache(makeSubCollection(target, subCollectionContext), target, propertyKey);
      break;
  }

  return obs$;
}

function makeSubCollection<T>(target: any, subCollectionContext: SubCollectionContext<T>): Observable<any> {
  return NgxRepositoryModule.getNgxRepositoryService()
    .getRepository(subCollectionContext.resourceType(), subCollectionContext.repository ? subCollectionContext.repository() : null)
    .findAll(
      subCollectionContext.params ? subCollectionContext.params(target, Reflect.getOwnMetadata(ORIGINAL_QUERY_METADATA_KEY, target)) : null
    );
}
