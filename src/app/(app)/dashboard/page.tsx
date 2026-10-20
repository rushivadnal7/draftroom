import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-lg font-semibold text-zinc-900">Welcome, {user?.name}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Document dashboard — My documents / Shared with me come in the next phase.
      </p>
    </div>
  );
}
