import {QueryRunner, SelectQueryBuilder} from "typeorm";


export class HsqlDbSelectQueryBuilder<Entity> extends SelectQueryBuilder<Entity> {
  /*
  protected async executeCountQuery(queryRunner: QueryRunner): Promise<number> {
    this.expressionMap.queryEntity = false;

    const mainAlias = this.expressionMap.mainAlias!.name; // todo: will this work with "fromTableName"?
    const metadata = this.expressionMap.mainAlias!.metadata;

    const distinctAlias = this.escape(mainAlias);
    let countSql: string = "";
    if (metadata.hasMultiplePrimaryKeys) {
      countSql = `COUNT(DISTINCT(` + metadata.primaryColumns.map((primaryColumn, index) => {
        const propertyName = this.escape(primaryColumn.databaseName);
        return `${distinctAlias}.${propertyName}`;
      }).join(", ") + ")) as \"cnt\"";

    } else {
      countSql = `COUNT(DISTINCT(` + metadata.primaryColumns.map((primaryColumn, index) => {
        const propertyName = this.escape(primaryColumn.databaseName);
        return `${distinctAlias}.${propertyName}`;
      }).join(", ") + ")) as \"cnt\"";
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
  */
}
