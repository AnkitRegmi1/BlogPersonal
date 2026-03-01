const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';

const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });

const docClient = DynamoDBDocumentClient.from(dynamoClient);

module.exports = {
  docClient,
  s3Client,
  region,
};
