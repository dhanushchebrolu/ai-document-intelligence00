"use client"

import { useState, useCallback } from "react"
import { DocumentUpload } from "@/components/document-upload"
import { ExtractedResults, type ExtractedData } from "@/components/extracted-results"
import { ProcessingStatus, type ProcessingStep } from "@/components/processing-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Sparkles, Shield, Zap, RotateCcw } from "lucide-react"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [rawText, setRawText] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    setError(null)
    setExtractedData(null)
    setRawText("")
    setIsProcessing(true)
    setProcessingStep("uploading")

    try {
      await new Promise((r) => setTimeout(r, 400))
      setProcessingStep("extracting")

      await new Promise((r) => setTimeout(r, 400))
      setProcessingStep("analyzing")

      const formData = new FormData()
      formData.append("file", file)

      /* 🔥 CONNECTED TO YOUR FASTAPI BACKEND */
      const response = await fetch("http://localhost:8001/process-document", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Processing failed")
      }

      setProcessingStep("complete")
      await new Promise((r) => setTimeout(r, 400))

      setExtractedData(result.extracted_data)
      setRawText(result.raw_text_preview)

      /* 🚫 Show warning if not license */
      if (
        result.document_type &&
        !result.document_type.toLowerCase().includes("driving")
      ) {
        setError("Uploaded document is not a Driving License")
      }

    } catch (err: any) {
      setError(err.message)
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
        {!extractedData && !isProcessing && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">
              Extract Information from Driving Licenses
            </h2>
            <p className="text-muted-foreground mt-3">
              OCR + Self-Hosted LLM Processing
            </p>
          </div>
        )}

        {/* Feature Cards */}
        {!extractedData && !isProcessing && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">

            <Card><CardContent className="p-4 flex gap-3">
              <Sparkles className="text-primary"/>
              <div>
                <p className="font-medium">AI-Powered</p>
                <p className="text-xs text-muted-foreground">
                  LLM extraction
                </p>
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-4 flex gap-3">
              <Zap className="text-primary"/>
              <div>
                <p className="font-medium">Fast</p>
                <p className="text-xs text-muted-foreground">
                  Seconds response
                </p>
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-4 flex gap-3">
              <Shield className="text-primary"/>
              <div>
                <p className="font-medium">Secure</p>
                <p className="text-xs text-muted-foreground">
                  No storage
                </p>
              </div>
            </CardContent></Card>

          </div>
        )}

        {/* Upload Card */}
        {!extractedData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                PDF or Image supported
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
        )}

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
