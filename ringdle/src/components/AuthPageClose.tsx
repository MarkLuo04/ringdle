import Link from "next/link";
import { Button } from "@/components/retroui/Button";

export function AuthPageClose() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/" aria-label="Close">
        ✕
      </Link>
    </Button>
  );
}
