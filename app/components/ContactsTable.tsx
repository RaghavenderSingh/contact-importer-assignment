"use client";

import { useState, useEffect } from "react";
import { Search, User, Mail, Phone, Calendar } from "lucide-react";
import { Contact, User as UserType } from "../../types/firestore";
import { contactService, userService } from "../../lib/collections";

interface ContactsTableProps {
  onImportClick: () => void;
}

export default function ContactsTable({ onImportClick }: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsData, usersData] = await Promise.all([
        contactService.getContacts(100),
        userService.getUsers(),
      ]);

      setContacts(contactsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !searchTerm ||
      contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm);

    const matchesAgent =
      selectedAgent === "all" ||
      (selectedAgent === "unassigned" && !contact.agentUid) ||
      contact.agentUid === selectedAgent;

    return matchesSearch && matchesAgent;
  });

  const getAgentName = (agentUid?: string): string => {
    if (!agentUid) return "Unassigned";
    const agent = users.find((user) => user.uid === agentUid);
    return agent?.name || "Unknown Agent";
  };

  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return "N/A";

    // Handle Firestore Timestamp objects
    if (
      typeof timestamp === "object" &&
      timestamp !== null &&
      "toDate" in timestamp
    ) {
      const firestoreTimestamp = timestamp as { toDate: () => Date };
      return firestoreTimestamp.toDate().toLocaleDateString();
    }

    // Handle regular Date objects or date strings
    try {
      const date = new Date(timestamp as string | number | Date);
      return date.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your contact database ({filteredContacts.length} contacts)
          </p>
        </div>

        <button
          onClick={onImportClick}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Import Contacts
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="sm:w-48">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option key="all" value="all">
                All Agents
              </option>
              <option key="unassigned" value="unassigned">
                Unassigned
              </option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No contacts found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedAgent !== "all"
                ? "Try adjusting your search or filters."
                : "Get started by importing your first contacts."}
            </p>
            {!searchTerm && selectedAgent === "all" && (
              <div className="mt-6">
                <button
                  onClick={onImportClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Import Contacts
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {contact.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contact.agentUid
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getAgentName(contact.agentUid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(contact.createdOn)}
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
