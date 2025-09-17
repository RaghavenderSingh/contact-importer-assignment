"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import { FileProcessingService } from "../../lib/file-processing";

interface ImportStepProps {
  onFileUpload: (file: File) => void;
  error: string | null;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  status: "uploading" | "validating" | "valid" | "error";
  validationError?: string;
  progress?: number;
}

const SUPPORTED_FORMATS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export default function ImportStep({ onFileUpload, error }: ImportStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isClicking, setIsClicking] = useState(false);
  const isClickingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!file.name) {
        return { valid: false, error: "File name is required" };
      }

      if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File size exceeds 10MB limit` };
      }

      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!SUPPORTED_FORMATS.includes(extension)) {
        return {
          valid: false,
          error: "Only CSV and Excel files are supported",
        };
      }

      return { valid: true };
    },
    []
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback(
    async (fileList: File[]) => {
      console.log("Processing files:", fileList);
      const newFiles: FileWithPreview[] = [];

      for (const file of fileList) {
        if (files.length >= MAX_FILES) break;

        if (!file || !file.name) {
          setAnnouncement("Skipped invalid file");
          continue;
        }

        const validation = validateFile(file);
        console.log("File validation result:", validation);
        const fileWithPreview: FileWithPreview = {
          ...file,
          id: generateFileId(),
          status: validation.valid ? "validating" : "error",
          validationError: validation.error,
          progress: 0,
        };

        newFiles.push(fileWithPreview);

        if (validation.valid) {
          setIsProcessing(true);
          setAnnouncement(`Validating file ${file.name}...`);
          console.log(
            "Starting validation for file:",
            file.name,
            "with ID:",
            fileWithPreview.id
          );
          setTimeout(() => {
            console.log("Validation timeout completed, updating file status");
            setFiles((prev) => {
              const updated = prev.map((f) =>
                f.id === fileWithPreview.id
                  ? { ...f, status: "valid" as const, progress: 100 }
                  : f
              );
              console.log("Files after validation update:", updated);
              console.log(
                "File with ID",
                fileWithPreview.id,
                "status updated to valid"
              );
              return updated;
            });
            setAnnouncement(`File ${file.name} validated successfully`);
            setIsProcessing(false);
          }, 1500);
        } else {
          setAnnouncement(
            `File ${file.name} validation failed: ${validation.error}`
          );
        }
      }

      setFiles((prev) => {
        const updatedFiles = [...prev, ...newFiles];
        console.log("Updated files state:", updatedFiles);
        return updatedFiles;
      });
    },
    [files.length, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      isClickingRef.current = false; // Reset clicking state
      setIsClicking(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      console.log("Files dropped:", droppedFiles);
      processFiles(droppedFiles);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("handleFileInput triggered");
      const selectedFiles = Array.from(e.target.files || []);
      console.log("Files selected:", selectedFiles);

      isClickingRef.current = false;
      setIsClicking(false);

      processFiles(selectedFiles);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (fileId: string) => {
      const fileToRemove = files.find((f) => f.id === fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (fileToRemove) {
        setAnnouncement(`File ${fileToRemove.name} removed`);
      }
    },
    [files]
  );

  const handleProcessFile = useCallback(
    (file: FileWithPreview) => {
      console.log("handleProcessFile called with file:", file);
      if (file.status === "valid") {
        console.log("File is valid, calling onFileUpload...");
        onFileUpload(file);
      } else {
        console.log("File is not valid, status:", file.status);
      }
    },
    [onFileUpload]
  );

  const getFileIcon = (fileName: string) => {
    if (!fileName) return <File className="w-5 h-5" />;

    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "csv":
        return <FileSpreadsheet className="w-5 h-5" />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: FileWithPreview["status"]) => {
    switch (status) {
      case "uploading":
      case "validating":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: FileWithPreview["status"]) => {
    switch (status) {
      case "uploading":
      case "validating":
        return "border-blue-200 bg-blue-50";
      case "valid":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
    }
  };

  console.log("Current files state:", files);

  return (
    <div className="space-y-8 p-6">
      <div className="text-left">
        <h4 className="text-lg font-semibold text-[#0E4259] mb-3 leading-none">
          Upload Your Contact Files
        </h4>
        <p className="text-base text-[#68818C] leading-[1.2]">
          Upload CSV or Excel files to import contacts with smart field mapping.
          Support for up to {MAX_FILES} files at once.
        </p>
        <div className="mt-3">
          <button
            onClick={() => {
              const sampleContent = `First Name,Last Name,Email,Phone,Company,Lead Score,Assigned Agent
