import { DocumentAsset } from '../models/DocumentAsset';
import { PrintJob } from '../models/PrintJob';
import { deleteStoredDocument } from './cloudinary.service';

const cleanupIntervalMs = 15 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;
let cleanupRunning = false;

async function dropLegacyTtlIndex() {
  try {
    const indexes = await DocumentAsset.collection.indexes();
    const ttlIndex = indexes.find((index) => index.name === 'expiresAt_1' && typeof index.expireAfterSeconds === 'number');

    if (ttlIndex?.name) {
      await DocumentAsset.collection.dropIndex(ttlIndex.name);
      console.log('Dropped legacy document TTL index; cleanup worker now handles file deletion.');
    }
  } catch (error) {
    console.warn('Could not inspect/drop document TTL index', error);
  }
}

async function expireRelatedPrintJobs(documentId: unknown) {
  await PrintJob.updateMany(
    {
      document: documentId,
      status: { $in: ['pending', 'processing', 'printing'] },
    },
    {
      $set: { status: 'expired' },
      $push: {
        statusHistory: {
          status: 'expired',
          message: 'Document expired and was deleted automatically',
          at: new Date(),
        },
      },
    }
  );
}

export async function cleanupExpiredDocuments() {
  if (cleanupRunning) return;
  cleanupRunning = true;

  try {
    const now = new Date();
    const expiredDocuments = await DocumentAsset.find({
      expiresAt: { $lte: now },
      deletedAt: { $exists: false },
    })
      .sort({ expiresAt: 1 })
      .limit(100);

    for (const document of expiredDocuments) {
      try {
        await deleteStoredDocument(document.publicId);
        await expireRelatedPrintJobs(document._id);
        await DocumentAsset.deleteOne({ _id: document._id });
        console.log(`Deleted expired document ${document._id}`);
      } catch (error) {
        console.error(`Failed to delete expired document ${document._id}`, error);
      }
    }
  } finally {
    cleanupRunning = false;
  }
}

export async function startExpiredDocumentCleanup() {
  await dropLegacyTtlIndex();
  await cleanupExpiredDocuments();

  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      cleanupExpiredDocuments().catch((error) => {
        console.error('Expired document cleanup failed', error);
      });
    }, cleanupIntervalMs);
  }
}
