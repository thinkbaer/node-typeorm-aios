import {ColumnType, ObjectLiteral, Table, TableColumn, TableIndex} from "typeorm";
import {AiosQueryRunner} from "../AiosQueryRunner";
import * as _ from "lodash";
import {TableUnique} from "../../../../node_modules/typeorm/schema-builder/table/TableUnique";
import {OrmUtils} from "../../../../node_modules/typeorm/util/OrmUtils";
import {TableIndexOptions} from "../../../../node_modules/typeorm/schema-builder/options/TableIndexOptions";
import {TableCheck} from "../../../../node_modules/typeorm/schema-builder/table/TableCheck";


export class InformixQueryRunner extends AiosQueryRunner {


  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------


  /**
   * Checks if table with the given name exist in the database.
   */
  async hasTable(tableOrName: Table | string): Promise<boolean> {
    let table = this.parseTableName(tableOrName);
    let sql = `SELECT * FROM systables WHERE tabname = ${table.tableName}`;
    if (table.owner) {
      sql += ` and owner = '${table.owner}'`;
    }
    const result = await this.query(sql);
    return result.length ? true : false;
  }

  /**
   * Checks if column with the given name exist in the given table.
   */
  async hasColumn(tableOrName: Table | string, columnName: string): Promise<boolean> {
    let table = this.parseTableName(tableOrName);
    let sql = `SELECT * FROM syscolumns cols left join systables tab on tab.tabid = cols.tabid where tabname = ${table.tableName} AND colname = '${columnName}'`;
    if (table.owner) {
      sql += ` and owner = '${table.owner}'`;
    }
    const result = await this.query(sql);
    return result.length ? true : false;
  }


  /**
   * Creates a new table.
   */
  async createTable(table: Table,
                    ifNotExist: boolean = false,
                    createForeignKeys: boolean = true,
                    createIndices: boolean = true): Promise<void> {
    if (ifNotExist) {
      const isTableExist = await this.hasTable(table);
      if (isTableExist) return Promise.resolve();
    }
    const upQueries: string[] = [];
    const downQueries: string[] = [];

    upQueries.push(this.createTableSql(table, createForeignKeys));
    downQueries.push(this.dropTableSql(table));


    if (createIndices) {
      table.indices.forEach(index => {

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name)
          index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
        upQueries.push(this.createIndexSql(table, index));
        downQueries.push(this.dropIndexSql(table, index));
      });
    }

