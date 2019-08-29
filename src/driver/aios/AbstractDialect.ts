import {ColumnType, EntityManager, ObjectLiteral, ObjectType, QueryRunner, SelectQueryBuilder, TableColumn} from 'typeorm';
import {DataTypeDefaults} from 'typeorm/driver/types/DataTypeDefaults';
import {MappedColumnTypes} from 'typeorm/driver/types/MappedColumnTypes';
import {IDialect} from './IDialect';
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata';
import {NotYetImplementedError} from './NotYetImplementedError';
import {DateUtils} from 'typeorm/util/DateUtils';
import {AiosQueryRunner} from './AiosQueryRunner';
import {AiosDriver} from './AiosDriver';
import * as _ from 'lodash';
import {SchemaBuilder} from 'typeorm/schema-builder/SchemaBuilder';
import {RdbmsSchemaBuilder} from 'typeorm/schema-builder/RdbmsSchemaBuilder';


export abstract class AbstractDialect implements IDialect {

  /**
   * Indicates if tree tables are supported by this driver.
   */
  treeSupport = false;

  /**
   * Gets list of supported column data types by a driver.
   */
  supportedDataTypes: ColumnType[] = [];

  /**
   * Default values of length, precision and scale depends on column data type.
   * Used in the cases when length/precision/scale is not specified by user.
   */
  dataTypeDefaults: DataTypeDefaults = null;

  /**
   * Gets list of spatial column data types.
   */
  spatialTypes: ColumnType[] = [];

  /**
   * Gets list of column data types that support length by a driver.
   */
  withLengthColumnTypes: ColumnType[] = [];

  /**
   * Gets list of column data types that support precision by a driver.
   */
  withPrecisionColumnTypes: ColumnType[] = [];

  /**
   * Gets list of column data types that support scale by a driver.
   */
  withScaleColumnTypes: ColumnType[] = [];

  /**
   * Orm has special columns and we need to know what database column types should be for those types.
   * Column types are driver dependant.
   */
  mappedDataTypes: MappedColumnTypes;

  readonly type: string;


  prepare(driver: AiosDriver) {
  }

  afterConnect(driver: AiosDriver) {
  }

  escape(name: string): string {
    return name.replace(/\'/, '\'\'');
  }

  escapeValue(name: any): string {
    if (_.isString(name)) {
      return name.replace(/\'/, '\'\'');
    } else {
      return name;
    }

  }

  createParameter(parameterName: string, index: number): string {
    return '$' + (index + 1);
  }


  buildQuery(query: string, parameters?: string[]) {
    let str = query;
    if (_.isArray(parameters) && parameters.length > 0) {
      parameters.map((p: string, idx: number) => {
        let value = p;
        if (_.isString(p)) {
          value = '\'' + this.escapeValue(value) + '\'';
        } else if (_.isNull(p) || _.isUndefined(p)) {
          value = 'NULL';
        } else if (_.isDate(p)) {
          value = '\'' + (<Date>p).toISOString() + '\'';
        } else if (_.isArrayBuffer(p)) {
          // value = (<ArrayBuffer>p).toString();
        }
        str = str.replace('$' + (idx + 1), `${value}`);
      });
    }
    return str;
  }


  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
    const builtParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
    if (!parameters || !Object.keys(parameters).length) {
      return [sql, builtParameters];
    }

