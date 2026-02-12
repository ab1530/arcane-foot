import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { createClient } from '@supabase/supabase-js';

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: ConfigService;
  let mockSupabaseClient: any;

  const mockStorageMethods = {
    upload: jest.fn(),
    remove: jest.fn(),
    getPublicUrl: jest.fn(),
    list: jest.fn(),
    download: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabaseClient = {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: mockStorageMethods.upload,
          remove: mockStorageMethods.remove,
          getPublicUrl: mockStorageMethods.getPublicUrl,
          list: mockStorageMethods.list,
          download: mockStorageMethods.download,
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
              if (key === 'SUPABASE_SERVICE_KEY') return 'test-service-key';
              if (key === 'SUPABASE_STORAGE_BUCKET') return 'test-bucket';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize Supabase client with correct credentials', () => {
      expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-service-key');
    });

    it('should disable client gracefully if SUPABASE_URL is missing', async () => {
      (createClient as jest.Mock).mockClear();

      const module = await Test.createTestingModule({
        providers: [
          SupabaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'SUPABASE_SERVICE_KEY') return 'test-key';
                return null;
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<SupabaseService>(SupabaseService);
      expect(createClient).not.toHaveBeenCalled();
      await expect(testService.listFiles()).rejects.toThrow(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.',
      );
    });

    it('should disable client gracefully if SUPABASE_SERVICE_KEY is missing', async () => {
      (createClient as jest.Mock).mockClear();

      const module = await Test.createTestingModule({
        providers: [
          SupabaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
                return null;
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<SupabaseService>(SupabaseService);
      expect(createClient).not.toHaveBeenCalled();
      await expect(testService.uploadFile(Buffer.from('x'), 'file.txt')).rejects.toThrow(
        'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.',
      );
    });

    it('should use default bucket name if not provided', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SupabaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
                if (key === 'SUPABASE_SERVICE_KEY') return 'test-key';
                return null; // No bucket name
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<SupabaseService>(SupabaseService);
      expect(testService).toBeDefined();
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully without folder', async () => {
      const mockFile = Buffer.from('test file content');
      const mockFileName = 'test-file.txt';
      const mockPath = 'test-file.txt';
      const mockPublicUrl =
        'https://test.supabase.co/storage/v1/object/public/test-bucket/test-file.txt';

      mockStorageMethods.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await service.uploadFile(mockFile, mockFileName);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorageMethods.upload).toHaveBeenCalledWith(mockFileName, mockFile, {
        contentType: 'auto',
        upsert: true,
      });
      expect(result).toBe(mockPublicUrl);
    });

    it('should upload file successfully with folder', async () => {
      const mockFile = Buffer.from('test file content');
      const mockFileName = 'test-file.txt';
      const mockFolder = 'avatars';
      const mockPath = 'avatars/test-file.txt';
      const mockPublicUrl =
        'https://test.supabase.co/storage/v1/object/public/test-bucket/avatars/test-file.txt';

      mockStorageMethods.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await service.uploadFile(mockFile, mockFileName, mockFolder);

      expect(mockStorageMethods.upload).toHaveBeenCalledWith('avatars/test-file.txt', mockFile, {
        contentType: 'auto',
        upsert: true,
      });
      expect(result).toBe(mockPublicUrl);
    });

    it('should throw error when upload fails', async () => {
      const mockFile = Buffer.from('test file content');
      const mockFileName = 'test-file.txt';
      const mockError = { message: 'Upload failed: insufficient permissions' };

      mockStorageMethods.upload.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.uploadFile(mockFile, mockFileName)).rejects.toThrow(
        'Failed to upload file: Upload failed: insufficient permissions',
      );
    });

    it('should upload file with upsert enabled (overwrite existing)', async () => {
      const mockFile = Buffer.from('updated content');
      const mockFileName = 'existing-file.txt';

      mockStorageMethods.upload.mockResolvedValue({
        data: { path: mockFileName },
        error: null,
      });

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      await service.uploadFile(mockFile, mockFileName);

      expect(mockStorageMethods.upload).toHaveBeenCalledWith(
        mockFileName,
        mockFile,
        expect.objectContaining({
          upsert: true,
        }),
      );
    });

    it('should handle empty file buffer', async () => {
      const mockFile = Buffer.from('');
      const mockFileName = 'empty-file.txt';

      mockStorageMethods.upload.mockResolvedValue({
        data: { path: mockFileName },
        error: null,
      });

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      const result = await service.uploadFile(mockFile, mockFileName);

      expect(result).toBeDefined();
      expect(mockStorageMethods.upload).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockFilePath = 'avatars/test-file.txt';

      mockStorageMethods.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.deleteFile(mockFilePath);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorageMethods.remove).toHaveBeenCalledWith([mockFilePath]);
    });

    it('should throw error when delete fails', async () => {
      const mockFilePath = 'avatars/test-file.txt';
      const mockError = { message: 'File not found' };

      mockStorageMethods.remove.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.deleteFile(mockFilePath)).rejects.toThrow(
        'Failed to delete file: File not found',
      );
    });

    it('should handle deletion of non-existent file', async () => {
      const mockFilePath = 'non-existent-file.txt';
      const mockError = { message: 'Object not found' };

      mockStorageMethods.remove.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.deleteFile(mockFilePath)).rejects.toThrow(
        'Failed to delete file: Object not found',
      );
    });

    it('should delete file from nested folder', async () => {
      const mockFilePath = 'documents/reports/2024/report.pdf';

      mockStorageMethods.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.deleteFile(mockFilePath);

      expect(mockStorageMethods.remove).toHaveBeenCalledWith([mockFilePath]);
    });
  });

  describe('getPublicUrl', () => {
    it('should return public URL for file', () => {
      const mockFilePath = 'avatars/user-123.jpg';
      const mockPublicUrl =
        'https://test.supabase.co/storage/v1/object/public/test-bucket/avatars/user-123.jpg';

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = service.getPublicUrl(mockFilePath);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorageMethods.getPublicUrl).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe(mockPublicUrl);
    });

    it('should return public URL for file in root', () => {
      const mockFilePath = 'logo.png';
      const mockPublicUrl =
        'https://test.supabase.co/storage/v1/object/public/test-bucket/logo.png';

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = service.getPublicUrl(mockFilePath);

      expect(result).toBe(mockPublicUrl);
    });

    it('should handle special characters in file path', () => {
      const mockFilePath = 'files/report (2024).pdf';
      const mockPublicUrl =
        'https://test.supabase.co/storage/v1/object/public/test-bucket/files/report%20(2024).pdf';

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = service.getPublicUrl(mockFilePath);

      expect(result).toBe(mockPublicUrl);
    });
  });

  describe('listFiles', () => {
    it('should list files in folder successfully', async () => {
      const mockFolder = 'avatars';
      const mockFiles = [
        { name: 'user-1.jpg', id: '1', updated_at: '2024-01-01' },
        { name: 'user-2.jpg', id: '2', updated_at: '2024-01-02' },
      ];

      mockStorageMethods.list.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      const result = await service.listFiles(mockFolder);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorageMethods.list).toHaveBeenCalledWith(mockFolder);
      expect(result).toEqual(mockFiles);
      expect(result).toHaveLength(2);
    });

    it('should list files in root when no folder specified', async () => {
      const mockFiles = [
        { name: 'file1.txt', id: '1' },
        { name: 'file2.txt', id: '2' },
      ];

      mockStorageMethods.list.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      const result = await service.listFiles();

      expect(mockStorageMethods.list).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockFiles);
    });

    it('should return empty array when folder is empty', async () => {
      const mockFolder = 'empty-folder';

      mockStorageMethods.list.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.listFiles(mockFolder);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when list fails', async () => {
      const mockFolder = 'avatars';
      const mockError = { message: 'Access denied' };

      mockStorageMethods.list.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.listFiles(mockFolder)).rejects.toThrow(
        'Failed to list files: Access denied',
      );
    });

    it('should list files in nested folder', async () => {
      const mockFolder = 'documents/reports/2024';
      const mockFiles = [{ name: 'Q1-report.pdf', id: '1' }];

      mockStorageMethods.list.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      const result = await service.listFiles(mockFolder);

      expect(mockStorageMethods.list).toHaveBeenCalledWith(mockFolder);
      expect(result).toEqual(mockFiles);
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const mockFilePath = 'documents/report.pdf';
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      mockStorageMethods.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const result = await service.downloadFile(mockFilePath);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorageMethods.download).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe(mockBlob);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error when download fails', async () => {
      const mockFilePath = 'documents/report.pdf';
      const mockError = { message: 'File not found' };

      mockStorageMethods.download.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.downloadFile(mockFilePath)).rejects.toThrow(
        'Failed to download file: File not found',
      );
    });

    it('should download file from nested folder', async () => {
      const mockFilePath = 'images/2024/january/photo.jpg';
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });

      mockStorageMethods.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const result = await service.downloadFile(mockFilePath);

      expect(mockStorageMethods.download).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe(mockBlob);
    });

    it('should handle download of large files', async () => {
      const mockFilePath = 'videos/large-video.mp4';
      const largeContent = new Array(1000000).fill('x').join('');
      const mockBlob = new Blob([largeContent], { type: 'video/mp4' });

      mockStorageMethods.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const result = await service.downloadFile(mockFilePath);

      expect(result).toBe(mockBlob);
    });

    it('should handle insufficient permissions error', async () => {
      const mockFilePath = 'private/confidential.pdf';
      const mockError = { message: 'Insufficient permissions' };

      mockStorageMethods.download.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.downloadFile(mockFilePath)).rejects.toThrow(
        'Failed to download file: Insufficient permissions',
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should upload and then get public URL for the same file', async () => {
      const mockFile = Buffer.from('test content');
      const mockFileName = 'test.txt';
      const mockPath = 'test.txt';
      const mockPublicUrl =
        'https://test.supabase.co/storage/v1/object/public/test-bucket/test.txt';

      mockStorageMethods.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const uploadResult = await service.uploadFile(mockFile, mockFileName);
      const urlResult = service.getPublicUrl(mockPath);

      expect(uploadResult).toBe(mockPublicUrl);
      expect(urlResult).toBe(mockPublicUrl);
    });

    it('should list files and then delete one of them', async () => {
      const mockFolder = 'temp';
      const mockFiles = [
        { name: 'file1.txt', id: '1' },
        { name: 'file2.txt', id: '2' },
      ];

      mockStorageMethods.list.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      mockStorageMethods.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      const files = await service.listFiles(mockFolder);
      expect(files).toHaveLength(2);

      await service.deleteFile(`${mockFolder}/${files[0].name}`);

      expect(mockStorageMethods.remove).toHaveBeenCalledWith(['temp/file1.txt']);
    });

    it('should handle upload, download, and delete workflow', async () => {
      const mockFile = Buffer.from('workflow test');
      const mockFileName = 'workflow.txt';
      const mockPath = 'workflow.txt';
      const mockBlob = new Blob(['workflow test'], { type: 'text/plain' });

      // Upload
      mockStorageMethods.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      mockStorageMethods.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      // Download
      mockStorageMethods.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      // Delete
      mockStorageMethods.remove.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.uploadFile(mockFile, mockFileName);
      await service.downloadFile(mockPath);
      await service.deleteFile(mockPath);

      expect(mockStorageMethods.upload).toHaveBeenCalled();
      expect(mockStorageMethods.download).toHaveBeenCalled();
      expect(mockStorageMethods.remove).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockFile = Buffer.from('test');
      const mockError = { message: 'Network request failed' };

      mockStorageMethods.upload.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.uploadFile(mockFile, 'test.txt')).rejects.toThrow(
        'Failed to upload file: Network request failed',
      );
    });

    it('should handle quota exceeded error', async () => {
      const mockFile = Buffer.from('large file');
      const mockError = { message: 'Storage quota exceeded' };

      mockStorageMethods.upload.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.uploadFile(mockFile, 'large.file')).rejects.toThrow(
        'Failed to upload file: Storage quota exceeded',
      );
    });

    it('should handle invalid file path error', async () => {
      const mockError = { message: 'Invalid file path' };

      mockStorageMethods.list.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(service.listFiles('../../../etc/passwd')).rejects.toThrow(
        'Failed to list files: Invalid file path',
      );
    });
  });
});
