import {ColumnType, EntityManager, ObjectLiteral, ObjectType, QueryRunner, SelectQueryBuilder} from "typeorm";
import {DataTypeDefaults} from "../../../node_modules/typeorm/driver/types/DataTypeDefaults";
import {MappedColumnTypes} from "../../../node_modules/typeorm/driver/types/MappedColumnTypes";
import {IDialect} from "./IDialect";
import {ColumnMetadata} from "../../../node_modules/typeorm/metadata/ColumnMetadata";
import {NotYetImplementedError} from "./NotYetImplementedError";
import {DateUtils} from "../../../node_modules/typeorm/util/DateUtils";
import {AiosQueryRunner} from "./AiosQueryRunner";
import {AiosDriver} from "./AiosDriver";


export abstract class AbstractDialect implements IDialect {

  /**
   * Indicates if tree tables are supported by this driver.
   */
  treeSupport: boolean = false;

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

  escape(name: string): string {
    return name.replace(/\'/, "");
  }


  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {

    if (!parameters || !Object.keys(parameters).length)
      return [sql, []];

    throw new NotYetImplementedError();

  }

  normalizeType(column: { type?: ColumnType | string; length?: number | string; precision?: number | null; scale?: number; isArray?: boolean }): string {
    throw new NotYetImplementedError();
  }

  processResultSet(res: any[]): any[] {
    return res;
  }

  prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
    if (columnMetadata.transformer)
      value = columnMetadata.transformer.from(value);

    if (value === null || value === undefined)
      return value;

    if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
      return value ? true : false;
    } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
      return DateUtils.normalizeHydratedDate(value);
    } else if (columnMetadata.type === "date") {
      return DateUtils.mixedDateToDateString(value);
    } else if (columnMetadata.type === "time") {
      return DateUtils.mixedTimeToString(value);
    }

    return value;
  }

  createQueryBuilder?<Entity>(entityManager: EntityManager, entityClass?: ObjectType<Entity> | Function | string | QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;


  /**
   * Creates a query runner used for common queries.
   */
  createQueryRunner(driver: AiosDriver, mode: "master" | "slave"): AiosQueryRunner {
    throw new NotYetImplementedError();
  };

}
