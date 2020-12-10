// import {InsertQueryBuilder, ObjectLiteral, QueryRunner, SelectQueryBuilder} from 'typeorm';
// import {SelectQuery} from 'typeorm/query-builder/SelectQuery';
// import {QueryResultCacheOptions} from 'typeorm/cache/QueryResultCacheOptions';
// import * as _ from 'lodash';
// import {InsertValuesMissingError} from 'typeorm/error/InsertValuesMissingError';
//
//
// export class InformixInsertQueryBuilder<Entity> extends InsertQueryBuilder<Entity> {
// //
// //   /**
// //    * Creates INSERT query.
// //
// //
// //    insert(): InsertQueryBuilder<Entity> {
// //     this.expressionMap.queryType = "insert";
// //
// //     // loading it dynamically because of circular issue
// //     const InformixInsertQueryBuilder = require("./InformixInsertQueryBuilder").InformixInsertQueryBuilder;
// //     if (this instanceof InsertQueryBuilder)
// //       return this as any;
// //
// //     return new InformixInsertQueryBuilder(this);
// //   }
// //    */
// //
//
//   /**
//    * Gets array of values need to be inserted into the target table.
//    */
//   protected getValueSets(): ObjectLiteral[] {
//     if (Array.isArray(this.expressionMap.valuesSet)) {
//       return this.expressionMap.valuesSet;
//     }
//
//     if (this.expressionMap.valuesSet instanceof Object) {
//       return [this.expressionMap.valuesSet];
//     }
//
//     throw new InsertValuesMissingError();
//   }
//
//
// }
