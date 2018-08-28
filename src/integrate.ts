import {AiosDriver} from "./driver/aios/AiosDriver";
import {Connection, Driver} from "typeorm";
import {DriverFactory} from "typeorm/driver/DriverFactory";
import {MysqlConnectionOptions} from "../node_modules/typeorm/driver/mysql/MysqlConnectionOptions";
import {PostgresConnectionOptions} from "../node_modules/typeorm/driver/postgres/PostgresConnectionOptions";
import {SqliteConnectionOptions} from "../node_modules/typeorm/driver/sqlite/SqliteConnectionOptions";
import {SqlServerConnectionOptions} from "../node_modules/typeorm/driver/sqlserver/SqlServerConnectionOptions";
import {OracleConnectionOptions} from "../node_modules/typeorm/driver/oracle/OracleConnectionOptions";
import {CordovaConnectionOptions} from "../node_modules/typeorm/driver/cordova/CordovaConnectionOptions";
import {ReactNativeConnectionOptions} from "../node_modules/typeorm/driver/react-native/ReactNativeConnectionOptions";
import {SqljsConnectionOptions} from "../node_modules/typeorm/driver/sqljs/SqljsConnectionOptions";
import {MongoConnectionOptions} from "../node_modules/typeorm/driver/mongodb/MongoConnectionOptions";
import {AiosConnectionOptions} from "./driver/aios/AiosConnectionOptions";

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
