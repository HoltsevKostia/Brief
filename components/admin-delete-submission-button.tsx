"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminDeleteSubmissionButtonProps = {
  submissionId: string;
};

export function AdminDeleteSubmissionButton({ submissionId }: AdminDeleteSubmissionButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    const confirmed = window.confirm("Видалити цю заявку?");
    if (!confirmed) return;

    setIsDeleting(true);
    const response = await fetch(`/api/admin/submissions/${submissionId}`, {
      method: "DELETE",
    });

    setIsDeleting(false);

    if (!response.ok) {
      window.alert("Не вдалося видалити заявку");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isDeleting}
      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 transition hover:bg-red-100 disabled:opacity-60"
    >
      {isDeleting ? "Видалення..." : "Видалити"}
    </button>
  );
}

