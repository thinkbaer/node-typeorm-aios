import {QueryRunner, SelectQueryBuilder} from "typeorm";
import {SelectQuery} from "typeorm/query-builder/SelectQuery";
import {Alias} from "typeorm/query-builder/Alias";
import {QueryResultCacheOptions} from "typeorm/cache/QueryResultCacheOptions";
import * as _ from "lodash";


export class InformixSelectQueryBuilder<Entity> extends SelectQueryBuilder<Entity> {

  /*
  insert(){

  }
  */
  // -------------------------------------------------------------------------
  // Public Implemented Methods
  // -------------------------------------------------------------------------

  /**
   * Gets generated sql query without parameters being replaced.
   */
  getQuery(): string {
    let sql = this.createSelectExpression();
    sql += this.createJoinExpression();
    sql += this.createWhereExpression();
    sql += this.createGroupByExpression();
    sql += this.createHavingExpression();
    sql += this.createOrderByExpression();
    sql += this.createLockExpression();
    sql = sql.trim();
    if (this.expressionMap.subQuery)
      sql = "(" + sql + ")";
    return sql;
  }


  protected async executeCountQuery(queryRunner: QueryRunner): Promise<number> {
    this.expressionMap.queryEntity = false;

    const mainAlias = this.expressionMap.mainAlias!.name; // todo: will this work with "fromTableName"?
    const metadata = this.expressionMap.mainAlias!.metadata;

    const distinctAlias = this.escape(mainAlias);
    let countSql: string = "";
    // informix does not support multiple columns in distinct and count
    // https://www.ibm.com/support/knowledgecenter/en/SSGU8G_12.1.0/com.ibm.sqls.doc/ids_sqs_1581.htm
    // https://www.ibm.com/support/knowledgecenter/en/SSGU8G_12.1.0/com.ibm.sqls.doc/ids_sqs_0185.htm
    if (metadata.hasMultiplePrimaryKeys) {
      countSql = `COUNT (DISTINCT (` + metadata.primaryColumns.map((primaryColumn, index) => {
        const propertyName = this.escape(primaryColumn.databaseName);
        return `${distinctAlias}.${propertyName}`;
      }).join(" || ") + ")) as cnt";

    } else {
      countSql = `COUNT (DISTINCT (` + metadata.primaryColumns.map((primaryColumn, index) => {
        const propertyName = this.escape(primaryColumn.databaseName);
        return `${distinctAlias}.${propertyName}`;
      }).join(" || ") + ")) as cnt";
    }

    const results = await this.clone()
      .mergeExpressionMap(<any>{ignoreParentTablesJoins: true})
      .orderBy()
      .groupBy()
      .offset(undefined)
      .limit(undefined)
      .select(countSql)
      .loadRawResults(queryRunner);

    if (!results || !results[0] || !results[0]["cnt"])
      return 0;

    return parseInt(results[0]["cnt"]);
  }


  /**
   * Creates "SELECT FROM" part of SQL query.
   */
  protected createSelectExpression() {

    if (!this.expressionMap.mainAlias)
      throw new Error("Cannot build query because main alias is not set (call qb#from method)");

    // todo throw exception if selects or from is missing

    const allSelects: SelectQuery[] = [];
    const excludedSelects: SelectQuery[] = [];

    if (this.expressionMap.mainAlias.hasMetadata) {
      const metadata = this.expressionMap.mainAlias.metadata;
      allSelects.push(...this.buildEscapedEntityColumnSelects(this.expressionMap.mainAlias.name, metadata));
      excludedSelects.push(...this.findEntityColumnSelects(this.expressionMap.mainAlias.name, metadata));
    }

    // add selects from joins
    this.expressionMap.joinAttributes
      .forEach(join => {
        if (join.metadata) {
          allSelects.push(...this.buildEscapedEntityColumnSelects(join.alias.name!, join.metadata));
          excludedSelects.push(...this.findEntityColumnSelects(join.alias.name!, join.metadata));
        } else {
          const hasMainAlias = this.expressionMap.selects.some(select => select.selection === join.alias.name);
          if (hasMainAlias) {
            allSelects.push({selection: this.escape(join.alias.name!) + ".*"});
            const excludedSelect = this.expressionMap.selects.find(select => select.selection === join.alias.name);
            excludedSelects.push(excludedSelect!);
          }
        }
      });

    // add all other selects
    this.expressionMap.selects
      .filter(select => excludedSelects.indexOf(select) === -1)
      .forEach(select => allSelects.push({
        selection: this.replacePropertyNames(select.selection),
        aliasName: select.aliasName
      }));

    // if still selection is empty, then simply set it to all (*)
    if (allSelects.length === 0)
      allSelects.push({selection: "*"});


    // create a selection query
    const froms = this.expressionMap.aliases
      .filter(alias => alias.type === "from" && (alias.tablePath || alias.subQuery))
      .map(alias => {
        if (alias.subQuery)
          return alias.subQuery + " " + this.escape(alias.name);

        return this.getTableName(alias.tablePath!) + " " + this.escape(alias.name);
      });
    const selection = allSelects.map(select => select.selection + (select.aliasName ? " AS " + this.escape(select.aliasName) : "")).join(", ");

    let offset: number | undefined = this.expressionMap.offset,
      limit: number | undefined = this.expressionMap.limit;
    if (!offset && !limit && this.expressionMap.joinAttributes.length === 0) {
      offset = this.expressionMap.skip;
      limit = this.expressionMap.take;
    }

    let limitStr = "";
    if (limit && offset)
      limitStr = " SKIP " + offset + " FIRST " + limit;
    else if (limit)
      limitStr = " FIRST " + limit;
    else if (offset)
      limitStr = " SKIP " + offset;

    return "SELECT" + limitStr + " " + selection + " FROM " + froms.join(", ");
  }

