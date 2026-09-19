import { Test, TestingModule } from '@nestjs/testing';
import { VolumesController } from './volumes.controller';
import { VolumesService } from '../services/volumes.service';
import { VolumeStatus } from '../../common/enums/volume-status.enum';

describe('VolumesController', () => {
  let controller: VolumesController;
  let service: any;

  const mockVolume = {
    id: 'b0000000-0000-0000-0000-000000000001',
    seriesId: 'a0000000-0000-0000-0000-000000000001',
    volumeNumber: 1,
    title: 'Romance Dawn',
    slug: 'one-piece-vol-1',
    status: VolumeStatus.PUBLISHED,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockVolume),
      findAll: jest.fn().mockResolvedValue({
        data: [mockVolume],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      }),
      findOne: jest.fn().mockResolvedValue(mockVolume),
      update: jest.fn().mockResolvedValue({ ...mockVolume, title: 'Updated Romance Dawn' }),
      remove: jest.fn().mockResolvedValue({ message: 'Volume deleted successfully', id: mockVolume.id }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VolumesController],
      providers: [
        {
          provide: VolumesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<VolumesController>(VolumesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /volumes calls service.create', async () => {
    const dto = {
      seriesId: 'a0000000-0000-0000-0000-000000000001',
      volumeNumber: 1,
      title: 'Romance Dawn',
    };
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(mockVolume);
  });

  it('GET /volumes calls service.findAll', async () => {
    const res = await controller.findAll({ page: 1, limit: 20, sortBy: 'sortOrder', sortOrder: 'ASC' });
    expect(service.findAll).toHaveBeenCalled();
    expect(res.data.length).toBe(1);
  });

  it('GET /volumes/:id calls service.findOne', async () => {
    const res = await controller.findOne('one-piece-vol-1');
    expect(service.findOne).toHaveBeenCalledWith('one-piece-vol-1', undefined);
    expect(res.id).toBe(mockVolume.id);
  });

  it('PATCH /volumes/:id calls service.update', async () => {
    const dto = { title: 'Updated Romance Dawn' };
    const res = await controller.update(mockVolume.id, dto);
    expect(service.update).toHaveBeenCalledWith(mockVolume.id, dto);
    expect(res.title).toBe('Updated Romance Dawn');
  });

  it('DELETE /volumes/:id calls service.remove', async () => {
    const res = await controller.remove(mockVolume.id);
    expect(service.remove).toHaveBeenCalledWith(mockVolume.id);
    expect(res.id).toBe(mockVolume.id);
  });
});
