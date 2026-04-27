import { renderContractClassesSource } from '@/utils/generate-contract-classes';

describe('generate-contract-classes', () => {
  it('renders class decorators based on contract types and style rules', () => {
    const source = `
      export enum UserRole {
        Admin = 'admin',
        User = 'user',
      }

      export interface Address {
        street: string;
        zip?: number | null;
      }

      export interface User {
        name: string;
        tags: string[];
        scores: Array<number>;
        roles: UserRole[];
        address: Address;
        addresses: Address[];
        active?: boolean;
        metadata: Record<string, unknown>;
      }
    `;

    const rendered = renderContractClassesSource(source);

    expect(rendered).not.toBeNull();
    expect(rendered).toContain('export class Address');
    expect(rendered).toContain('@IsString()');
    expect(rendered).toContain("street!: string;");
    expect(rendered).toContain('@IsNullable()');
    expect(rendered).toContain('@IsInt()');
    expect(rendered).toContain('@IsString({ each: true })');
    expect(rendered).toContain('@IsInt({ each: true })');
    expect(rendered).toContain('@IsEnum(UserRole, { each: true })');
    expect(rendered).toContain('@ValidateNested()');
    expect(rendered).toContain('@ValidateNested({ each: true })');
    expect(rendered).toContain('@Type(() => Address)');
    expect(rendered).toContain('@Allow()');
    expect(rendered).toContain('@IsDefined()');
    expect(rendered).toContain('@IsOptional()');
    expect(rendered).not.toContain('@IsArray()');
  });
});

