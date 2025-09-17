"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { ParsedFileData } from "../../lib/file-processing";
import { FieldDetectionResult } from "../../lib/field-mapping";
import { contactFieldService } from "../../lib/collections";
import { ContactField } from "../../types/firestore";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { Check } from "lucide-react";

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
  const [expandedMapping, setExpandedMapping] = useState<number | null>(null);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [showCustomFieldForm, setShowCustomFieldForm] = useState<number | null>(
    null
  );
  const [tempSelection, setTempSelection] = useState<string | null>(null);
  const [showMoreOptionsDropdown, setShowMoreOptionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContactFields();
  }, []);

  useEffect(() => {
    if (onMappingsChange) {
      onMappingsChange(mappings);
    }
  }, [mappings, onMappingsChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setExpandedMapping(null);
        setTempSelection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadContactFields = async () => {
    try {
      const fields = await contactFieldService.getFields();
      setContactFields(fields);
    } catch (error) {
      console.error("Failed to load contact fields:", error);
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
      return "text-[#008D0E] border border-[#B0F0C2] bg-[#E8FFE6]";
    if (confidence >= 70)
      return "bg-[#FFF8DD] text-[#8C5E04] border border-[#F6CD7E]";
    if (confidence >= 50)
      return "bg-[#F2F2F2] text-[#666666] border border-[#BDBDBD]";
    return "bg-[#F2F2F2] text-[#666666] border border-[#BDBDBD]";
  };

  const handleFieldMappingChange = (index: number, newField: string) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      suggestedField: newField,
    };
    setMappings(updatedMappings);
    if (onMappingsChange) {
      onMappingsChange(updatedMappings);
    }
  };

  const handleTempSelection = (fieldName: string) => {
    setTempSelection(fieldName);
    const currentIndex = expandedMapping;
    if (currentIndex !== null) {
      handleFieldMappingChange(currentIndex, fieldName);
    }
  };

  const handleConfirmSelection = (index: number) => {
    if (tempSelection) {
      handleFieldMappingChange(index, tempSelection);
      setTempSelection(null);
      setExpandedMapping(null);
    }
  };

  const handleCancelSelection = () => {
    setTempSelection(null);
    setExpandedMapping(null);
  };

  const handleCreateCustomField = async (index: number) => {
    if (!newCustomFieldName.trim()) return;

    try {
      const newFieldData: Omit<ContactField, "id"> = {
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
        createdOn: new Date() as unknown as Timestamp,
      };

      const fieldId = await contactFieldService.createField(newFieldData);
      const newField: ContactField = {
        ...newFieldData,
        id: fieldId,
      };
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

  const availableFields = getAvailableFields();

  return (
    <div className="flex flex-col h-[500px] max-w-6xl mx-auto overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0 bg-white">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-[#0E4259] mb-3 leading-[100%] tracking-[0%]">
              Smart Field Mapping
            </h2>
            <p className="text-[#68818C] text-base sm:text-lg font-normal leading-[120%] tracking-[0%]">
              Review and adjust the AI-powered field mappings below. Click
              &quot;Edit&quot; next to any mapping to change it. You can map to
              existing CRM fields or create custom fields with different data
              types.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 flex-shrink-0">
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
            <div className="relative">
              <button
                onClick={() =>
                  setShowMoreOptionsDropdown(!showMoreOptionsDropdown)
                }
                className="flex items-center gap-2 px-4 py-2 text-[#444444] hover:text-[#0E4259] hover:bg-gray-100 rounded-lg transition-colors"
              >
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
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showMoreOptionsDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMoreOptionsDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <Image
                        src="/manage.svg"
                        alt="Bulk Edit"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      Bulk Edit Mappings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <Image
                        src="/manage.svg"
                        alt="Import Templates"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      Import Mapping Templates
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <Image
                        src="/manage.svg"
                        alt="Export Mappings"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      Export Current Mappings
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <Image
                        src="/manage.svg"
                        alt="Advanced Settings"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                      Advanced Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 relative overflow-x-visible">
        <div className="space-y-4 w-full">
          {mappings.map((mapping, index) => (
            <motion.div
              key={mapping.columnName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white border rounded-[16px] p-4 sm:p-6 w-full ${
                mapping.confidence < 50
                  ? "border-[#FFD3D3] shadow-[0px_0px_24px_0px_#E1070714]"
                  : "border-[#EEEEEE]"
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-[12px] font-medium text-[#920C7A] bg-[#FBEBFF] border border-[#FFB7F4] rounded-[8px] h-6 flex items-center justify-center">
                      DATABASE FIELD
                    </span>
                    <span
                      className={`px-2 py-1 text-[12px] font-medium rounded-[8px] h-6 inline-flex items-center ${getConfidenceColor(
                        mapping.confidence
                      )}`}
                    >
                      {mapping.confidence}% •{" "}
                      {mapping.confidence >= 90
                        ? "High"
                        : mapping.confidence >= 70
                        ? "Medium"
                        : mapping.confidence >= 50
                        ? "Low"
                        : "Very Low"}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0E4259] leading-[100%] tracking-[0%] mb-2 break-words">
                    {mapping.columnName}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#556B75] font-normal leading-[100%] tracking-[0%]">
                      Sample
                    </span>
                    {mapping.sampleData.slice(0, 1).map((data, i) => (
                      <span
                        key={i}
                        className="text-[13px] text-[#556B75] font-normal leading-[100%] tracking-[0%] bg-[#F4F5F6] px-2 py-1 rounded"
                      >
                        {data}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 self-center lg:self-auto">
                  <Image
                    src="/Chain.svg"
                    alt="Link"
                    width={24}
                    height={16}
                    className="w-6 h-4 opacity-50"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-[88px] h-6 rounded-lg border border-[#AACCFF] bg-[#E7F5FB] px-2 py-1 flex items-center justify-center text-[12px] font-medium leading-[136%] tracking-[1px] text-[#0959D1] whitespace-nowrap">
                      CRM FIELD
                    </span>
                  </div>
                  {expandedMapping !== index ? (
                    <h3 className="text-lg sm:text-xl font-bold text-[#0051CC] leading-[100%] tracking-[0%] mb-2 break-words">
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
                        : "Contact Name"}
                    </h3>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-2 ">
                        <button
                          onClick={() => setExpandedMapping(null)}
                          className="flex items-center justify-between w-full min-w-[200px] max-w-[400px] h-9 px-3 py-2 bg-white border border-[#D1D5DB] hover:border-[#1970F3] rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm sm:text-base font-medium text-[#0E4259] break-words">
                              {mapping.suggestedField
                                ? availableFields.core.find(
                                    (f) =>
                                      f.fieldName === mapping.suggestedField
                                  )?.label ||
                                  availableFields.custom.find(
                                    (f) =>
                                      f.fieldName === mapping.suggestedField
                                  )?.label ||
                                  (mapping.suggestedField === "new_custom_field"
                                    ? "New Custom Field"
                                    : mapping.suggestedField)
                                : "Contact Name"}
                            </div>
                            <span className="px-2 py-1 text-[#A449FF] border-1 border-[#F0E1FF]  text-xs font-[14px] rounded-full">
                              Current
                            </span>
                          </div>
                          <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                        </button>

                        <div
                          ref={dropdownRef}
                          className="absolute top-full left-0 mt-2 z-[100] w-80 max-w-[90vw] max-h-96 min-h-[200px] bg-white rounded-lg shadow-xl overflow-y-auto border border-gray-200"
                        >
                          <div className="py-2">
                            <div className="px-3 py-2">
                              <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                                Actions
                              </div>
                              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[#6B7280] hover:bg-[#F9FAFB] rounded">
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                Don't import this field
                              </button>
                              <button
                                onClick={() =>
                                  setShowCustomFieldForm(
                                    showCustomFieldForm === index ? null : index
                                  )
                                }
                                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[#6B7280] hover:bg-[#F9FAFB] rounded"
                              >
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                Create Custom Field
                              </button>
                            </div>
                            <div className="border-t border-[#E5E7EB] px-3 py-2">
                              <div className="text-xs font-semibold text-[#1970F3] uppercase tracking-wide mb-2">
                                Core Fields
                              </div>
                              {availableFields.core.map((field) => (
                                <button
                                  key={field.id}
                                  onClick={() => {
                                    handleTempSelection(field.fieldName);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded ${
                                    mapping.suggestedField ===
                                      field.fieldName ||
                                    tempSelection === field.fieldName
                                      ? "bg-[#F3F4F6] text-[#0E4259]"
                                      : "text-[#0E4259] hover:bg-[#F9FAFB]"
                                  }`}
                                >
                                  <div className="flex w-full justify-between items-center gap-3">
                                    <div className="font-medium">
                                      {field.label}
                                    </div>
                                  </div>
                                  {mapping.suggestedField !== field.fieldName &&
                                    tempSelection !== field.fieldName && (
                                      <div className="px-2 py-1 border-[#F8CEFF] border-1 text-[#DF56A5] text-xs font-medium rounded-full flex items-center gap-1">
                                        <svg
                                          width="16"
                                          height="11"
                                          viewBox="0 0 16 11"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4"
                                        >
                                          <path
                                            d="M0 5.3C0 4.66966 0.124156 4.04548 0.365378 3.46312C0.606601 2.88076 0.960166 2.35161 1.40589 1.90589C2.30606 1.00571 3.52696 0.5 4.8 0.5H5C5.26522 0.5 5.51957 0.605357 5.70711 0.792893C5.89464 0.98043 6 1.23478 6 1.5C6 1.76522 5.89464 2.01957 5.70711 2.20711C5.51957 2.39464 5.26522 2.5 5 2.5H4.8C4.05739 2.5 3.3452 2.795 2.8201 3.3201C2.295 3.8452 2 4.55739 2 5.3V5.7C2 6.44261 2.295 7.1548 2.8201 7.6799C3.3452 8.205 4.05739 8.5 4.8 8.5H5C5.26522 8.5 5.51957 8.60536 5.70711 8.79289C5.89464 8.98043 6 9.23478 6 9.5C6 9.76522 5.89464 10.0196 5.70711 10.2071C5.51957 10.3946 5.26522 10.5 5 10.5H4.8C3.52696 10.5 2.30606 9.99429 1.40589 9.09411C0.505713 8.19394 0 6.97304 0 5.7V5.3ZM16 5.3C16 4.66966 15.8758 4.04548 15.6346 3.46312C15.3934 2.88076 15.0398 2.35161 14.5941 1.90589C14.1484 1.46017 13.6192 1.1066 13.0369 0.865378C12.4545 0.624156 11.8303 0.5 11.2 0.5H11C10.7348 0.5 10.4804 0.605357 10.2929 0.792893C10.1054 0.98043 10 1.23478 10 1.5C10 1.76522 10.1054 2.01957 10.2929 2.20711C10.4804 2.39464 10.7348 2.5 11 2.5H11.2C11.9426 2.5 12.6548 2.795 13.1799 3.3201C13.705 3.8452 14 4.55739 14 5.3V5.7C14 6.44261 13.705 7.1548 13.1799 7.6799C12.6548 8.205 11.9426 8.5 11.2 8.5H11C10.7348 8.5 10.4804 8.60536 10.2929 8.79289C10.1054 8.98043 10 9.23478 10 9.5C10 9.76522 10.1054 10.0196 10.2929 10.2071C10.4804 10.3946 10.7348 10.5 11 10.5H11.2C11.8303 10.5 12.4545 10.3758 13.0369 10.1346C13.6192 9.8934 14.1484 9.53983 14.5941 9.09411C15.0398 8.64839 15.3934 8.11924 15.6346 7.53688C15.8758 6.95452 16 6.33034 16 5.7V5.3ZM5 4.5C4.73478 4.5 4.48043 4.60536 4.29289 4.79289C4.10536 4.98043 4 5.23478 4 5.5C4 5.76522 4.10536 6.01957 4.29289 6.20711C4.48043 6.39464 4.73478 6.5 5 6.5H11C11.2652 6.5 11.5196 6.39464 11.7071 6.20711C11.8946 6.01957 12 5.76522 12 5.5C12 5.23478 11.8946 4.98043 11.7071 4.79289C11.5196 4.60536 11.2652 4.5 11 4.5H5Z"
                                            fill="#DF56A5"
                                          />
                                        </svg>
                                        {field.fieldName}
                                      </div>
                                    )}
                                  {mapping.suggestedField ===
                                    field.fieldName && (
                                    <div className="flex gap-1 items-center">
                                      <div className="rounded-[12px] border border-[#F0E1FF] bg-white px-2 py-1 text-[#A449FF] text-sm font-medium leading-none text-center">
                                        Current
                                      </div>
                                      <svg
                                        className="w-4 h-4 text-[#0E4259]"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>

                            {availableFields.custom.length > 0 && (
                              <div className="border-t border-[#E5E7EB] px-3 py-2">
                                <div className="text-xs font-semibold text-[#1970F3] uppercase tracking-wide mb-2">
                                  CRM Fields
                                </div>
                                {availableFields.custom.map((field) => (
                                  <button
                                    key={field.id}
                                    onClick={() => {
                                      handleTempSelection(field.fieldName);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded ${
                                      mapping.suggestedField ===
                                        field.fieldName ||
                                      tempSelection === field.fieldName
                                        ? "bg-[#F3F4F6] text-[#0E4259]"
                                        : "text-[#0E4259] hover:bg-[#F9FAFB]"
                                    }`}
                                  >
                                    <div className="flex w-full justify-between  items-center gap-3">
                                      <div className="font-medium">
                                        {field.label}
                                      </div>
                                      <div className="px-2 py-1 border-[#F8CEFF] border-1 text-[#DF56A5] text-xs font-medium rounded-full flex items-center gap-1">
                                        <svg
                                          width="16"
                                          height="11"
                                          viewBox="0 0 16 11"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4"
                                        >
                                          <path
                                            d="M0 5.3C0 4.66966 0.124156 4.04548 0.365378 3.46312C0.606601 2.88076 0.960166 2.35161 1.40589 1.90589C2.30606 1.00571 3.52696 0.5 4.8 0.5H5C5.26522 0.5 5.51957 0.605357 5.70711 0.792893C5.89464 0.98043 6 1.23478 6 1.5C6 1.76522 5.89464 2.01957 5.70711 2.20711C5.51957 2.39464 5.26522 2.5 5 2.5H4.8C4.05739 2.5 3.3452 2.795 2.8201 3.3201C2.295 3.8452 2 4.55739 2 5.3V5.7C2 6.44261 2.295 7.1548 2.8201 7.6799C3.3452 8.205 4.05739 8.5 4.8 8.5H5C5.26522 8.5 5.51957 8.60536 5.70711 8.79289C5.89464 8.98043 6 9.23478 6 9.5C6 9.76522 5.89464 10.0196 5.70711 10.2071C5.51957 10.3946 5.26522 10.5 5 10.5H4.8C3.52696 10.5 2.30606 9.99429 1.40589 9.09411C0.505713 8.19394 0 6.97304 0 5.7V5.3ZM16 5.3C16 4.66966 15.8758 4.04548 15.6346 3.46312C15.3934 2.88076 15.0398 2.35161 14.5941 1.90589C14.1484 1.46017 13.6192 1.1066 13.0369 0.865378C12.4545 0.624156 11.8303 0.5 11.2 0.5H11C10.7348 0.5 10.4804 0.605357 10.2929 0.792893C10.1054 0.98043 10 1.23478 10 1.5C10 1.76522 10.1054 2.01957 10.2929 2.20711C10.4804 2.39464 10.7348 2.5 11 2.5H11.2C11.9426 2.5 12.6548 2.795 13.1799 3.3201C13.705 3.8452 14 4.55739 14 5.3V5.7C14 6.44261 13.705 7.1548 13.1799 7.6799C12.6548 8.205 11.9426 8.5 11.2 8.5H11C10.7348 8.5 10.4804 8.60536 10.2929 8.79289C10.1054 8.98043 10 9.23478 10 9.5C10 9.76522 10.1054 10.0196 10.2929 10.2071C10.4804 10.3946 10.7348 10.5 11 10.5H11.2C11.8303 10.5 12.4545 10.3758 13.0369 10.1346C13.6192 9.8934 14.1484 9.53983 14.5941 9.09411C15.0398 8.64839 15.3934 8.11924 15.6346 7.53688C15.8758 6.95452 16 6.33034 16 5.7V5.3ZM5 4.5C4.73478 4.5 4.48043 4.60536 4.29289 4.79289C4.10536 4.98043 4 5.23478 4 5.5C4 5.76522 4.10536 6.01957 4.29289 6.20711C4.48043 6.39464 4.73478 6.5 5 6.5H11C11.2652 6.5 11.5196 6.39464 11.7071 6.20711C11.8946 6.01957 12 5.76522 12 5.5C12 5.23478 11.8946 4.98043 11.7071 4.79289C11.5196 4.60536 11.2652 4.5 11 4.5H5Z"
                                            fill="#DF56A5"
                                          />
                                        </svg>
                                        {field.fieldName}
                                      </div>
                                    </div>
                                    {mapping.suggestedField ===
                                      field.fieldName && (
                                      <div className="flex gap-1 items-center">
                                        <div className="rounded-[12px] border border-[#F0E1FF] bg-white px-2 py-1 text-[#A449FF] text-sm font-medium leading-none text-center">
                                          Current
                                        </div>
                                        <svg
                                          className="w-4 h-4 text-[#0E4259]"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmSelection(index)}
                            disabled={!tempSelection}
                            className="w-8 h-8 p-1 text-[12px] bg-[#0E4259] text-white hover:text-white  disabled:cursor-not-allowed shadow-[0px_-2px_4px_0px_#0000001A_inset,0px_8px_40px_0px_#FFFFFF33] rounded-md flex items-center justify-center"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={handleCancelSelection}
                            className="w-8 h-8 p-1 text-[12px] bg-white text-black hover:text-black border border-[#EEEEEE] shadow-[0px_0px_2px_0px_#0000001A] rounded-md flex items-center justify-center"
                          >
                            x
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-[13px] text-[#596A72] font-normal">
                    {mapping.suggestedField
                      ? (() => {
                          const field =
                            availableFields.core.find(
                              (f) => f.fieldName === mapping.suggestedField
                            ) ||
                            availableFields.custom.find(
                              (f) => f.fieldName === mapping.suggestedField
                            );
                          return field
                            ? `${field.core ? "Core" : "Custom"} Field • ${
                                field.type
                              } Data type • ${
                                field.required ? "Required" : "Optional"
                              }`
                            : "Core Field • Text Data type • Required";
                        })()
                      : "Core Field • Text Data type • Required"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 mt-4 lg:mt-0">
                  <button className="flex  gap-1 text-[#556B75] hover:text-[#0E4259] transition-colors">
                    <Image
                      src="/reset.svg"
                      alt="Reset"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Reset</span>
                  </button>
                  <button
                    onClick={() =>
                      setExpandedMapping(
                        expandedMapping === index ? null : index
                      )
                    }
                    className="flex  gap-1 text-[#556B75] hover:text-[#0E4259] transition-colors"
                  >
                    <Image
                      src="/manage.svg"
                      alt="Edit"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                </div>
              </div>

              {mapping.confidence < 50 && (
                <div className="mt-4 bg-[#FFF2EF] border-t border-[#FFE5E5] rounded-b-[16px] -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 -mb-4 sm:-mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Image
                      src="/si_warning-line.svg"
                      alt="Warning"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span className="text-[#D74141] text-sm font-medium">
                      Manual Review Recommended
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
