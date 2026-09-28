import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language, Category, Genre, Tag } from './entities';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async getLanguages(): Promise<Language[]> {
    return this.languageRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getGenres(): Promise<Genre[]> {
    return this.genreRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getTags(): Promise<Tag[]> {
    return this.tagRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getMetadata() {
    const [languages, categories, genres, tags] = await Promise.all([
      this.getLanguages(),
      this.getCategories(),
      this.getGenres(),
      this.getTags(),
    ]);

    return {
      languages,
      categories,
      genres,
      tags,
    };
  }
}

