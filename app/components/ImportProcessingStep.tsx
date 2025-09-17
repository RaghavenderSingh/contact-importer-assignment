"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ParsedFileData } from "../../lib/file-processing";
import { FieldDetectionResult } from "../../lib/field-mapping";
import { contactService } from "../../lib/collections";
import { Contact } from "../../types/firestore";
import GridBackground from "../../components/ui/grid-background";
import Image from "next/image";

interface ImportProcessingStepProps {
  fileData?: ParsedFileData;
  fieldMappings?: FieldDetectionResult[];
  onComplete?: (results: {
    imported: number;
    merged: number;
    errors: number;
    errorDetails: string[];
  }) => void;
  onError?: (error: string) => void;
  onMoveToContacts?: () => void;
  onDisabledStateChange?: (disabled: boolean) => void;
}

interface ProcessingResults {
  imported: number;
  merged: number;
  errors: number;
  errorDetails: string[];
}

export default function ImportProcessingStep({
  fileData,
  fieldMappings = [],
  onComplete,
  onError,
  onMoveToContacts,
  onDisabledStateChange,
}: ImportProcessingStepProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<ProcessingResults>({
    imported: 0,
    merged: 0,
    errors: 0,
    errorDetails: [],
  });

  const processingSteps = [
    "Analyzing data structure...",
    "Checking for duplicate contacts...",
    "Validating email formats...",
    "Validating phone numbers...",
    "Checking required fields...",
    "Finalizing import...",
  ];

  useEffect(() => {
    if (fileData && fieldMappings.length > 0) {
      startProcessing();
    }
  }, [fileData, fieldMappings]);

  useEffect(() => {
    const isDisabled = isProcessing || !isComplete || results.errors > 0;
    onDisabledStateChange?.(isDisabled);
  }, [isProcessing, isComplete, results.errors, onDisabledStateChange]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10;
  };

  const normalizePhone = (phone: string): string => {
    return phone.replace(/\D/g, "");
  };

  const normalizeEmail = (email: string): string => {
    return email.toLowerCase().trim();
  };

  const checkForDuplicates = async (
    contactData: Record<string, string>
  ): Promise<{
    isDuplicate: boolean;
    existingContact?: Contact;
    confidence: number;
  }> => {
    try {
      const email = contactData.email ? normalizeEmail(contactData.email) : "";
      const phone = contactData.phone ? normalizePhone(contactData.phone) : "";
      const firstName = contactData.firstName?.toLowerCase().trim() || "";
      const lastName = contactData.lastName?.toLowerCase().trim() || "";

      if (email) {
        const emailQuery = await contactService.searchContacts(email);
        const emailMatch = emailQuery.find(
          (c) => normalizeEmail(c.email) === email
        );
        if (emailMatch) {
          return {
            isDuplicate: true,
            existingContact: emailMatch,
            confidence: 100,
          };
        }
      }

      if (phone) {
        const phoneQuery = await contactService.searchContacts(phone);
        const phoneMatch = phoneQuery.find(
          (c) => normalizePhone(c.phone) === phone
        );
        if (phoneMatch) {
          return {
            isDuplicate: true,
            existingContact: phoneMatch,
            confidence: 95,
          };
        }
      }

      if (firstName && lastName) {
        const nameQuery = await contactService.searchContacts(
          `${firstName} ${lastName}`
        );
        const nameMatch = nameQuery.find(
          (c) =>
            c.firstName?.toLowerCase().trim() === firstName &&
            c.lastName?.toLowerCase().trim() === lastName
        );
        if (nameMatch) {
          return {
            isDuplicate: true,
            existingContact: nameMatch,
            confidence: 70,
          };
        }
      }

      return {
        isDuplicate: false,
        confidence: 0,
      };
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return {
        isDuplicate: false,
        confidence: 0,
      };
    }
  };

  const validateContactData = (
    contactData: Record<string, string>
  ): string[] => {
    const errors: string[] = [];

    if (!contactData.firstName?.trim()) {
      errors.push("First name is required");
    }
    if (!contactData.lastName?.trim()) {
      errors.push("Last name is required");
    }
    if (!contactData.email?.trim()) {
      errors.push("Email is required");
    }
    if (!contactData.phone?.trim()) {
      errors.push("Phone is required");
    }

    if (contactData.email && !validateEmail(contactData.email)) {
      errors.push("Invalid email format");
    }

    if (contactData.phone && !validatePhone(contactData.phone)) {
      errors.push("Invalid phone format");
    }

    return errors;
  };

  const handleMoveToContacts = async () => {
    if (!fileData || !fieldMappings.length || results.errors > 0) {
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentStep("Saving contacts to database...");
      setProgress(0);

      const totalRows = fileData.rows.length;
      let processedRows = 0;
      let savedCount = 0;
      let mergedCount = 0;

      for (let i = 0; i < totalRows; i++) {
        const row = fileData.rows[i];

        const contactData: Record<string, string> = {};

        fieldMappings.forEach((mapping) => {
          if (
            mapping.suggestedField &&
            mapping.suggestedField !== "new_custom_field"
          ) {
            const columnIndex = fileData.headers.indexOf(mapping.columnName);
            if (columnIndex >= 0 && row[columnIndex]) {
              contactData[mapping.suggestedField] = row[columnIndex].trim();
            }
          }
        });

        const validationErrors = validateContactData(contactData);
        if (validationErrors.length > 0) {
          processedRows++;
          continue;
        }

        const duplicateCheck = await checkForDuplicates(contactData);

        if (duplicateCheck.isDuplicate && duplicateCheck.existingContact) {
          const updatedContact: Contact = {
            ...duplicateCheck.existingContact,
            ...contactData,
            updatedAt: new Date(),
          };
          await contactService.updateContact(
            duplicateCheck.existingContact.id,
            updatedContact
          );
          mergedCount++;
        } else {
          const newContact: Omit<Contact, "id"> = {
            ...contactData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await contactService.createContact(newContact);
          savedCount++;
        }

        processedRows++;

        const stepProgress = (processedRows / totalRows) * 100;
        setProgress(stepProgress);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      setProgress(100);
      setIsProcessing(false);

      onComplete?.({
        imported: savedCount,
        merged: mergedCount,
        errors: 0,
        errorDetails: [],
      });

      onMoveToContacts?.();
    } catch (error) {
      console.error("Error saving contacts:", error);
      setIsProcessing(false);
      onError?.(
        error instanceof Error ? error.message : "Failed to save contacts"
      );
    }
  };

  const startProcessing = async () => {
    if (!fileData || !fieldMappings.length) {
      onError?.("Missing file data or field mappings");
      return;
    }

    setIsProcessing(true);
    const results: ProcessingResults = {
      imported: 0,
      merged: 0,
      errors: 0,
      errorDetails: [],
    };

    try {
      setCurrentStep(processingSteps[0]);
      setProgress(10);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentStep(processingSteps[1]);
      setProgress(25);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setCurrentStep(processingSteps[2]);
      setProgress(40);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentStep(processingSteps[3]);
      setProgress(55);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentStep(processingSteps[4]);
      setProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const totalRows = fileData.rows.length;
      let processedRows = 0;

      for (let i = 0; i < totalRows; i++) {
        const row = fileData.rows[i];

        const contactData: Record<string, string> = {};

        fieldMappings.forEach((mapping) => {
          if (
            mapping.suggestedField &&
            mapping.suggestedField !== "new_custom_field"
          ) {
            const columnIndex = fileData.headers.indexOf(mapping.columnName);
            if (columnIndex >= 0 && row[columnIndex]) {
              contactData[mapping.suggestedField] = row[columnIndex].trim();
            }
          }
        });

        const validationErrors = validateContactData(contactData);
        if (validationErrors.length > 0) {
          results.errors++;
          results.errorDetails.push(
            `Row ${i + 2}: ${validationErrors.join(", ")}`
          );
          processedRows++;
          continue;
        }

        const duplicateCheck = await checkForDuplicates(contactData);

        if (duplicateCheck.isDuplicate) {
          results.merged++;
        } else {
          results.imported++;
        }

        processedRows++;

        const stepProgress = 70 + (processedRows / totalRows) * 25;
        setProgress(stepProgress);

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setCurrentStep(processingSteps[5]);
      setProgress(95);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress(100);
      setResults(results);
      setIsProcessing(false);
      setIsComplete(true);
    } catch (error) {
      console.error("Error processing contacts:", error);
      setIsProcessing(false);
      onError?.(
        error instanceof Error ? error.message : "Failed to process contacts"
      );
    }
  };

  return (
    <div className="bg-white min-h-[400px] space-y-4 p-4">
      <div className="text-left">
        <h3 className="text-[18px] font-semibold text-[#0E4259] mb-2 leading-none">
          {isComplete
            ? "Final Checks Complete"
            : "Checking for Duplicates & Errors..."}
        </h3>
        <p className="text-[16px] text-[#68818C] leading-[1.2]">
          {isComplete
            ? results.errors === 0
              ? "No Issue Founds! This Database entres are good to move to contacts section."
              : `Found ${results.errors} issues that need to be resolved before importing.`
            : "Scanning entries for duplicates, missing details, or errors before the move to contact section completes..."}
        </p>
      </div>

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
                src="/protect.svg"
                alt="protect"
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
          animate={{ opacity: isProcessing ? [0.7, 1, 0.7] : 1 }}
          transition={{
            duration: 1.5,
            repeat: isProcessing ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          <h3 className="text-base font-semibold text-[#5883C9] mb-1">
            {isProcessing
              ? "Running Final Checks..."
              : isComplete
              ? "Final Checks Complete"
              : "Processing..."}
          </h3>
          <p className="text-xs text-[#7782AD] leading-relaxed whitespace-nowrap">
            {isProcessing
              ? currentStep ||
                "Scanning entries for duplicates, missing details, or errors before the move to contact section completes..."
              : isComplete
              ? results.errors === 0
                ? "All checks passed successfully. Ready to import contacts."
                : "Please review and fix the errors before proceeding."
              : "Processing contacts..."}
          </p>
        </motion.div>

        {!isComplete && (
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
        )}

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl"
          >
            <div className="grid grid-cols-3 bg-[#FFFFFF]  rounded-[12px] gap-2 pt-3 pr-2 pb-3 pl-1.5">
              <div className="bg-[#F2FFED] border-0  rounded-lg p-4 text-center">
                <h4 className="text-sm font-semibold text-[#008D0E] mb-1">
                  Total Contacts Imported
                </h4>
                <p className="text-2xl font-bold text-[#008D0E]">
                  {results.imported}
                </p>
              </div>

              <div className="bg-[#FFF7EA] border-0 rounded-lg p-4 text-center">
                <h4 className="text-sm font-semibold text-[#B67C0C] mb-1">
                  Contacts Merged
                </h4>
                <p className="text-2xl font-bold text-[#B67C0C]">
                  {results.merged}
                </p>
              </div>

              <div className="bg-[#FFEDED] border-0  rounded-lg p-4 text-center">
                <h4 className="text-sm font-semibold text-[#C4494B] mb-1">
                  Errors
                </h4>
                <p className="text-2xl font-bold text-[#C4494B]">
                  {results.errors}
                </p>
              </div>
            </div>

            {results.errors > 0 && results.errorDetails.length > 0 && (
              <div className="mt-4 bg-[#FFEDED] border-0  rounded-lg p-4">
                <h5 className="text-sm font-semibold text-[#C4494B] mb-2">
                  Error Details:
                </h5>
                <div className="text-xs text-[#C4494B] space-y-1 max-h-32 overflow-y-auto">
                  {results.errorDetails.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
