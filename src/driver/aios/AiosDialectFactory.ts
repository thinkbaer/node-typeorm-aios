import {IDialect} from "./IDialect";
import {NotYetImplementedError} from "./NotYetImplementedError";
import * as _ from 'lodash';
import {HsqlDbDialect} from "./dialects/HsqlDbDialect";
import {SqliteDialect} from "./dialects/SqliteDialect";
import {InformixDialect} from "./dialects/InformixDialect";


export class AiosDialectFactory {

  private static  $self:AiosDialectFactory = null;

  dialects: { [key: string]: IDialect } = {};


  static $(){
    if(!this.$self){
      this.$self = new AiosDialectFactory();
    }
    return this.$self;
  }

  constructor(){
    //this.register(new HsqlDbDialect());
    //this.register(new SqliteDialect());
    this.register(new InformixDialect());
  }

  register(dialect: IDialect) {
    this.dialects[dialect.type] = dialect;
  }

  get(name: string): IDialect {
    if (_.has(this.dialects, name)) {
      return this.dialects[name];
    } else {
      throw new NotYetImplementedError();
    }
  }
}
