"use client"

import { useState, useCallback } from "react"
import { DocumentUpload } from "@/components/document-upload"
import { ExtractedResults, type ExtractedData } from "@/components/extracted-results"
import { ProcessingStatus, type ProcessingStep } from "@/components/processing-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, RotateCcw } from "lucide-react"

const API_URL = "https://ai-document-intelligence00-production.up.railway.app"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [rawText, setRawText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    setError(null)
    setExtractedData(null)
    setRawText("")
    setIsProcessing(true)
    setProcessingStep("uploading")

    try {
      await new Promise(r => setTimeout(r, 250))
      setProcessingStep("extracting")

      await new Promise(r => setTimeout(r, 250))
      setProcessingStep("analyzing")

      const formData = new FormData()
      formData.append("file", file)

      // ✅ timeout protection
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(id)

      let result: any = {}
      try {
        result = await response.json()
      } catch {
        throw new Error("Invalid server response")
      }

      console.log("API RESULT =", result)

      if (!response.ok || result.error) {
        throw new Error(result.error || "Processing failed")
      }

      const d = result.extracted_data ?? {}

      // ✅ robust mapping
      const mapped: ExtractedData = {
        name: d.name ?? "-",
        dob: d.date_of_birth ?? d.dob ?? "-",
        license_number: d.license_number ?? "-",
        issue_date: d.issue_date ?? "-",
        expiry_date: d.expiry_date ?? "-",
        address: d.address ?? "-",
        document_type: d.document_type ?? "-",
      }

      console.log("MAPPED DATA =", mapped)

      setExtractedData(mapped)
      setRawText(result.raw_text_preview ?? "")

      setProcessingStep("complete")
      await new Promise(r => setTimeout(r, 300))

    } catch (err: any) {
      console.error("PROCESS ERROR:", err)
      setError(err.message || "Processing failed")
    } finally {
      setIsProcessing(false)
      setProcessingStep(null)
    }
  }, [])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setExtractedData(null)
    setRawText("")
    setError(null)
    setIsProcessing(false)
    setProcessingStep(null)
  }, [])

  return (
    <main className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">DocAI</h1>
              <p className="text-sm text-muted-foreground">
                Document Intelligence System
              </p>
            </div>
          </div>
          <Badge>MVP v1.0</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">
            Extract Information from Driving Licenses
          </h2>
          <p className="text-muted-foreground mt-3">
            OCR + AI Structured Extraction
          </p>
        </div>

        {/* Upload */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              JPG supported (OCR enabled)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              selectedFile={selectedFile}
              onClear={handleClear}
            />
          </CardContent>
        </Card>

        {/* Processing */}
        {isProcessing && processingStep && (
          <ProcessingStatus currentStep={processingStep} />
        )}

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardContent className="p-4">
              ❌ {error}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {extractedData && (
          <>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                Extraction Results
              </h2>

              <Button onClick={handleClear} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2"/>
                New Document
              </Button>
            </div>

            <ExtractedResults
              data={extractedData}
              rawText={rawText}
            />
          </>
        )}

      </div>
    </main>
  )
}
