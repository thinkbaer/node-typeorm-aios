import {EntitySchema} from "typeorm";
import {EntitySchemaOptions} from "../../node_modules/typeorm/entity-schema/EntitySchemaOptions";

export const CategoryEntity = new EntitySchema(<EntitySchemaOptions<any>>{
  name: "category",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true
    },
    name: {
      type: String
    }
  },

});
