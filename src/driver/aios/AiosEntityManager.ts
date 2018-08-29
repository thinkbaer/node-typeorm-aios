import {EntityManager, EntitySchema, ObjectType, QueryRunner, SelectQueryBuilder} from "typeorm";
import {AiosDriver} from "./AiosDriver";
import {IDialect} from "./IDialect";


export class AiosEntityManager extends EntityManager {

  /**
   * Creates a new query builder that can be used to build a sql query.
   */
  createQueryBuilder<Entity>(entityClass: ObjectType<Entity> | Function | string, alias: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;

  /**
   * Creates a new query builder that can be used to build a sql query.
   */
  createQueryBuilder(queryRunner?: QueryRunner): SelectQueryBuilder<any>;

  /**
   * Creates a new query builder that can be used to build a sql query.
   */
  createQueryBuilder<Entity>(entityClass?: ObjectType<Entity> | Function | string | QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
    const dialect:IDialect = (<AiosDriver>this.connection.driver).dialect;

    if(dialect.createQueryBuilder){
      if (alias) {
        return dialect.createQueryBuilder(this,entityClass as Function | string, alias, queryRunner || this.queryRunner);
      } else {
        return dialect.createQueryBuilder(this,entityClass as QueryRunner | undefined || this.queryRunner);
      }
    }else{
      if (alias) {
        return super.createQueryBuilder(entityClass as Function | string, alias, queryRunner || this.queryRunner);
      } else {
        return super.createQueryBuilder(entityClass as QueryRunner | undefined || this.queryRunner);
      }
    }

  }
}
