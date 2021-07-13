import { Test, TestingModule } from '@nestjs/testing';
import { Proj4Service } from './proj4.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Proj4Service', () => {
  let service: Proj4Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Proj4Service],
    }).compile();

    service = module.get<Proj4Service>(Proj4Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('properly resolve', function () {
    const code = 4326;
    const definition = '+proj=longlat +datum=WGS84 +no_defs';
    const result = service.getDefinition(code);
    expect(result).toEqual(definition);
  });

  it('throws BadRequestException on non number code', function () {
    try {
      service.getDefinition(NaN);
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
    }
  });

  it('throws NotFoundException on unknown code', function () {
    try {
      const code = 999999;
      service.getDefinition(code);
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
    }
  });
});
