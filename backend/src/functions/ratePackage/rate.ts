/* Provides metrics for uploaded packages.

Schema:
/package/{id}/rate:
    get:
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PackageRating'
          description: Return the rating. Only use this if each metric was computed
            successfully.
        400:
          description: There is missing field(s) in the PackageID
        403:
          description: Authentication failed due to invalid or missing AuthenticationToken.
        404:
          description: Package does not exist.
        500:
          description: The package rating system choked on at least one of the metrics.
      operationId: PackageRate
      summary: "Get ratings for this package. (BASELINE)"
    parameters:
    - name: id
      schema:
        $ref: '#/components/schemas/PackageID'
      in: path
      required: true
    - name: X-Authorization
      description: ""
      schema:
        $ref: '#/components/schemas/AuthenticationToken'
      in: header
      required: true
*/
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { main } from "./src/index";

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "PackageRegistry";
const GSI_NAME = "id-index"; // Replace with your actual GSI name if different

// Custom error class for better error handling
class PackageRegistryError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PackageRegistryError";
    this.statusCode = statusCode;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate HTTP method
    if (event.httpMethod !== "GET") {
      throw new PackageRegistryError("Method not allowed", 405);
    }

    // Validate path parameter for package ID
    const packageId = event.pathParameters?.id; // API input uses 'id'
    if (!packageId) {
      throw new PackageRegistryError("Package ID is missing in the request", 400);
    }

    // Validate headers for X-Authorization
    const authToken = event.headers["X-Authorization"];
    if (!authToken) {
      throw new PackageRegistryError("Authentication failed: Missing AuthenticationToken", 403);
    }

    // Query the package from DynamoDB using the GSI
    const { Items } = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: "#ID = :id",
        ExpressionAttributeNames: {
          "#ID": "ID", // Map the GSI key
        },
        ExpressionAttributeValues: {
          ":id": packageId,
        },
      })
    );

    if (!Items || Items.length === 0) {
      throw new PackageRegistryError(`Package with ID '${packageId}' does not exist`, 404);
    }

    const item = Items[0]; // Assuming one record per ID
    if (!item.URL) {
      throw new PackageRegistryError("The package URL is missing", 500);
    }

    const metrics = await main(item.URL);

    // Check if metrics are available for the package
    if (!metrics) {
      throw new PackageRegistryError("The package rating system choked on at least one of the metrics", 500);
    }

    // Update the metrics in the DynamoDB table
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { Name: item.Name, Version: item.Version }, // Replace with actual primary key
        UpdateExpression: "SET #metrics = :metrics",
        ExpressionAttributeNames: {
          "#metrics": "metrics",
        },
        ExpressionAttributeValues: {
          ":metrics": metrics,
        },
      })
    );

    // Return a successful response with the package rating
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Package rating retrieved successfully",
        metrics: metrics,
        details: metrics,
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    // Determine error response
    let statusCode = 500;
    let message = "Internal Server Error";

    if (error instanceof PackageRegistryError) {
      statusCode = error.statusCode;
      message = error.message;
    }

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: {
          message,
        },
      }),
    };
  }
};
