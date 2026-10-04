import { redirect } from 'next/navigation';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  redirect(token ? `/?token=${encodeURIComponent(token)}` : '/');
}
