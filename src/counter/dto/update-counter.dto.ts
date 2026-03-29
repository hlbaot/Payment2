import { CounterStatus } from '../entities/counter.entity';

export class UpdateCounterDto {
  code?: string;
  name?: string;
  status?: CounterStatus;
  minAmount?: string;
}
