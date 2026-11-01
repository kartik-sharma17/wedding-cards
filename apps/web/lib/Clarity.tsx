"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityAnalytics() {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_ID;

    if (projectId) {
      Clarity.init(projectId);
    }
  }, []);

  return null;
}