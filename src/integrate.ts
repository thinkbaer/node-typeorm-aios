import {AiosDriver} from "./driver/aios/AiosDriver";
import {Connection, Driver} from "typeorm";
import {DriverFactory} from "typeorm/driver/DriverFactory";

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
