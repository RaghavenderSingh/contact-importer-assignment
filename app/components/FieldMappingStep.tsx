"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Search,
  Target,
  Wrench,
  ArrowRightLeft,
} from "lucide-react";
import { ParsedFileData } from "../../lib/file-processing";
import {
  FieldDetectionResult,
  FieldMappingService,
} from "../../lib/field-mapping";
import { contactFieldService } from "../../lib/collections";
import { ContactField } from "../../types/firestore";

interface FieldMappingStepProps {
  fileData: ParsedFileData;
  initialMappings: FieldDetectionResult[];
  onComplete: (mappings: FieldDetectionResult[]) => void;
  onBack: () => void;
  onMappingsChange?: (mappings: FieldDetectionResult[]) => void;
}

export default function FieldMappingStep({
  fileData,
  initialMappings,
  onComplete,
  onBack,
  onMappingsChange,
}: FieldMappingStepProps) {
  const [mappings, setMappings] =
    useState<FieldDetectionResult[]>(initialMappings);
  const [contactFields, setContactFields] = useState<ContactField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactFields();
  }, []);

  useEffect(() => {
    if (onMappingsChange) {
      onMappingsChange(mappings);
    }
  }, [mappings, onMappingsChange]);

  const loadContactFields = async () => {
    try {
      const fields = await contactFieldService.getFields();
      setContactFields(fields);
    } catch (error) {
      console.error("Failed to load contact fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableFields = () => {
    const coreFields = contactFields.filter((f) => f.core);
    const customFields = contactFields.filter((f) => !f.core);

    return {
      core: coreFields,
      custom: customFields,
      newCustom: {
        label: "Create New Custom Field",
        fieldName: "new_custom_field",
      },
    };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90)
      return "text-[#008D0E] bg-[#B0F0C2] border border-[#B0F0C2] rounded";
    if (confidence >= 70)
      return "text-[#8C5E04] bg-[#FFF8DD] border border-[#F6CD7E] rounded";
    if (confidence >= 50) return "text-orange-600 bg-orange-50 rounded";
    return "text-red-600 bg-red-50 rounded";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return "High";
    if (confidence >= 70) return "Good";
    if (confidence >= 50) return "Medium";
    return "Low";
  };

  const handleContinue = () => {
    onComplete(mappings);
  };

  const canContinue = mappings.some(
    (m) => m.suggestedField && m.suggestedField !== "new_custom_field"
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading field options...</p>
      </div>
    );
  }

  const availableFields = getAvailableFields();
  const highConfidenceCount = mappings.filter((m) => m.confidence >= 90).length;
  const customFieldCount = mappings.filter((m) => m.isCustomField).length;

  return (
    <div className="space-y-8 p-4 max-w-full overflow-hidden">
      <div className="rounded-lg p-2">
        <h2 className="text-[18px] font-semibold text-[#0E4259] mb-3 leading-[100%] tracking-[0%]">
          Column Detection Results
        </h2>
        <p className="text-[#68818C] text-[17px] font-normal mb-6 leading-[120%] tracking-[0%]">
          Our AI has analyzed {mappings.length} columns and suggested field
          mappings. Review the results and proceed to the next step to make any
          adjustments.
        </p>

        <div className="flex gap-4">
          <div className="bg-green-100 border-2 border-green-200 rounded-[12px] px-6 py-3 flex items-center gap-4 h-[48px] flex-1">
            <Search className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-green-600">
                {mappings.length}
              </span>
              <span className="text-sm text-green-600 font-semibold">
                {"Fields Detected"}
              </span>
            </div>
          </div>

          <div className="bg-purple-100 border-2 border-purple-200 rounded-[12px] px-6 py-3 flex items-center gap-4 h-[48px] flex-1">
            <Target className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-purple-600">
                {highConfidenceCount}
              </span>
              <span className="text-sm text-purple-600 font-semibold">
                High Confidence
              </span>
            </div>
          </div>

          <div className="bg-pink-100 border-2 border-pink-200 rounded-[12px] px-6 py-3 flex items-center gap-4 h-[48px] flex-1">
            <Wrench className="w-5 h-5 text-pink-600 flex-shrink-0" />
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-pink-600">
                {customFieldCount}
              </span>
              <span className="text-sm text-pink-600 font-semibold">
                Custom Fields
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6 max-w-full">
        <div className="space-y-3">
          {mappings.map((mapping, index) => (
            <motion.div
              key={mapping.columnName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-[#EEEEEE] rounded-[16px] p-[20px_16px] w-full max-w-4xl h-[98px] flex items-center gap-6"
            >
              <div
                className={`px-2 py-1 text-[12px] font-medium leading-[136%] tracking-[-0.41px] min-w-[25px] h-[16px] flex items-center justify-center ${getConfidenceColor(
                  mapping.confidence
                )}`}
              >
                {mapping.confidence}%
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center gap-6">
                  <span className="text-[20px] font-medium text-[#0E4259] leading-[100%] tracking-[0%]">
                    {mapping.columnName}
                  </span>
                  <img
                    src="/Chain.svg"
                    alt="Link"
                    className="w-4 h-[10px] opacity-100"
                  />
                  <span className="text-[20px] font-medium text-[#1970F3] leading-[100%] tracking-[0%]">
                    {mapping.suggestedField
                      ? availableFields.core.find(
                          (f) => f.fieldName === mapping.suggestedField
                        )?.label ||
                        availableFields.custom.find(
                          (f) => f.fieldName === mapping.suggestedField
                        )?.label ||
                        (mapping.suggestedField === "new_custom_field"
                          ? "New Custom Field"
                          : mapping.suggestedField)
                      : "Select field..."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#556B75] font-normal leading-[100%] tracking-[0%]">
                    Sample
                  </span>
                  {mapping.sampleData.slice(0, 2).map((data, i) => (
                    <span
                      key={i}
                      className="text-[13px] text-[#556B75] font-normal leading-[100%] tracking-[0%] bg-[#F4F5F6] px-2 py-1 rounded"
                    >
                      {data}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleContinue}
          className="inline-flex items-center px-6 py-3 bg-[#0E4259] text-white text-sm font-medium rounded-lg hover:bg-[#0a3447] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E4259]"
        >
          Continue to Smart Mapping
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
