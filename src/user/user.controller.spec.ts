import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './controllers/user.controller';
import { UsersService } from './services/users.service';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            changePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
