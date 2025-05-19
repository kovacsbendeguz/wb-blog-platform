import { handler } from "../../src/handlers/postArticle";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddbMock = mockClient(DynamoDBClient);

process.env.TABLE_NAME = "test-articles-table";

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mock-uuid")
}));

describe("postArticle handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  test("creates an article successfully", async () => {
    ddbMock.on(PutItemCommand).resolves({});

    const newArticle = {
      title: "New Test Article",
      content: "This is new test content",
      author: "Test Author"
    };

    const response = await handler(
      { httpMethod: "POST", body: JSON.stringify(newArticle) } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(201);
    const body = JSON.parse(response?.body ?? "");
    expect(body.articleId).toBe("mock-uuid");
    expect(body.title).toBe("New Test Article");

    const putCalls = ddbMock.commandCalls(PutItemCommand);
    expect(putCalls).toHaveLength(1);
  });

  test("returns 400 if required fields are missing", async () => {
    const incompleteArticle = {
      title: "Incomplete Article",
      author: "Test Author"
    };

    const response = await handler(
      { httpMethod: "POST", body: JSON.stringify(incompleteArticle) } as any,
      {} as any,
      () => {}
    );

    expect(response?.statusCode).toBe(400);
    const body = JSON.parse(response?.body ?? "");
    expect(body.message).toContain("Missing required fields");
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
});
