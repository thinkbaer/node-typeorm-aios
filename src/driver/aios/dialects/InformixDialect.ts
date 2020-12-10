import {AbstractDialect} from '../AbstractDialect';
import {ColumnType, EntityManager, ObjectType, QueryRunner, SelectQueryBuilder} from 'typeorm';
import {InformixSelectQueryBuilder} from './InformixSelectQueryBuilder';
import * as _ from 'lodash';
import {InformixQueryRunner} from './InformixQueryRunner';
import {AiosQueryRunner} from '../AiosQueryRunner';
import {AiosDriver} from '../AiosDriver';
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata';
import {InformixNamingStrategy} from './InformixNamingStrategy';
import {DateUtils} from 'typeorm/util/DateUtils';


export class InformixDialect extends AbstractDialect {
  type = 'informix';

  supportedDataTypes: any[] = [
    'bigint', 'bigserial', 'byte', 'bson', 'boolean', 'blob',
    'json', 'character', 'char', 'clob',
    'character varying', 'date', 'datetime', 'dec', 'decimal',
    'double precision', 'float', 'int', 'integer',
    'datetime year to fraction', 'datetime year to second',
    'interval day to fraction', 'interval day to second',
    'money', 'nchar', 'numeric', 'nvarchar', 'lvarchar',
    'real', 'serial', 'serial8', 'smallfloat', 'smallint',
    'text', 'varchar'];

  withLengthColumnTypes: any[] = ['character', 'char',
    'character varying', 'float', 'nchar', 'varchar', 'lvarchar'
  ];


  prepare(driver: AiosDriver) {
    // For schema builder
    if (!_.has(driver.options, 'schema')) {
      (<any>driver.options).schema = driver.options.user;
    }
  }

  afterConnect(driver: AiosDriver) {
    (<any>driver.connection)['namingStrategy'] = new InformixNamingStrategy();
  }


  createQueryBuilder?<Entity>(entityManager: EntityManager, entityClass?: ObjectType<Entity> | Function | string | QueryRunner,
                              alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
    const connection = entityManager.connection;
    if (alias) {
      const metadata = connection.getMetadata(entityClass as Function | string);
      return new InformixSelectQueryBuilder(connection, queryRunner)
        .select(alias)
        .from(metadata.target, alias);
    } else {
      return new InformixSelectQueryBuilder(connection, entityClass as QueryRunner | undefined);
    }
  }

  processResultSet(res: any[]): any[] {
    if (_.isUndefined(res)) {
      return [];
    }

    res.forEach(r => {
      Object.keys(r).forEach(k => {
        if (_.isString(r[k])) {
          r[k] = r[k].trim();
        }
      });
    });

    return res;
  }


  createQueryRunner(driver: AiosDriver, mode: 'slave' | 'master'): AiosQueryRunner {
    return new InformixQueryRunner(driver, mode);
  }


  buildTableName(table: string, schema?: string, database?: string): string {
    if (schema) {
      return [schema.trim(), table.trim()].join('.');
    } else {
      return table.trim();
    }

  }


  buildQuery(query: string, parameters?: string[]) {
    let str = query;
    if (_.isArray(parameters) && parameters.length > 0) {
      for (let idx = parameters.length - 1; idx >= 0; idx--) {
        const p = parameters[idx];
        let value = p;
        if (_.isString(p)) {
          value = '\'' + this.escapeValue(value) + '\'';
        } else if (_.isNull(p) || _.isUndefined(p)) {
          value = 'NULL';
        } else if (_.isDate(p)) {
          value = '\'' + (<Date>p).toISOString().replace(/T|Z/g, ' ').trim() + '\'';
        } else if (_.isBoolean(p)) {
          value = '\'' + (p ? 'T' : 'F') + '\'';
        }
        str = str.replace('$' + (idx + 1), `${value}`);
      }
    }
    return str;
  }


  preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
    if (columnMetadata.transformer) {
      value = _.isArray(columnMetadata.transformer) ?
        columnMetadata.transformer.map(t => t.from(value)) :
        columnMetadata.transformer.from(value);
    }

    if (value === null || value === undefined) {
      return function () {
        return 'NULL';
      };
    }

    if (columnMetadata.type === Boolean || columnMetadata.type === 'boolean') {
      return value ? 'T' : 'F';
    } else if (columnMetadata.type as any === 'datetime year to fraction' || columnMetadata.type === Date) {
      return DateUtils.normalizeHydratedDate(value);
    } else if (columnMetadata.type as any === 'datetime year to second') {
      if (_.isDate(value)) {
        return value.toISOString().replace(/T|\.\d{3}Z$/g, ' ').trim();
      }
    } else if (columnMetadata.type === 'json') {
      if (_.isObjectLike(value)) {
        return JSON.stringify(value);
      }
    } else if (columnMetadata.type === 'date') {
      return DateUtils.mixedDateToDateString(value);
    } else if (columnMetadata.type === 'time') {
      return DateUtils.mixedTimeToString(value);
    }

    return value;
  }


  normalizeType(column: {
    type?: ColumnType | string; length?: number | string;
    precision?: number | null; scale?: number; isArray?: boolean
  }): string {
    if (column instanceof ColumnMetadata) {
      if (column.type === Number) {
        if (column.isPrimary && column.isGenerated) {
          return 'serial';
        }
      }
    }

    if (column.type === Number || column.type === 'int') {
      return 'integer';

    } else if (column.type === String || column.type === 'text') {
      // TODO workaround to text which are blobs limit to 32kb
      return 'lvarchar';

    } else if (column.type === Date) {
      return 'datetime';

    } else if (column.type === Boolean) {
      return 'boolean';

    } else {
      return column.type as string || '';
    }
  }


  /**
   * Normalizes "default" value of the column.
   */
  normalizeDefault(columnMetadata: ColumnMetadata): string {
    const defaultValue = columnMetadata.default;

    if (typeof defaultValue === 'number') {
      return '' + defaultValue;

    } else if (typeof defaultValue === 'boolean') {
      return defaultValue === true ? 'true' : 'false';

    } else if (typeof defaultValue === 'function') {
      return defaultValue();

    } else if (typeof defaultValue === 'string') {
      return `'${defaultValue}'`;

    } else if (typeof defaultValue === 'object') {
      return `'${JSON.stringify(defaultValue)}'`;

    } else {
      return defaultValue;
    }
  }


}
