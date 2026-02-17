import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null = null;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    this.bucketName = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'arcane-media';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase disabled: SUPABASE_URL or SUPABASE_SERVICE_KEY not configured');
      this.supabase = null;
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized');
  }

  /**
   * Upload a file to Supabase Storage
   * @param file - File buffer
   * @param fileName - Name of the file
   * @param folder - Optional folder path (e.g., 'avatars', 'documents')
   * @returns Public URL of the uploaded file
   */
  async uploadFile(file: Buffer, fileName: string, folder?: string): Promise<string> {
    this.ensureClient();
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await this.supabase!.storage.from(this.bucketName).upload(
      filePath,
      file,
      {
        contentType: 'auto',
        upsert: true,
      },
    );

    if (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return this.getPublicUrl(data.path);
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - Path to the file in storage
   */
  async deleteFile(filePath: string): Promise<void> {
    this.ensureClient();
    const normalizedPath = this.extractStoragePath(filePath);
    const { error } = await this.supabase!.storage.from(this.bucketName).remove([normalizedPath]);

    if (error) {
      this.logger.error(`Failed to delete file (${normalizedPath}): ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    this.logger.log(`File deleted: ${normalizedPath}`);
  }

  /**
   * Get public URL for a file
   * @param filePath - Path to the file in storage
   * @returns Public URL
   */
  getPublicUrl(filePath: string): string {
    this.ensureClient();
    const { data } = this.supabase!.storage.from(this.bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  }

  /**
   * Normalize a storage input (full URL or plain path) into a path relative to the bucket root.
   */
  extractStoragePath(urlOrPath: string): string {
    const raw = (urlOrPath ?? '').trim();
    if (!raw) {
      throw new Error('Storage path is empty');
    }

    const parseCandidate = (candidate: string) => {
      const withoutQuery = candidate.split('?')[0];
      return withoutQuery.replace(/^\/+/, '');
    };

    let pathCandidate = raw;
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        pathCandidate = new URL(raw).pathname;
      } catch {
        pathCandidate = raw;
      }
    }

    const normalized = parseCandidate(pathCandidate);
    const prefixes = [
      `storage/v1/object/public/${this.bucketName}/`,
      `storage/v1/object/sign/${this.bucketName}/`,
      `storage/v1/object/authenticated/${this.bucketName}/`,
      `storage/v1/object/${this.bucketName}/`,
      `${this.bucketName}/`,
    ];

    for (const prefix of prefixes) {
      if (normalized.startsWith(prefix)) {
        return decodeURIComponent(normalized.slice(prefix.length));
      }
    }

    return decodeURIComponent(normalized);
  }

  /**
   * Create a signed URL for private bucket playback/download.
   */
  async createSignedUrl(pathOrUrl: string, expiresInSec = 3600): Promise<string> {
    this.ensureClient();
    const normalizedPath = this.extractStoragePath(pathOrUrl);
    const { data, error } = await this.supabase!.storage.from(this.bucketName).createSignedUrl(
      normalizedPath,
      expiresInSec,
    );

    if (error || !data?.signedUrl) {
      this.logger.error(
        `Failed to create signed URL (${normalizedPath}): ${error?.message ?? 'unknown error'}`,
      );
      throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`);
    }

    return data.signedUrl;
  }

  /**
   * List all files in a folder
   * @param folder - Folder path
   * @returns List of files
   */
  async listFiles(folder?: string): Promise<any[]> {
    this.ensureClient();
    const { data, error } = await this.supabase!.storage.from(this.bucketName).list(folder);

    if (error) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data;
  }

  /**
   * Download a file from Supabase Storage
   * @param filePath - Path to the file in storage
   * @returns File blob
   */
  async downloadFile(filePath: string): Promise<Blob> {
    this.ensureClient();
    const normalizedPath = this.extractStoragePath(filePath);
    const { data, error } = await this.supabase!.storage.from(this.bucketName).download(
      normalizedPath,
    );

    if (error) {
      this.logger.error(`Failed to download file (${normalizedPath}): ${error.message}`);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }

  private ensureClient() {
    if (!this.supabase) {
      throw new Error(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.',
      );
    }
  }
}
