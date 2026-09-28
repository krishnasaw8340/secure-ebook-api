import { Test, TestingModule } from '@nestjs/testing';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from '../services/chapters.service';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { ChapterContentStatus } from '../../common/enums/chapter-content-status.enum';

describe('ChaptersController', () => {
  let controller: ChaptersController;
  let service: any;

  const mockChapter = {
    id: 'c0000000-0000-0000-0000-000000000001',
    bookId: 'e0000000-0000-0000-0000-000000000001',
    chapterNumber: 1,
    title: 'Romance Dawn',
    sortOrder: 10,
    pricingModel: ChapterPricingModel.FREE,
    coinCost: 0,
    pdfFileName: 'chapter-001.pdf',
    pdfFileSize: 15420000,
    pdfPageCount: 42,
    contentStatus: ChapterContentStatus.READY,
    published: true,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockChapter),
      findAll: jest.fn().mockResolvedValue({
        data: [mockChapter],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
      findOne: jest.fn().mockResolvedValue(mockChapter),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockChapter, title: 'Updated Romance Dawn' }),
      remove: jest.fn().mockResolvedValue({
        message: 'Chapter soft-deleted successfully',
        id: mockChapter.id,
      }),
      initPdfUpload: jest.fn().mockResolvedValue({
        chapterId: mockChapter.id,
        storageKey: 'books/b1/chapters/c1/chapter.pdf',
        uploadUrl: 'https://storage-mock/upload',
        expiresInSeconds: 3600,
      }),
      completePdfUpload: jest.fn().mockResolvedValue(mockChapter),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChaptersController],
      providers: [
        {
          provide: ChaptersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ChaptersController>(ChaptersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /chapters calls service.create', async () => {
    const dto = {
      bookId: 'e0000000-0000-0000-0000-000000000001',
      chapterNumber: 1,
      title: 'Romance Dawn',
    };
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockChapter);
  });

  it('GET /chapters calls service.findAll', async () => {
    const query = {
      bookId: 'e0000000-0000-0000-0000-000000000001',
      page: 1,
      limit: 20,
      sortBy: 'sortOrder' as const,
      sortOrder: 'ASC' as const,
    };
    const res = await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query, undefined);
    expect(res.data.length).toBe(1);
  });

  it('GET /chapters/:id calls service.findOne', async () => {
    const res = await controller.findOne(mockChapter.id);
    expect(service.findOne).toHaveBeenCalledWith(mockChapter.id, undefined);
    expect(res.id).toBe(mockChapter.id);
  });

  it('PATCH /chapters/:id calls service.update', async () => {
    const dto = { title: 'Updated Romance Dawn' };
    const res = await controller.update(mockChapter.id, dto);
    expect(service.update).toHaveBeenCalledWith(mockChapter.id, dto);
    expect(res.title).toBe('Updated Romance Dawn');
  });

  it('DELETE /chapters/:id calls service.remove', async () => {
    const res = await controller.remove(mockChapter.id);
    expect(service.remove).toHaveBeenCalledWith(mockChapter.id);
    expect(res.id).toBe(mockChapter.id);
  });

  it('POST /chapters/:id/content/upload-url calls service.generateUploadUrl', async () => {
    const dto = {
      fileName: 'chapter-001.pdf',
      fileSize: 15420000,
      contentType: 'application/pdf',
    };
    const mockUploadUrlResponse = {
      uploadId: 'd0000000-0000-0000-0000-000000000001',
      chapterId: mockChapter.id,
      versionId: 'v0000000-0000-0000-0000-000000000001',
      objectKey: `chapters/${mockChapter.id}/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf`,
      storageKey: `chapters/${mockChapter.id}/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf`,
      uploadUrl: 'https://storage-mock/upload',
      expiresIn: 600,
      expiresInSeconds: 600,
    };
    service.generateUploadUrl = jest
      .fn()
      .mockResolvedValue(mockUploadUrlResponse);

    const res = await controller.generateUploadUrl(mockChapter.id, dto);
    expect(service.generateUploadUrl).toHaveBeenCalledWith(mockChapter.id, dto);
    expect(res.uploadId).toBe('d0000000-0000-0000-0000-000000000001');
    expect(res.objectKey).toBe(mockUploadUrlResponse.objectKey);
    expect(res.uploadUrl).toBe('https://storage-mock/upload');
    expect(res.expiresIn).toBe(600);
  });

  it('POST /chapters/:id/content/upload-init calls service.initPdfUpload', async () => {
    const dto = { fileName: 'chapter-001.pdf', fileSize: 15420000 };
    const res = await controller.initPdfUpload(mockChapter.id, dto);
    expect(service.initPdfUpload).toHaveBeenCalledWith(mockChapter.id, dto);
    expect(res.storageKey).toBeDefined();
  });

  it('POST /chapters/:id/content/complete calls service.completePdfUpload', async () => {
    const dto = {
      objectKey: 'chapters/c1/versions/v1/chapter.pdf',
      versionId: 'v1',
      fileName: 'chapter-001.pdf',
      fileSize: 15420000,
      pageCount: 42,
    };
    const res = await controller.completePdfUpload(mockChapter.id, dto);
    expect(service.completePdfUpload).toHaveBeenCalledWith(mockChapter.id, dto);
    expect(res.contentStatus).toBe(ChapterContentStatus.READY);
  });

  describe('RBAC authorization for upload URL endpoint', () => {
    const { Reflector } = jest.requireActual('@nestjs/core');
    const { RolesGuard } = jest.requireActual('../../auth/guards/roles.guard');
    const { RoleType } = jest.requireActual('../../common/enums/role.enum');
    let rolesGuard: any;

    beforeEach(() => {
      const reflector = new Reflector();
      rolesGuard = new RolesGuard(reflector);
    });

    const createMockExecutionContext = (user?: any): any => ({
      getHandler: () => controller.generateUploadUrl,
      getClass: () => ChaptersController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    });

    it('ADMIN role can access upload-url', () => {
      const context = createMockExecutionContext({
        userId: 'admin-id',
        email: 'admin@kuroyomi.com',
        roles: [RoleType.ADMIN],
      });
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('SUPER_ADMIN role can access upload-url', () => {
      const context = createMockExecutionContext({
        userId: 'super-admin-id',
        email: 'super@kuroyomi.com',
        roles: [RoleType.SUPER_ADMIN],
      });
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('normal USER role cannot access upload-url and throws ForbiddenException', () => {
      const context = createMockExecutionContext({
        userId: 'user-id',
        email: 'reader@kuroyomi.com',
        roles: [RoleType.USER],
      });
      expect(() => rolesGuard.canActivate(context)).toThrow();
    });

    it('unauthenticated request throws ForbiddenException', () => {
      const context = createMockExecutionContext(undefined);
      expect(() => rolesGuard.canActivate(context)).toThrow();
    });
  });
});
