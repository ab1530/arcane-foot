'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationStatus } from '../types';
import { validationService } from '@/services/validationService';

interface BulkActionsProps {
  onImportComplete?: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ onImportComplete }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [autoVerify, setAutoVerify] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (status?: VerificationStatus) => validationService.exportToCsv(status),
    onSuccess: (data) => {
      validationService.downloadCsv(data);
      toast.success('Players exported successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export players');
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: ({ content, verify }: { content: string; verify: boolean }) =>
      validationService.bulkImportCsv(content, verify),
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['validation-stats'] });

      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.imported} players!`);
      } else {
        toast.warning(
          `Imported ${result.imported} players, ${result.failed} failed. Check results for details.`
        );
      }

      if (onImportComplete) {
        onImportComplete();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import players');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setShowImportModal(true);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!csvContent.trim()) {
      toast.error('No CSV content to import');
      return;
    }
    importMutation.mutate({ content: csvContent, verify: autoVerify });
  };

  const handleExport = (status?: VerificationStatus) => {
    exportMutation.mutate(status);
  };

  const handleCloseModal = () => {
    setShowImportModal(false);
    setCsvContent('');
    setAutoVerify(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="border-arcane-darkBorder">
        <CardHeader>
          <CardTitle className="text-lg font-ananstonExpanded uppercase">
            Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-arcane-grey uppercase tracking-wider">
                Import Players
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV File
              </Button>
              <p className="text-xs text-arcane-grey">
                Import multiple players from a CSV file. Required columns: firstName, lastName,
                email, position, dateOfBirth, nationality
              </p>
            </div>

            {/* Export Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-arcane-grey uppercase tracking-wider">
                Export Players
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport()}
                  loading={exportMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(VerificationStatus.VERIFIED)}
                    loading={exportMutation.isPending}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(VerificationStatus.PENDING)}
                    loading={exportMutation.isPending}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Pending
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CSV Template Download */}
          <div className="mt-6 pt-6 border-t border-arcane-darkBorder">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">CSV Template</h3>
                <p className="text-xs text-arcane-grey">
                  Download a template CSV file to see the correct format
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const template =
                    'firstName,lastName,email,phone,dateOfBirth,nationality,position,height,weight,preferredFoot,currentClub\n' +
                    'John,Doe,john.doe@example.com,+1234567890,1998-01-15,United States,Forward,180,75,Right,Example FC\n' +
                    'Jane,Smith,jane.smith@example.com,+0987654321,1999-05-20,United Kingdom,Midfielder,165,60,Left,Sample United';
                  validationService.downloadCsv(template, 'players-template.csv');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl bg-arcane-darkCard border border-arcane-darkBorder rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-arcane-darkBorder">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-arcane-accent/10 rounded-lg">
                    <Upload className="w-6 h-6 text-arcane-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-ananstonExpanded text-white">
                      Import Players
                    </h2>
                    <p className="text-sm text-arcane-grey">
                      {importResult ? 'Import Complete' : 'Review and confirm import'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {!importResult ? (
                  <>
                    {/* Preview */}
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                        CSV Preview
                      </h3>
                      <div className="bg-arcane-darkBorder/30 rounded-lg p-4 max-h-60 overflow-auto">
                        <pre className="text-xs text-arcane-grey font-mono whitespace-pre-wrap">
                          {csvContent.split('\n').slice(0, 10).join('\n')}
                          {csvContent.split('\n').length > 10 && '\n...'}
                        </pre>
                      </div>
                      <p className="text-xs text-arcane-grey mt-2">
                        {csvContent.split('\n').length - 1} rows detected
                      </p>
                    </div>

                    {/* Options */}
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                        Import Options
                      </h3>
                      <label className="flex items-center gap-3 p-4 bg-arcane-darkBorder/30 rounded-lg cursor-pointer hover:bg-arcane-darkBorder/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={autoVerify}
                          onChange={(e) => setAutoVerify(e.target.checked)}
                          className="w-5 h-5 rounded border-arcane-darkBorder bg-arcane-darkCard text-arcane-accent focus:ring-arcane-accent focus:ring-offset-arcane-darkCard"
                        />
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Auto-verify imported players
                          </div>
                          <div className="text-xs text-arcane-grey">
                            Automatically set verification status to VERIFIED for all imported
                            players
                          </div>
                        </div>
                      </label>
                    </div>
                  </>
                ) : (
                  // Import Results
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-arcane-darkBorder bg-green-500/10">
                        <CardContent className="py-6">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div>
                              <div className="text-2xl font-bold text-white">
                                {importResult.imported}
                              </div>
                              <div className="text-sm text-arcane-grey">Imported</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-arcane-darkBorder bg-red-500/10">
                        <CardContent className="py-6">
                          <div className="flex items-center gap-3">
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div>
                              <div className="text-2xl font-bold text-white">
                                {importResult.failed}
                              </div>
                              <div className="text-sm text-arcane-grey">Failed</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Errors */}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          Import Errors
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {importResult.errors.map((error: any, index: number) => (
                            <div
                              key={index}
                              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                            >
                              <div className="text-sm font-semibold text-white mb-1">
                                Row {error.row}: {error.field}
                              </div>
                              <div className="text-xs text-arcane-grey">{error.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {importResult.failed === 0 && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div>
                            <div className="text-sm font-bold text-white">
                              All players imported successfully!
                            </div>
                            <div className="text-xs text-arcane-grey">
                              {importResult.imported} players have been added to the database
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-arcane-darkBorder bg-arcane-darkAlt">
                {!importResult ? (
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button onClick={handleImport} loading={importMutation.isPending}>
                      {importMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Players
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button onClick={handleCloseModal}>Close</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
