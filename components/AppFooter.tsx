import Link from "next/link";

function truncateApiHost(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const host = new URL(trimmed).host;
    if (host.length <= 48) return host;
    return `${host.slice(0, 45)}…`;
  } catch {
    if (trimmed.length <= 48) return trimmed;
    return `${trimmed.slice(0, 45)}…`;
  }
}

export function AppFooter() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiHost = apiUrl ? truncateApiHost(apiUrl) : null;

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-[0.6875rem] text-slate-600">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>AskMyDocs · dev</span>
          {apiHost ? (
            <>
              <span aria-hidden="true">·</span>
              <span title={apiUrl}>API {apiHost}</span>
            </>
          ) : null}
        </div>
        <Link
          href="/DEPLOY.md"
          className="text-slate-500 underline-offset-2 transition-colors hover:text-cyan-400/90"
        >
          Deploy guide
        </Link>
      </div>
    </footer>
  );
}
