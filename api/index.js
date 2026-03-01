require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { getPublishedPosts, getDrafts, getPostById, putPost, updateDraft, publishPost } = require('./lib/dynamodb-posts');
const { subscribe } = require('./lib/dynamodb-subscribers');
const { uploadFromMulterFile } = require('./lib/s3-upload');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));
  if (process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// ---------- Public routes (DynamoDB) ----------
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getPublishedPosts();
    res.json(posts);
  } catch (e) {
    console.error('GET /api/posts', e);
    res.status(500).json({ error: e.message || 'Failed to fetch posts' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) {
    console.error('GET /api/posts/:id', e);
    res.status(500).json({ error: e.message || 'Failed to fetch post' });
  }
});

app.post('/api/subscribe', express.json(), async (req, res) => {
  try {
    const { email } = req.body || {};
    await subscribe(email);
    res.json({ ok: true, message: 'Subscribed successfully' });
  } catch (e) {
    console.error('POST /api/subscribe', e);
    res.status(400).json({ error: e.message || 'Invalid request' });
  }
});

// ---------- Admin routes (token only) ----------
app.post('/api/upload-image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    const url = await uploadFromMulterFile(req.file);
    res.json({ url });
  } catch (e) {
    console.error('POST /api/upload-image', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

app.get('/api/drafts', requireAdmin, async (req, res) => {
  try {
    const drafts = await getDrafts();
    res.json(drafts);
  } catch (e) {
    console.error('GET /api/drafts', e);
    res.status(500).json({ error: e.message || 'Failed to fetch drafts' });
  }
});

app.post('/api/drafts', requireAdmin, express.json(), async (req, res) => {
  try {
    const { Title, Summary, Content, NewsletterHook, CoverImageUrl } = req.body || {};
    const now = new Date().toISOString();
    const postId = uuidv4();
    const item = {
      PostId: postId,
      Title: Title || 'Untitled',
      Summary: Summary || '',
      Content: Content || '',
      NewsletterHook: NewsletterHook || '',
      CoverImageUrl: CoverImageUrl || '',
      Status: 'draft',
      CreatedAt: now,
      UpdatedAt: now,
    };
    await putPost(item);
    res.status(201).json(item);
  } catch (e) {
    console.error('POST /api/drafts', e);
    res.status(500).json({ error: e.message || 'Failed to create draft' });
  }
});

app.put('/api/drafts/:id', requireAdmin, async (req, res) => {
  try {
    const { Title, Summary, Content, CoverImageUrl } = req.body || {};
    const post = await updateDraft(req.params.id, {
      Title,
      Summary,
      Content,
      CoverImageUrl,
    });
    res.json(post);
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Draft not found or already published' });
    }
    console.error('PUT /api/drafts/:id', e);
    res.status(500).json({ error: e.message || 'Failed to update draft' });
  }
});

app.put('/api/publish/:id', requireAdmin, async (req, res) => {
  try {
    const post = await publishPost(req.params.id);
    res.json(post);
  } catch (e) {
    console.error('PUT /api/publish/:id', e);
    res.status(500).json({ error: e.message || 'Failed to publish' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.method + ' ' + req.path });
});

app.listen(4000, () => {
  console.log('Server running on port 4000 (AWS DynamoDB)');
});
