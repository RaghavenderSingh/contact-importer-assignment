import { ContactField, User } from "../types/firestore";
import { userService } from "./collections";

// Field mapping patterns for intelligent detection
const FIELD_PATTERNS = {
  firstName: {
    keywords: ["first", "given", "fname", "forename", "name"],
    patterns: [/^first.?name$/i, /^given.?name$/i, /^f.?name$/i],
    priority: 90,
  },
  lastName: {
    keywords: ["last", "family", "surname", "lname"],
    patterns: [/^last.?name$/i, /^family.?name$/i, /^surname$/i, /^l.?name$/i],
    priority: 90,
  },
  email: {
    keywords: ["email", "e-mail", "mail", "address"],
    patterns: [/^e.?mail$/i, /^email.?address$/i, /@/],
    priority: 95,
  },
  phone: {
    keywords: ["phone", "mobile", "cell", "telephone", "tel", "number"],
    patterns: [
      /^phone$/i,
      /^mobile$/i,
      /^cell$/i,
      /^tel$/i,
      /^\d{3}[-.]?\d{3}[-.]?\d{4}$/,
    ],
    priority: 85,
  },
  agentUid: {
    keywords: ["agent", "rep", "representative", "assigned", "owner"],
    patterns: [/^agent$/i, /^rep$/i, /^assigned$/i, /^owner$/i],
    priority: 80,
  },
};

// Data type detection patterns
const DATA_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
  date: /^\d{4}[-\/]\d{2}[-\/]\d{2}$|^\d{2}[-\/]\d{2}[-\/]\d{4}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,
  number: /^\d+(\.\d+)?$/,
  url: /^https?:\/\/.+/,
  boolean: /^(true|false|yes|no|y|n|1|0)$/i,
};

export interface FieldDetectionResult {
  columnName: string;
  suggestedField: string;
  confidence: number;
  dataType: string;
  sampleData: string[];
  isCustomField: boolean;
  customFieldConfig?: Partial<ContactField>;
}

