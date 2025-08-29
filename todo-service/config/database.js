import "reflect-metadata";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import { DataSource } from "typeorm";
import { Todo } from "../entities/Todo.js";


export const AppDataSource = new DataSource({
    type: "mongodb",
    url: process.env.MONGODB_URL || "mongodb://ankurram2002:ankurram2002@ac-ki2r2zw-shard-00-00.exnkjri.mongodb.net:27017,ac-ki2r2zw-shard-00-01.exnkjri.mongodb.net:27017,ac-ki2r2zw-shard-00-02.exnkjri.mongodb.net:27017/community-events?ssl=true&replicaSet=atlas-lixxbm-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0",
    database: "microservice-todos",
    synchronize: true,
    logging: false, // Disable logging to reduce overhead
    entities: [Todo],
    subscribers: [],
    migrations: [],
    // Add connection options for better performance
    extra: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
    }
});
