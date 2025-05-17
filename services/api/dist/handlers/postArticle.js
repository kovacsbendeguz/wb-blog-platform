"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const dbClient_1 = require("../lib/dbClient");
const uuid_1 = require("uuid");
const TABLE = process.env.TABLE_NAME;
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json'
};
const handler = async (event) => {
    try {
        // Handle preflight request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                    'Access-Control-Allow-Credentials': true,
                },
                body: ''
            };
        }
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Request body is required' })
            };
        }
        const data = JSON.parse(event.body);
        // Validate required fields
        if (!data.title || !data.content || !data.author) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'Missing required fields',
                    required: ['title', 'content', 'author']
                })
            };
        }
        const articleId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const item = {
            PK: 'ARTICLE',
            articleId,
            publishedAt: now,
            title: data.title,
            content: data.content,
            author: data.author,
            createdAt: now,
            metrics: {
                views: 0,
                timeSpent: 0,
                rating: 0
            }
        };
        // Convert plain JS object to DynamoDB attribute values
        const dbItem = (0, util_dynamodb_1.marshall)(item, { removeUndefinedValues: true });
        await dbClient_1.dbClient.send(new client_dynamodb_1.PutItemCommand({
            TableName: TABLE,
            Item: dbItem
        }));
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(item)
        };
    }
    catch (err) {
        console.error('postArticle error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Internal Server Error',
                error: err instanceof Error ? err.message : 'Unknown error'
            })
        };
    }
};
exports.handler = handler;
