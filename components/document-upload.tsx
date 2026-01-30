"use client"

import { UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  isProcessing: boolean
  onClear: () => void
}

export function DocumentUpload({
  onFileSelect,
  selectedFile,
  isProcessing,
  onClear,
}: Props) {
  return (
    <div className="space-y-4">

      <label
        htmlFor="doc-upload"
        className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition"
      >
        <UploadCloud className="h-10 w-10 mb-3 text-muted-foreground" />

        <p className="font-medium">
          Click to upload or drag file
        </p>

        <p className="text-sm text-muted-foreground mt-1">
          PDF, JPG, PNG supported
        </p>

        <input
          id="doc-upload"
          type="file"
          accept=".pdf,image/*"
          disabled={isProcessing}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />
      </label>

      {/* File Preview Block */}

      {selectedFile && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">

          <div className="flex items-center justify-between">

            <div className="space-y-1">

              <p className="text-sm font-medium">
                {selectedFile.name}
              </p>

              {/* File Type Badge */}

              {selectedFile.type === "application/pdf" && (
                <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  📄 PDF Document
                </span>
              )}

              {selectedFile.type.startsWith("image/") && (
                <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  🖼 Image File
                </span>
              )}

            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>

          </div>

          {/* Image Preview */}

          {selectedFile.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(selectedFile)}
              className="max-h-56 rounded border"
            />
          )}

        </div>
      )}

    </div>
  )
}
