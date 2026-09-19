import { Test, TestingModule } from '@nestjs/testing';
import { SeriesController } from './series.controller';
import { SeriesService } from '../services/series.service';
import { SeriesStatus } from '../../common/enums/series-status.enum';
import { RoleType } from '../../common/enums/role.enum';

describe('SeriesController', () => {
  let controller: SeriesController;
  let service: any;

  const mockSeries = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'One Piece',
    slug: 'one-piece',
    status: SeriesStatus.ONGOING,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockSeries),
      findAll: jest.fn().mockResolvedValue({ data: [mockSeries], meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false } }),
      findOne: jest.fn().mockResolvedValue(mockSeries),
      update: jest.fn().mockResolvedValue({ ...mockSeries, name: 'Updated One Piece' }),
      remove: jest.fn().mockResolvedValue({ message: 'Series deleted successfully', id: mockSeries.id }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeriesController],
      providers: [
        {
          provide: SeriesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SeriesController>(SeriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /series calls service.create', async () => {
    const dto = { name: 'One Piece' };
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockSeries);
  });

  it('GET /series calls service.findAll', async () => {
    const res = await controller.findAll({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' });
    expect(service.findAll).toHaveBeenCalled();
    expect(res.data.length).toBe(1);
  });

  it('GET /series/:id calls service.findOne', async () => {
    const res = await controller.findOne('one-piece');
    expect(service.findOne).toHaveBeenCalledWith('one-piece', undefined);
    expect(res.id).toBe(mockSeries.id);
  });

  it('PATCH /series/:id calls service.update', async () => {
    const dto = { name: 'Updated One Piece' };
    const res = await controller.update(mockSeries.id, dto);
    expect(service.update).toHaveBeenCalledWith(mockSeries.id, dto);
    expect(res.name).toBe('Updated One Piece');
  });

  it('DELETE /series/:id calls service.remove', async () => {
    const res = await controller.remove(mockSeries.id);
    expect(service.remove).toHaveBeenCalledWith(mockSeries.id);
    expect(res.id).toBe(mockSeries.id);
  });
});
