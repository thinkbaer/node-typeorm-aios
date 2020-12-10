import {Column, Entity, EntitySchema, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {EntitySchemaOptions} from '../../node_modules/typeorm/entity-schema/EntitySchemaOptions';

export const CategoryEntity = new EntitySchema(<EntitySchemaOptions<any>>{
  name: 'category',
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


@Entity()
export class Category {

  @PrimaryGeneratedColumn()
  id: number;


  @Column('varchar', {length: 128})
  name: string;

}


@Entity()
export class CarShort {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {length: 128, nullable: true})
  label: string;

  @Column('varchar', {length: 128})
  name: string;

}


@Entity()
export class Car {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {length: 128})
  label: string;

  @Column('varchar', {length: 128})
  name: string;

  @ManyToOne(type => Category)
  @JoinColumn()
  categories: Category;

}
