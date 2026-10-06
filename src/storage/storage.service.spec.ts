import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://s3.ap-south-1.amazonaws.com/test-url'),
}));

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command.constructor.name === 'HeadObjectCommand') {
          return Promise.resolve({
            ContentType: 'application/pdf',
            ContentLength: 15420000,
          });
        }
        if (command.constructor.name === 'DeleteObjectCommand') {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      }),
    })),
  };
});

describe('StorageService', () => {
  let service: StorageService;
  let configService: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const configMap: Record<string, any> = {
          'aws.region': 'ap-south-1',
          'aws.bucket': 'ebook-platform-pdfs-prod',
          'aws.accessKeyId': 'test-access-key',
          'aws.secretAccessKey': 'test-secret-key',
          'aws.maxChapterPdfSizeMb': 200,
        };
        return configMap[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    service.onModuleInit();
  });

  it('should be defined and initialized', () => {
    expect(service).toBeDefined();
    expect(service.getBucketName()).toBe('ebook-platform-pdfs-prod');
    expect(service.getMaxFileSizeMb()).toBe(200);
    expect(service.getMaxFileSizeBytes()).toBe(200 * 1024 * 1024);
  });

  it('should generate presigned upload url', async () => {
    const url = await service.generatePresignedUploadUrl({
      key: 'chapters/c1/versions/v1/chapter.pdf',
      contentType: 'application/pdf',
      expiresInSeconds: 600,
    });

    expect(url).toBe('https://s3.ap-south-1.amazonaws.com/test-url');
  });

  it('should check headObject', async () => {
    const head = await service.headObject(
      'chapters/c1/versions/v1/chapter.pdf',
    );
    expect(head.ContentType).toBe('application/pdf');
    expect(head.ContentLength).toBe(15420000);
  });

  it('should deleteObject', async () => {
    await expect(
      service.deleteObject('chapters/c1/versions/v1/chapter.pdf'),
    ).resolves.not.toThrow();
  });
});
