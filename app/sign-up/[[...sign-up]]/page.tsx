import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-96 w-full max-w-md" />}>
        <SignUp />
      </Suspense>
    </div>
  );
}
