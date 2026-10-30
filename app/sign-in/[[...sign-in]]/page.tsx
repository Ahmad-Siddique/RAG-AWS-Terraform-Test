import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-96 w-full max-w-md" />}>
        <SignIn />
      </Suspense>
    </div>
  );
}
