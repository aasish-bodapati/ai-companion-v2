"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function DocumentsPage() {
  useEffect(() => {
    redirect("/chat");
  }, []);
  return null;
}
