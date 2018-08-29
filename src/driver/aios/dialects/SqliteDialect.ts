import {ColumnType, ObjectLiteral} from "typeorm";
import {AbstractDialect} from "../AbstractDialect";



export class SqliteDialect extends AbstractDialect {

  type: string = 'sqlite';
  supportedDataTypes: ColumnType[] = [
    "int",
    "integer",
    "tinyint",
    "smallint",
    "mediumint",
    "bigint",
    "unsigned big int",
    "int2",
    "int8",
    "integer",
    "character",
    "varchar",
    "varying character",
    "nchar",
    "native character",
    "nvarchar",
    "text",
    "clob",
    "text",
    "blob",
    "real",
    "double",
    "double precision",
    "float",
    "real",
    "numeric",
    "decimal",
    "boolean",
    "date",
    "time",
    "datetime"];

  withLengthColumnTypes: ColumnType[] = ["character",
    "varchar",
    "varying character",
    "nchar",
    "native character",
    "nvarchar",
    "text",
    "blob",
    "clob"];

  withPrecisionColumnTypes: ColumnType[] = [];

  withScaleColumnTypes: ColumnType[] = [];

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

    } else if (column.type === "simple-array") {
      return "text";

    } else {
      return column.type as string || "";
    }
  }


  escape(name: string): string {
    return "\"" + name + "\"";
  }


  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
    if (!parameters || !Object.keys(parameters).length)
      return [sql, []];

    const builtParameters: any[] = [];
    const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
    sql = sql.replace(new RegExp(keys, "g"), (key: string): string => {
      const value = parameters[key.substr(1)];
      if (value instanceof Array) {
        return value.map((v: any) => {
          builtParameters.push(v);
          return "$" + builtParameters.length;
        }).join(", ");

      } else if (value instanceof Function) {
        return value();

      } else {
        builtParameters.push(value);
        return "$" + builtParameters.length;
      }
    }); // todo: make replace only in value statements, otherwise problems
    return [sql, builtParameters];
  }

  processResultSet(res: any[]): any[] {
    return res;
  }


}
