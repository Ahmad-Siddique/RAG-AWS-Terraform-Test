import { Suspense } from "react";
import { HomeCtas } from "@/components/HomeCtas";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <main className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            AskMyDocs
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Upload documents and chat with answers grounded in your files.
          </p>
        </div>

        <Suspense fallback={<div className="h-10" />}>
          <HomeCtas />
        </Suspense>
      </main>
    </div>
  );
}
