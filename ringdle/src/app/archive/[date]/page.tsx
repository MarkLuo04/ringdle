"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BoxerSearchPlayArea } from "~/components/BoxerSearchResults";
import { RingdleGame } from "~/components/RingdleGame";
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
      <header className="relative w-full text-center">
        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm underline"
          >
            Home
          </Link>
        </div>

        <h1 className="text-primary text-5xl font-extrabold tracking-tight sm:text-7xl">
          Ringdle
        </h1>
        <p className="text-muted-foreground mt-2 text-base tracking-widest uppercase sm:text-lg">
          Archive · {formatArchiveLabel(date)}
        </p>
      </header>

      <RingdleGame key={date} mode="archive" playedDate={date}>
        <BoxerSearchPlayArea />
      </RingdleGame>
    </div>
  );
}
