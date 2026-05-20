"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BoxerSearchPlayArea } from "~/components/BoxerSearchResults";
import { RingdleGame } from "~/components/RingdleGame";
import { Button } from "~/components/retroui/Button";
import { formatArchiveLabel, isValidArchiveDate } from "~/lib/ringdleGame";

export default function ArchivePage() {
  const params = useParams();
  const router = useRouter();
  const date = typeof params.date === "string" ? params.date : "";

  useEffect(() => {
    if (!isValidArchiveDate(date)) {
      router.replace("/");
    }
  }, [date, router]);

  if (!isValidArchiveDate(date)) {
    return null;
  }

  // return the archive page
  return (
    // main container for the archive page
    <div className="mt-8 flex w-full flex-col items-center justify-center gap-8 px-4 sm:px-6 md:mt-16 md:gap-16">
      <header className="relative w-full">
        <div className="mb-2 flex justify-end sm:absolute sm:top-0 sm:right-0 sm:mb-0">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground py-1 text-sm font-medium underline-offset-4 hover:underline sm:hidden"
          >
            Home
          </Link>
          <Button variant="outline" size="md" asChild className="hidden sm:inline-flex">
            <Link href="/">Home</Link>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-primary text-5xl font-extrabold tracking-tight sm:text-7xl">
            Ringdle
          </h1>
          <p className="text-muted-foreground mt-2 text-base tracking-widest uppercase sm:text-lg">
            Archive · {formatArchiveLabel(date)}
          </p>
        </div>
      </header>

      <RingdleGame key={date} mode="archive" playedDate={date}>
        <BoxerSearchPlayArea />
      </RingdleGame>
    </div>
  );
}
