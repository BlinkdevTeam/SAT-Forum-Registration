import React, { Suspense } from "react";
import QRDownloadClient from "./QRDownloadClient";

export default function QRDownloadPage() {
  return (
    <Suspense fallback={<div>Loading QR code...</div>}>
      <QRDownloadClient />
    </Suspense>
  );
}
