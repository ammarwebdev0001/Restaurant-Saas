/** Matches Next.js 15 App Router page props (async params / searchParams). */
export type PageProps = {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};
