"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Settings, Edit2, Trash2, Check, X, Lock } from "lucide-react";
import { ContactField } from "../../types/firestore";
import { contactFieldService } from "../../lib/collections";

export default function FieldManagement() {
  const [fields, setFields] = useState<ContactField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<ContactField | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    fieldName: "",
    type: "text" as
      | "text"
      | "number"
      | "phone"
      | "email"
      | "datetime"
      | "checkbox",
    required: false,
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const fieldsData = await contactFieldService.getFields();
      setFields(fieldsData);
    } catch (error) {
      console.error("Failed to load fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim() || !formData.fieldName.trim()) {
      return;
    }

    try {
      if (editingField) {
        if (!editingField.core) {
          await contactFieldService.updateField(editingField.id, {
            label: formData.label.trim(),
            fieldName: formData.fieldName.trim(),
            type: formData.type,
            required: formData.required,
          });
        }
      } else {
        await contactFieldService.createField({
          label: formData.label.trim(),
          fieldName: formData.fieldName.trim(),
          type: formData.type,
          core: false,
          required: formData.required,
        });
      }

      setFormData({ label: "", fieldName: "", type: "text", required: false });
      setShowAddForm(false);
      setEditingField(null);
      await loadFields();
    } catch (error) {
      console.error("Failed to save field:", error);
    }
  };

  const handleEdit = (field: ContactField) => {
    setEditingField(field);
    setFormData({
      label: field.label,
      fieldName: field.fieldName,
      type: field.type,
      required: field.required || false,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (field: ContactField) => {
    if (field.core) {
      alert("Core fields cannot be deleted");
      return;
    }

    if (
      !confirm(`Are you sure you want to delete the "${field.label}" field?`)
    ) {
      return;
    }

    try {
      await contactFieldService.deleteField(field.id);
      await loadFields();
    } catch (error) {
      console.error("Failed to delete field:", error);
      if (error instanceof Error && error.message.includes("core fields")) {
        alert("Core fields cannot be deleted");
      }
    }
  };

  const cancelEdit = () => {
    setFormData({ label: "", fieldName: "", type: "text", required: false });
    setShowAddForm(false);
    setEditingField(null);
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .join("")
      .substring(0, 20);
  };

  const handleLabelChange = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      label,
      fieldName: editingField?.core ? prev.fieldName : generateFieldName(label),
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const coreFields = fields.filter((f) => f.core);
  const customFields = fields.filter((f) => !f.core);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Field Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage contact fields and custom properties ({fields.length} total
            fields)
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingField ? "Edit Field" : "Add Custom Field"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Label
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Company Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name
                </label>
                <input
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fieldName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., company"
                  required
                  disabled={editingField?.core}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Internal field name (lowercase, no spaces)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editingField?.core}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="datetime">Date/Time</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={editingField?.core}
                />
                <label
                  htmlFor="required"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Required field
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingField ? "Update Field" : "Add Field"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Core Fields</h3>
            <span className="ml-2 text-sm text-gray-500">
              ({coreFields.length} fields)
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            These fields are required for the system and cannot be deleted or
            modified.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coreFields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Lock className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {field.fieldName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {field.required ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Core Field
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Plus className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Custom Fields
              </h3>
              <span className="ml-2 text-sm text-gray-500">
                ({customFields.length} fields)
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Custom fields you can add, edit, or remove as needed.
          </p>
        </div>

        {customFields.length === 0 ? (
          <div className="text-center py-12">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No custom fields
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add custom fields to store additional contact information.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Field
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {field.fieldName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {field.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {field.required ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(field)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit field"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(field)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
