# Phase 1: The AWS Vault (Storage & Database)

Do these steps in the **AWS Console** before running the backend with DynamoDB/S3.

---

## 1. Create an AWS Account

- Go to [aws.amazon.com](https://aws.amazon.com) and sign up if you don't have an account.

---

## 2. Create an S3 Bucket

1. Open **S3** in the AWS Console.
2. Click **Create bucket**.
3. **Bucket name:** e.g. `my-tech-blog-assets-2026` (must be globally unique).
4. **Region:** Choose one (e.g. `us-east-1`).
5. **Block Public Access:** **Uncheck** "Block all public access" so images can be read by the blog (or use a bucket policy below).
6. Create the bucket.
7. **Bucket policy (for public read):**  
   Bucket → **Permissions** → **Bucket policy** → Edit and use (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

Save the **bucket name** and **region** for your `.env` (e.g. `S3_BUCKET`, `AWS_REGION`).

---

## 3. Create DynamoDB Tables

### Table 1: BlogPosts

1. Open **DynamoDB** → **Tables** → **Create table**.
2. **Table name:** `BlogPosts`
3. **Partition key:** `PostId` (String).
4. **Table settings:** Default (on-demand or provisioned as you prefer).
5. Create table.

### Table 2: Subscribers

1. **Create table** again.
2. **Table name:** `Subscribers`
3. **Partition key:** `Email` (String).
4. Create table.

Note the **table names** and **region** for `.env` (e.g. `BLOG_POSTS_TABLE`, `SUBSCRIBERS_TABLE`, `AWS_REGION`).

---

## 4. Create IAM User and Access Keys

1. Open **IAM** → **Users** → **Create user**.
2. **User name:** `blog-service-account`
3. **Permissions:** Attach policies directly:
   - `AmazonS3FullAccess`
   - `AmazonDynamoDBFullAccess`
4. Create user.
5. Open the user → **Security credentials** → **Create access key**.
6. Choose **Application running outside AWS** (or CLI) → Next → Create.
7. **Save the Access Key ID and Secret Access Key** somewhere safe (you'll put them in `.env`). You won't see the secret again.

---

## 5. Add to Your Project

In the `api` folder, copy `.env.example` to `.env` and fill in:

- `AWS_ACCESS_KEY_ID` – from the IAM user access key.
- `AWS_SECRET_ACCESS_KEY` – from the IAM user secret key.
- `AWS_REGION` – e.g. `us-east-1` (same as your S3/DynamoDB region).
- `S3_BUCKET` – your S3 bucket name.
- `BLOG_POSTS_TABLE` – `BlogPosts`
- `SUBSCRIBERS_TABLE` – `Subscribers`
- `ADMIN_TOKEN` – a long random string (for `/api/drafts` and `/api/publish/:id`; only you or the agent use it)

After this, you're ready for **Phase 2** (Node backend using DynamoDB and S3).
