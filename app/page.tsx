"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getConfig } from "@/lib/config";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getConfig().then((config) => {
      if (config) {
        router.replace("/calendar");
      } else {
        router.replace("/setup");
      }
    });
  }, [router]);

  return null;
}
