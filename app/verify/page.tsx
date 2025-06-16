"use client";

import React, { Suspense } from "react";
import VerifyPage from "./VerifyPage";

export default function VerifyPageWrapper() {
  return (
    <Suspense fallback={<div>Loading verification status...</div>}>
      <VerifyPage />
    </Suspense>
  );
}
