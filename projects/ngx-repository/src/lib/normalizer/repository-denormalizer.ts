import {Query} from '../query-builder/query';
import {Request} from '../query-builder/request';

export interface RepositoryDenormalizer {

  denormalizeWithQuery<T, K>(type: new() => T, data: any, query?: Query<any>, request?: Request): T;
}