John,Doe,john.doe@example.com,555-0123,Acme Corp,85,sarah.johnson@example.com
Jane,Smith,jane.smith@example.com,555-0124,Tech Inc,92,mike.wilson@example.com
Bob,Johnson,bob.johnson@example.com,555-0125,Startup LLC,78,sarah.johnson@example.com`;

              const blob = new Blob([sampleContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-contacts.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            aria-label="Download sample CSV file to see expected format"
          >
            <Download className="w-4 h-4 mr-1" />
            Download sample CSV
          </button>
        </div>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
          dragActive
            ? "border-blue-400 bg-blue-50 scale-[1.02] shadow-lg"
            : files.length > 0
            ? "border-gray-300 bg-gray-50"
            : isClicking
            ? "border-gray-300 bg-gray-100 cursor-wait"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={(e) => {
          console.log("Main div clicked, isClicking:", isClickingRef.current);
          e.preventDefault();
          e.stopPropagation();

          if (isClickingRef.current) {
            console.log("Click ignored - already processing");
            return;
          }

          isClickingRef.current = true;
          setIsClicking(true);
          fileInputRef.current?.click();

          setTimeout(() => {
            isClickingRef.current = false;
            setIsClicking(false);
          }, 1000);
        }}
        role="button"
        tabIndex={0}
        aria-label="File upload area. Drag and drop files here or click to browse."
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Select files to upload"
        />

        <div className="text-center">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: dragActive ? 1.1 : 1 }}
            className="space-y-6"
          >
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                dragActive ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <Upload
                className={`w-8 h-8 transition-colors ${
                  dragActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-semibold text-[#0E4259] leading-none">
                {dragActive ? "Drop files here" : "Drag & drop your files here"}
              </p>
              <p className="text-base text-[#68818C] leading-[1.2]">
                or{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    console.log(
                      "Browse files button clicked, isClicking:",
                      isClickingRef.current
                    );
                    e.stopPropagation();

                    if (isClickingRef.current) {
                      console.log("Click ignored - already processing");
                      return;
                    }

                    isClickingRef.current = true;
                    setIsClicking(true);
                    fileInputRef.current?.click();

                    setTimeout(() => {
                      isClickingRef.current = false;
                      setIsClicking(false);
                    }, 1000);
                  }}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium underline"
                >
                  browse files
                </button>
              </p>
            </div>

            <div className="flex items-center justify-center space-x-6 text-sm text-[#89A6B2]">
              <div className="flex items-center space-x-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV, XLSX</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>Up to 10MB</span>
              </div>
              <div className="flex items-center space-x-1">
                <File className="w-4 h-4" />
                <span>Max {MAX_FILES} files</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-base font-medium text-[#0E4259]">
                Selected Files ({files.length}/{MAX_FILES})
              </h5>
              {files.length > 0 && (
                <button
                  onClick={() => setFiles([])}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                  aria-label={`Clear all ${files.length} selected files`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`border rounded-lg p-4 transition-all ${getStatusColor(
                    file.status
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0E4259] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#68818C]">
                          {FileProcessingService.formatFileSize(file.size)}
                        </p>
                        {file.validationError && (
                          <p className="text-xs text-red-600 mt-1">
                            {file.validationError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}

                      {file.status === "valid" && (
                        <button
                          onClick={() => {
                            console.log(
                              "Process button clicked for file:",
                              file
                            );
                            handleProcessFile(file);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-[#0E4259] hover:bg-[#0a3447] transition-colors"
                          aria-label={`Process file ${file.name}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Process
                        </button>
                      )}

                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove file ${file.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {file.status === "uploading" ||
                  file.status === "validating" ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-[#68818C] mb-1">
                        <span>
                          {file.status === "uploading"
                            ? "Uploading..."
                            : "Validating..."}
                        </span>
                        <span>{file.progress || 0}%</span>
                      </div>
                      <div
                        className="w-full bg-gray-200 rounded-full h-1.5"
                        role="progressbar"
                        aria-valuenow={file.progress || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${
                          file.status === "uploading" ? "Upload" : "Validation"
                        } progress for ${file.name}: ${file.progress || 0}%`}
                      >
                        <motion.div
                          className="bg-blue-500 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress || 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
            <span className="text-sm text-blue-700">Processing files...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
