import {AbstractDialect} from "../AbstractDialect";
import {ColumnType, EntityManager, ObjectType, QueryRunner, SelectQueryBuilder} from "typeorm";
import {HsqlDbSelectQueryBuilder} from "./HsqlDbSelectQueryBuilder";
import {InformixSelectQueryBuilder} from "./InformixSelectQueryBuilder";
import * as _ from "lodash";
import {InformixQueryRunner} from "./InformixQueryRunner";
import {AiosQueryRunner} from "../AiosQueryRunner";
import {AiosDriver} from "../AiosDriver";


export class InformixDialect extends AbstractDialect {
  type: string = 'informix';

  supportedDataTypes: any[] = [
    "bigint", "bigserial", "byte", "bson", "json", "character", "char",
    "character varying", "date", "datetime", "dec", "decimal",
    "double precision", "float", "int", "integer", "interval",
    "money", "nchar", "numeric", "nvarchar",
    "real", "serial", "serial8", "smallfloat", "smallint",
    "text", "varchar"];

  withLengthColumnTypes: any[] = ["character", "char",
    "character varying", "float", "nchar", "serial", "serial8", "varchar","lvarchar"
  ];


  normalizeType(column: { type?: ColumnType | string; length?: number | string; precision?: number | null; scale?: number; isArray?: boolean }): string {
    if (column.type === Number || column.type === "int") {
      return "integer";

    } else if (column.type === String) {
      return "varchar";

    } else if (column.type === Date) {
      return "datetime";

    } else if (column.type === Boolean) {
      return "boolean";

    } else if (column.type === "uuid") {
      return "varchar";

    } else {
      return column.type as string || "";
    }
  }

  createQueryBuilder?<Entity>(entityManager: EntityManager, entityClass?: ObjectType<Entity> | Function | string | QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
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
        if(_.isString(r[k])){
          r[k] = r[k].trim();
        }
      })
    })

    return res;
  }


  createQueryRunner(driver: AiosDriver, mode: "slave" | "master"): AiosQueryRunner {
    return new InformixQueryRunner(driver, mode);
  }


  buildTableName(table:string,schema?:string,database?:string):string{
    if(schema){
      return [schema.trim(),table.trim()].join('.')
    }else{
      return table.trim();
    }

  }


}
