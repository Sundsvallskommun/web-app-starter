import 'reflect-metadata';
import { assertResponseContract } from '@/utils/assert-response-contract';
import { IsNullable } from '@/utils/custom-validation-classes';
import { Type } from 'class-transformer';
import { IsDefined, IsInt, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

class NestedDto {
  @IsDefined()
  @IsString()
  name!: string;
}

class NullableNumberDto {
  @IsNullable()
  @ValidateIf((_obj, value) => value !== null)
  @IsDefined()
  @IsInt()
  value!: number | null;
}

class ResponseDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => NestedDto)
  data!: NestedDto;

  @IsOptional()
  @IsString()
  message?: string;
}

describe('assertResponseContract', () => {
  it('passes for a valid payload', () => {
    const payload = {
      data: { name: 'Alice' },
      message: 'success',
    };

    const validated = assertResponseContract(ResponseDto, payload);
    expect(validated).toBeInstanceOf(ResponseDto);
  });

  it('throws when required properties are missing', () => {
    expect(() => assertResponseContract(ResponseDto, { message: 'missing data' })).toThrow('Response contract validation failed');
  });

  it('throws when additional properties are present', () => {
    expect(() =>
      assertResponseContract(ResponseDto, {
        data: { name: 'Alice', extra: 'not-allowed' },
      }),
    ).toThrow('Response contract validation failed');
  });

  it('throws when property type is invalid', () => {
    expect(() =>
      assertResponseContract(ResponseDto, {
        data: { name: 123 },
      }),
    ).toThrow('Response contract validation failed');
  });

  it('accepts null for nullable fields and rejects undefined for required nullable fields', () => {
    expect(() => assertResponseContract(NullableNumberDto, { value: null })).not.toThrow();
    expect(() => assertResponseContract(NullableNumberDto, {})).toThrow('Response contract validation failed');
  });
});

