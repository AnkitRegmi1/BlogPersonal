# TecBlogAI

TecBlogAI is an AI-powered technical blogging platform that automatically discovers developer tools, repositories, and emerging technologies, generates educational content using large language models, stores content in AWS infrastructure, and provides a publishing workflow through a web-based administration dashboard.

The platform combines AI agents, cloud infrastructure, content automation, and full-stack web development into a scalable system capable of generating and managing technical blog content with minimal human intervention.

---

# Overview

Technical content creation is time-consuming and difficult to scale. Developers and engineering teams often spend significant effort researching topics, writing tutorials, sourcing images, formatting content, and publishing updates.

TecBlogAI automates much of this process.

The platform continuously generates draft articles using AI agents, stores content in cloud infrastructure, allows human review through an admin dashboard, and publishes approved content to a public-facing technical blog.

The system consists of four major components:

* React Frontend
* Node.js Backend API
* AWS Cloud Infrastructure
* Python AI Content Agent

---

# System Architecture

```text
                    GitHub Actions
                           │
                           ▼
                  Python AI Agent
                           │
                           ▼
                    AWS DynamoDB
                           │
                           ▼
                     Node.js API
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 React         AWS S3
              Frontend        Images
```

---

# Core Features

## AI-Generated Technical Articles

The platform uses an autonomous AI agent to generate technical content.

Capabilities include:

* Repository discovery
* Topic research
* Tutorial generation
* Article drafting
* Content formatting
* Cover image assignment
* Draft storage

Generated content is stored as drafts until reviewed by an administrator.

---

## Technical Blog Platform

Visitors can:

* Browse published articles
* Read technical tutorials
* View individual posts
* Subscribe to newsletters

The frontend dynamically loads content from AWS DynamoDB through the backend API.

---

## Administrative Dashboard

The admin panel provides a content management workflow.

Administrators can:

* Review drafts
* Edit articles
* Upload cover images
* Publish articles
* Delete posts
* Manage content lifecycle

Publishing changes article status from:

```text
Draft
   ↓
Published
```

making the content immediately available to public users.

---

## Newsletter Subscription System

Visitors can subscribe to updates.

The backend stores subscriber information in DynamoDB and provides a foundation for future newsletter automation.

Workflow:

```text
Visitor
   ↓
Subscribe
   ↓
API
   ↓
DynamoDB
   ↓
Subscriber Database
```

---

# AI Agent Architecture

The AI subsystem is implemented in Python and designed to operate through scheduled GitHub Actions workflows.

The agent uses:

* CrewAI
* Groq LLM
* Crawl4AI
* Boto3
* GitHub APIs

Responsibilities include:

### Topic Discovery

Identifies relevant repositories and technologies.

Examples:

* AI agents
* Cloud infrastructure
* Developer tools
* Open-source frameworks

---

### Content Generation

The agent generates:

* Titles
* Technical explanations
* Tutorials
* Blog content
* Newsletter summaries

Content is written in Markdown and formatted for publication.

---

### Duplicate Prevention

Before creating content, the agent checks previously published repositories and topics.

This prevents generating duplicate articles on the same repository.

---

### Draft Creation

Generated posts are automatically stored in DynamoDB with a status of:

```json
{
  "status": "draft"
}
```

allowing human review before publication.

---

# Backend Architecture

The backend is implemented using Node.js and Express.

Responsibilities include:

* Content retrieval
* Draft management
* Publishing workflows
* Subscriber management
* Image uploads
* Administrative authorization

---

## Public API Endpoints

### Get Published Posts

```http
GET /api/posts
```

Returns all published articles.

---

### Get Single Post

```http
GET /api/posts/:id
```

Returns an individual article.

---

### Subscribe

```http
POST /api/subscribe
```

Adds a subscriber to the newsletter database.

---

## Administrative Endpoints

Protected by admin authentication.

### Upload Image

```http
POST /api/upload-image
```

Uploads images to AWS S3.

---

### Retrieve Drafts

```http
GET /api/drafts
```

Returns unpublished content.

---

### Publish Draft

```http
PUT /api/publish/:id
```

Changes a draft into a published article.

---

# Cloud Infrastructure

The platform is designed around AWS serverless services.

## DynamoDB

Used for:

* Blog posts
* Drafts
* Published content
* Subscriber records

Benefits:

* Fully managed
* Scalable
* Serverless

---

## Amazon S3

Used for:

* Cover images
* Uploaded assets
* Content media

Benefits:

* Durable object storage
* Global accessibility
* Low operational overhead

---

# Content Lifecycle

```text
GitHub Actions Trigger
           ↓
Python Agent Executes
           ↓
Repository Research
           ↓
AI Generates Article
           ↓
Draft Stored In DynamoDB
           ↓
Admin Reviews Draft
           ↓
Admin Publishes Article
           ↓
Public Blog Displays Content
```

---

# Security

## Administrative Authorization

Administrative routes require a secure admin token.

Protected actions include:

* Publishing content
* Editing drafts
* Uploading images
* Deleting posts

---

## Environment Variable Management

Sensitive values are stored through environment variables.

Examples:

* AWS Credentials
* Groq API Keys
* Admin Tokens
* GitHub Tokens

---

## Access Separation

The system separates:

```text
Public Access
```

from

```text
Administrative Access
```

ensuring visitors cannot modify content.

---

# Technology Stack

## Frontend

* React
* JavaScript
* CSS

## Backend

* Node.js
* Express

## AI

* CrewAI
* Groq
* Crawl4AI

## Cloud

* AWS DynamoDB
* AWS S3

## Automation

* GitHub Actions

## Infrastructure

* Serverless Architecture

---

# Learning Outcomes

This project provided experience with:

* AI agent development
* Autonomous content generation
* AWS cloud services
* DynamoDB data modeling
* Object storage with S3
* Backend API development
* React frontend development
* CI/CD automation
* GitHub Actions workflows
* LLM integration
* Serverless architecture
* Technical content automation

---

# Future Improvements

Potential future enhancements include:

* Multi-agent research pipelines
* AI-powered content fact checking
* SEO optimization
* Newsletter automation
* Content recommendation engine
* Multi-author support
* Analytics dashboard
* Scheduled publishing
* Citation verification
* Semantic search

---

TecBlogAI demonstrates how AI agents, cloud infrastructure, and modern web development can be combined to automate technical content creation while maintaining human review and editorial control.
