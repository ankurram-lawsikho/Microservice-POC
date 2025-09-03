import { EntitySchema } from "typeorm";

export const Todo = new EntitySchema({
    name: "Todo",
    tableName: "todos",
    columns: {
        id: {
            primary: true,
            type: "ObjectId",
            objectId: true
        },
        userId: {
            type: "int"
        },
        task: {
            type: "varchar"
        },
        completed: {
            type: "boolean",
            default: false
        },
        createdAt: {
            type: "timestamp",
            createDate: true
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true
        }
    }
});