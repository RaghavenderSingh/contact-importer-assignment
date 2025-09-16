"use client";

import { useState, useCallback } from "react";
import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileProcessingService,
  ParsedFileData,
} from "../../lib/file-processing";
import {
  FieldMappingService,
  FieldDetectionResult,
} from "../../lib/field-mapping";
import { FileUpload } from "./FileUpload";
import AIColumnDetectionStep from "./AIColumnDetectionStep";
import FieldMappingStep from "./FieldMappingStep";
import SmartFieldMappingStep from "./SmartFieldMappingStep";
import ImportProcessingStep from "./ImportProcessingStep";
import ImportSummaryStep from "./ImportSummaryStep";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Stepper, { StepperStep } from "@/components/ui/stepper";
import Image from "next/image";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStepType =
  | "upload"
  | "detection"
  | "mapping"
  | "smart_mapping"
  | "processing"
  | "summary";

interface ImportState {
  step: ImportStepType;
  fileData: ParsedFileData | null;
  fieldMappings: FieldDetectionResult[];
  importResults: {
    imported: number;
    merged: number;
    errors: number;
    errorDetails: any[];
  } | null;
  error: string | null;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [state, setState] = useState<ImportState>({
    step: "upload",
    fileData: null,
    fieldMappings: [],
    importResults: null,
    error: null,
  });

  const fieldMappingService = new FieldMappingService();

  const resetModal = useCallback(() => {
    setState({
      step: "upload",
      fileData: null,
      fieldMappings: [],
      importResults: null,
      error: null,
    });
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleFileUpload = async (file: File) => {
    console.log("handleFileUpload called with file:", file);
    try {
      setState((prev) => ({ ...prev, error: null }));
      console.log("Cleared error state");

      console.log("Starting file validation...");
      const validation = FileProcessingService.validateFile(file);
      console.log("File validation result:", validation);

      if (!validation.valid) {
        console.log("File validation failed:", validation.error);
        setState((prev) => ({
          ...prev,
          error: validation.error || "Invalid file",
        }));
        return;
      }

      console.log("File validation passed, starting file parsing...");
      const fileData = await FileProcessingService.parseFile(file, {
        maxRows: 1000,
        skipEmptyRows: true,
        trimWhitespace: true,
      });
      console.log("File parsing completed successfully:", fileData);

      console.log("Updating state to detection step...");
      setState((prev) => ({
        ...prev,
        step: "detection",
        fileData,
      }));
      console.log("State updated successfully");
    } catch (error) {
      console.error("Error in handleFileUpload:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to process file",
      }));
    }
  };

  const handleAIDetectionComplete = (mappings: FieldDetectionResult[]) => {
    console.log("handleAIDetectionComplete called with mappings:", mappings);
    setState((prev) => ({
      ...prev,
      step: "mapping",
      fieldMappings: mappings,
    }));
    console.log("State updated to mapping step");
  };

  const handleFieldMappingComplete = (mappings: FieldDetectionResult[]) => {
    setState((prev) => ({
      ...prev,
      step: "smart_mapping",
      fieldMappings: mappings,
    }));
  };

  const handleSmartMappingComplete = (mappings: FieldDetectionResult[]) => {
    setState((prev) => ({
      ...prev,
      step: "processing",
      fieldMappings: mappings,
    }));
  };

  const handleFieldMappingsChange = useCallback(
    (mappings: FieldDetectionResult[]) => {
      setState((prev) => ({
        ...prev,
        fieldMappings: mappings,
      }));
    },
    []
  );

  const handleProcessingComplete = (results: any) => {
    setState((prev) => ({
      ...prev,
      step: "summary",
      importResults: results,
    }));
  };

