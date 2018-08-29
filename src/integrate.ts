import {AiosDriver} from "./driver/aios/AiosDriver";
import {Connection, Driver, EntityManager, QueryRunner} from "typeorm";
import {DriverFactory} from "typeorm/driver/DriverFactory";
import {MysqlConnectionOptions} from "typeorm/driver/mysql/MysqlConnectionOptions";
import {PostgresConnectionOptions} from "typeorm/driver/postgres/PostgresConnectionOptions";
import {SqliteConnectionOptions} from "typeorm/driver/sqlite/SqliteConnectionOptions";
import {SqlServerConnectionOptions} from "typeorm/driver/sqlserver/SqlServerConnectionOptions";
import {OracleConnectionOptions} from "typeorm/driver/oracle/OracleConnectionOptions";
import {CordovaConnectionOptions} from "typeorm/driver/cordova/CordovaConnectionOptions";
import {ReactNativeConnectionOptions} from "typeorm/driver/react-native/ReactNativeConnectionOptions";
import {SqljsConnectionOptions} from "typeorm/driver/sqljs/SqljsConnectionOptions";
import {MongoConnectionOptions} from "typeorm/driver/mongodb/MongoConnectionOptions";
import {AiosConnectionOptions} from "./driver/aios/AiosConnectionOptions";
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
    };
    return driverFactoryCreate.call(this,connection);
}

export declare type ConnectionOptions = MysqlConnectionOptions | PostgresConnectionOptions | SqliteConnectionOptions | SqlServerConnectionOptions | OracleConnectionOptions | CordovaConnectionOptions | ReactNativeConnectionOptions | SqljsConnectionOptions | MongoConnectionOptions | AiosConnectionOptions;
export declare type DatabaseType = "mysql" | "postgres" | "mariadb" | "sqlite" | "cordova" | "react-native" | "sqljs" | "oracle" | "mssql" | "mongodb" | "aios";


const entityManagerFactoryCreate = EntityManagerFactory.prototype.create;
EntityManagerFactory.prototype.create = function (connection: Connection, queryRunner?: QueryRunner): EntityManager {
  if(connection.driver instanceof AiosDriver){
    return new AiosEntityManager(connection,queryRunner);
  };
  return entityManagerFactoryCreate.call(this,connection);
}

