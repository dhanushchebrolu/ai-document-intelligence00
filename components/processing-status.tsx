"use client"

import { Loader2, CheckCircle2, FileSearch, Brain, FileOutput } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type ProcessingStep = "uploading" | "extracting" | "analyzing" | "complete"

interface ProcessingStatusProps {
  currentStep: ProcessingStep
}

const steps = [
  {
    id: "uploading",
    label: "Uploading Document",
    description: "Reading your file...",
    icon: FileSearch,
  },
  {
    id: "extracting",
    label: "Extracting Text",
    description: "Running OCR / PDF parsing...",
    icon: FileSearch,
  },
  {
    id: "analyzing",
    label: "AI Processing",
    description: "Analyzing with LLM...",
    icon: Brain,
  },
  {
    id: "complete",
    label: "Complete",
    description: "Extraction finished!",
    icon: FileOutput,
  },
]

export function ProcessingStatus({ currentStep }: ProcessingStatusProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isComplete = index < currentIndex
            const isCurrent = step.id === currentStep
            const isPending = index > currentIndex

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 transition-opacity duration-200",
                  isPending && "opacity-40"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    isComplete && "bg-green-100 text-green-600",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPending && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium",
                      isComplete && "text-green-600",
                      isCurrent && "text-primary",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
