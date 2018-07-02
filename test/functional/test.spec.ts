import {expect} from 'chai';
import {suite, test} from 'mocha-typescript';
import {Connection, createConnection, Driver} from 'typeorm';
import {DriverFactory} from "typeorm/driver/DriverFactory";
import {AiosDriver} from "../../src/driver/aios/AiosDriver";



@suite('functional/test')
class TestSpec {


    @test
    async 'load aios'() {
        const connection = await createConnection(<any>{
            type: "aios",
        });

    }


}

