import {ColumnType, EntityManager, ObjectLiteral, ObjectType, QueryRunner, SelectQueryBuilder} from 'typeorm';
import * as _ from 'lodash';
import {AbstractDialect} from '../AbstractDialect';
import {NotYetImplementedError} from '../NotYetImplementedError';
import {HsqlDbSelectQueryBuilder} from './HsqlDbSelectQueryBuilder';


export class HsqlDbDialect extends AbstractDialect {

  type = 'hsqldb';
  supportedDataTypes: ColumnType[] = [
    'int',
    'tinyint',
    'smallint',
    'mediumint',
    'bigint',
    'float',
    'double',
    'decimal',
    'date',
    'datetime',
    'timestamp',
    'time',
    'year',
    'char',
    'varchar',
    'blob',
    'text',
    'tinyblob',
    'tinytext',
    'mediumblob',
    'mediumtext',
    'longblob',
    'longtext',
    'enum',
    'json'
  ];

  withLengthColumnTypes: ColumnType[] = [
    'int',
    'tinyint',
    'smallint',
    'mediumint',
    'bigint',
    'char',
    'varchar',
    'blob',
    'text'];
  withPrecisionColumnTypes: ColumnType[] = [];

  withScaleColumnTypes: ColumnType[] = [];

  normalizeType(column: {
    type?: ColumnType | string; length?: number | string;
    precision?: number | null; scale?: number; isArray?: boolean
  }): string {
    if (column.type === Number || column.type === 'integer') {
      return 'int';

    } else if (column.type === String) {
      return 'varchar';

    } else if (column.type === Date) {
      return 'datetime';

    } else if ((column.type as any) === Buffer) {
      return 'blob';

    } else if (column.type === Boolean) {
      return 'tinyint';

    } else if (column.type === 'uuid') {
      return 'varchar';

    } else if (column.type === 'simple-array') {
      return 'text';

    } else {
      return column.type as string || '';
    }
  }

  processResultSet(res: any[]): any[] {
    const _res: any[] = [];
    res.forEach(r => {
      const _r: any = {};
      _.keys(r).forEach(k => {
        _r[k.toLocaleLowerCase()] = r[k];
      });
      _res.push(_r);
    });
    return _res;
  }

  escape(name: string): string {
    return name.replace(/\'/g, '\'\'');
  }

  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {

    if (!parameters || !Object.keys(parameters).length) {
      return [sql, []];
    }

    throw new NotYetImplementedError();
    /*
    const escapedParameters: any[] = [];


    const keys = Object.keys(parameters)
      .map(parameter => "(:" + parameter + "\\b)")
      .join("|");

    sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
      const value = parameters[key.substr(1)];
      if (value instanceof Function) {
        return value();
      } else {
        escapedParameters.push(parameters[key.substr(1)]);
        return "?";
      }
    });
    return [sql, escapedParameters];
    */
  }

  createQueryBuilder?<Entity>(entityManager: EntityManager,
                              entityClass?: ObjectType<Entity> | Function | string | QueryRunner,
                              alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
    const connection = entityManager.connection;
    if (alias) {
      const metadata = connection.getMetadata(entityClass as Function | string);
      return new HsqlDbSelectQueryBuilder(connection, queryRunner)
        .select(alias)
        .from(metadata.target, alias);
    } else {
      return new HsqlDbSelectQueryBuilder(connection, entityClass as QueryRunner | undefined);
    }
  }
}
