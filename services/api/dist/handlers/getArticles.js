"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const dbClient_1 = require("../lib/dbClient");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const TABLE = process.env.TABLE_NAME;
// Common headers for CORS
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json'
};
const handler = async (event) => {
    try {
        // If this is a specific article request, handle that
        if (event.pathParameters && event.pathParameters.id) {
            // TODO: Implement GetItem with the specific ID
            // For now, we'll just do a scan and filter
            const result = await dbClient_1.dbClient.send(new client_dynamodb_1.ScanCommand({ TableName: TABLE }));
            const items = result.Items || [];
            const foundItem = items.find(item => item.articleId && item.articleId.S === event.pathParameters.id);
            if (!foundItem) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ message: 'Article not found' })
                };
            }
            // Convert DynamoDB format to plain JavaScript object
            const unmarshalled = (0, util_dynamodb_1.unmarshall)(foundItem);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(unmarshalled)
            };
        }
        // Otherwise return all articles
        const result = await dbClient_1.dbClient.send(new client_dynamodb_1.ScanCommand({ TableName: TABLE }));
        // Convert DynamoDB format to plain JavaScript objects
        const unmarshalled = (result.Items || []).map(item => (0, util_dynamodb_1.unmarshall)(item));
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(unmarshalled)
        };
    }
    catch (error) {
        console.error('Error in getArticles:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};
exports.handler = handler;
