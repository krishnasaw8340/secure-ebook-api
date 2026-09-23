import { Test, TestingModule } from '@nestjs/testing';
import { PagesController } from './pages.controller';
import { PagesService } from '../services/pages.service';
import { PageResponseDto } from '../dto';

describe('PagesController', () => {
  let controller: PagesController;
  let service: jest.Mocked<Partial<PagesService>>;

  const mockPage: PageResponseDto = {
    id: 'a0000000-0000-0000-0000-000000000001',
    chapterId: 'c0000000-0000-0000-0000-000000000001',
    pageNumber: 1,
    sortOrder: 1,
    storageKey: 'https://storage.kuroyomi.com/chapters/c1/p1.webp',
    imageUrl: 'https://storage.kuroyomi.com/chapters/c1/p1.webp',
    isDrmProtected: false,
    createdAt: new Date('2026-09-20T00:00:00.000Z'),
    updatedAt: new Date('2026-09-20T00:00:00.000Z'),
  };

  beforeEach(async () => {
    service = {
      getByChapter: jest.fn().mockResolvedValue([mockPage]),
      getById: jest.fn().mockResolvedValue(mockPage),
      createPages: jest.fn().mockResolvedValue([mockPage]),
      reorderPages: jest.fn().mockResolvedValue([mockPage]),
      remove: jest.fn().mockResolvedValue({
        message: 'Page deleted successfully',
        id: mockPage.id,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagesController],
      providers: [
        {
          provide: PagesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<PagesController>(PagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /chapters/:chapterId/pages calls service.getByChapter', async () => {
    const res = await controller.getByChapter(mockPage.chapterId);
    expect(service.getByChapter).toHaveBeenCalledWith(mockPage.chapterId);
    expect(res).toEqual([mockPage]);
  });

  it('POST /chapters/:chapterId/pages calls service.createPages', async () => {
    const dto = {
      imageUrls: ['https://storage.kuroyomi.com/chapters/c1/p1.webp'],
    };
    const res = await controller.createPages(mockPage.chapterId, dto);
    expect(service.createPages).toHaveBeenCalledWith(mockPage.chapterId, dto);
    expect(res).toEqual([mockPage]);
  });

  it('PUT /chapters/:chapterId/pages/reorder calls service.reorderPages', async () => {
    const dto = {
      pageIds: [mockPage.id],
    };
    const res = await controller.reorder(mockPage.chapterId, dto);
    expect(service.reorderPages).toHaveBeenCalledWith(mockPage.chapterId, dto);
    expect(res).toEqual([mockPage]);
  });

  it('GET /pages/:id calls service.getById', async () => {
    const res = await controller.getById(mockPage.id);
    expect(service.getById).toHaveBeenCalledWith(mockPage.id);
    expect(res).toEqual(mockPage);
  });

  it('DELETE /pages/:id calls service.remove', async () => {
    const res = await controller.remove(mockPage.id);
    expect(service.remove).toHaveBeenCalledWith(mockPage.id);
    expect(res.id).toBe(mockPage.id);
  });

  it('GET /pages with chapterId query calls service.getByChapter', async () => {
    const res = await controller.findByQuery(mockPage.chapterId);
    expect(service.getByChapter).toHaveBeenCalledWith(mockPage.chapterId);
    expect(res).toEqual([mockPage]);
  });

  it('GET /pages without chapterId returns empty array', async () => {
    const res = await controller.findByQuery(undefined);
    expect(res).toEqual([]);
  });
});
