"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Toast, useToast } from "@/components/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { uploadFile, addUploadToMemory, type UploadOut } from "@/features/uploads/api";
import { UPLOAD_CATEGORIES } from "@/features/uploads/constants";

export default function UploadsPage() {
  const { toast, show, hide } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploaded, setUploaded] = useState<UploadOut | null>(null);
  const [category, setCategory] = useState<string>(UPLOAD_CATEGORIES[0].value);
  const [importance, setImportance] = useState<number>(0.9);
  const [consolidate, setConsolidate] = useState<boolean>(true);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    const kb = Math.round(file.size / 1024);
    return `${file.name} • ${kb} KB • ${file.type || "unknown"}`;
  }, [file]);

  async function onUpload() {
    if (!file) {
      show("Select a file first", "error");
      return;
    }
    try {
      setBusy(true);
      const up = await uploadFile(file);
      setUploaded(up);
      show(`Uploaded ${up.filename}`, "success");
    } catch (e: any) {
      show(`Upload failed: ${String(e?.message || e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onAddToMemory() {
    if (!uploaded) {
      show("Upload a file first", "error");
      return;
    }
    try {
      setBusy(true);
      await addUploadToMemory(uploaded.upload_id, { category, importance, consolidate });
      show(`Added to memory: ${category} • importance ${importance.toFixed(2)}`, "success");
    } catch (e: any) {
      show(`Add to memory failed: ${String(e?.message || e)}`, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={hide} />
      )}
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Uploads</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Upload reports or plans and add them to memory for contextual retrieval in chat.</p>
      </header>

      <Card className="p-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload a file</div>
              <div className="text-xs text-gray-500">PDF, image, or text. Max size depends on server limits.</div>
            </div>
            <Link href="/today" className="text-xs text-indigo-600 hover:underline">Back to Today</Link>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={busy}
                className="block w-full text-sm text-gray-800 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {fileInfo && <div className="mt-2 text-xs text-gray-500">{fileInfo}</div>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onUpload}
                disabled={busy || !file}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Working…" : "Upload"}
              </button>
              {uploaded && (
                <span className="text-xs text-gray-500">Uploaded: {uploaded.filename}</span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="h-4" />

      <Card className="p-0">
        <CardHeader>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Add to Memory</div>
          <div className="text-xs text-gray-500">Tag the upload so the assistant retrieves it in context.</div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white/70 dark:bg-gray-900/40 p-2 text-sm"
                disabled={busy}
              >
                {UPLOAD_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Importance ({importance.toFixed(2)})</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={importance}
                onChange={(e) => setImportance(parseFloat(e.target.value))}
                className="w-full"
                disabled={busy}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="consolidate"
                type="checkbox"
                checked={consolidate}
                onChange={(e) => setConsolidate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                disabled={busy}
              />
              <label htmlFor="consolidate" className="text-sm text-gray-700 dark:text-gray-200">Consolidate/summarize</label>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={onAddToMemory}
              disabled={busy || !uploaded}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Working…" : "Add to memory"}
            </button>
            {!uploaded && (
              <div className="mt-2 text-xs text-gray-500">Upload a file first.</div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 text-xs text-gray-500">
        Tips:
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>Use clear categories and higher importance for critical documents (e.g., medical reports).</li>
          <li>No human is involved — uploads and memory are fully automated.</li>
          <li>Ask in chat: <span className="italic">“Use my BMI report from July 2025 to advise my diet and training this month.”</span></li>
        </ul>
      </div>
    </div>
  );
}