  const handleProcessingError = (error: string) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  };

  const handleImportSuccess = () => {
    onSuccess();
    handleClose();
  };

  const getStepperSteps = (): StepperStep[] => {
    const stepIds = ["detection", "smart_mapping", "processing"];
    const currentStepIndex = getCurrentStepIndex();

    return stepIds.map((stepId, index) => {
      let state: "complete" | "current" | "pending";

      if (index < currentStepIndex) {
        state = "complete";
      } else if (index === currentStepIndex) {
        state = "current";
      } else {
        state = "pending";
      }

      const stepConfig = {
        detection: {
          heading: "Detect Fields",
          subtext: "Review data structure",
        },
        smart_mapping: {
          heading: "Map Fields",
          subtext: "Connect to CRM Fields",
        },
        processing: {
          heading: "Final Checks",
          subtext: "For Duplicates or Errors",
        },
      };

      return {
        state,
        stepCount: index + 1,
        heading: stepConfig[stepId as keyof typeof stepConfig].heading,
        subtext: stepConfig[stepId as keyof typeof stepConfig].subtext,
      };
    });
  };

  const getCurrentStepIndex = () => {
    const stepIds = ["detection", "smart_mapping", "processing"];
    return stepIds.findIndex((stepId) => stepId === state.step);
  };

  const getStepProgress = () => {
    const totalSteps = 3;
    return ((getCurrentStepIndex() + 1) / totalSteps) * 100;
  };

  const getStepTitle = () => {
    const stepTitles = {
      upload: "Move Entry to Contact Section",
      detection: "Detect Contact Fields",
      mapping: "Column Detection Results",
      smart_mapping: "Map Fields",
      processing: "Final Checks",
      summary: "Import Complete",
    };
    return stepTitles[state.step] || "Import Contacts";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-[12px] overflow-hidden flex flex-col p-1 bg-[#FDFDFD] border-0 shadow-none">
        <DialogTitle className="sr-only">{getStepTitle()}</DialogTitle>
        <DialogDescription className="sr-only">
          Import contacts from CSV or Excel files with smart field mapping
        </DialogDescription>
        <div className="w-full h-full rounded-[8px] border border-black/10 bg-[#FDFDFD] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 ">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-[#E8F4F9] rounded-[8px]">
                <Image
                  src="/Vector.svg"
                  alt="Import Icon"
                  width={22}
                  height={20}
                  className="text-[#E8F4F9]"
                />
              </div>
              <div>
                <h2 className="text-[18px] font-medium text-[#0C5271] leading-[100%] tracking-[0%]">
                  {getStepTitle()}
                </h2>
                <p className="text-sm text-[#89A6B2]">
                  Step {getCurrentStepIndex() + 1} of 3
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-[8px] transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <Stepper steps={getStepperSteps()} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <AnimatePresence mode="wait">
                  {state.error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[8px] mx-6 mt-6"
                    >
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800 font-medium">
                            {state.error}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    key={state.step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {state.step === "upload" && (
                      <FileUpload
                        onFileUpload={handleFileUpload}
                        error={state.error}
                        maxFiles={5}
                        maxSize={10 * 1024 * 1024}
                        acceptedTypes={[".csv", ".xlsx", ".xls"]}
                      />
                    )}

                    {state.step === "detection" && state.fileData && (
                      <AIColumnDetectionStep
                        fileData={state.fileData}
                        onComplete={handleAIDetectionComplete}
                        onBack={() =>
                          setState((prev) => ({ ...prev, step: "upload" }))
                        }
                      />
                    )}

                    {state.step === "mapping" && state.fileData && (
                      <FieldMappingStep
                        fileData={state.fileData}
                        initialMappings={state.fieldMappings}
                        onComplete={handleFieldMappingComplete}
                        onBack={() =>
                          setState((prev) => ({ ...prev, step: "detection" }))
                        }
                        onMappingsChange={handleFieldMappingsChange}
                      />
                    )}

                    {state.step === "smart_mapping" && state.fileData && (
                      <SmartFieldMappingStep
                        fileData={state.fileData}
                        initialMappings={state.fieldMappings}
                        onComplete={handleSmartMappingComplete}
                        onBack={() =>
                          setState((prev) => ({ ...prev, step: "mapping" }))
                        }
                        onMappingsChange={handleFieldMappingsChange}
                      />
                    )}

                    {state.step === "processing" && state.fileData && (
                      <ImportProcessingStep
                        fileData={state.fileData}
                        fieldMappings={state.fieldMappings}
                        onComplete={handleProcessingComplete}
                        onError={handleProcessingError}
                        onBack={() =>
                          setState((prev) => ({ ...prev, step: "mapping" }))
                        }
                      />
                    )}

                    {state.step === "summary" && state.importResults && (
                      <ImportSummaryStep
                        results={state.importResults}
                        onClose={handleClose}
                        onImportMore={() => resetModal()}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <button
              onClick={handleClose}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-4">
              {state.step !== "upload" && state.step !== "summary" && (
                <button
                  onClick={() => {
                    if (state.step === "detection") {
                      setState((prev) => ({ ...prev, step: "upload" }));
                    } else if (state.step === "mapping") {
                      setState((prev) => ({ ...prev, step: "detection" }));
                    } else if (state.step === "smart_mapping") {
                      setState((prev) => ({ ...prev, step: "mapping" }));
                    } else if (state.step === "processing") {
                      setState((prev) => ({ ...prev, step: "smart_mapping" }));
                    }
                  }}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button>
              )}

              {state.step !== "summary" && (
                <button
                  onClick={() => {
                    if (state.step === "upload") {
                    } else if (state.step === "detection") {
                    } else if (state.step === "mapping") {
                      handleFieldMappingComplete(state.fieldMappings);
                    } else if (state.step === "smart_mapping") {
                      handleSmartMappingComplete(state.fieldMappings);
                    } else if (state.step === "processing") {
                    }
                  }}
                  disabled={
                    state.step === "upload" ||
                    state.step === "detection" ||
                    (state.step === "mapping" &&
                      !state.fieldMappings.some(
                        (m) =>
                          m.suggestedField &&
                          m.suggestedField !== "new_custom_field"
                      )) ||
                    (state.step === "smart_mapping" &&
                      !state.fieldMappings.some(
                        (m) =>
                          m.suggestedField &&
                          m.suggestedField !== "new_custom_field"
                      )) ||
                    state.step === "processing"
                  }
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0E4259] hover:bg-[#0a3447] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E4259] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
