import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use email magic link to access your account.
        </p>
      </div>
      <form action="/api/auth/signin/email" method="post" className="space-y-4">
        <input
          className="h-10 w-full rounded-md border border-input px-3 text-sm"
          type="email"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Button type="submit" className="w-full">
          Send magic link
        </Button>
      </form>
    </div>
  );
}
