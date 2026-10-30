"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={
        active
          ? "text-cyan-400/95"
          : "text-slate-500 transition-colors hover:text-slate-200"
      }
    >
      {label}
    </Link>
  );
}

export function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-slate-100"
          >
            AskMyDocs
          </Link>
          <Show when="signed-in">
            <nav className="flex items-center gap-5 text-sm">
              <NavLink href="/documents" label="Documents" />
              <NavLink href="/chat" label="Chat" />
            </nav>
          </Show>
        </div>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </Show>
      </div>
    </header>
  );
}
