const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./aws');

const TABLE = process.env.BLOG_POSTS_TABLE || 'BlogPosts';

/**
 * Get all published posts (for public blog).
 * Returns items where status === 'published', sorted by CreatedAt desc.
 */
async function getPublishedPosts() {
  const cmd = new ScanCommand({
    TableName: TABLE,
    FilterExpression: '#s = :published',
    ExpressionAttributeNames: { '#s': 'Status' },
    ExpressionAttributeValues: { ':published': 'published' },
  });
  const res = await docClient.send(cmd);
  const items = res.Items || [];
  items.sort((a, b) => (b.CreatedAt || '').localeCompare(a.CreatedAt || ''));
  return items;
}

/**
 * Get all posts (drafts + published) for admin list. Sorted by CreatedAt desc.
 * Uses pagination so every item is returned (DynamoDB Scan returns max 1MB per call).
 */
async function getAllPosts() {
  const items = [];
  let lastKey;
  do {
    const params = {
      TableName: TABLE,
    };
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const cmd = new ScanCommand(params);
    const res = await docClient.send(cmd);
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  items.sort((a, b) => (b.CreatedAt || '').localeCompare(a.CreatedAt || ''));
  return items;
}

/**
 * Delete a post by PostId (draft or published). Admin only.
 */
async function deletePost(postId) {
  const cmd = new DeleteCommand({
    TableName: TABLE,
    Key: { PostId: postId },
  });
  await docClient.send(cmd);
  return { deleted: postId };
}

/**
 * Get all draft posts (for admin dashboard).
 */
async function getDrafts() {
  const cmd = new ScanCommand({
    TableName: TABLE,
    FilterExpression: '#s = :draft',
    ExpressionAttributeNames: { '#s': 'Status' },
    ExpressionAttributeValues: { ':draft': 'draft' },
  });
  const res = await docClient.send(cmd);
  const items = res.Items || [];
  items.sort((a, b) => (b.CreatedAt || '').localeCompare(a.CreatedAt || ''));
  return items;
}

/**
 * Get a single post by PostId.
 */
async function getPostById(postId) {
  const cmd = new GetCommand({
    TableName: TABLE,
    Key: { PostId: postId },
  });
  const res = await docClient.send(cmd);
  return res.Item || null;
}

/**
 * Create or replace a post (used by Python agent or admin).
 */
async function putPost(item) {
  const cmd = new PutCommand({
    TableName: TABLE,
    Item: item,
  });
  await docClient.send(cmd);
  return item;
}

/**
 * Update a draft post (for EditPost).
 */
async function updateDraft(postId, updates) {
  const { Title, Summary, Content, CoverImageUrl } = updates;
  const now = new Date().toISOString();
  const sets = ['UpdatedAt = :now'];
  const names = {};
  const values = { ':now': now };
  if (Title !== undefined) {
    sets.push('#t = :title');
    names['#t'] = 'Title';
    values[':title'] = Title;
  }
  if (Summary !== undefined) {
    sets.push('Summary = :summary');
    values[':summary'] = Summary;
  }
  if (Content !== undefined) {
    sets.push('Content = :content');
    values[':content'] = Content;
  }
  if (CoverImageUrl !== undefined) {
    sets.push('CoverImageUrl = :cover');
    values[':cover'] = CoverImageUrl;
  }
  const cmd = new UpdateCommand({
    TableName: TABLE,
    Key: { PostId: postId },
    UpdateExpression: 'SET ' + sets.join(', '),
    ConditionExpression: 'attribute_exists(PostId) AND #s = :draft',
    ExpressionAttributeNames: { ...names, '#s': 'Status' },
    ExpressionAttributeValues: { ...values, ':draft': 'draft' },
  });
  await docClient.send(cmd);
  return getPostById(postId);
}

/**
 * Update a post's status from draft to published.
 */
async function publishPost(postId) {
  const now = new Date().toISOString();
  const cmd = new UpdateCommand({
    TableName: TABLE,
    Key: { PostId: postId },
    UpdateExpression: 'SET #s = :published, UpdatedAt = :now',
    ConditionExpression: 'attribute_exists(PostId)',
    ExpressionAttributeNames: { '#s': 'Status' },
    ExpressionAttributeValues: { ':published': 'published', ':now': now },
  });
  await docClient.send(cmd);
  return getPostById(postId);
}

module.exports = {
  getPublishedPosts,
  getDrafts,
  getAllPosts,
  getPostById,
  putPost,
  updateDraft,
  publishPost,
  deletePost,
};
