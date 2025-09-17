"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Users, RefreshCw } from "lucide-react";

interface ImportSummaryStepProps {
  results?: {
    imported: number;
    merged: number;
    errors: number;
    errorDetails: string[];
  };
}

export default function ImportSummaryStep({ results }: ImportSummaryStepProps) {
  const defaultResults = {
    imported: 0,
    merged: 0,
    errors: 0,
    errorDetails: [],
  };

  const finalResults = results || defaultResults;
  const totalProcessed =
    finalResults.imported + finalResults.merged + finalResults.errors;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-12 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </motion.div>

        <h2 className="text-3xl font-bold text-[#0E4259] mb-4">
          Import Complete!
        </h2>

        <p className="text-lg text-[#68818C] mb-8">
          Your contacts have been successfully processed and imported into the
          CRM system.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-[#0E4259] mb-4">
            Import Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {finalResults.imported}
              </div>
              <div className="text-sm text-gray-600">New Contacts</div>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {finalResults.merged}
              </div>
              <div className="text-sm text-gray-600">Merged Contacts</div>
            </div>

            <div className="bg-white border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">
                {finalResults.errors}
              </div>
              <div className="text-sm text-gray-600">Errors Found</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">
              Total Records Processed
            </div>
            <div className="text-xl font-semibold text-[#0E4259]">
              {totalProcessed}
            </div>
          </div>
        </motion.div>

        {finalResults.errors > 0 && finalResults.errorDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8"
          >
            <h4 className="text-lg font-semibold text-red-800 mb-4">
              Error Details
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {finalResults.errorDetails.map((error, index) => (
                <div
                  key={index}
                  className="text-sm text-red-700 bg-white border border-red-200 rounded p-2"
                >
                  {error}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-lg font-semibold text-green-800">
              Import Successful
            </span>
          </div>
          <p className="text-green-700">
            {finalResults.imported > 0 &&
              `${finalResults.imported} new contacts`}
            {finalResults.imported > 0 && finalResults.merged > 0 && " and "}
            {finalResults.merged > 0 &&
              `${finalResults.merged} existing contacts updated`}
            {finalResults.imported === 0 &&
              finalResults.merged === 0 &&
              "No contacts were imported"}
            {finalResults.errors > 0 &&
              ` (${finalResults.errors} errors encountered)`}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
