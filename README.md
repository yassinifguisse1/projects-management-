This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

This project uses **Bun** as the package manager. Make sure you have Bun installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then run the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Vercel Deployment

This project is configured to use Bun for deployment. The `vercel.json` file ensures that:

1. Bun is installed during the build process
2. Dependencies are installed with `bun install`
3. The build command uses `bun run build`

Simply push your code to your repository and deploy on Vercel. The configuration will automatically handle the Bun setup.

### Manual Deployment

If you need to deploy manually, use the provided deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Important Notes

- **Do not use npm or yarn** - This project requires Bun due to dependency resolution conflicts
- The `bun.lock` file ensures consistent dependency versions
- All deployment configurations are included in the repository

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
