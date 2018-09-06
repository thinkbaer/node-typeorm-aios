import {DefaultNamingStrategy, Table} from "typeorm";
import * as _ from "lodash";


export class InformixNamingStrategy extends DefaultNamingStrategy {


  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    if (embeddedPrefixes.length)
      return _.snakeCase(embeddedPrefixes.join("_")) + (customName ? customName : _.snakeCase(propertyName));
    return customName ? customName : _.snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return _.snakeCase(relationName + "_" + referencedColumnName);
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return super.primaryKeyName(tableOrName,columnNames).toLowerCase();
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return super.uniqueConstraintName(tableOrName,columnNames).toLowerCase();
  }

  relationConstraintName(tableOrName: Table | string, columnNames: string[], where?: string): string {
    return super.relationConstraintName(tableOrName,columnNames,where).toLowerCase();
  }

  defaultConstraintName(tableOrName: Table | string, columnName: string): string {
    return super.defaultConstraintName(tableOrName,columnName).toLowerCase();
  }

  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return super.foreignKeyName(tableOrName,columnNames).toLowerCase();
  }

  indexName(tableOrName: Table | string, columnNames: string[], where?: string): string {
    return super.indexName(tableOrName,columnNames,where).toLowerCase();
  }

  checkConstraintName(tableOrName: Table | string, expression: string): string {
    return super.checkConstraintName(tableOrName,expression).toLowerCase();
  }

}
