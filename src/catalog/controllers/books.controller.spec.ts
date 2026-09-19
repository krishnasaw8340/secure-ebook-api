import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from '../services/books.service';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';

describe('BooksController', () => {
  let controller: BooksController;
  let service: any;

  const mockBook = {
    id: 'e0000000-0000-0000-0000-000000000001',
    seriesId: 'a0000000-0000-0000-0000-000000000001',
    volumeId: 'b0000000-0000-0000-0000-000000000001',
    title: 'One Piece, Vol. 1: Romance Dawn',
    slug: 'one-piece-vol-1-romance-dawn',
    languageId: 'l0000000-0000-0000-0000-000000000001',
    categoryId: 'c0000000-0000-0000-0000-000000000001',
    status: BookStatus.PUBLISHED,
    pricingModel: BookPricingModel.FREE,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockBook),
      findAll: jest.fn().mockResolvedValue({
        data: [mockBook],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
      findOne: jest.fn().mockResolvedValue(mockBook),
      update: jest.fn().mockResolvedValue({
        ...mockBook,
        title: 'One Piece, Vol. 1: Romance Dawn (Special Edition)',
      }),
      remove: jest.fn().mockResolvedValue({
        message: 'Book deleted successfully',
        id: mockBook.id,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /books calls service.create', async () => {
    const dto = {
      seriesId: 'a0000000-0000-0000-0000-000000000001',
      volumeId: 'b0000000-0000-0000-0000-000000000001',
      title: 'One Piece, Vol. 1: Romance Dawn',
      languageId: 'l0000000-0000-0000-0000-000000000001',
      categoryId: 'c0000000-0000-0000-0000-000000000001',
    };
    const user = { userId: 'u1', email: 'admin@kuroyomi.com', roles: [] };
    const res = await controller.create(dto, user as any);
    expect(service.create).toHaveBeenCalledWith(dto, user);
    expect(res).toEqual(mockBook);
  });

  it('GET /books calls service.findAll', async () => {
    const query = { page: 1, limit: 20, sortBy: 'createdAt' as const, sortOrder: 'DESC' as const };
    const res = await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query, undefined);
    expect(res.data.length).toBe(1);
  });

  it('GET /books/:id calls service.findOne', async () => {
    const res = await controller.findOne('one-piece-vol-1-romance-dawn');
    expect(service.findOne).toHaveBeenCalledWith('one-piece-vol-1-romance-dawn', undefined);
    expect(res.id).toBe(mockBook.id);
  });

  it('PATCH /books/:id calls service.update', async () => {
    const dto = { title: 'One Piece, Vol. 1: Romance Dawn (Special Edition)' };
    const user = { userId: 'u1', email: 'admin@kuroyomi.com', roles: [] };
    const res = await controller.update(mockBook.id, dto, user as any);
    expect(service.update).toHaveBeenCalledWith(mockBook.id, dto, user);
    expect(res.title).toContain('Special Edition');
  });

  it('DELETE /books/:id calls service.remove', async () => {
    const res = await controller.remove(mockBook.id);
    expect(service.remove).toHaveBeenCalledWith(mockBook.id);
    expect(res.id).toBe(mockBook.id);
  });
});
