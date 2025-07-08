// app/onsite/page.tsx
"use client";

import React, { Suspense } from "react";
import RegisterPage from "./Register";

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div>Loading verification status...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
