import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
    name: "User",
    tableName: "users",
    target: class User {},
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        name: {
            type: "varchar",
            length: 100,
            nullable: false
        },
        email: {
            type: "varchar",
            length: 255,
            unique: true,
            nullable: false
        },
        password: {
            type: "varchar",
            length: 255,
            nullable: true
        },
        createdAt: {
            type: "timestamp",
            createDate: true,
            nullable: false
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true,
            nullable: false
        }
    }
});
