"use client"

export type ExtractedData = {
  document_type?: string
  name?: string
  dob?: string
  license_number?: string
  issue_date?: string
  expiry_date?: string
  address?: string
}

export function ExtractedResults({
  data,
  rawText,
}: {
  data: ExtractedData
  rawText: string
}) {

  const notLicense =
    data?.document_type &&
    !data.document_type.toLowerCase().includes("driving")

  return (
    <div className="space-y-6">

      {/* NOT LICENSE WARNING */}

      {notLicense && (
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
          ⚠️ This document does NOT appear to be a Driving License
        </div>
      )}

      {/* Data Grid */}

      <div className="grid sm:grid-cols-2 gap-4">

        <Field label="Name" value={data.name} />
        <Field label="Date of Birth" value={data.dob} />
        <Field label="License Number" value={data.license_number} />
        <Field label="Issue Date" value={data.issue_date} />
        <Field label="Expiry Date" value={data.expiry_date} />
        <Field label="Document Type" value={data.document_type} />

      </div>

      {/* Address */}

      <div>
        <p className="text-sm text-muted-foreground">Address</p>
        <p className="font-medium">{data.address || "-"}</p>
      </div>

      {/* Raw Text Toggle */}

      <details className="border rounded-lg p-4 bg-muted/30">
        <summary className="cursor-pointer font-medium">
          Raw Extracted Text
        </summary>

        <pre className="text-xs mt-3 whitespace-pre-wrap">
          {rawText}
        </pre>
      </details>

    </div>
  )
}

/* ---------- Small Field Component ---------- */

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>
      <p className="font-medium mt-1">
        {value || "-"}
      </p>
    </div>
  )
}
