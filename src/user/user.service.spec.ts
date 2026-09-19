import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { PasswordService } from '../common/services/password.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(UserRole), useValue: {} },
        { provide: getRepositoryToken(RefreshToken), useValue: {} },
        {
          provide: PasswordService,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
