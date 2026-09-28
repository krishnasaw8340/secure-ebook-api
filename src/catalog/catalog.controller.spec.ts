import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

describe('CatalogController', () => {
  let controller: CatalogController;

  const mockCatalogService = {
    getLanguages: jest.fn().mockResolvedValue([]),
    getCategories: jest.fn().mockResolvedValue([]),
    getGenres: jest.fn().mockResolvedValue([]),
    getTags: jest.fn().mockResolvedValue([]),
    getMetadata: jest.fn().mockResolvedValue({
      languages: [],
      categories: [],
      genres: [],
      tags: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get languages', async () => {
    const res = await controller.getLanguages();
    expect(res).toEqual([]);
    expect(mockCatalogService.getLanguages).toHaveBeenCalled();
  });

  it('should get metadata', async () => {
    const res = await controller.getMetadata();
    expect(res).toHaveProperty('languages');
    expect(mockCatalogService.getMetadata).toHaveBeenCalled();
  });
});

