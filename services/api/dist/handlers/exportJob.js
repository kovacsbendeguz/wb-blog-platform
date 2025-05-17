"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const dbClient_1 = require("../lib/dbClient");
const client_s3_1 = require("@aws-sdk/client-s3");
const TABLE = process.env.TABLE_NAME;
const BUCKET = process.env.EXPORT_BUCKET;
const s3 = new client_s3_1.S3Client({});
const handler = async () => {
    const data = await dbClient_1.dbClient.send(new client_dynamodb_1.ScanCommand({ TableName: TABLE }));
    const payload = JSON.stringify(data.Items);
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: `exports/${new Date().toISOString()}.json`,
        Body: payload,
    }));
};
exports.handler = handler;
