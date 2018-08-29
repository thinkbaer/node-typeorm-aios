import {AbstractDialect} from "../AbstractDialect";
import {ColumnType, EntityManager, ObjectType, QueryRunner, SelectQueryBuilder} from "typeorm";
import {HsqlDbSelectQueryBuilder} from "./HsqlDbSelectQueryBuilder";
import {InformixSelectQueryBuilder} from "./InformixSelectQueryBuilder";


export class InformixDialect extends AbstractDialect {
  type: string = 'informix';

  supportedDataTypes: any[] = [
    "bigint", "bigserial", "byte", "bson", "json", "character", "char",
    "character varying", "date", "datetime", "dec", "decimal",
    "double precision", "float", "int", "integer", "interval",
    "money", "nchar", "numeric", "nvarchar",
    "real", "serial", "serial8", "smallfloat", "smallint", "text", "varchar"];

  withLengthColumnTypes: any[] = ["character", "char",
    "character varying", "float", "nchar", "serial", "serial8", "varchar"
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

}
