"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  error?: string | null;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
}

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  onFileUpload,
  error,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [".csv", ".xlsx", ".xls"],
}: FileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      console.log("FileUpload validateFile called with file:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!file) {
        return { valid: false, error: "Invalid file object" };
      }

      if (!file.name || typeof file.name !== "string") {
        return { valid: false, error: "File name is required" };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(
            0
          )}MB limit`,
        };
      }

      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      console.log("File extension:", extension);
      console.log("Accepted types:", acceptedTypes);

      if (!acceptedTypes.includes(extension)) {
        return {
          valid: false,
          error: "Only CSV and Excel files are supported",
        };
      }

      return { valid: true };
    },
    [maxSize, acceptedTypes]
  );

  const processFiles = useCallback(
    async (fileList: File[]) => {
      console.log("Processing files:", fileList);
      setIsProcessing(true);

      for (const file of fileList) {
        if (!file || !file.name) {
          continue;
        }

        const validation = validateFile(file);
        console.log("File validation result:", validation);

        if (validation.valid) {
          console.log("File is valid, uploading:", file.name);
          onFileUpload(file);
        } else {
          console.log("File validation failed:", validation.error);
        }
      }

      setIsProcessing(false);
    },
    [validateFile, onFileUpload]
  );

  const handleFileChange = useCallback(
    (newFiles: File[]) => {
      processFiles(newFiles);
    },
    [processFiles]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log("Drop rejected:", error);
    },
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <div className="space-y-8 p-6">
      <div className="text-left">
        <h4 className="text-lg font-semibold text-[#0E4259] mb-3 leading-none">
          Upload Your Contact Files
        </h4>
        <p className="text-base text-[#68818C] leading-[1.2]">
          Upload CSV or Excel files to import contacts with smart field mapping.
          Support for up to {maxFiles} files at once.
        </p>
      </div>

      <div className="w-full" {...getRootProps()}>
        <motion.div
          onClick={handleClick}
          whileHover="animate"
          className={`p-10 group/file block rounded-xl cursor-pointer w-full relative overflow-hidden transition-all duration-300 `}
        >
          <input
            ref={fileInputRef}
            id="file-upload-handle"
            type="file"
            accept={acceptedTypes.join(",")}
            multiple
            onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
            className="hidden"
          />

          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
            <GridPattern />
          </div>

          <div className="flex flex-col items-center justify-center relative z-20">
            <p className="font-sans font-bold text-[#0E4259] text-base">
              {isDragActive ? "Drop files here" : "Upload file"}
            </p>
            <p className="font-sans font-normal text-[#68818C] text-base mt-2">
              Drag or drop your files here or click to upload
            </p>

            <div className="relative w-full mt-10 max-w-4xl mx-auto">
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-lg",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#0E4259] flex flex-col items-center"
                  >
                    Drop it
                    <IconUpload className="h-4 w-4 text-[#0E4259]" />
                  </motion.p>
                ) : (
                  <IconUpload className="h-4 w-4 text-[#0E4259]" />
                )}
              </motion.div>

              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-blue-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-lg"
              ></motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span className="text-sm text-blue-700">Processing files...</span>
        </motion.div>
      )}
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50"
                  : "bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
