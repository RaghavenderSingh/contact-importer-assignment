import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFileData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  fileName: string;
  fileSize: number;
  fileType: "csv" | "xlsx";
}

export interface ProcessingOptions {
  maxRows?: number;
  skipEmptyRows?: boolean;
  trimWhitespace?: boolean;
}

export class FileProcessingService {
  // Parse CSV file
  static async parseCSV(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<ParsedFileData> {
    console.log("Starting CSV parsing with options:", options);
    return new Promise((resolve, reject) => {
      const config: Papa.ParseConfig = {
        header: false,
        skipEmptyLines: options.skipEmptyRows ?? true,
        complete: (results) => {
          console.log("CSV parsing complete, results:", {
            dataLength: results.data.length,
            errorCount: results.errors.length,
            errors: results.errors,
          });

          if (results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            reject(
              new Error(
                `CSV parsing errors: ${results.errors
                  .map((e) => e.message)
                  .join(", ")}`
              )
            );
            return;
          }

          const rows = results.data as string[][];
          console.log("Parsed rows count:", rows.length);

          if (rows.length === 0) {
            console.error("File is empty");
            reject(new Error("File is empty"));
            return;
          }

          const headers = rows[0];
          const dataRows = rows.slice(1);
          console.log("Headers:", headers);
          console.log("Data rows count:", dataRows.length);

          // Validate headers
          if (!headers || headers.length === 0) {
            console.error("No headers found in CSV file");
            reject(new Error("No headers found in CSV file"));
            return;
          }

          // Limit rows if specified
          const limitedRows = options.maxRows
            ? dataRows.slice(0, options.maxRows)
            : dataRows;
          console.log("Limited rows count:", limitedRows.length);

          const result = {
            headers: this.cleanHeaders(headers, options.trimWhitespace),
            rows: limitedRows,
            totalRows: limitedRows.length,
            fileName: file.name,
            fileSize: file.size,
            fileType: "csv" as const,
          };

          console.log("CSV parsing result:", result);
          resolve(result);
        },
      };

      console.log("Starting Papa.parse...");
      (Papa.parse as unknown as (file: File, config: Papa.ParseConfig) => void)(
        file,
        config
      );
    });
  }

  // Parse Excel file
  static async parseExcel(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            reject(new Error("No worksheets found in Excel file"));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];

          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as unknown[][];

          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"));
            return;
          }

          const headers = jsonData[0];
          const dataRows = jsonData.slice(1);

          // Validate headers
          if (!headers || headers.length === 0) {
            reject(new Error("No headers found in Excel file"));
            return;
          }

          // Convert all data to strings and clean
          const stringHeaders = this.cleanHeaders(
            headers.map((h) => h?.toString() || ""),
            options.trimWhitespace
          );

          const stringRows = dataRows.map((row) =>
            row.map((cell) => cell?.toString() || "")
          );

          // Limit rows if specified
          const limitedRows = options.maxRows
            ? stringRows.slice(0, options.maxRows)
            : stringRows;

          resolve({
            headers: stringHeaders,
            rows: limitedRows,
            totalRows: limitedRows.length,
            fileName: file.name,
            fileSize: file.size,
            fileType: "xlsx",
          });
        } catch (error) {
          reject(
            new Error(
              `Failed to parse Excel file: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read Excel file"));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Parse file based on type
  static async parseFile(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<ParsedFileData> {
    console.log("FileProcessingService.parseFile called with:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      options,
    });

    const fileType = this.getFileType(file.name);
    console.log("Detected file type:", fileType);

    switch (fileType) {
      case "csv":
        console.log("Parsing as CSV...");
        return this.parseCSV(file, options);
      case "xlsx":
        console.log("Parsing as Excel...");
        return this.parseExcel(file, options);
      default:
        console.error("Unsupported file type:", fileType);
        throw new Error(
          `Unsupported file type: ${fileType}. Please upload a CSV or Excel file.`
        );
    }
  }

  // Get file type from filename
  static getFileType(fileName: string): "csv" | "xlsx" | "unknown" {
    console.log("getFileType called with fileName:", fileName);

    if (!fileName || typeof fileName !== "string") {
      console.error("Invalid fileName provided to getFileType:", fileName);
      return "unknown";
    }

    const extension = fileName.toLowerCase().split(".").pop();
    console.log("Extracted extension:", extension);

    switch (extension) {
      case "csv":
        return "csv";
      case "xlsx":
      case "xls":
        return "xlsx";
      default:
        return "unknown";
    }
  }

  // Clean headers - remove empty/null values and trim whitespace
  private static cleanHeaders(
    headers: string[],
    trimWhitespace: boolean = true
  ): string[] {
    return headers
      .map((header) => {
        if (!header) return "";
        const cleaned = trimWhitespace ? header.trim() : header;
        return cleaned || "";
      })
      .filter((header) => header.length > 0);
  }

  // Validate file before processing
  static validateFile(file: File): { valid: boolean; error?: string } {
    console.log("validateFile called with file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Check if file object is valid
    if (!file) {
      return {
        valid: false,
        error: "Invalid file object",
      };
    }

    // Check if file has a name
    if (!file.name || typeof file.name !== "string") {
      return {
        valid: false,
        error: "File name is required",
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(
          1
        )}MB) exceeds the 10MB limit`,
      };
    }

    // Check file type
    const fileType = this.getFileType(file.name);
    console.log("File type detected:", fileType);

    if (fileType === "unknown") {
      return {
        valid: false,
        error: "Please upload a CSV or Excel (.xlsx) file",
      };
    }

    return { valid: true };
  }

  // Get sample data for preview
  static getSampleData(rows: string[][], sampleSize: number = 5): string[][] {
    return rows.slice(0, sampleSize);
  }

  // Get unique values for a column (useful for dropdown suggestions)
  static getUniqueValues(
    rows: string[][],
    columnIndex: number,
    limit: number = 50
  ): string[] {
    const values = new Set<string>();

    for (const row of rows) {
      if (row[columnIndex] && row[columnIndex].trim()) {
        values.add(row[columnIndex].trim());
        if (values.size >= limit) break;
      }
    }

    return Array.from(values).sort();
  }

  // Check if column contains mostly empty values
  static getColumnStats(
    rows: string[][],
    columnIndex: number
  ): {
    totalRows: number;
    emptyRows: number;
    filledRows: number;
    fillPercentage: number;
    uniqueValues: number;
  } {
    const values = new Set<string>();
    let emptyRows = 0;

    for (const row of rows) {
      const value = row[columnIndex];
      if (!value || !value.trim()) {
        emptyRows++;
      } else {
        values.add(value.trim());
      }
    }

    const totalRows = rows.length;
    const filledRows = totalRows - emptyRows;
    const fillPercentage =
      totalRows > 0 ? Math.round((filledRows / totalRows) * 100) : 0;

    return {
      totalRows,
      emptyRows,
      filledRows,
      fillPercentage,
      uniqueValues: values.size,
    };
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Export data to CSV (for debugging/testing)
  static exportToCSV(data: string[][], filename: string = "export.csv"): void {
    const csvContent = data
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
