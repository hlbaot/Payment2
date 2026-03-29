import { ServiceCategory } from '../entities/counter-service.entity';

export class UpdateCounterServiceDto {
  counterId?: number;
  serviceCode?: string;
  name?: string;
  category?: ServiceCategory;
  commissionRate?: string;
  isActive?: boolean;
}