    const keys = Object.keys(parameters).map(parameter => '(:(\\.\\.\\.)?' + parameter + '\\b)').join('|');
    sql = sql.replace(new RegExp(keys, 'g'), (key: string): string => {
      let value: any;
      let isArray = false;
      if (key.substr(0, 4) === ':...') {
        isArray = true;
        value = parameters[key.substr(4)];
      } else {
        value = parameters[key.substr(1)];
      }

      if (isArray) {
        return value.map((v: any) => {
          builtParameters.push(v);
          return '$' + builtParameters.length;
        }).join(', ');

      } else if (value instanceof Function) {
        return value();

      } else {
        builtParameters.push(value);
        return '$' + builtParameters.length;
      }
    }); // todo: make replace only in value statements, otherwise problems
    return [sql, builtParameters];

  }

  normalizeType(column: {
    type?: ColumnType | string; length?: number | string;
    precision?: number | null; scale?: number; isArray?: boolean
  }): string {
    throw new NotYetImplementedError();
  }

  processResultSet(res: any[]): any[] {
    return res;
  }

  prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
    if (columnMetadata.transformer) {
      value = _.isArray(columnMetadata.transformer) ?
        columnMetadata.transformer.map(t => t.from(value)) :
        columnMetadata.transformer.from(value);
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (columnMetadata.type === Boolean || columnMetadata.type === 'boolean') {
      return value ? true : false;
    } else if (columnMetadata.type === 'datetime' || columnMetadata.type === Date) {
      return DateUtils.normalizeHydratedDate(value);
    } else if (columnMetadata.type === 'date') {
      return DateUtils.mixedDateToDateString(value);
    } else if (columnMetadata.type === 'time') {
      return DateUtils.mixedTimeToString(value);
    }
    return value;
  }


  preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
    if (columnMetadata.transformer) {
      value = _.isArray(columnMetadata.transformer) ?
        columnMetadata.transformer.map(t => t.from(value)) :
        columnMetadata.transformer.from(value);
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (columnMetadata.type === Boolean || columnMetadata.type === 'boolean') {
      return value ? true : false;
    } else if (columnMetadata.type === 'datetime' || columnMetadata.type === Date) {
      return DateUtils.normalizeHydratedDate(value);
    } else if (columnMetadata.type === 'date') {
      return DateUtils.mixedDateToDateString(value);
    } else if (columnMetadata.type === 'time') {
      return DateUtils.mixedTimeToString(value);
    }

    return value;
  }

  createQueryBuilder?<Entity>(entityManager: EntityManager,
                              entityClass?: ObjectType<Entity> | Function | string | QueryRunner,
                              alias?: string,
                              queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;


  /**
   * Creates a query runner used for common queries.
   */
  createQueryRunner(driver: AiosDriver, mode: 'master' | 'slave'): AiosQueryRunner {
    throw new NotYetImplementedError();
  }

  buildTableName(tableName: string, schema: string, database: string): string {
    throw new NotYetImplementedError();
  }


  createSchemaBuilder(driver: AiosDriver): SchemaBuilder {
    return new RdbmsSchemaBuilder(driver.connection);

  }

  normalizeDefault(columnMetadata: ColumnMetadata): string {
    throw new NotYetImplementedError();
  }

  normalizeIsUnique(column: ColumnMetadata): boolean {
    return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
  }

  /**
   * Returns default column lengths, which is required on column creation.
   */
  getColumnLength(column: ColumnMetadata): string {
    return column.length ? column.length.toString() : '';
  }


  /**
   * Creates column type definition including length, precision and scale
   */
  createFullType(column: TableColumn): string {
    let type = column.type;

    if (column.length) {
      type += '(' + column.length + ')';
    } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
      type += '(' + column.precision + ',' + column.scale + ')';
    } else if (column.precision !== null && column.precision !== undefined) {
      type += '(' + column.precision + ')';
    }

    if (column.type === 'time without time zone') {
      type = 'TIME' + (column.precision !== null && column.precision !== undefined ? '(' + column.precision + ')' : '');
    } else if (column.type === 'time with time zone') {
      type = 'TIME' + (column.precision !== null && column.precision !== undefined ? '(' + column.precision + ')' : '') + ' WITH TIME ZONE';
    } else if (column.type === 'timestamp without time zone') {
      type = 'TIMESTAMP' + (column.precision !== null && column.precision !== undefined ? '(' + column.precision + ')' : '');
    } else if (column.type === 'timestamp with time zone') {
      type = 'TIMESTAMP' + (column.precision !== null && column.precision !== undefined ? '(' + column.precision + ')' : '') + ' WITH TIME ZONE';
    } else if (column.type === 'text') {
      type = 'LVARCHAR';
    } else {
      type = column.type;
    }

    return type;
  }


  /**
   * Differentiate columns of this table and columns from the given column metadatas columns
   * and returns only changed.
   */
  findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
    return columnMetadatas.filter(columnMetadata => {
      const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
      if (!tableColumn) {
        return false;
      } // we don't need new columns, we only need exist and changed

      const res = tableColumn.name !== columnMetadata.databaseName
        || tableColumn.type !== this.normalizeType(columnMetadata)
        || tableColumn.length !== columnMetadata.length
        || tableColumn.precision !== columnMetadata.precision
        || tableColumn.scale !== columnMetadata.scale
        // || tableColumn.comment !== columnMetadata.comment // todo
        || (!tableColumn.isGenerated && this.normalizeDefault(columnMetadata) !== tableColumn.default)
        // we included check for generated here, because generated columns already can have default values
        || tableColumn.isPrimary !== columnMetadata.isPrimary
        || tableColumn.isNullable !== columnMetadata.isNullable
        || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
        || tableColumn.isGenerated !== columnMetadata.isGenerated;
      return res;
    });
  }

}

