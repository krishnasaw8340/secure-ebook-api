import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { Language, Category, Genre, Tag } from './entities';

describe('CatalogService', () => {
  let service: CatalogService;

  const mockRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(Language), useValue: mockRepo },
        { provide: getRepositoryToken(Category), useValue: mockRepo },
        { provide: getRepositoryToken(Genre), useValue: mockRepo },
        { provide: getRepositoryToken(Tag), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return metadata', async () => {
    const result = await service.getMetadata();
    expect(result).toHaveProperty('languages');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('genres');
    expect(result).toHaveProperty('tags');
  });
});
