This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database

PostgreSQL is used to support concurrent ingestion writes and live UI polling. SQLite caused lock contention under mixed workloads and was intentionally replaced.

### Setup PostgreSQL

1. Install PostgreSQL locally:
   - macOS: `brew install postgresql && brew services start postgresql`
   - Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib && sudo systemctl start postgresql`
   - Windows: Download from https://www.postgresql.org/download/

2. Create database and user:
   ```sql
   psql postgres
   CREATE DATABASE xandeum_analytics;
   CREATE USER xandeum_user WITH PASSWORD 'strongpassword';
   GRANT ALL PRIVILEGES ON DATABASE xandeum_analytics TO xandeum_user;
   \q
   ```

3. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://xandeum_user:strongpassword@localhost:5432/xandeum_analytics"
   ```

4. Run migrations:
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev
   npx prisma generate
   ```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
