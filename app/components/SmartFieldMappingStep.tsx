"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { ParsedFileData } from "../../lib/file-processing";
import { FieldDetectionResult } from "../../lib/field-mapping";
import { contactFieldService } from "../../lib/collections";
import { ContactField } from "../../types/firestore";
import Image from "next/image";

interface SmartFieldMappingStepProps {
  fileData: ParsedFileData;
  initialMappings: FieldDetectionResult[];
  onComplete: (mappings: FieldDetectionResult[]) => void;
  onBack: () => void;
  onMappingsChange?: (mappings: FieldDetectionResult[]) => void;
}

export default function SmartFieldMappingStep({
  fileData,
  initialMappings,
  onComplete,
  onBack,
  onMappingsChange,
}: SmartFieldMappingStepProps) {
  const [mappings, setMappings] =
    useState<FieldDetectionResult[]>(initialMappings);
  const [contactFields, setContactFields] = useState<ContactField[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMapping, setExpandedMapping] = useState<number | null>(null);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [showCustomFieldForm, setShowCustomFieldForm] = useState<number | null>(
    null
  );

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

  const handleFieldMappingChange = (index: number, newField: string) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      suggestedField: newField,
    };
    setMappings(updatedMappings);
  };

  const handleCreateCustomField = async (index: number) => {
    if (!newCustomFieldName.trim()) return;

    try {
      const newField: Omit<ContactField, "id"> = {
        label: newCustomFieldName.trim(),
        fieldName: newCustomFieldName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        type: (mappings[index].dataType || "text") as
          | "text"
          | "number"
          | "phone"
          | "email"
          | "datetime"
          | "checkbox",
        core: false,
        required: false,
        createdOn: new Date() as any, // Will be converted to Timestamp by the service
      };

      await contactFieldService.createField(newField);
      setContactFields((prev) => [...prev, newField]);

      const updatedMappings = [...mappings];
      updatedMappings[index] = {
        ...updatedMappings[index],
        suggestedField: newField.fieldName,
        isCustomField: true,
        customFieldConfig: newField,
      };
      setMappings(updatedMappings);

      setNewCustomFieldName("");
      setShowCustomFieldForm(null);
    } catch (error) {
      console.error("Failed to create custom field:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading field options...</p>
      </div>
    );
  }

  const availableFields = getAvailableFields();

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto">
      <div className="mb-8 p-6 pb-4 bg-white flex-shrink-0">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-[18px] font-semibold text-[#0E4259] mb-3 leading-[100%] tracking-[0%]">
              Smart Field Mapping
            </h2>
            <p className="text-[#68818C] text-[17px] font-normal leading-[120%] tracking-[0%]">
              Review and adjust the AI-powered field mappings below. Click
              &quot;Edit&quot; next to any mapping to change it. You can map to
              existing CRM fields or create custom fields with different data
              types.
            </p>
          </div>

          <div className="flex justify-end items-center gap-3 flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 text-[#444444] hover:text-[#0E4259] hover:bg-gray-100 rounded-lg transition-colors">
              <Image
                src="/reset.svg"
                alt="Reset"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              <span className="text-base font-normal leading-[100%] tracking-[0%]">
                Reset to Default
              </span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-[#444444] hover:text-[#0E4259] hover:bg-gray-100 rounded-lg transition-colors">
              <Image
                src="/manage.svg"
                alt="Manage"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              <span className="text-base font-normal leading-[100%] tracking-[0%]">
                More Mapping Options
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        <div className="space-y-4 max-w-full">
          {mappings.map((mapping, index) => (
            <motion.div
              key={mapping.columnName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-[#EEEEEE] rounded-[16px] p-6 w-full max-w-4xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`px-2 py-1 text-[12px] font-medium leading-[136%] tracking-[-0.41px] min-w-[25px] h-[16px] flex items-center justify-center ${getConfidenceColor(
                      mapping.confidence
                    )}`}
                  >
                    {mapping.confidence}%
                  </div>
                  <div>
                    <h3 className="text-[18px] font-medium text-[#0E4259] leading-[100%] tracking-[0%]">
                      {mapping.columnName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[13px] text-[#556B75] font-normal leading-[100%] tracking-[0%]">
                        Sample:
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
                </div>
                <button
                  onClick={() =>
                    setExpandedMapping(expandedMapping === index ? null : index)
                  }
                  className="flex items-center gap-2 text-[#1970F3] hover:text-[#0E4259] transition-colors"
                >
                  <span className="text-sm font-medium">
                    {expandedMapping === index
                      ? "Hide Options"
                      : "Change Mapping"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedMapping === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/Chain.svg"
                  alt="Link"
                  width={16}
                  height={10}
                  className="w-4 h-[10px] opacity-100"
                />
                <div className="flex-1">
                  <span className="text-[16px] font-medium text-[#1970F3] leading-[100%] tracking-[0%]">
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
              </div>

              {expandedMapping === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 pt-4"
                >
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Core Fields
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availableFields.core.map((field) => (
                        <button
                          key={field.id}
                          onClick={() =>
                            handleFieldMappingChange(index, field.fieldName)
                          }
                          className={`p-3 text-left rounded-lg border transition-colors ${
                            mapping.suggestedField === field.fieldName
                              ? "border-[#1970F3] bg-blue-50 text-[#1970F3]"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {field.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {field.type}
                          </div>
                        </button>
                      ))}
                    </div>

                    {availableFields.custom.length > 0 && (
                      <>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">
                          Custom Fields
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {availableFields.custom.map((field) => (
                            <button
                              key={field.id}
                              onClick={() =>
                                handleFieldMappingChange(index, field.fieldName)
                              }
                              className={`p-3 text-left rounded-lg border transition-colors ${
                                mapping.suggestedField === field.fieldName
                                  ? "border-[#1970F3] bg-blue-50 text-[#1970F3]"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-medium text-sm">
                                {field.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {field.type}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                      <button
                        onClick={() =>
                          setShowCustomFieldForm(
                            showCustomFieldForm === index ? null : index
                          )
                        }
                        className="flex items-center gap-2 text-[#1970F3] hover:text-[#0E4259] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Create New Custom Field
                        </span>
                      </button>

                      {showCustomFieldForm === index && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field Name
                              </label>
                              <input
                                type="text"
                                value={newCustomFieldName}
                                onChange={(e) =>
                                  setNewCustomFieldName(e.target.value)
                                }
                                placeholder="Enter field name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCreateCustomField(index)}
                                disabled={!newCustomFieldName.trim()}
                                className="px-4 py-2 bg-[#1970F3] text-white text-sm rounded-md hover:bg-[#0E4259] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Create Field
                              </button>
                              <button
                                onClick={() => {
                                  setShowCustomFieldForm(null);
                                  setNewCustomFieldName("");
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
