import { redirect } from "@/lib/i18n/routing";

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/docs/getting-started', locale });
}
