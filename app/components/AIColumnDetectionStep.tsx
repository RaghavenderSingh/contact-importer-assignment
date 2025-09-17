"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ParsedFileData } from "../../lib/file-processing";
import {
  FieldDetectionResult,
  FieldMappingService,
} from "../../lib/field-mapping";
import GridBackground from "../../components/ui/grid-background";
import Image from "next/image";

interface AIColumnDetectionStepProps {
  fileData: ParsedFileData;
  onComplete: (mappings: FieldDetectionResult[]) => void;
}

export default function AIColumnDetectionStep({
  fileData,
  onComplete,
}: AIColumnDetectionStepProps) {
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getFallbackFieldMapping = (header: string): string => {
    const normalized = header.toLowerCase();
    if (normalized.includes("first") || normalized.includes("given"))
      return "firstName";
    if (
      normalized.includes("last") ||
      normalized.includes("family") ||
      normalized.includes("surname")
    )
      return "lastName";
    if (normalized.includes("email") || normalized.includes("mail"))
      return "email";
    if (
      normalized.includes("phone") ||
      normalized.includes("mobile") ||
      normalized.includes("cell")
    )
      return "phone";
    if (normalized.includes("company") || normalized.includes("organization"))
      return "company";
    return "new_custom_field";
  };

  const detectBasicDataType = (sampleData: string[]): string => {
    if (sampleData.length === 0) return "text";

    const samples = sampleData.slice(0, 5);
    if (samples.every((sample) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sample))) {
      return "email";
    }
    if (
      samples.every((sample) =>
        /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{10,}$/.test(
          sample.replace(/[\s\-\(\)]/g, "")
        )
      )
    ) {
      return "phone";
    }
    if (samples.every((sample) => /^\d+(\.\d+)?$/.test(sample))) {
      return "number";
    }

    return "text";
  };

  useEffect(() => {
    const analyzeFields = async () => {
      try {
        setError(null);
        setIsAnalyzing(true);
        setProgress(0);

        const fieldMappingService = new FieldMappingService();

        const progressSteps = [
          { step: "Loading field patterns...", progress: 20 },
          { step: "Analyzing column headers...", progress: 40 },
          { step: "Matching data patterns...", progress: 60 },
          { step: "Calculating confidence scores...", progress: 80 },
          { step: "Finalizing mappings...", progress: 100 },
        ];

        for (const { progress: stepProgress } of progressSteps) {
          setProgress(stepProgress);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("Starting field mapping analysis...");
        console.log("Headers:", fileData.headers);
        console.log("Sample data:", fileData.rows.slice(0, 3));

        let mappings;
        try {
          mappings = await fieldMappingService.analyzeFileHeaders(
            fileData.headers,
            fileData.rows.slice(0, 10)
          );
        } catch (serviceError) {
          console.warn(
            "FieldMappingService failed, using fallback:",
            serviceError
          );
          mappings = fileData.headers.map((header, index) => {
            const sampleData = fileData.rows
              .slice(0, 5)
              .map((row) => row[index])
              .filter(Boolean);
            const dataType = detectBasicDataType(sampleData);
            const suggestedField = getFallbackFieldMapping(header);
            const isCustomField = suggestedField === "new_custom_field";

            return {
              columnName: header,
              suggestedField: suggestedField,
              confidence: 60,
              dataType: dataType,
              sampleData: sampleData.slice(0, 5),
              isCustomField: isCustomField,
              customFieldConfig: isCustomField
                ? {
                    label: header,
                    fieldName: header.toLowerCase().replace(/[^a-z0-9]/g, "_"),
                    type: dataType as
                      | "text"
                      | "number"
                      | "phone"
                      | "email"
                      | "datetime"
                      | "checkbox",
                    core: false,
                  }
                : undefined,
            };
          });
        }

        console.log("Field mapping results:", mappings);

        setProgress(100);
        setIsAnalyzing(false);

        console.log("Calling onComplete with mappings:", mappings);
        onComplete(mappings);
        console.log("onComplete called successfully");
      } catch (err) {
        console.error("Field mapping analysis failed:", err);
        setError("Failed to analyze field mappings. Please try again.");
        setIsAnalyzing(false);
      }
    };

    analyzeFields();
  }, [fileData, onComplete]);

  return (
    <div className="bg-white min-h-[400px] space-y-4 p-4">
      <div className="text-left">
        <h3 className="text-[18px] font-semibold text-[#0E4259] mb-2 leading-none">
          AI Column Detection...
        </h3>
        <p className="text-[16px] text-[#68818C] leading-[1.2]">
          {error
            ? "Analysis failed. Please try again."
            : `Analyzing ${fileData.headers.length} columns and matching with CRM fields using AI...`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {!error && (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-lg h-64 mx-auto">
            <GridBackground className="absolute inset-0 w-full h-full" />

            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div
                className="bg-blue-50 flex items-center justify-center"
                style={{
                  width: "108.38px",
                  height: "108.38px",
                  borderRadius: "18.02px",
                  padding: "22.65px",
                }}
              >
                <Image
                  src="/sparkles.svg"
                  alt="Sparkles"
                  width={49}
                  height={60}
                  style={{
                    width: "48.84px",
                    height: "60.21px",
                  }}
                />
              </div>
            </div>
          </div>
          <motion.div
            className="text-center"
            animate={{ opacity: isAnalyzing ? [0.7, 1, 0.7] : 1 }}
            transition={{
              duration: 1.5,
              repeat: isAnalyzing ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <h3 className="text-base font-semibold text-[#5883C9] mb-1">
              {isAnalyzing
                ? "Auto Detecting Field Mapping..."
                : "Analysis Complete!"}
            </h3>
            <p className="text-xs text-[#7782AD] leading-relaxed whitespace-nowrap">
              {isAnalyzing
                ? "Matching spreadsheets columns to CRM fields using intelligent pattern recognition..."
                : "Field mappings have been detected successfully."}
            </p>
          </motion.div>
          <div className="flex justify-center">
            <div
              className="bg-[#EEF4FF] rounded-full"
              style={{
                width: "294px",
                height: "22px",
                borderRadius: "100px",
                paddingTop: "7px",
                paddingRight: "8px",
                paddingBottom: "7px",
                paddingLeft: "8px",
              }}
            >
              <motion.div
                className="bg-[#5883C9] rounded-full"
                style={{
                  height: "8px",
                  borderRadius: "100px",
                }}
                initial={{ width: "0px" }}
                animate={{ width: `${Math.min(progress, 100) * 2.78}px` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
