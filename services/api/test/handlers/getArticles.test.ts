import { handler } from "../../src/handlers/getArticles";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const ddbMock = mockClient(DynamoDBClient);

process.env.TABLE_NAME = "test-articles-table";

const mockArticle = {
  PK: { S: "ARTICLE" },
  articleId: { S: "123" },
  title: { S: "Test Article" },
  content: { S: "This is test content" },
  author: { S: "Test Author" },
  publishedAt: { S: "2025-01-01T00:00:00.000Z" },
  metrics: {
    M: {
      views: { N: "5" },
      timeSpent: { N: "120" },
      rating: { N: "4.5" }
    }
  }
};

describe("getArticles handler", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test("returns a list of articles when no ID is specified", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [mockArticle],
      LastEvaluatedKey: undefined
    });

    const response = await handler(
      { httpMethod: "GET", pathParameters: null, queryStringParameters: null } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.articles).toHaveLength(1);
    expect(body.articles[0].title).toBe("Test Article");
    expect(body.nextToken).toBeNull();
  });

  test("returns a single article when ID is specified", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [mockArticle] });

    const response = await handler(
      { httpMethod: "GET", pathParameters: { id: "123" }, queryStringParameters: null } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.title).toBe("Test Article");
  });

  test("returns 404 when article is not found", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });

    const response = await handler(
      { httpMethod: "GET", pathParameters: { id: "not-found" }, queryStringParameters: null } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(404);
  });

  test("handles pagination correctly", async () => {
    const lastEvaluatedKey = {
      PK: { S: "ARTICLE" },
      publishedAt: { S: "2025-01-01T00:00:00.000Z" }
    };

    ddbMock.on(QueryCommand).resolves({
      Items: [mockArticle],
      LastEvaluatedKey: lastEvaluatedKey
    });

    const response = await handler(
      { httpMethod: "GET", pathParameters: null, queryStringParameters: { limit: "5" } } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.nextToken).toBeTruthy();
  });
});