export class FieldMappingService {
  private contactFields: ContactField[] = [];
  private users: User[] = [];

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      // Load contact fields and users for mapping
      const { contactFieldService } = await import("./collections");
      this.contactFields = await contactFieldService.getFields();
      this.users = await userService.getUsers();
    } catch (error) {
      console.error("Failed to load data for field mapping:", error);
    }
  }

  // Main method to analyze CSV headers and suggest mappings
  async analyzeFileHeaders(
    headers: string[],
    sampleData: string[][]
  ): Promise<FieldDetectionResult[]> {
    const results: FieldDetectionResult[] = [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const columnData = sampleData
        .map((row) => row[i])
        .filter((val) => val && val.toString().trim());

      const detection = await this.detectField(header, columnData);
      results.push({
        columnName: header,
        suggestedField: detection.field,
        confidence: detection.confidence,
        dataType: detection.dataType,
        sampleData: columnData.slice(0, 5), // First 5 sample values
        isCustomField: detection.isCustomField,
        customFieldConfig: detection.customFieldConfig,
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  // Detect what field a column should map to
  private async detectField(
    header: string,
    sampleData: string[]
  ): Promise<{
    field: string;
    confidence: number;
    dataType: string;
    isCustomField: boolean;
    customFieldConfig?: Partial<ContactField>;
  }> {
    const normalizedHeader = header.toLowerCase().trim();

    // Check against core field patterns
    for (const [fieldName, config] of Object.entries(FIELD_PATTERNS)) {
      const keywordMatch = config.keywords.some((keyword) =>
        normalizedHeader.includes(keyword.toLowerCase())
      );

      const patternMatch = config.patterns.some((pattern) =>
        pattern.test(normalizedHeader)
      );

      if (keywordMatch || patternMatch) {
        const confidence = this.calculateConfidence(
          header,
          sampleData,
          fieldName
        );
        if (confidence > 50) {
          return {
            field: fieldName,
            confidence,
            dataType: this.detectDataType(sampleData),
            isCustomField: false,
          };
        }
      }
    }

    // Check for agent email mapping
    if (this.isAgentEmail(sampleData)) {
      return {
        field: "agentUid",
        confidence: 85,
        dataType: "email",
        isCustomField: false,
      };
    }

    // Check existing custom fields
    const customFieldMatch = this.matchCustomField(header, sampleData);
    if (customFieldMatch) {
      return customFieldMatch;
    }

    // Suggest creating a new custom field
    return {
      field: "new_custom_field",
      confidence: 30,
      dataType: this.detectDataType(sampleData),
      isCustomField: true,
      customFieldConfig: {
        label: this.formatFieldLabel(header),
        fieldName: this.generateFieldName(header),
        type: this.suggestFieldType(sampleData),
        core: false,
      },
    };
  }

  // Calculate confidence score based on header similarity and data patterns
  private calculateConfidence(
    header: string,
    sampleData: string[],
    fieldName: string
  ): number {
    let confidence = 0;

    // Header similarity (40% weight)
    const config = FIELD_PATTERNS[fieldName as keyof typeof FIELD_PATTERNS];
    if (config) {
      const keywordScore = config.keywords.reduce((score, keyword) => {
        if (header.toLowerCase().includes(keyword.toLowerCase())) {
          return score + (keyword.length / header.length) * 100;
        }
        return score;
      }, 0);

      const patternScore = config.patterns.some((pattern) =>
        pattern.test(header)
      )
        ? 80
        : 0;
      confidence += Math.max(keywordScore, patternScore) * 0.4;
    }

    // Data pattern matching (60% weight)
    const dataPatternScore = this.getDataPatternScore(sampleData, fieldName);
    confidence += dataPatternScore * 0.6;

    // Bonus for exact matches
    if (header.toLowerCase() === fieldName.toLowerCase()) {
      confidence += 20;
    }

    return Math.min(Math.round(confidence), 100);
  }

  // Get data pattern score for specific field types
  private getDataPatternScore(sampleData: string[], fieldName: string): number {
    if (sampleData.length === 0) return 0;

    let matchingSamples = 0;

    switch (fieldName) {
      case "email":
        matchingSamples = sampleData.filter((data) =>
          DATA_PATTERNS.email.test(data.toString())
        ).length;
        break;

      case "phone":
        matchingSamples = sampleData.filter((data) =>
          DATA_PATTERNS.phone.test(data.toString().replace(/[\s\-\(\)]/g, ""))
        ).length;
        break;

      case "firstName":
      case "lastName":
        // Names should be mostly alphabetic
        matchingSamples = sampleData.filter(
          (data) =>
            /^[a-zA-Z\s\-']+$/.test(data.toString()) &&
            data.toString().trim().length > 1
        ).length;
        break;
    }

    return (matchingSamples / sampleData.length) * 100;
  }

  // Detect data type from sample data
  private detectDataType(sampleData: string[]): string {
    if (sampleData.length === 0) return "text";

    const samples = sampleData.slice(0, 10); // Check first 10 samples

    // Check for email pattern
    if (
      samples.every((sample) => DATA_PATTERNS.email.test(sample.toString()))
    ) {
      return "email";
    }

    // Check for phone pattern
    if (
      samples.every((sample) =>
        DATA_PATTERNS.phone.test(sample.toString().replace(/[\s\-\(\)]/g, ""))
      )
    ) {
      return "phone";
    }

    // Check for date pattern
    if (samples.every((sample) => DATA_PATTERNS.date.test(sample.toString()))) {
      return "datetime";
    }

    // Check for number pattern
    if (
      samples.every((sample) => DATA_PATTERNS.number.test(sample.toString()))
    ) {
      return "number";
    }

    // Check for boolean pattern
    if (
      samples.every((sample) => DATA_PATTERNS.boolean.test(sample.toString()))
    ) {
      return "checkbox";
    }

    return "text";
  }

  // Check if sample data contains agent emails
  private isAgentEmail(sampleData: string[]): boolean {
    if (sampleData.length === 0) return false;

    const emailSamples = sampleData.filter((sample) =>
      DATA_PATTERNS.email.test(sample.toString())
    );

    if (emailSamples.length === 0) return false;

    // Check if any emails match users in the system
    return emailSamples.some((email) =>
      this.users.some((user) => user.email === email.toString())
    );
  }

  // Match against existing custom fields
  private matchCustomField(
    header: string,
    sampleData: string[]
  ): {
    field: string;
    confidence: number;
    dataType: string;
    isCustomField: boolean;
  } | null {
    const normalizedHeader = header.toLowerCase();

    for (const field of this.contactFields) {
      if (field.core) continue;

      const fieldLabelMatch =
        field.label.toLowerCase().includes(normalizedHeader) ||
        normalizedHeader.includes(field.label.toLowerCase());

      if (fieldLabelMatch) {
        return {
          field: field.fieldName,
          confidence: 75,
          dataType: field.type,
          isCustomField: false,
        };
      }
    }

    return null;
  }

  // Format field label for display
  private formatFieldLabel(header: string): string {
    return header
      .split(/[\s\-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Generate field name from header
  private generateFieldName(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .join("")
      .substring(0, 20); // Limit length
  }

  // Suggest field type based on data
  private suggestFieldType(
    sampleData: string[]
  ): "text" | "number" | "phone" | "email" | "datetime" | "checkbox" {
    const dataType = this.detectDataType(sampleData);

    switch (dataType) {
      case "email":
        return "email";
      case "phone":
        return "phone";
      case "datetime":
        return "datetime";
      case "number":
        return "number";
      case "checkbox":
        return "checkbox";
      default:
        return "text";
    }
  }

  // Map agent email to UID
  async mapAgentEmail(email: string): Promise<string | null> {
    const user = await userService.getUserByEmail(email);
    return user?.uid || null;
  }

  // Get confidence color class
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return "text-green-600 bg-green-50";
    if (confidence >= 70) return "text-blue-600 bg-blue-50";
    if (confidence >= 50) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  }

  // Get confidence label
  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 90) return "High";
    if (confidence >= 70) return "Good";
    if (confidence >= 50) return "Medium";
    return "Low";
  }
}
