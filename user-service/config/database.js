import "reflect-metadata";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import { DataSource } from "typeorm";
import { User } from "../entities/User.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "microservice-users",
    synchronize: true,
    logging: false,
    entities: [User],
    subscribers: [],
    migrations: [],
});
