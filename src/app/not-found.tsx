import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo variant="mark" href={null} className="h-10" />
      <h1 className="text-2xl font-semibold text-brand-text">Page not found</h1>
      <p className="max-w-sm text-brand-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/">Go to Estimator</Link>
      </Button>
    </div>
  );
}
