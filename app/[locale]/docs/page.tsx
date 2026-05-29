import { redirect } from "@/lib/i18n/routing";

export default async function DocsPage({ params }: { params: { locale: string } }) {
  const resolvedParams = await Promise.resolve(params);
  redirect({ href: '/docs/getting-started', locale: resolvedParams.locale });
}
