"use client";

import { useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Disalin");
    } catch {
      setStatus("Gagal menyalin");
    }
  }

  return <span className="west-code"><b>{code}</b><button type="button" onClick={copy} aria-label={`Salin ${code}`}>Salin</button>{status && <small role="status">{status}</small>}</span>;
}
