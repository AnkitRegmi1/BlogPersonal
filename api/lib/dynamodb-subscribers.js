const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./aws');

const TABLE = process.env.SUBSCRIBERS_TABLE || 'Subscribers';

/**
 * Add a subscriber (idempotent by email).
 */
async function subscribe(email) {
  const trimmed = String(email).trim().toLowerCase();
  if (!trimmed) throw new Error('Email is required');
  const cmd = new PutCommand({
    TableName: TABLE,
    Item: {
      Email: trimmed,
      SubscribedAt: new Date().toISOString(),
    },
  });
  await docClient.send(cmd);
  return { email: trimmed };
}

/**
 * List all subscriber emails (for Phase 6 – newsletter blast).
 */
async function listSubscribers() {
  const cmd = new ScanCommand({ TableName: TABLE });
  const res = await docClient.send(cmd);
  const items = res.Items || [];
  return items.map((item) => item.Email).filter(Boolean);
}

module.exports = {
  subscribe,
  listSubscribers,
};
