"use client";

import { useEffect } from "react";

export default function Base() {
  useEffect(() => {
    window.location.href =
      "https://www.blinkcreativestudio.com/Species-Advancement-Tech-Forum";
  }, []);

  return null; // or a loading spinner if needed
}

