import { CommissionStatus } from '../entities/order.entity';

export class QueryCommissionReviewDto {
  status?: CommissionStatus | 'all';
}
