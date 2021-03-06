import {Injectable} from '@angular/core';
import {Library} from '../model/library.model';
import {Observable} from 'rxjs';
import {LibraryQuery} from '../query/library.query';
import {InjectRepository, Page} from '@witty-services/ngx-repository';
import {HttpRepository} from '@witty-services/ngx-http-repository';

@Injectable()
export class LibraryService {

  @InjectRepository({resourceType: () => Library, repository: () => HttpRepository})
  private readLibraryRepository: HttpRepository<Library, string>;

  @InjectRepository({resourceType: () => Library, repository: () => HttpRepository})
  private writeLibraryRepository: HttpRepository<Library, string>;

  public findAll(currentPage: number, itemPerPage: number): Observable<Page<Library>> {
    return this.readLibraryRepository.findAll(new LibraryQuery({
      opened: true,
      page: currentPage,
      itemPerPage
    }));
  }

  public findById(id: string): Observable<Library> {
    return this.readLibraryRepository.findOne(new LibraryQuery({libraryId: id}));
  }

  public create(library: Library): Observable<string> {
    return this.writeLibraryRepository.create(library);
  }

  public update(library: Library): Observable<void> {
    return this.writeLibraryRepository.update(library);
  }

  public delete(library: Library): Observable<void> {
    return this.writeLibraryRepository.delete(library);
  }
}
