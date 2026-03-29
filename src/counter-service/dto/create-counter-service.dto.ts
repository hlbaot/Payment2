import { ServiceCategory } from '../entities/counter-service.entity';

export class CreateCounterServiceDto {
  counterId: number;
  serviceCode: string;
  name: string;
  category: ServiceCategory;
  commissionRate?: string;
  isActive?: boolean;
}
