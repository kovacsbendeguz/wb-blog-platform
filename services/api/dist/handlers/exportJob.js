"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const dbClient_1 = require("../lib/dbClient");
const client_s3_1 = require("@aws-sdk/client-s3");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const TABLE = process.env.TABLE_NAME;
const BUCKET = process.env.EXPORT_BUCKET;
const s3 = new client_s3_1.S3Client({});
const handler = async () => {
    try {
        const data = await dbClient_1.dbClient.send(new client_dynamodb_1.QueryCommand({
            TableName: TABLE,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': { S: 'ARTICLE' }
            }
        }));
        const articles = (data.Items || []).map(item => (0, util_dynamodb_1.unmarshall)(item));
        const payload = JSON.stringify(articles);
        await s3.send(new client_s3_1.PutObjectCommand({
            Bucket: BUCKET,
            Key: `exports/${new Date().toISOString()}.json`,
            Body: payload,
        }));
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Export completed successfully',
                articleCount: articles.length
            })
        };
    }
    catch (error) {
        console.error('Error during export job:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Export failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};
exports.handler = handler;
