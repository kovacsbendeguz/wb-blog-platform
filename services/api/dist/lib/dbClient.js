"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
exports.dbClient = new client_dynamodb_1.DynamoDBClient({});
