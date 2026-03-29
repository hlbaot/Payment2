import { CounterStatus } from '../entities/counter.entity';

export class CreateCounterDto {
  code: string;
  name: string;
  status?: CounterStatus;
  minAmount?: string;
}
