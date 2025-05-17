import { handler } from "../../src/handlers/getArticles";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddbMock = mockClient(DynamoDBClient);

beforeEach(() => ddbMock.reset());
it("returns items from DynamoDB", async () => {
  ddbMock.on(ScanCommand).resolves({ Items: [{ foo: { S: "bar" } }] });
  const response = await handler({} as any, {} as any);
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toEqual([{ foo: { S: "bar" } }]);
});
