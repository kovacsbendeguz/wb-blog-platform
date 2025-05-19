import { handler } from "../../src/handlers/updateMetrics";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbMock = mockClient(DynamoDBDocumentClient);

process.env.TABLE_NAME = "test-articles-table";

describe("updateMetrics handler", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test("updates view count successfully", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [{
        PK: "ARTICLE",
        publishedAt: "2025-01-01T00:00:00.000Z",
        articleId: "123",
        title: "Test Article",
        metrics: {
          views: 5,
          timeSpent: 120,
          rating: 4.5,
          ratingCount: 1,
          totalRating: 4.5
        }
      }]
    });

    ddbMock.on(UpdateCommand).resolves({
      Attributes: {
        metrics: {
          views: 6,
          timeSpent: 120,
          rating: 4.5,
          ratingCount: 1,
          totalRating: 4.5
        }
      }
    });

    const response = await handler(
      {
        httpMethod: "POST",
        pathParameters: { id: "123" },
        body: JSON.stringify({ incrementView: true })
      } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.metrics.views).toBe(6);

    const updateCalls = ddbMock.commandCalls(UpdateCommand);
    expect(updateCalls).toHaveLength(1);
  });

  test("updates time spent successfully", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [{
        PK: "ARTICLE",
        publishedAt: "2025-01-01T00:00:00.000Z",
        articleId: "123",
        title: "Test Article",
        metrics: {
          views: 5,
          timeSpent: 120,
          rating: 4.5,
          ratingCount: 1,
          totalRating: 4.5
        }
      }]
    });

    ddbMock.on(UpdateCommand).resolves({
      Attributes: {
        metrics: {
          views: 5,
          timeSpent: 170,
          rating: 4.5,
          ratingCount: 1,
          totalRating: 4.5
        }
      }
    });

    const response = await handler(
      {
        httpMethod: "POST",
        pathParameters: { id: "123" },
        body: JSON.stringify({ timeSpent: 50 })
      } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.metrics.timeSpent).toBe(170);
  });

  test("updates rating successfully", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [{
        PK: "ARTICLE",
        publishedAt: "2025-01-01T00:00:00.000Z",
        articleId: "123",
        title: "Test Article",
        metrics: {
          views: 5,
          timeSpent: 120,
          rating: 4.5,
          ratingCount: 1,
          totalRating: 4.5
        }
      }]
    });

    ddbMock.on(UpdateCommand).resolves({
      Attributes: {
        metrics: {
          views: 5,
          timeSpent: 120,
          rating: 4.3,
          ratingCount: 2,
          totalRating: 8.5
        }
      }
    });

    const response = await handler(
      {
        httpMethod: "POST",
        pathParameters: { id: "123" },
        body: JSON.stringify({ rating: 4 })
      } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.metrics.rating).toBe(4.3);
  });
});
