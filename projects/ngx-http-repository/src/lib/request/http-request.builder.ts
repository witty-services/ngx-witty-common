import { Observable, of } from 'rxjs';
import { cloneDeep } from 'lodash';
import {
  Path,
  RepositoryNormalizer,
  RepositoryRequest,
  RequestBuilder,
  RequestManagerContext
} from '@witty-services/ngx-repository';
import { HttpRepositoryRequest } from './http-repository.request';
import { Injectable } from '@angular/core';
import { isNullOrUndefined } from 'util';
import {
  HTTP_QUERY_PARAM_METADATA_KEY,
  HttpQueryParamContextConfiguration
} from '../decorator/http-query-param.decorator';
import { HttpParams } from '@angular/common/http';
import { HTTP_HEADER_METADATA_KEY, HttpHeaderContextConfiguration } from '../decorator/http-header.decorator';
import { ConfigurationContextProvider } from '../../../../ngx-repository/src/lib/core/configuration/configuration-context.provider';
import { FirebaseRepositoryParamConfiguration } from '../../../../ngx-firebase-repository/src/lib/configuration/firebase-repository-param.configuration';
import { HttpOperation } from './http.operation';

@Injectable()
export class HttpRequestBuilder implements RequestBuilder {

  public constructor(private readonly normalizer: RepositoryNormalizer) {
  }

  public build({ body, query, configuration }: RequestManagerContext): Observable<RepositoryRequest> {
    const method: string = this.getMethod(configuration);
    const path: Path = this.getPath(body, query, configuration);
    const normalizedBody: any = this.getBody(body);
    const queryParams: any = this.getQueryParams(query);
    const headers: any = this.getHeaders(query);

    return of(new HttpRepositoryRequest(method, normalizedBody, path, headers, queryParams));
  }

  protected getPath(body: any, query: any, configuration: ConfigurationContextProvider): Path {
    const path: string = configuration.getConfiguration<FirebaseRepositoryParamConfiguration>('path');

    return new Path(body, query, path);
  }

  protected getBody(body: any): any {
    return body ? this.normalizer.normalize(body) : null;
  }

  protected getQueryParams(query: any): HttpParams {
    let params: HttpParams = new HttpParams();
    if (query) {
      const httpQueryParams: HttpQueryParamContextConfiguration[] = Reflect.getMetadata(HTTP_QUERY_PARAM_METADATA_KEY, query) || [];
      httpQueryParams.forEach((httpQueryParam: HttpQueryParamContextConfiguration) => {
        if (isNullOrUndefined(query[httpQueryParam.propertyKey])) {
          return;
        }

        params = params.append(httpQueryParam.name, cloneDeep(httpQueryParam.format).replace(/:value/gi, query[httpQueryParam.propertyKey]));
      });
    }

    return params;
  }


  protected getHeaders<K>(query: any): any {
    const headers: any = {};
    if (query) {
      const httpHeaders: HttpHeaderContextConfiguration[] = Reflect.getMetadata(HTTP_HEADER_METADATA_KEY, query) || [];
      httpHeaders.forEach((httpHeader: HttpHeaderContextConfiguration) => {
        if (isNullOrUndefined(query[httpHeader.propertyKey])) {
          return;
        }

        headers[httpHeader.name] = `${ query[httpHeader.propertyKey] }`;
      });
    }

    return headers;
  }

  protected getMethod(configuration: ConfigurationContextProvider): string {
    const operation: HttpOperation = configuration.getOperation() as HttpOperation;

    switch (operation) {
      case 'findAll':
      case 'findById':
      case 'findOne':
        return 'GET';
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
    }

    throw new Error(`Operation not supported (${ operation })`);
  }
}
