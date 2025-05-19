import { handler } from "../src/rssIngest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import Parser from "rss-parser";

const ddbMock = mockClient(DynamoDBClient);

process.env.TABLE_NAME = "test-articles-table";
process.env.RSS_FEED_URL = "https://example.com/rss";

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mock-uuid")
}));

jest.mock("rss-parser");

describe("RSS Ingest handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  test("successfully ingests RSS feed items", async () => {
    const mockFeed = {
      title: "Test Feed",
      items: [
        {
          title: "Article 1",
          content: "Content for article 1",
          link: "https://example.com/article1",
          isoDate: "2025-01-01T00:00:00.000Z",
          author: "Author 1"
        },
        {
          title: "Article 2",
          content: "Content for article 2",
          link: "https://example.com/article2",
          isoDate: "2025-01-02T00:00:00.000Z",
          author: "Author 2"
        }
      ]
    };

    (Parser.prototype.parseURL as jest.Mock).mockResolvedValue(mockFeed);
    ddbMock.on(PutItemCommand).resolves({});

    const response = await handler({} as any, {} as any, () => {});

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.articleIds).toHaveLength(2);

    const putCalls = ddbMock.commandCalls(PutItemCommand);
    expect(putCalls).toHaveLength(2);
  });

  test("handles CORS preflight OPTIONS request", async () => {
    const response = await handler(
      { httpMethod: "OPTIONS" } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(200);
    expect(response?.headers?.["Access-Control-Allow-Origin"]).toBe("*");
  });

  test("handles empty RSS feed", async () => {
    (Parser.prototype.parseURL as jest.Mock).mockResolvedValue({ title: "Test Feed", items: [] });

    const response = await handler({} as any, {} as any, () => {});

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.articleIds).toHaveLength(0);

    const putCalls = ddbMock.commandCalls(PutItemCommand);
    expect(putCalls).toHaveLength(0);
  });

  test("handles RSS parser error gracefully", async () => {
    (Parser.prototype.parseURL as jest.Mock).mockRejectedValue(new Error("Failed to fetch RSS feed"));

    const response = await handler({} as any, {} as any, () => {});

    expect(response?.statusCode).toBe(500);
    const body = JSON.parse(response?.body ?? "");
    expect(body.message).toBe("Error importing RSS feed");
    expect(body.error).toBe("Failed to fetch RSS feed");
  });

  test("handles DynamoDB error gracefully", async () => {
    const mockFeed = {
      title: "Test Feed",
      items: [
        {
          title: "Article 1",
          content: "Content for article 1",
          link: "https://example.com/article1",
          isoDate: "2025-01-01T00:00:00.000Z",
          author: "Author 1"
        }
      ]
    };

    (Parser.prototype.parseURL as jest.Mock).mockResolvedValue(mockFeed);
    ddbMock.on(PutItemCommand).rejects(new Error("Database error"));

    const response = await handler({} as any, {} as any, () => {});

    expect(response?.statusCode).toBe(500);
    const body = JSON.parse(response?.body ?? "");
    expect(body.message).toBe("Error importing RSS feed");
  });

  test("uses content fallback mechanism correctly", async () => {
    const mockFeed = {
      title: "Test Feed",
      items: [
        {
          title: "Content Field Article",
          content: "Content field",
          description: "Description field",
          contentEncoded: "Content encoded field",
          link: "https://example.com/article1",
          isoDate: "2025-01-01T00:00:00.000Z",
          author: "Author 1"
        },
        {
          title: "Description Field Article",
          description: "Only description field",
          link: "https://example.com/article2",
          isoDate: "2025-01-02T00:00:00.000Z",
          author: "Author 2"
        },
        {
          title: "Minimal Article",
          link: "https://example.com/article3",
          isoDate: "2025-01-03T00:00:00.000Z"
        }
      ]
    };

    (Parser.prototype.parseURL as jest.Mock).mockResolvedValue(mockFeed);
    ddbMock.on(PutItemCommand).resolves({});

    const response = await handler({} as any, {} as any, () => {});

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body ?? "");
    expect(body.articleIds).toHaveLength(3);

    const putCalls = ddbMock.commandCalls(PutItemCommand);
    expect(putCalls).toHaveLength(3);
  });

  test("uses feed title when author is not available", async () => {
    const mockFeed = {
      title: "Test",
      items: [
        {
          title: "No Author Article",
          content: "Content for article without author",
          link: "https://example.com/article1",
          isoDate: "2025-01-01T00:00:00.000Z"
        }
      ]
    };

    (Parser.prototype.parseURL as jest.Mock).mockResolvedValue(mockFeed);
    ddbMock.on(PutItemCommand).resolves({});

    const response = await handler({} as any, {} as any, () => {});

    expect(response?.statusCode).toBe(200);

    const putCalls = ddbMock.commandCalls(PutItemCommand);
    const putCallItem = putCalls[0].args[0].input.Item;

    expect(putCallItem?.author).toEqual({ S: "Test Feed" });
  });
});
