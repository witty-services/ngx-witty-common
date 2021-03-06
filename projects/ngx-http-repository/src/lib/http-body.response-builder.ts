import {Observable} from 'rxjs';
import {HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {HttpResponseBuilder} from './http-response-builder';

/**
 * @ignore
 */
@Injectable()
export class HttpBodyResponseBuilder implements HttpResponseBuilder {

  public build(response$: Observable<HttpResponse<any>>): Observable<any> {
    return response$.pipe(
      map((response: HttpResponse<any>) => response.body)
    );
  }
}
