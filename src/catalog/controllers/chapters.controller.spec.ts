import { Test, TestingModule } from '@nestjs/testing';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from '../services/chapters.service';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';

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
    freePageCount: 0,
    coinCost: 0,
    pageCount: 24,
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
      update: jest.fn().mockResolvedValue({ ...mockChapter, title: 'Updated Romance Dawn' }),
      remove: jest.fn().mockResolvedValue({
        message: 'Chapter soft-deleted successfully',
        id: mockChapter.id,
      }),
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
});
