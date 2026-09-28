import { Test, TestingModule } from '@nestjs/testing';
import { AdminChaptersController } from './admin-chapters.controller';
import { ChaptersService } from '../services/chapters.service';
import { ChapterContentStatus } from '../../common/enums/chapter-content-status.enum';

describe('AdminChaptersController', () => {
  let controller: AdminChaptersController;
  let service: any;

  const mockChapter = {
    id: 'c0000000-0000-0000-0000-000000000001',
    bookId: 'e0000000-0000-0000-0000-000000000001',
    chapterNumber: 1,
    title: 'Romance Dawn',
    contentStatus: ChapterContentStatus.READY,
  };

  beforeEach(async () => {
    service = {
      initPdfUpload: jest.fn().mockResolvedValue({
        chapterId: mockChapter.id,
        storageKey: 'books/b1/chapters/c1/chapter.pdf',
        uploadUrl: 'https://storage-mock/upload',
        expiresInSeconds: 3600,
      }),
      completePdfUpload: jest.fn().mockResolvedValue(mockChapter),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminChaptersController],
      providers: [
        {
          provide: ChaptersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AdminChaptersController>(AdminChaptersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /admin/chapters/:chapterId/content/upload-init calls service.initPdfUpload', async () => {
    const dto = { fileName: 'chapter-001.pdf', fileSize: 15420000 };
    const res = await controller.initPdfUpload(mockChapter.id, dto);
    expect(service.initPdfUpload).toHaveBeenCalledWith(mockChapter.id, dto);
    expect(res.storageKey).toBeDefined();
  });

  it('POST /admin/chapters/:chapterId/content/complete calls service.completePdfUpload', async () => {
    const dto = {
      fileName: 'chapter-001.pdf',
      fileSize: 15420000,
      pageCount: 42,
    };
    const res = await controller.completePdfUpload(mockChapter.id, dto);
    expect(service.completePdfUpload).toHaveBeenCalledWith(mockChapter.id, dto);
    expect(res.contentStatus).toBe(ChapterContentStatus.READY);
  });
});
