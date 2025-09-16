"use client";

import { useState } from "react";
import { Users, Settings, FileUp, Database, Sparkles } from "lucide-react";
import ContactsTable from "./components/ContactsTable";
import ImportModal from "./components/ImportModal";
import UserManagement from "./components/UserManagement";
import FieldManagement from "./components/FieldManagement";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabType = "contacts" | "import" | "users" | "fields";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("contacts");
  const [showImportModal, setShowImportModal] = useState(false);

  const tabs = [
    { id: "contacts" as TabType, label: "Contacts", icon: Database },
    { id: "users" as TabType, label: "Users", icon: Users },
    { id: "fields" as TabType, label: "Fields", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "contacts":
        return <ContactsTable onImportClick={() => setShowImportModal(true)} />;
      case "users":
        return <UserManagement />;
      case "fields":
        return <FieldManagement />;
      default:
        return <ContactsTable onImportClick={() => setShowImportModal(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Contact Importer
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Smart Field Mapping & AI-Powered Import
                </p>
              </div>
            </div>

            {/* Import Button */}
            <Button
              onClick={() => setShowImportModal(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Import Contacts
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="contacts" className="mt-0">
            {renderContent()}
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {renderContent()}
          </TabsContent>

          <TabsContent value="fields" className="mt-0">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            setActiveTab("contacts");
          }}
        />
      )}
    </div>
  );
}
