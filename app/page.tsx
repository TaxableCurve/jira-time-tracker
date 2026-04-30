"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const config = localStorage.getItem("jira_config");
    if (config) {
      router.replace("/calendar");
    } else {
      router.replace("/setup");
    }
  }, [router]);

  return null;
}
