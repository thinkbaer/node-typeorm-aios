import {AiosDriver} from "./driver/aios/AiosDriver";
import {Connection, Driver, EntityManager, QueryRunner} from "typeorm";
import {DriverFactory} from "typeorm/driver/DriverFactory";
import {EntityManagerFactory} from "typeorm/entity-manager/EntityManagerFactory";
import {AiosEntityManager} from "./driver/aios/AiosEntityManager";

/** ===============================================
 * Override typeorm DriverFactory
 */
const driverFactoryCreate = DriverFactory.prototype.create;
DriverFactory.prototype.create = function (connection: Connection): Driver {
    const type = connection.options.type as string;
    if(type == 'aios'){
        return new AiosDriver(connection);
    }
  return driverFactoryCreate.call(this,connection);
};


const entityManagerFactoryCreate = EntityManagerFactory.prototype.create;
EntityManagerFactory.prototype.create = function (connection: Connection, queryRunner?: QueryRunner): EntityManager {
  if(connection.driver instanceof AiosDriver){
    return new AiosEntityManager(connection,queryRunner);
  }
  return entityManagerFactoryCreate.call(this,connection);
};

