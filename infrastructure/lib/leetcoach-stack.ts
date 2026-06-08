// infrastructure/lib/leetcoach-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as path from "path";

export class LeetCoachStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB single-table ─────────────────────────────────────────────
    const table = new dynamodb.Table(this, "LeetCoachTable", {
      tableName: "leetcoach",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI for SRS queue queries (items due for review)
    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── Cognito User Pool ─────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, "LeetCoachUserPool", {
      userPoolName: "leetcoach-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      email: cognito.UserPoolEmail.withCognito(),
    });

    // App client (extension + website)
    const userPoolClient = new cognito.UserPoolClient(this, "LeetCoachAppClient", {
      userPool,
      userPoolClientName: "leetcoach-app",
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "http://localhost:5173/callback",
        ],
        logoutUrls: [
          "http://localhost:5173",
        ],
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // ── Shared Lambda env ─────────────────────────────────────────────────
    const lambdaEnv = {
      DYNAMODB_TABLE: table.tableName,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
      WEBSITE_URL: process.env.WEBSITE_URL || "https://leetcoach.app",
    };

    const lambdaDefaults: Partial<lambda.FunctionProps> & Pick<lambda.FunctionProps, "runtime"> = {
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnv,
    };

    // ── Lambda functions ──────────────────────────────────────────────────
     const analyzeSubmissionFn = new lambda.Function(this, "AnalyzeSubmission", {
      ...lambdaDefaults,
      functionName: "leetcoach-analyze-submission",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../backend"), {
        bundling: {
        image: lambda.Runtime.NODEJS_22_X.bundlingImage,
        command: [
        "bash", "-c",
        "cp -r /asset-input/. /asset-output/ && npm ci --prefix /asset-output --cache /tmp/npm-cache",
      ],
      },
      }),
      handler: "lambdas/analyze-submission/index.handler",
      description: "Analyze LeetCode submission with Claude AI + update SRS",
    });

    const submissionsFn = new lambda.Function(this, "UserSubmissions", {
  ...lambdaDefaults,
  functionName: "leetcoach-user-submissions",
  code: lambda.Code.fromAsset(path.join(__dirname, "../../backend"), {
    bundling: {
      image: lambda.Runtime.NODEJS_22_X.bundlingImage,
      command: [
      "bash", "-c",
      "cp -r /asset-input/. /asset-output/ && npm ci --prefix /asset-output --cache /tmp/npm-cache",
    ],
    },
  }),
  handler: "lambdas/user-submissions/index.handler",
  description: "Get user submission history and stats",
});

const reviewQueueFn = new lambda.Function(this, "ReviewQueue", {
  ...lambdaDefaults,
  functionName: "leetcoach-review-queue",
  code: lambda.Code.fromAsset(path.join(__dirname, "../../backend"), {
    bundling: {
      image: lambda.Runtime.NODEJS_22_X.bundlingImage,
      command: [
      "bash", "-c",
      "cp -r /asset-input/. /asset-output/ && npm ci --prefix /asset-output --cache /tmp/npm-cache",
    ],
    },
  }),
  handler: "lambdas/review-queue/index.handler",
  description: "SRS review queue management",
});

const saveSubmissionFn = new lambda.Function(this, "SaveSubmission", {
  ...lambdaDefaults,
  functionName: "leetcoach-save-submission",
  code: lambda.Code.fromAsset(path.join(__dirname, "../../backend"), { 
    bundling: {
      image: lambda.Runtime.NODEJS_22_X.bundlingImage,
      command: [
      "bash", "-c",
      "cp -r /asset-input/. /asset-output/ && npm ci --prefix /asset-output --cache /tmp/npm-cache",
    ],
    },
  }),
  handler: "lambdas/save-submission/index.handler",
  description: "Saves submission and updates SRS record without AI analysis",
});

    // Grant DynamoDB access
    table.grantReadWriteData(analyzeSubmissionFn);
    table.grantReadWriteData(submissionsFn);
    table.grantReadWriteData(reviewQueueFn);
    table.grantReadWriteData(saveSubmissionFn);

    // ── API Gateway ───────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, "LeetCoachApi", {
      restApiName: "leetcoach-api",
      description: "LeetCoach backend API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
      deployOptions: {
        stageName: "prod",
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
    });

    // Cognito authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "Authorizer", {
      cognitoUserPools: [userPool],
      authorizerName: "CognitoAuthorizer",
    });

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // Routes
    const submissions = api.root.addResource("submissions");
    submissions.addMethod("GET", new apigateway.LambdaIntegration(submissionsFn), authOptions);

    const analyze = submissions.addResource("analyze");
    analyze.addMethod("POST", new apigateway.LambdaIntegration(analyzeSubmissionFn), authOptions);

    const save = submissions.addResource("save");
    save.addMethod("POST", new apigateway.LambdaIntegration(saveSubmissionFn), authOptions);

    const reviews = api.root.addResource("reviews");
    const queue = reviews.addResource("queue");
    queue.addMethod("GET", new apigateway.LambdaIntegration(reviewQueueFn), authOptions);

    const submitReview = reviews.addResource("submit");
    submitReview.addMethod("POST", new apigateway.LambdaIntegration(reviewQueueFn), authOptions);

    // ── SSM Parameters (for CI/CD) ────────────────────────────────────────
    new ssm.StringParameter(this, "ApiUrlParam", {
      parameterName: "/leetcoach/api-url",
      stringValue: api.url,
    });
    new ssm.StringParameter(this, "UserPoolIdParam", {
      parameterName: "/leetcoach/user-pool-id",
      stringValue: userPool.userPoolId,
    });
    new ssm.StringParameter(this, "UserPoolClientIdParam", {
      parameterName: "/leetcoach/user-pool-client-id",
      stringValue: userPoolClient.userPoolClientId,
    });

    // ── CloudFormation outputs ────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL — use as VITE_API_URL and extension API_URL",
    });
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito App Client ID",
    });
    new cdk.CfnOutput(this, "TableName", {
      value: table.tableName,
      description: "DynamoDB table name",
    });
  }
}