  /**
   * Builds column alias from given alias name and column name,
   * If alias length is more than 29, abbreviates column name.
   */
  protected buildColumnAlias(aliasName: string, columnName: string): string {
    //const columnAliasName = aliasName + "_" + columnName;
    return super.buildColumnAlias(aliasName, columnName);//columnAliasName.toLowerCase();
  }


  protected async loadRawResults(queryRunner: QueryRunner) {
    const [sql, parameters] = this.getQueryAndParameters();
    const queryId = sql + " -- PARAMETERS: " + JSON.stringify(parameters);
    const cacheOptions = typeof this.connection.options.cache === "object" ? this.connection.options.cache : {};
    let savedQueryResultCacheOptions: QueryResultCacheOptions | undefined = undefined;
    if (this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled)) {
      savedQueryResultCacheOptions = await this.connection.queryResultCache.getFromCache({
        identifier: this.expressionMap.cacheId,
        query: queryId,
        duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000
      }, queryRunner);
      if (savedQueryResultCacheOptions && !this.connection.queryResultCache.isExpired(savedQueryResultCacheOptions))
        return JSON.parse(savedQueryResultCacheOptions.result);
    }

    const results: any[] = await queryRunner.query(sql, parameters);

    // convert keys for informix, it speaks only lower case
    this.expressionMap.aliases.map(alias => {
      const prefix = alias.name.toLowerCase() + '_';
      let prefixReplace = alias.name + '_';
      if (prefixReplace == prefix) {
        return;
      }

      results.forEach(result => {
        Object.keys(result).forEach(k => {
          if (_.startsWith(k, prefix)) {
            const kn = k.replace(prefix, prefixReplace);
            result[kn] = result[k];
            delete result[k];
          }
        })
      })
    });


    if (this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled)) {
      await this.connection.queryResultCache.storeInCache({
        identifier: this.expressionMap.cacheId,
        query: queryId,
        time: new Date().getTime(),
        duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000,
        result: JSON.stringify(results)
      }, savedQueryResultCacheOptions, queryRunner);
    }

    return results;
  }

  //
  // /**
  //  * Specifies FROM which entity's table select/update/delete will be executed.
  //  * Also sets a main string alias of the selection data.
  //  */
  // protected createFromAlias(entityTarget: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName?: string): Alias {
  //   if (aliasName) {
  //     //aliasName = aliasName.toLowerCase();
  //   }
  //   return super.createFromAlias(entityTarget, aliasName);
  // }

  //
  //   // if table has a metadata then find it to properly escape its properties
  //   // const metadata = this.connection.entityMetadatas.find(metadata => metadata.tableName === tableName);
  //   if (this.connection.hasMetadata(entityTarget)) {
  //     const metadata = this.connection.getMetadata(entityTarget);
  //
  //     return this.expressionMap.createAlias({
  //       type: "from",
  //       name: aliasName.toLowerCase(),
  //       metadata: this.connection.getMetadata(entityTarget),
  //       tablePath: metadata.tablePath
  //     });
  //
  //   } else {
  //     let subQuery: string = "";
  //     if (entityTarget instanceof Function) {
  //       const subQueryBuilder: SelectQueryBuilder<any> = (entityTarget as any)(((this as any) as SelectQueryBuilder<any>).subQuery());
  //       this.setParameters(subQueryBuilder.getParameters());
  //       subQuery = subQueryBuilder.getQuery();
  //
  //     } else {
  //       subQuery = entityTarget;
  //     }
  //     const isSubQuery = entityTarget instanceof Function || entityTarget.substr(0, 1) === "(" && entityTarget.substr(-1) === ")";
  //     return this.expressionMap.createAlias({
  //       type: "from",
  //       name: aliasName.toLowerCase(),
  //       tablePath: isSubQuery === false ? entityTarget as string : undefined,
  //       subQuery: isSubQuery === true ? subQuery : undefined,
  //     });
  //   }
  // }

}
