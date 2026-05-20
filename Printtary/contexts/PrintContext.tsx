import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/expo';
import { DocumentPrintSettings, PrintJob, PrintSettings, UploadedFile, Shop } from '@/types';
import { fetchJobStatus, uploadDocument } from '@/services/printService';
import { getRealtimeSocket } from '@/services/realtime';
import { PRINT_CONFIG } from '@/constants/config';

interface PrintContextType {
  // Current flow state
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  selectedFile: UploadedFile | null;
  setSelectedFile: (file: UploadedFile | null) => void;
  selectedFiles: UploadedFile[];
  setSelectedFiles: (files: UploadedFile[]) => void;
  printSettings: PrintSettings;
  setPrintSettings: (settings: PrintSettings) => void;
  currentJob: PrintJob | null;
  setCurrentJob: (job: PrintJob | null) => void;

  // Job history
  jobHistory: PrintJob[];
  addJobToHistory: (job: PrintJob) => void;

  // Upload flow
  isUploading: boolean;
  uploadProgress: number;
  submitPrintJob: (
    file: UploadedFile | UploadedFile[],
    settings: PrintSettings,
    shopId: string,
    usedDefaultSettings?: boolean,
    documentSettings?: DocumentPrintSettings[]
  ) => Promise<PrintJob>;

  // Reset
  resetFlow: () => void;
}

export const PrintContext = createContext<PrintContextType | undefined>(undefined);

const DEFAULT_SETTINGS = PRINT_CONFIG.defaultSettings as PrintSettings;

const HISTORY_KEY_PREFIX = 'printopay:job-history';

function reviveDate(value?: string | Date) {
  return value ? new Date(value) : new Date();
}

function reviveJob(raw: PrintJob): PrintJob {
  return {
    ...raw,
    createdAt: reviveDate(raw.createdAt),
    updatedAt: reviveDate(raw.updatedAt),
    file: {
      ...raw.file,
      uploadedAt: reviveDate(raw.file.uploadedAt),
      expiresAt: raw.file.expiresAt ? reviveDate(raw.file.expiresAt) : undefined,
    },
    files: raw.files?.map((file) => ({
      ...file,
      uploadedAt: reviveDate(file.uploadedAt),
      expiresAt: file.expiresAt ? reviveDate(file.expiresAt) : undefined,
    })),
    statusHistory: raw.statusHistory?.map((entry) => ({
      ...entry,
      timestamp: reviveDate(entry.timestamp),
    })) ?? [],
  };
}

export function PrintProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const userId = user?.id;
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [selectedFiles, setSelectedFilesState] = useState<UploadedFile[]>([]);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [currentJob, setCurrentJob] = useState<PrintJob | null>(null);
  const [jobHistory, setJobHistory] = useState<PrintJob[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addJobToHistory = useCallback((job: PrintJob) => {
    setJobHistory(prev => [job, ...prev.filter(item => item.id !== job.id)]);
  }, []);

  const setSelectedFiles = useCallback((files: UploadedFile[]) => {
    setSelectedFilesState(files);
    setSelectedFile(files[0] ?? null);
  }, []);

  useEffect(() => {
    if (!isUserLoaded) return;

    let cancelled = false;
    const loadHistory = async () => {
      setHistoryReady(false);

      if (!userId) {
        setJobHistory([]);
        setHistoryReady(true);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(`${HISTORY_KEY_PREFIX}:${userId}`);
        if (cancelled) return;

        const parsed = stored ? JSON.parse(stored) as PrintJob[] : [];
        setJobHistory(parsed.map(reviveJob));
      } catch {
        if (!cancelled) setJobHistory([]);
      } finally {
        if (!cancelled) setHistoryReady(true);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isUserLoaded, userId]);

  useEffect(() => {
    if (!historyReady || !userId) return;
    AsyncStorage.setItem(`${HISTORY_KEY_PREFIX}:${userId}`, JSON.stringify(jobHistory)).catch(() => undefined);
  }, [historyReady, jobHistory, userId]);

  const refreshJob = useCallback(async (jobId: string) => {
    const updatedJob = await fetchJobStatus(jobId);
    if (!updatedJob) return;

    setCurrentJob((current) => current?.id === jobId ? { ...updatedJob, otp: current.otp || updatedJob.otp } : current);
    setJobHistory((current) => current.map((job) => (
      job.id === jobId ? { ...updatedJob, otp: job.otp || updatedJob.otp } : job
    )));
  }, []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const handleJobChange = (payload?: { jobId?: string }) => {
      if (!payload?.jobId) return;
      refreshJob(payload.jobId).catch(() => undefined);
    };

    socket.on('print-jobs:changed', handleJobChange);

    return () => {
      socket.off('print-jobs:changed', handleJobChange);
    };
  }, [refreshJob]);

  const submitPrintJob = useCallback(async (
    file: UploadedFile | UploadedFile[],
    settings: PrintSettings,
    shopId: string,
    usedDefaultSettings?: boolean,
    documentSettings?: DocumentPrintSettings[]
  ): Promise<PrintJob> => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const job = await uploadDocument(file, settings, shopId, usedDefaultSettings, documentSettings, (p) => {
        setUploadProgress(p);
      });
      setCurrentJob(job);
      addJobToHistory(job);
      return job;
    } finally {
      setIsUploading(false);
    }
  }, [addJobToHistory]);

  const resetFlow = useCallback(() => {
    setSelectedShop(null);
    setSelectedFile(null);
    setSelectedFilesState([]);
    setPrintSettings(DEFAULT_SETTINGS);
    setCurrentJob(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  return (
    <PrintContext.Provider value={{
      selectedShop,
      setSelectedShop,
      selectedFile,
      setSelectedFile,
      selectedFiles,
      setSelectedFiles,
      printSettings,
      setPrintSettings,
      currentJob,
      setCurrentJob,
      jobHistory,
      addJobToHistory,
      isUploading,
      uploadProgress,
      submitPrintJob,
      resetFlow,
    }}>
      {children}
    </PrintContext.Provider>
  );
}
