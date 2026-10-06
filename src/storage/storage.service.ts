import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface GeneratePresignedUploadUrlOptions {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private maxFileSizeMb: number;
  private maxBookCoverSizeMb: number;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.region =
      this.configService.get<string>('aws.region') ||
      this.configService.get<string>('AWS_REGION') ||
      'ap-south-1';

    this.bucket =
      this.configService.get<string>('aws.bucket') ||
      this.configService.get<string>('AWS_S3_BUCKET') ||
      'ebook-platform-pdfs-prod';

    this.maxFileSizeMb = Number(
      this.configService.get<number>('aws.maxChapterPdfSizeMb') ||
        this.configService.get<number>('MAX_CHAPTER_PDF_SIZE_MB') ||
        200,
    );

    this.maxBookCoverSizeMb = Number(
      this.configService.get<number>('aws.maxBookCoverSizeMb') ||
        this.configService.get<number>('MAX_BOOK_COVER_SIZE_MB') ||
        10,
    );

    const accessKeyId =
      this.configService.get<string>('aws.accessKeyId') ||
      this.configService.get<string>('AWS_ACCESS_KEY_ID');

    const secretAccessKey =
      this.configService.get<string>('aws.secretAccessKey') ||
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    const clientConfig: {
      region: string;
      credentials?: { accessKeyId: string; secretAccessKey: string };
      requestChecksumCalculation?: any;
      responseChecksumValidation?: any;
    } = {
      region: this.region,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    };

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.s3Client = new S3Client(clientConfig);
    this.logger.log(
      `Initialized S3Client for bucket "${this.bucket}" in region "${this.region}"`,
    );
  }

  getBucketName(): string {
    return this.bucket;
  }

  getMaxFileSizeBytes(): number {
    return this.maxFileSizeMb * 1024 * 1024;
  }

  getMaxFileSizeMb(): number {
    return this.maxFileSizeMb;
  }

  getMaxBookCoverSizeBytes(): number {
    return this.maxBookCoverSizeMb * 1024 * 1024;
  }

  getMaxBookCoverSizeMb(): number {
    return this.maxBookCoverSizeMb;
  }

  /**
   * Generates a short-lived presigned GET URL for a private object.
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
      unhoistableHeaders: new Set([
        "x-amz-checksum-crc32",
        "x-amz-checksum-crc32c",
        "x-amz-checksum-sha1",
        "x-amz-checksum-sha256",
        "x-amz-sdk-checksum-algorithm",
      ]),
    });
  }

  /**
   * Reads the first bytes of an object (for magic-byte content verification).
   */
  async getObjectHead(key: string, bytes = 16): Promise<Buffer> {
    const res = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${bytes - 1}`,
      }),
    );
    const body = res.Body as {
      transformToByteArray?: () => Promise<Uint8Array>;
    };
    const arr = await body.transformToByteArray!();
    return Buffer.from(arr);
  }

  /**
   * Generates a short-lived presigned PUT URL for direct browser -> S3 upload.
   * Default expiration: 10 minutes (600s).
   * Bucket remains strictly private.
   */
  async generatePresignedUploadUrl(
    options: GeneratePresignedUploadUrlOptions,
  ): Promise<string> {
    const {
      key,
      contentType = 'application/pdf',
      expiresInSeconds = 600,
    } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
      unhoistableHeaders: new Set([
        "x-amz-checksum-crc32",
        "x-amz-checksum-crc32c",
        "x-amz-checksum-sha1",
        "x-amz-checksum-sha256",
        "x-amz-sdk-checksum-algorithm",
      ]),
    });
  }

  /**
   * Checks existence and metadata of an object in S3.
   */
  async headObject(key: string): Promise<HeadObjectCommandOutput> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return this.s3Client.send(command);
  }

  /**
   * Deletes an object from S3.
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }
}
