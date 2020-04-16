import 'reflect-metadata';
import {SUB_COLLECTION_METADATA_KEY, SubCollection, SubCollectionContext} from './sub-collection.decorator';
import {Mock} from '../../test/mock.model';

describe('SubCollectionDecorator', () => {

  it('should place all SubCollectionContext parameter in the good place', () => {
    const subCollectionContext: SubCollectionContext = {
      resourceType: Mock,
      params: () => ({})
    };

    const obj: Mock = new Mock({
      myProperty: 'myValue',
      mySecondProperty: 'myOtherValue'
    });

    SubCollection(subCollectionContext)(obj, 'myProperty');
    expect(Reflect.getMetadata(SUB_COLLECTION_METADATA_KEY, obj)).toEqual([{propertyKey: 'myProperty', ...subCollectionContext}]);

    SubCollection(subCollectionContext)(obj, 'MySecondProperty');
    expect(Reflect.getMetadata(SUB_COLLECTION_METADATA_KEY, obj)).toEqual([
      {propertyKey: 'myProperty', ...subCollectionContext},
      {propertyKey: 'MySecondProperty', ...subCollectionContext}
    ]);
  });
});