    await this._executeQueries(upQueries, downQueries);
  }

  /**
   * Drops the table.
   */
  async dropTable(target: Table | string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {// It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
    // to perform drop queries for foreign keys and indices.
    if (ifExist) {
      const isTableExist = await this.hasTable(target);
      if (!isTableExist) return Promise.resolve();
    }

    // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
    const createForeignKeys: boolean = dropForeignKeys;
    const tableName = target instanceof Table ? target.name : target;
    const table = await this.getCachedTable(tableName);
    const upQueries: string[] = [];
    const downQueries: string[] = [];


    if (dropIndices) {
      table.indices.forEach(index => {
        upQueries.push(this.dropIndexSql(table, index));
        downQueries.push(this.createIndexSql(table, index));
      });
    }

//    if (dropForeignKeys)
//      table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

    upQueries.push(this.dropTableSql(table));
    downQueries.push(this.createTableSql(table, createForeignKeys));

    await this._executeQueries(upQueries, downQueries);
  }


  // /**
  //  * Renames the given table.
  //  */
  // async renameTable(oldTableOrName: Table | string, newTableName: string): Promise<void> {
  //   const upQueries: string[] = [];
  //   const downQueries: string[] = [];
  //   const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
  //   const newTable = oldTable.clone();
  //   const oldTableName = oldTable.name.indexOf(".") === -1 ? oldTable.name : oldTable.name.split(".")[1];
  //   const schemaName = oldTable.name.indexOf(".") === -1 ? undefined : oldTable.name.split(".")[0];
  //   newTable.name = schemaName ? `${schemaName}.${newTableName}` : newTableName;
  //
  //   upQueries.push(`ALTER TABLE ${this.escapeTableName(oldTable)} RENAME TO "${newTableName}"`);
  //   downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME TO "${oldTableName}"`);
  //
  //   // rename column primary key constraint
  //   if (newTable.primaryColumns.length > 0) {
  //     const columnNames = newTable.primaryColumns.map(column => column.name);
  //
  //     const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
  //     const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
  //
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
  //   }
  //
  //   // rename unique constraints
  //   newTable.uniques.forEach(unique => {
  //     // build new constraint name
  //     const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
  //
  //     // build queries
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);
  //
  //     // replace constraint name
  //     unique.name = newUniqueName;
  //   });
  //
  //   // rename index constraints
  //   newTable.indices.forEach(index => {
  //     // build new constraint name
  //     const schema = this.extractSchema(newTable);
  //     const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
  //
  //     // build queries
  //     const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
  //     const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
  //     upQueries.push(up);
  //     downQueries.push(down);
  //
  //     // replace constraint name
  //     index.name = newIndexName;
  //   });
  //
  //   // rename foreign key constraints
  //   newTable.foreignKeys.forEach(foreignKey => {
  //     // build new constraint name
  //     const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);
  //
  //     // build queries
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);
  //
  //     // replace constraint name
  //     foreignKey.name = newForeignKeyName;
  //   });
  //
  //   // rename ENUM types
  //   newTable.columns
  //     .filter(column => column.type === "enum")
  //     .forEach(column => {
  //       upQueries.push(`ALTER TYPE ${this.buildEnumName(oldTable, column)} RENAME TO ${this.buildEnumName(newTable, column, false)}`);
  //       downQueries.push(`ALTER TYPE ${this.buildEnumName(newTable, column)} RENAME TO ${this.buildEnumName(oldTable, column, false)}`);
  //     });
  //
  //   await this.executeQueries(upQueries, downQueries);
  // }
  //
  // /**
  //  * Creates a new column from the column in the table.
  //  */
  // async addColumn(tableOrName: Table | string, column: TableColumn): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const clonedTable = table.clone();
  //   const upQueries: string[] = [];
  //   const downQueries: string[] = [];
  //
  //   if (column.type === "enum") {
  //     const hasEnum = await this.hasEnumType(table, column);
  //     if (!hasEnum) {
  //       upQueries.push(this.createEnumTypeSql(table, column));
  //       downQueries.push(this.dropEnumTypeSql(table, column));
  //     }
  //   }
  //
  //   upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(table, column)}`);
  //   downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);
  //
  //   // create or update primary key constraint
  //   if (column.isPrimary) {
  //     const primaryColumns = clonedTable.primaryColumns;
  //     // if table already have primary key, me must drop it and recreate again
  //     if (primaryColumns.length > 0) {
  //       const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
  //       const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
  //       upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //       downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //     }
  //
  //     primaryColumns.push(column);
  //     const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
  //     const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //   }
  //
  //   // create column index
  //   const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
  //   if (columnIndex) {
  //     upQueries.push(this.createIndexSql(table, columnIndex));
  //     downQueries.push(this.dropIndexSql(table, columnIndex));
  //   }
  //
  //   // create unique constraint
  //   if (column.isUnique) {
  //     const uniqueConstraint = new TableUnique({
  //       name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
  //       columnNames: [column.name]
  //     });
  //     clonedTable.uniques.push(uniqueConstraint);
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);
  //   }
  //
  //   await this.executeQueries(upQueries, downQueries);
  //
  //   clonedTable.addColumn(column);
  //   this.replaceCachedTable(table, clonedTable);
  // }
  //
  // /**
  //  * Creates a new columns from the column in the table.
  //  */
  // async addColumns(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
  //   await PromiseUtils.runInSequence(columns, column => this.addColumn(tableOrName, column));
  // }
  //
  // /**
  //  * Renames column in the given table.
  //  */
  // async renameColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newTableColumnOrName: TableColumn | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
  //   if (!oldColumn)
  //     throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
  //
  //   let newColumn;
  //   if (newTableColumnOrName instanceof TableColumn) {
  //     newColumn = newTableColumnOrName;
  //   } else {
  //     newColumn = oldColumn.clone();
  //     newColumn.name = newTableColumnOrName;
  //   }
  //
  //   return this.changeColumn(table, oldColumn, newColumn);
  // }
  //
  // /**
  //  * Changes a column in the table.
  //  */
  // async changeColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newColumn: TableColumn): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   let clonedTable = table.clone();
  //   const upQueries: string[] = [];
  //   const downQueries: string[] = [];
  //
  //   const oldColumn = oldTableColumnOrName instanceof TableColumn
  //     ? oldTableColumnOrName
  //     : table.columns.find(column => column.name === oldTableColumnOrName);
  //   if (!oldColumn)
  //     throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
  //
  //   if (oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length) {
  //     // To avoid data conversion, we just recreate column
  //     await this.dropColumn(table, oldColumn);
  //     await this.addColumn(table, newColumn);
  //
  //     // update cloned table
  //     clonedTable = table.clone();
  //
  //   } else {
  //     if (oldColumn.name !== newColumn.name) {
  //       // rename column
  //       upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`);
  //       downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`);
  //
  //       // rename ENUM type
  //       if (oldColumn.type === "enum") {
  //         upQueries.push(`ALTER TYPE ${this.buildEnumName(table, oldColumn)} RENAME TO ${this.buildEnumName(table, newColumn, false)}`);
  //         downQueries.push(`ALTER TYPE ${this.buildEnumName(table, newColumn)} RENAME TO ${this.buildEnumName(table, oldColumn, false)}`);
  //       }
  //
  //       // rename column primary key constraint
  //       if (oldColumn.isPrimary === true) {
  //         const primaryColumns = clonedTable.primaryColumns;
  //
  //         // build old primary constraint name
  //         const columnNames = primaryColumns.map(column => column.name);
  //         const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
  //
  //         // replace old column name with new column name
  //         columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
  //         columnNames.push(newColumn.name);
  //
  //         // build new primary constraint name
  //         const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
  //
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
  //       }
  //
  //       // rename column sequence
  //       if (oldColumn.isGenerated === true && newColumn.generationStrategy === "increment") {
  //         const schema = this.extractSchema(table);
  //
  //         // building sequence name. Sequence without schema needed because it must be supplied in RENAME TO without
  //         // schema name, but schema needed in ALTER SEQUENCE argument.
  //         const seqName = this.buildSequenceName(table, oldColumn.name, undefined, true, true);
  //         const newSeqName = this.buildSequenceName(table, newColumn.name, undefined, true, true);
  //
  //         const up = schema ? `ALTER SEQUENCE "${schema}"."${seqName}" RENAME TO "${newSeqName}"` : `ALTER SEQUENCE "${seqName}" RENAME TO "${newSeqName}"`;
  //         const down = schema ? `ALTER SEQUENCE "${schema}"."${newSeqName}" RENAME TO "${seqName}"` : `ALTER SEQUENCE "${newSeqName}" RENAME TO "${seqName}"`;
  //         upQueries.push(up);
  //         downQueries.push(down);
  //       }
  //
  //       // rename unique constraints
  //       clonedTable.findColumnUniques(oldColumn).forEach(unique => {
  //         // build new constraint name
  //         unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
  //         unique.columnNames.push(newColumn.name);
  //         const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
  //
  //         // build queries
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);
  //
  //         // replace constraint name
  //         unique.name = newUniqueName;
  //       });
  //
  //       // rename index constraints
  //       clonedTable.findColumnIndices(oldColumn).forEach(index => {
  //         // build new constraint name
  //         index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
  //         index.columnNames.push(newColumn.name);
  //         const schema = this.extractSchema(table);
  //         const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
  //
  //         // build queries
  //         const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
  //         const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
  //         upQueries.push(up);
  //         downQueries.push(down);
  //
  //         // replace constraint name
  //         index.name = newIndexName;
  //       });
  //
  //       // rename foreign key constraints
  //       clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
  //         // build new constraint name
  //         foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
  //         foreignKey.columnNames.push(newColumn.name);
  //         const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);
  //
  //         // build queries
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);
  //
  //         // replace constraint name
  //         foreignKey.name = newForeignKeyName;
  //       });
  //
  //       // rename old column in the Table object
  //       const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
  //       clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
  //       oldColumn.name = newColumn.name;
  //     }
  //
  //     if (newColumn.precision !== oldColumn.precision || newColumn.scale !== oldColumn.scale) {
  //       upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(newColumn)}`);
  //       downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(oldColumn)}`);
  //     }
  //
  //     if (newColumn.type === "enum" && oldColumn.type === "enum" && !OrmUtils.isArraysEqual(newColumn.enum!, oldColumn.enum!)) {
  //       const enumName = this.buildEnumName(table, newColumn);
  //       const enumNameWithoutSchema = this.buildEnumName(table, newColumn, false);
  //       const oldEnumName = this.buildEnumName(table, newColumn, true, false, true);
  //       const oldEnumNameWithoutSchema = this.buildEnumName(table, newColumn, false, false, true);
  //
  //       // rename old ENUM
  //       upQueries.push(`ALTER TYPE ${enumName} RENAME TO ${oldEnumNameWithoutSchema}`);
  //       downQueries.push(`ALTER TYPE ${oldEnumName} RENAME TO ${enumNameWithoutSchema}`);
  //
  //       // create new ENUM
  //       upQueries.push(this.createEnumTypeSql(table, newColumn));
  //       downQueries.push(this.dropEnumTypeSql(table, oldColumn));
  //
  //       // if column have default value, we must drop it to avoid issues with type casting
  //       if (newColumn.default !== null && newColumn.default !== undefined) {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);
  //       }
  //
  //       // build column types
  //       const upType = `${enumNameWithoutSchema} USING "${newColumn.name}"::"text"::${enumNameWithoutSchema}`;
  //       const downType = `${oldEnumNameWithoutSchema} USING "${newColumn.name}"::"text"::${oldEnumNameWithoutSchema}`;
  //
  //       // update column to use new type
  //       upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${upType}`);
  //       downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${downType}`);
  //
  //       // if column have default value and we dropped it before, we must bring it back
  //       if (newColumn.default !== null && newColumn.default !== undefined) {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
  //       }
  //
  //       // remove old ENUM
  //       upQueries.push(this.dropEnumTypeSql(table, newColumn, oldEnumName));
  //       downQueries.push(this.createEnumTypeSql(table, oldColumn, oldEnumName));
  //     }
  //
  //     if (oldColumn.isNullable !== newColumn.isNullable) {
  //       if (newColumn.isNullable) {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`);
  //       } else {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`);
  //       }
  //     }
  //
  //     if (oldColumn.comment !== newColumn.comment) {
  //       upQueries.push(`COMMENT ON COLUMN ${this.escapeTableName(table)}."${oldColumn.name}" IS '${newColumn.comment}'`);
  //       downQueries.push(`COMMENT ON COLUMN ${this.escapeTableName(table)}."${newColumn.name}" IS '${oldColumn.comment}'`);
  //     }
  //
  //     if (newColumn.isPrimary !== oldColumn.isPrimary) {
  //       const primaryColumns = clonedTable.primaryColumns;
  //
  //       // if primary column state changed, we must always drop existed constraint.
  //       if (primaryColumns.length > 0) {
  //         const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
  //         const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //       }
  //
  //       if (newColumn.isPrimary === true) {
  //         primaryColumns.push(newColumn);
  //         // update column in table
  //         const column = clonedTable.columns.find(column => column.name === newColumn.name);
  //         column!.isPrimary = true;
  //         const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
  //         const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //
  //       } else {
  //         const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
  //         primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);
  //
  //         // update column in table
  //         const column = clonedTable.columns.find(column => column.name === newColumn.name);
  //         column!.isPrimary = false;
  //
  //         // if we have another primary keys, we must recreate constraint.
  //         if (primaryColumns.length > 0) {
  //           const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
  //           const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
  //           upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //           downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //         }
  //       }
  //     }
  //
  //     if (newColumn.isUnique !== oldColumn.isUnique) {
  //       if (newColumn.isUnique === true) {
  //         const uniqueConstraint = new TableUnique({
  //           name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
  //           columnNames: [newColumn.name]
  //         });
  //         clonedTable.uniques.push(uniqueConstraint);
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);
  //
  //       } else {
  //         const uniqueConstraint = clonedTable.uniques.find(unique => {
  //           return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
  //         });
  //         clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint!.name}"`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`);
  //       }
  //     }
  //
  //     if (oldColumn.isGenerated !== newColumn.isGenerated && newColumn.generationStrategy !== "uuid") {
  //       if (newColumn.isGenerated === true) {
  //         upQueries.push(`CREATE SEQUENCE ${this.buildSequenceName(table, newColumn)} OWNED BY ${this.escapeTableName(table)}."${newColumn.name}"`);
  //         downQueries.push(`DROP SEQUENCE ${this.buildSequenceName(table, newColumn)}`);
  //
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.buildSequenceName(table, newColumn, undefined, true)}')`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
  //
  //       } else {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.buildSequenceName(table, newColumn, undefined, true)}')`);
  //
  //         upQueries.push(`DROP SEQUENCE ${this.buildSequenceName(table, newColumn)}`);
  //         downQueries.push(`CREATE SEQUENCE ${this.buildSequenceName(table, newColumn)} OWNED BY ${this.escapeTableName(table)}."${newColumn.name}"`);
  //       }
  //     }
  //
  //     if (newColumn.default !== oldColumn.default) {
  //       if (newColumn.default !== null && newColumn.default !== undefined) {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);
  //
  //         if (oldColumn.default !== null && oldColumn.default !== undefined) {
  //           downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`);
  //         } else {
  //           downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
  //         }
  //
  //       } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
  //         upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
  //         downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`);
  //       }
  //     }
  //
  //     if ((newColumn.spatialFeatureType || "").toLowerCase() !== (oldColumn.spatialFeatureType || "").toLowerCase() || newColumn.srid !== oldColumn.srid) {
  //       upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(newColumn)}`);
  //       downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(oldColumn)}`);
  //     }
  //
  //   }
  //
  //   await this.executeQueries(upQueries, downQueries);
  //   this.replaceCachedTable(table, clonedTable);
  // }
  //
  // /**
  //  * Changes a column in the table.
  //  */
  // async changeColumns(tableOrName: Table | string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
  //   await PromiseUtils.runInSequence(changedColumns, changedColumn => this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn));
  // }
  //
  // /**
  //  * Drops column in the table.
  //  */
  // async dropColumn(tableOrName: Table | string, columnOrName: TableColumn | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
  //   if (!column)
  //     throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);
  //
  //   const clonedTable = table.clone();
  //   const upQueries: string[] = [];
  //   const downQueries: string[] = [];
  //
  //   // drop primary key constraint
  //   if (column.isPrimary) {
  //     const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
  //     const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //
  //     // update column in table
  //     const tableColumn = clonedTable.findColumnByName(column.name);
  //     tableColumn!.isPrimary = false;
  //
  //     // if primary key have multiple columns, we must recreate it without dropped column
  //     if (clonedTable.primaryColumns.length > 0) {
  //       const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
  //       const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
  //       upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
  //       downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
  //     }
  //   }
  //
  //   // drop column index
  //   const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
  //   if (columnIndex) {
  //     clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
  //     upQueries.push(this.dropIndexSql(table, columnIndex));
  //     downQueries.push(this.createIndexSql(table, columnIndex));
  //   }
  //
  //   // drop column check
  //   const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
  //   if (columnCheck) {
  //     clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
  //     upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
  //     downQueries.push(this.createCheckConstraintSql(table, columnCheck));
  //   }
  //
  //   // drop column unique
  //   const columnUnique = clonedTable.uniques.find(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
  //   if (columnUnique) {
  //     clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
  //     upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
  //     downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
  //   }
  //
  //   upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);
  //   downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(table, column)}`);
  //
  //   // drop enum type
  //   if (column.type === "enum") {
  //     const hasEnum = await this.hasEnumType(table, column);
  //     if (hasEnum) {
  //       upQueries.push(this.dropEnumTypeSql(table, column));
  //       downQueries.push(this.createEnumTypeSql(table, column));
  //     }
  //   }
  //
  //   await this.executeQueries(upQueries, downQueries);
  //
  //   clonedTable.removeColumn(column);
  //   this.replaceCachedTable(table, clonedTable);
  // }
  //
  // /**
  //  * Drops the columns in the table.
  //  */
  // async dropColumns(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
  //   await PromiseUtils.runInSequence(columns, column => this.dropColumn(tableOrName, column));
  // }
  //
  // /**
  //  * Creates a new primary key.
  //  */
  // async createPrimaryKey(tableOrName: Table | string, columnNames: string[]): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const clonedTable = table.clone();
  //
  //   const up = this.createPrimaryKeySql(table, columnNames);
  //
  //   // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
  //   clonedTable.columns.forEach(column => {
  //     if (columnNames.find(columnName => columnName === column.name))
  //       column.isPrimary = true;
  //   });
  //   const down = this.dropPrimaryKeySql(clonedTable);
  //
  //   await this.executeQueries(up, down);
  //   this.replaceCachedTable(table, clonedTable);
  // }
  //
  // /**
  //  * Updates composite primary keys.
  //  */
  // async updatePrimaryKeys(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const clonedTable = table.clone();
  //   const columnNames = columns.map(column => column.name);
  //   const upQueries: string[] = [];
  //   const downQueries: string[] = [];
  //
  //   // if table already have primary columns, we must drop them.
  //   const primaryColumns = clonedTable.primaryColumns;
  //   if (primaryColumns.length > 0) {
  //     const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
  //     const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
  //     upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //     downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`);
  //   }
  //
  //   // update columns in table.
  //   clonedTable.columns
  //     .filter(column => columnNames.indexOf(column.name) !== -1)
  //     .forEach(column => column.isPrimary = true);
  //
  //   const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
  //   const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
  //   upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`);
  //   downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
  //
  //   await this.executeQueries(upQueries, downQueries);
  //   this.replaceCachedTable(table, clonedTable);
  // }
  //
  // /**
  //  * Drops a primary key.
  //  */
  // async dropPrimaryKey(tableOrName: Table | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const up = this.dropPrimaryKeySql(table);
  //   const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
  //   await this.executeQueries(up, down);
  //   table.primaryColumns.forEach(column => {
  //     column.isPrimary = false;
  //   });
  // }
  //
  // /**
  //  * Creates new unique constraint.
  //  */
  // async createUniqueConstraint(tableOrName: Table | string, uniqueConstraint: TableUnique): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //
  //   // new unique constraint may be passed without name. In this case we generate unique name manually.
  //   if (!uniqueConstraint.name)
  //     uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);
  //
  //   const up = this.createUniqueConstraintSql(table, uniqueConstraint);
  //   const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
  //   await this.executeQueries(up, down);
  //   table.addUniqueConstraint(uniqueConstraint);
  // }
  //
  // /**
  //  * Creates new unique constraints.
  //  */
  // async createUniqueConstraints(tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
  //   await PromiseUtils.runInSequence(uniqueConstraints, uniqueConstraint => this.createUniqueConstraint(tableOrName, uniqueConstraint));
  // }
  //
  // /**
  //  * Drops unique constraint.
  //  */
  // async dropUniqueConstraint(tableOrName: Table | string, uniqueOrName: TableUnique | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
  //   if (!uniqueConstraint)
  //     throw new Error(`Supplied unique constraint was not found in table ${table.name}`);
  //
  //   const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
  //   const down = this.createUniqueConstraintSql(table, uniqueConstraint);
  //   await this.executeQueries(up, down);
  //   table.removeUniqueConstraint(uniqueConstraint);
  // }
  //
  // /**
  //  * Drops unique constraints.
  //  */
  // async dropUniqueConstraints(tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
  //   await PromiseUtils.runInSequence(uniqueConstraints, uniqueConstraint => this.dropUniqueConstraint(tableOrName, uniqueConstraint));
  // }
  //
  // /**
  //  * Creates new check constraint.
  //  */
  // async createCheckConstraint(tableOrName: Table | string, checkConstraint: TableCheck): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //
  //   // new unique constraint may be passed without name. In this case we generate unique name manually.
  //   if (!checkConstraint.name)
  //     checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table.name, checkConstraint.expression!);
  //
  //   const up = this.createCheckConstraintSql(table, checkConstraint);
  //   const down = this.dropCheckConstraintSql(table, checkConstraint);
  //   await this.executeQueries(up, down);
  //   table.addCheckConstraint(checkConstraint);
  // }
  //
  // /**
  //  * Creates new check constraints.
  //  */
  // async createCheckConstraints(tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void> {
  //   const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
  //   await Promise.all(promises);
  // }
  //
  // /**
  //  * Drops check constraint.
  //  */
  // async dropCheckConstraint(tableOrName: Table | string, checkOrName: TableCheck | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
  //   if (!checkConstraint)
  //     throw new Error(`Supplied check constraint was not found in table ${table.name}`);
  //
  //   const up = this.dropCheckConstraintSql(table, checkConstraint);
  //   const down = this.createCheckConstraintSql(table, checkConstraint);
  //   await this.executeQueries(up, down);
  //   table.removeCheckConstraint(checkConstraint);
  // }
  //
  // /**
  //  * Drops check constraints.
  //  */
  // async dropCheckConstraints(tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void> {
  //   const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
  //   await Promise.all(promises);
  // }
  //
  // /**
  //  * Creates a new foreign key.
  //  */
  // async createForeignKey(tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //
  //   // new FK may be passed without name. In this case we generate FK name manually.
  //   if (!foreignKey.name)
  //     foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);
  //
  //   const up = this.createForeignKeySql(table, foreignKey);
  //   const down = this.dropForeignKeySql(table, foreignKey);
  //   await this.executeQueries(up, down);
  //   table.addForeignKey(foreignKey);
  // }
  //
  // /**
  //  * Creates a new foreign keys.
  //  */
  // async createForeignKeys(tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
  //   await PromiseUtils.runInSequence(foreignKeys, foreignKey => this.createForeignKey(tableOrName, foreignKey));
  // }
  //
  // /**
  //  * Drops a foreign key from the table.
  //  */
  // async dropForeignKey(tableOrName: Table | string, foreignKeyOrName: TableForeignKey | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
  //   if (!foreignKey)
  //     throw new Error(`Supplied foreign key was not found in table ${table.name}`);
  //
  //   const up = this.dropForeignKeySql(table, foreignKey);
  //   const down = this.createForeignKeySql(table, foreignKey);
  //   await this.executeQueries(up, down);
  //   table.removeForeignKey(foreignKey);
  // }
  //
  // /**
  //  * Drops a foreign keys from the table.
  //  */
  // async dropForeignKeys(tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
  //   await PromiseUtils.runInSequence(foreignKeys, foreignKey => this.dropForeignKey(tableOrName, foreignKey));
  // }
  //
  // /**
  //  * Creates a new index.
  //  */
  // async createIndex(tableOrName: Table | string, index: TableIndex): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //
  //   // new index may be passed without name. In this case we generate index name manually.
  //   if (!index.name)
  //     index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
  //
  //   const up = this.createIndexSql(table, index);
  //   const down = this.dropIndexSql(table, index);
  //   await this.executeQueries(up, down);
  //   table.addIndex(index);
  // }
  //
  // /**
  //  * Creates a new indices
  //  */
  // async createIndices(tableOrName: Table | string, indices: TableIndex[]): Promise<void> {
  //   await PromiseUtils.runInSequence(indices, index => this.createIndex(tableOrName, index));
  // }
  //
  // /**
  //  * Drops an index from the table.
  //  */
  // async dropIndex(tableOrName: Table | string, indexOrName: TableIndex | string): Promise<void> {
  //   const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
  //   const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
  //   if (!index)
  //     throw new Error(`Supplied index was not found in table ${table.name}`);
  //
  //   const up = this.dropIndexSql(table, index);
  //   const down = this.createIndexSql(table, index);
  //   await this.executeQueries(up, down);
  //   table.removeIndex(index);
  // }
  //
  // /**
  //  * Drops an indices from the table.
  //  */
  // async dropIndices(tableOrName: Table | string, indices: TableIndex[]): Promise<void> {
  //   await PromiseUtils.runInSequence(indices, index => this.dropIndex(tableOrName, index));
  // }
  //
  // /**
  //  * Clears all table contents.
  //  * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
  //  */
  // async clearTable(tableName: string): Promise<void> {
  //   await this.query(`TRUNCATE TABLE ${this.escapeTableName(tableName)}`);
  // }
  //
  // /**
  //  * Removes all tables from the currently connected database.
  //  */
  // async clearDatabase(): Promise<void> {
  //   const schemas: string[] = [];
  //   this.connection.entityMetadatas
  //     .filter(metadata => metadata.schema)
  //     .forEach(metadata => {
  //       const isSchemaExist = !!schemas.find(schema => schema === metadata.schema);
  //       if (!isSchemaExist)
  //         schemas.push(metadata.schema!);
  //     });
  //   schemas.push(this.driver.options.schema || "current_schema()");
  //   const schemaNamesString = schemas.map(name => {
  //     return name === "current_schema()" ? name : "'" + name + "'";
  //   }).join(", ");
  //
  //   await this.startTransaction();
  //   try {
  //     // ignore spatial_ref_sys; it's a special table supporting PostGIS
  //     // TODO generalize this as this.driver.ignoreTables
  //     const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || schemaname || '"."' || tablename || '" CASCADE;' as "query" FROM "pg_tables" WHERE "schemaname" IN (${schemaNamesString}) AND tablename NOT IN ('spatial_ref_sys')`;
  //     const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
  //     await Promise.all(dropQueries.map(q => this.query(q["query"])));
  //     await this.dropEnumTypes(schemaNamesString);
  //
  //     await this.commitTransaction();
  //
  //   } catch (error) {
  //     try { // we throw original error even if rollback thrown an error
  //       await this.rollbackTransaction();
  //     } catch (rollbackError) {
  //     }
  //     throw error;
  //   }
  // }
  //
  // -------------------------------------------------------------------------
  // Protected Methods
  // -------------------------------------------------------------------------

  /**
   * Loads all tables (with given names) from the database and creates a Table from them.
   */
  protected async loadTables(tableNames: string[]): Promise<Table[]> {
    // if no tables given then no need to proceed
    if (!tableNames || !tableNames.length)
      return [];

//    const currentSchemaQuery = await this.query(`SELECT * FROM current_schema()`);
//    const currentSchema = currentSchemaQuery[0]["current_schema"];

    const tablesCondition = tableNames.map(tableName => {
      let [schema, name] = tableName.split(".");
      if (!name) {
        name = schema;
      }
      return `(t.tabname = '${name}')`;
    }).join(" OR ");

    const tablesSql = `SELECT t.tabname as table_name, t.owner as table_owner FROM systables t WHERE ` + tablesCondition;
    const columnsSql = `SELECT     
    t.tabname as table_name, 
    t.owner as table_owner,
    c.colno as column_no,
    c.colname as column_name ,
    c.coltype as column_type,
    c.collength as column_length,
    d.class as column_default_class,
    d.class as column_default_type,
    d.default as column_default,
    tp.type as extended_column_type,
    tp.length as extended_column_length,
    dsc.description as extended_column_label
    FROM syscolumns c 
    inner join systables t on t.tabid = c.tabid 
    left join sysxtdtypes tp on tp.extended_id = c.extended_id
    left join sysxtddesc dsc on dsc.extended_id = tp.extended_id
    left join sysdefaults d on d.tabid = t.tabid and c.colno = d.colno   
    WHERE ` + tablesCondition;

    const constraintsSql = '' +
      'SELECT ' +
      'c.constrname as constraint_name, ' +
      't.tabname as table_name, ' +
      't.owner as table_owner, ' +
      'i.part1 as column_no_01, ' +
      'i.part2 as column_no_02, ' +
      'i.part3 as column_no_03, ' +
      'i.part4 as column_no_04, ' +
      'i.part5 as column_no_05, ' +
      'i.part6 as column_no_06, ' +
      'i.part7 as column_no_07, ' +
      'i.part8 as column_no_08, ' +
      'i.part9 as column_no_09, ' +
      'i.part10 as column_no_10, ' +
      'i.part11 as column_no_11, ' +
      'i.part12 as column_no_12, ' +
      'i.part13 as column_no_13, ' +
      'i.part14 as column_no_14, ' +
      'i.part15 as column_no_15, ' +
      'i.part16 as column_no_16, ' +
      'i.idxname as constraint_name, ' +
      'i.idxtype as type_name,' +
      "CASE i.idxtype WHEN 'U' THEN 'TRUE' ELSE 'FALSE' END AS is_unique, " +
      "CASE c.constrtype WHEN 'P' THEN 'PRIMARY' WHEN 'U' THEN 'UNIQUE' WHEN 'C' THEN 'CHECK' WHEN 'N' THEN 'NOT NULL' WHEN 'T' THEN 'TABLE' WHEN 'R' THEN 'REFERENCE' END AS constraint_type " +
      'FROM sysconstraints c ' +
      'inner join systables t on t.tabid = c.tabid ' +
      'left join sysindexes i on t.tabid = i.tabid and i.idxname = c.idxname and t.owner = i.owner ' +
      'left join sysreferences r on c.constrid = r.constrid ' +
      'left join syschecks ch on c.constrid = ch.constrid ' +
      'WHERE ' + tablesCondition;


    // const constraintsSql = `SELECT
    // "ns"."nspname" AS "table_owner",
    // "t"."relname" AS "table_name",
    // "cnst"."conname" AS "constraint_name",
    // "cnst"."consrc" AS "expression", ` +
    // `CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' END AS "constraint_type",
    // "a"."attname" AS "column_name" ` +
    //   `FROM "pg_constraint" "cnst" ` +
    //   `INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" ` +
    //   `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" ` +
    //   `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") ` +
    //   `WHERE "t"."relkind" = 'r' AND (${constraintsCondition})`;

    const indicesSql = '' +
      'SELECT  ' +
      't.tabname as table_name, ' +
      't.owner as table_owner, ' +
      'i.idxname as constraint_name, ' +
      "CASE i.idxtype WHEN 'U' THEN 'TRUE' ELSE 'FALSE' END AS is_unique, " +
      'i.idxtype as type_name,' +
      'i.part1 as column_no_01, ' +
      'i.part2 as column_no_02, ' +
      'i.part3 as column_no_03, ' +
      'i.part4 as column_no_04, ' +
      'i.part5 as column_no_05, ' +
      'i.part6 as column_no_06, ' +
      'i.part7 as column_no_07, ' +
      'i.part8 as column_no_08, ' +
      'i.part9 as column_no_09, ' +
      'i.part10 as column_no_10, ' +
      'i.part11 as column_no_11, ' +
      'i.part12 as column_no_12, ' +
      'i.part13 as column_no_13, ' +
      'i.part14 as column_no_14, ' +
      'i.part15 as column_no_15, ' +
      'i.part16 as column_no_16 ' +
      'FROM sysindexes i ' +
      'inner join systables t on t.tabid = i.tabid '
    'WHERE ' + tablesCondition;

    // const indicesSql = `SELECT
    // "ns"."nspname" AS "table_owner",
    // "t"."relname" AS "table_name",
    // "i"."relname" AS "constraint_name",
    // "a"."attname" AS "column_name", ` +
    // `CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique",
    // pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", ` +
    //   `"types"."typname" AS "type_name" ` +
    //   `FROM "pg_class" "t" ` +
    //   `INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" ` +
    //   `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") ` +
    //   `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" ` +
    //   `INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" ` +
    //   `INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" ` +
    //   `LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" ` +
    //   `WHERE "t"."relkind" = 'r' AND "cnst"."contype" IS NULL AND (${constraintsCondition})`;
    //
    // const foreignKeysCondition = tableNames.map(tableName => {
    //   let [schema, name] = tableName.split(".");
    //   if (!name) {
    //     name = schema;
    //     schema = this.driver.options.schema || currentSchema;
    //   }
    //   return `("ns"."nspname" = '${schema}' AND "cl"."relname" = '${name}')`;
    // }).join(" OR ");
    // const foreignKeysSql = `SELECT
    // "con"."conname" AS "constraint_name",
    // "con"."nspname" AS "table_owner",
    // "con"."relname" AS "table_name",
    // "att2"."attname" AS "column_name", ` +
    //   `"ns"."nspname" AS "referenced_table_owner", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update" ` +
    //   `FROM ( ` +
    //   `SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", ` +
    //   `CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", ` +
    //   `CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" ` +
    //   `FROM "pg_class" "cl" ` +
    //   `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
    //   `INNER JOIN "pg_constraint" "con1" ON "con1"."conrelid" = "cl"."oid" ` +
    //   `WHERE "con1"."contype" = 'f' AND (${foreignKeysCondition}) ` +
    //   `) "con" ` +
    //   `INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" ` +
    //   `INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid" ` +
    //   `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
    //   `INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"`;


    const [
      dbTables,
      dbColumns,
      dbConstraints,
      dbIndices,
      dbForeignKeys
    ]: ObjectLiteral[][] = await Promise.all([

      this.query(tablesSql),
      this.query(columnsSql),
      this.query(constraintsSql),
      this.query(indicesSql),
      //  this.query(foreignKeysSql),
    ]);

    // if tables were not found in the db, no need to proceed
    if (!dbTables.length)
      return [];

    // create tables for loaded tables
    return Promise.all(dbTables.map(async dbTable => {
      const table = new Table();

      // We do not need to join schema name, when database is by default.
      // In this case we need local variable `tableFullName` for below comparision.
      const owner = dbTable["table_owner"];
      table.name = this.driver.buildTableName(dbTable["table_name"], owner);
      const tableFullName = this.driver.buildTableName(dbTable["table_name"], dbTable["table_owner"]);

      // create columns from the loaded columns
      table.columns = await Promise.all(dbColumns
        .filter(dbColumn => this.driver.buildTableName(dbColumn["table_name"], dbColumn["table_owner"]) === tableFullName)
        .map(async dbColumn => {

          const columnConstraints = dbConstraints.filter(dbConstraint => {
            if (this.driver.buildTableName(dbConstraint["table_name"],
              dbConstraint["table_owner"]) === tableFullName) {

              for (let i = 1; i <= 16; i++) {
                let k = "0".repeat(2 - ((i + "").length)) + i;
                if (dbConstraint['column_no_' + k] == 0) {
                  return false;
                }
                if (dbConstraint['column_no_' + k] == dbColumn['column_no']) {
                  return true;
                }
              }

            }
            return false;

          });

          const tableColumn = new TableColumn();
          tableColumn.name = dbColumn["column_name"];
          let colType = dbColumn["column_type"];

          let is_unique = false;
          let checks = {
            0x0100: false,// null not allowed
            0x0200: false,// Value is from a host variable
            0x0400: false,// Float-to-decimal for networked database server
            0x0800: false,// DISTINCT data type
            0x1000: false, // Named ROW type
            0x2000: false,// DISTINCT type from LVARCHAR base type
            0x4000: false,// DISTINCT type from BOOLEAN base type
            0x8000: false,// Collection is processed on client system
          };

          Object.keys(checks).forEach(check => {
            if (colType & <any>check) {
              checks[check] = true;
              colType = colType & ~check;
            }
          })

          if (InformixQueryRunner.typeMap[colType]) {
            tableColumn.type = InformixQueryRunner.typeMap[colType].toLowerCase();
            tableColumn['data_type'] = dbColumn['extended_column_label'];
          } else {
            let typeDesc = dbColumn['extended_column_label'] ? dbColumn['extended_column_label'].split('(', 1).shift() : null;
            if (typeDesc) {
              tableColumn.type = typeDesc.toLowerCase();
              tableColumn['data_type'] = dbColumn['extended_column_label'];
            } else {
              throw new Error('informix: type not found for coltype = ' + colType);
            }
          }

          if (tableColumn.type === "numeric" || tableColumn.type === "decimal" || tableColumn.type === "float") {
            // If one of these properties was set, and another was not, Postgres sets '0' in to unspecified property
            // we set 'undefined' in to unspecified property to avoid changing column on sync
            if (dbColumn["numeric_precision"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["numeric_precision"])) {
              tableColumn.precision = dbColumn["numeric_precision"];
            } else if (dbColumn["numeric_scale"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["numeric_scale"])) {
              tableColumn.precision = undefined;
            }
            if (dbColumn["numeric_scale"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["numeric_scale"])) {
              tableColumn.scale = dbColumn["numeric_scale"];
            } else if (dbColumn["numeric_precision"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["numeric_precision"])) {
              tableColumn.scale = undefined;
            }
          }

          if (tableColumn.type === "interval"
            || tableColumn.type === "time without time zone"
            || tableColumn.type === "time with time zone"
            || tableColumn.type === "timestamp without time zone"
            || tableColumn.type === "timestamp with time zone") {
            tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["datetime_precision"]) ? dbColumn["datetime_precision"] : undefined;
          }

          // check only columns that have length property
          if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1 && (dbColumn['column_length'] || dbColumn['extended_column_length'])) {
            const length = dbColumn['column_length'] > dbColumn['extended_column_length'] ? dbColumn['column_length'] : dbColumn['extended_column_length'];
            tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
          }

          tableColumn.isNullable = !!columnConstraints.find(constraint => constraint["constraint_type"] === "NOT NULL");
          tableColumn.isPrimary = !!columnConstraints.find(constraint => constraint["constraint_type"] === "PRIMARY");
          if (tableColumn.isPrimary && tableColumn.type == 'serial') {
            tableColumn.isGenerated = true;
            tableColumn.generationStrategy = "increment";
          }

          const uniqueConstraint = columnConstraints.find(constraint => constraint["is_unique"] === 'TRUE');
          const isConstraintComposite = uniqueConstraint && uniqueConstraint['column_no_02'] > 0;
          tableColumn.isUnique = !!uniqueConstraint && !isConstraintComposite;

          if (dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined) {
            tableColumn.default = dbColumn["column_default"];

          }

          tableColumn.comment = ""; // dbColumn["COLUMN_COMMENT"];

          return tableColumn;
        }));


      // find unique constraints of table, group them by constraint name and build TableUnique.
      // TODO detect unique indexes
      /*
        const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
          return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_owner"]) === tableFullName
            && dbConstraint["constraint_type"] === "UNIQUE";
        }), dbConstraint => dbConstraint["constraint_name"]);

        table.uniques = tableUniqueConstraints.map(constraint => {
          const uniques = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);


          return new TableUnique({
            name: constraint["constraint_name"],
            columnNames: uniques.map(u => u["column_name"])
          });
        });
*/

      // TODO detect check conditions
      // find check constraints of table, group them by constraint name and build TableCheck.
      /*
      const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {

        return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_owner"]) === tableFullName
          && dbConstraint["constraint_type"] === "CHECK";
      }), dbConstraint => dbConstraint["constraint_name"]);

      table.checks = tableCheckConstraints.map(constraint => {
        const checks = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);
        return new TableCheck({
          name: constraint["constraint_name"],
          columnNames: checks.map(c => c["column_name"]),
          expression: constraint["expression"] // column names are not escaped, may cause problems
        });
      });
*/

      // TODO detect foreign keys
      // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
      /*
    const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
        return this.driver.buildTableName(dbForeignKey["table_name"], dbForeignKey["table_owner"]) === tableFullName;
      }), dbForeignKey => dbForeignKey["constraint_name"]);

      table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
        const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["constraint_name"] === dbForeignKey["constraint_name"]);

        // if referenced table located in currently used schema, we don't need to concat schema name to table name.
        const schema = dbForeignKey["referenced_table_owner"] === currentSchema ? undefined : dbTable["referenced_table_owner"];
        const referencedTableName = this.driver.buildTableName(dbForeignKey["referenced_table_name"], schema);

        return new TableForeignKey({
          name: dbForeignKey["constraint_name"],
          columnNames: foreignKeys.map(dbFk => dbFk["column_name"]),
          referencedTableName: referencedTableName,
          referencedColumnNames: foreignKeys.map(dbFk => dbFk["referenced_column_name"]),
          onDelete: dbForeignKey["on_delete"],
          onUpdate: dbForeignKey["on_update"]
        });
      });
      */

      // find index constraints of table, group them by constraint name and build TableIndex.
      const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
        return this.driver.buildTableName(dbIndex["table_name"], dbIndex["table_owner"]) === tableFullName;
      }), dbIndex => dbIndex["constraint_name"]);

      table.indices = tableIndexConstraints.map(constraint => {
        // const indices = dbIndices.filter(index => index["constraint_name"] === constraint["constraint_name"]);
        let colNames = [];
        for (let i = 1; i <= 16; i++) {
          let k = "0".repeat(2 - ((i + "").length)) + i;
          if (constraint['column_no_' + k] == 0) {
            break;
          }
          let col = dbColumns.find(c => c['table_name'] == constraint['table_name'] && c['column_no'] == constraint['column_no_' + k]);
          ;
          colNames.push(col['column_name']);
        }


        return new TableIndex(<TableIndexOptions>{
          table: table,
          name: constraint["constraint_name"],
          columnNames: colNames,
          isUnique: constraint["is_unique"] === "TRUE",
          where: constraint["condition"],
          isSpatial: false,
          isFulltext: false
        });
      });

      return table;
    }));
    // return [];
  }

  /**
   *   0 = CHAR
   1 = SMALLINT
   2 = INTEGER
   3 = FLOAT
   4 = SMALLFLOAT
   5 = DECIMAL
   6 = SERIAL 1
   7 = DATE
   8 = MONEY
   9 = NULL
   10 = DATETIME
   11 = BYTE
   12 = TEXT
   13 = VARCHAR
   14 = INTERVAL
   15 = NCHAR
   16 = NVARCHAR
   17 = INT8
   18 = SERIAL8 1
   19 = SET
   20 = MULTISET
   21 = LIST
   22 = ROW (unnamed)
   23 = COLLECTION
   40 = LVARCHAR fixed-length opaque types 2
   41 = BLOB, BOOLEAN, CLOB variable-length opaque types 2
   43 = LVARCHAR (client-side only)
   45 = BOOLEAN
   52 = BIGINT
   53 = BIGSERIAL 1
   2061 = IDSSECURITYLABEL 2, 3
   4118 = ROW (named)

   */

  private static typeMap = {
    0: 'CHAR',
    1: 'SMALLINT',
    2: 'INTEGER',
    3: 'FLOAT',
    4: 'SMALLFLOAT',
    5: 'DECIMAL',
    6: 'SERIAL',
    7: 'DATE',
    8: 'MONEY',
    9: 'NULL',
    10: 'DATETIME',
    11: 'BYTE',
    12: 'TEXT',
    13: 'VARCHAR',
    14: 'INTERVAL',
    15: 'NCHAR',
    16: 'NVARCHAR',
    17: 'INT8',
    18: 'SERIAL8',
    19: 'SET',
    20: 'MULTISET',
    21: 'LIST',
    22: 'ROW',
    23: 'COLLECTION',
    40: 'LVARCHAR',
    41: 'BLOB',
    45: 'BOOLEAN',
    52: 'BIGINT',
    53: 'BIGSERIAL',
    2061: 'IDSSECURITYLABEL',
    4118: 'ROW'
  }


  /**
   * Builds create table sql.
   */
  protected createTableSql(table: Table, createForeignKeys?: boolean): string {
    const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table, column)).join(", ");
    let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

    table.columns
      .filter(column => column.isUnique)
      .forEach(column => {
        const isUniqueExist = table.uniques.some(unique =>
          unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
        if (!isUniqueExist)
          table.uniques.push(new TableUnique({
            name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
            columnNames: [column.name]
          }));
      });

    if (table.uniques.length > 0) {
      const uniquesSql = table.uniques.map(unique => {
        const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
        const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `UNIQUE (${columnNames}) CONSTRAINT ${uniqueName}`;
      }).join(", ");

      sql += `, ${uniquesSql}`;
    }

    if (table.checks.length > 0) {
      const checksSql = table.checks.map(check => {
        const checkName = check.name ? check.name : this.connection.namingStrategy.checkConstraintName(table.name, check.expression!);
        return `CHECK (${check.expression}) CONSTRAINT "${checkName}"`;
      }).join(", ");

      sql += `, ${checksSql}`;
    }

    if (table.foreignKeys.length > 0 && createForeignKeys) {
      const foreignKeysSql = table.foreignKeys.map(fk => {
        const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
        if (!fk.name)
          fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
        const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");

        let constraint = `FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames}) CONSTRAINT ${fk.name}`;
        if (fk.onDelete)
          constraint += ` ON DELETE ${fk.onDelete}`;
        if (fk.onUpdate)
          constraint += ` ON UPDATE ${fk.onUpdate}`;

        return constraint;
      }).join(", ");

      sql += `, ${foreignKeysSql}`;
    }

    const primaryColumns = table.columns.filter(column => column.isPrimary);
    if (primaryColumns.length > 0) {
      const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(column => column.name));
      const columnNames = primaryColumns.map(column => `${column.name}`).join(", ");
      sql += `, PRIMARY KEY (${columnNames}) CONSTRAINT ${primaryKeyName}`;
    }

    sql += `)`;

    return sql;
  }

  // /**
  //  * Extracts schema name from given Table object or table name string.
  //  */
  // protected extractSchema(target: Table | string): string | undefined {
  //   const tableName = target instanceof Table ? target.name : target;
  //   return tableName.indexOf(".") === -1 ? this.driver.options.schema : tableName.split(".")[0];
  // }
  //
  // /**
  //  * Drops ENUM type from given schemas.
  //  */
  // protected async dropEnumTypes(schemaNames: string): Promise<void> {
  //   const selectDropsQuery = `SELECT 'DROP TYPE IF EXISTS "' || n.nspname || '"."' || t.typname || '" CASCADE;' as "query" FROM "pg_type" "t" ` +
  //     `INNER JOIN "pg_enum" "e" ON "e"."enumtypid" = "t"."oid" ` +
  //     `INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" ` +
  //     `WHERE "n"."nspname" IN (${schemaNames}) GROUP BY "n"."nspname", "t"."typname"`;
  //   const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
  //   await Promise.all(dropQueries.map(q => this.query(q["query"])));
  // }
  //
  // /**
  //  * Checks if enum with the given name exist in the database.
  //  */
  // protected async hasEnumType(table: Table, column: TableColumn): Promise<boolean> {
  //   const schema = this.parseTableName(table).schema;
  //   const enumName = this.buildEnumName(table, column, false, true);
  //   const sql = `SELECT "n"."nspname", "t"."typname" FROM "pg_type" "t" ` +
  //     `INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" ` +
  //     `WHERE "n"."nspname" = ${schema} AND "t"."typname" = '${enumName}'`;
  //   const result = await this.query(sql);
  //   return result.length ? true : false;
  // }
  //
  // /**
  //  * Builds create ENUM type sql.
  //  */
  // protected createEnumTypeSql(table: Table, column: TableColumn, enumName?: string): string {
  //   if (!enumName)
  //     enumName = this.buildEnumName(table, column);
  //   const enumValues = column.enum!.map(value => `'${value}'`).join(", ");
  //   return `CREATE TYPE ${enumName} AS ENUM(${enumValues})`;
  // }
  //
  // /**
  //  * Builds create ENUM type sql.
  //  */
  // protected dropEnumTypeSql(table: Table, column: TableColumn, enumName?: string): string {
  //   if (!enumName)
  //     enumName = this.buildEnumName(table, column);
  //   return `DROP TYPE ${enumName}`;
  // }

  /**
   * Builds drop table sql.
   */
  protected dropTableSql(tableOrPath: Table | string): string {
    return `DROP TABLE ${this.escapeTableName(tableOrPath)}`;
  }

  /**
   * Builds create index sql.
   */
  protected createIndexSql(table: Table, index: TableIndex): string {
    const columns = index.columnNames.map(columnName => `'${columnName}'`).join(", ");
    return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX  "${index.name}" ON ${this.escapeTableName(table)} (${columns})`;
  }

  /**
   * Builds drop index sql.
   */
  protected dropIndexSql(table: Table, indexOrName: TableIndex | string): string {
    let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
    const schema = this.parseTableName(table);
    return schema.owner ? `DROP INDEX "${schema.owner}"."${indexName}"` : `DROP INDEX "${indexName}"`;
  }

  /**
   * Builds create primary key sql.
   */
  protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
    const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
    const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
    return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`;
  }

  /**
   * Builds drop primary key sql.
   */
  protected dropPrimaryKeySql(table: Table): string {
    const columnNames = table.primaryColumns.map(column => column.name);
    const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
    return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${primaryKeyName}"`;
  }

  /**
   * Builds create unique constraint sql.
   */
  protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique): string {
    const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
    return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`;
  }

  /**
   * Builds drop unique constraint sql.
   */
  protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique | string): string {
    const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
    return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`;
  }

  // /**
  //  * Builds create check constraint sql.
  //  */
  // protected createCheckConstraintSql(table: Table, checkConstraint: TableCheck): string {
  //   return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`;
  // }
  //
  // /**
  //  * Builds drop check constraint sql.
  //  */
  // protected dropCheckConstraintSql(table: Table, checkOrName: TableCheck | string): string {
  //   const checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
  //   return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${checkName}"`;
  // }
  //
  // /**
  //  * Builds create foreign key sql.
  //  */
  // protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
  //   const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
  //   const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
  //   let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
  //     `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
  //   if (foreignKey.onDelete)
  //     sql += ` ON DELETE ${foreignKey.onDelete}`;
  //   if (foreignKey.onUpdate)
  //     sql += ` ON UPDATE ${foreignKey.onUpdate}`;
  //
  //   return sql;
  // }
  //
  // /**
  //  * Builds drop foreign key sql.
  //  */
  // protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey | string): string {
  //   const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
  //   return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${foreignKeyName}"`;
  // }
  //
  // /**
  //  * Builds sequence name from given table and column.
  //  */
  // protected buildSequenceName(table: Table, columnOrName: TableColumn | string, currentSchema?: string, disableEscape?: true, skipSchema?: boolean): string {
  //   const columnName = columnOrName instanceof TableColumn ? columnOrName.name : columnOrName;
  //   let schema: string | undefined = undefined;
  //   let tableName: string | undefined = undefined;
  //
  //   if (table.name.indexOf(".") === -1) {
  //     tableName = table.name;
  //   } else {
  //     schema = table.name.split(".")[0];
  //     tableName = table.name.split(".")[1];
  //   }
  //
  //   if (schema && schema !== currentSchema && !skipSchema) {
  //     return disableEscape ? `${schema}.${tableName}_${columnName}_seq` : `"${schema}"."${tableName}_${columnName}_seq"`;
  //
  //   } else {
  //     return disableEscape ? `${tableName}_${columnName}_seq` : `"${tableName}_${columnName}_seq"`;
  //   }
  // }
  //

  /**
   * Escapes given table path.
   */
  protected escapeTableName(target: Table | string, disableEscape?: boolean): string {
    let tableName = target instanceof Table ? target.name : target;
    tableName = tableName.indexOf(".") === -1 && this.driver.options.user ? `${this.driver.options.user}.${tableName}` : tableName;

    return tableName.split(".").map(i => {
      return disableEscape ? i : `${i}`;
    }).join(".");
  }


  /**
   * Returns object with table schema and table name.
   */
  protected parseTableName(target: Table | string) {
    const tableName = target instanceof Table ? target.name : target;
    if (tableName.indexOf(".") === -1) {
      return {
        tableName: `'${tableName}'`
      };
    } else {
      return {
        owner: `'${tableName.split(".")[0]}'`,
        tableName: `'${tableName.split(".")[1]}'`
      };
    }
  }

  /**
   * Builds a query for create column.
   */
  protected buildCreateColumnSql(table: Table, column: TableColumn) {
    let c = column.name;


    if (column.isGenerated === true) {
      if (['integer', 'int', 'smallint'].indexOf(column.type) !== -1)
        c += " SERIAL";
      else if (column.type === "bigint")
        c += " BIGSERIAL";
      else
        c += " " + column.type.toUpperCase();
    } else {
      if (column.type == 'string' && column.length) {
        c += " VARCHAR";
      } else if (column.type == 'string') {
        c += " TEXT";
      } else {
        c += " " + column.type.toUpperCase();
      }

    }

    if (column.length) {
      c += `(${column.length})`
    }

    if (column.isNullable !== true)
      c += " NOT NULL";

    if (column.default !== undefined && column.default !== null)
      c += " DEFAULT " + column.default;


    return c;
  }


}
