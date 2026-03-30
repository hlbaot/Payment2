import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const normalizedName = createRoleDto.name?.trim().toUpperCase();

    if (!normalizedName) {
      throw new BadRequestException('Role name is required');
    }

    const existingRole = await this.roleRepository.findOne({
      where: { name: normalizedName },
    });

    if (existingRole) {
      throw new BadRequestException('Role already exists');
    }

    const role = this.roleRepository.create({
      name: normalizedName,
    });

    return this.roleRepository.save(role);
  }

  async findAll() {
    return this.roleRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    if (updateRoleDto.name !== undefined) {
      role.name = updateRoleDto.name.trim().toUpperCase();
    }

    return this.roleRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
    return { deleted: true, id };
  }
}
