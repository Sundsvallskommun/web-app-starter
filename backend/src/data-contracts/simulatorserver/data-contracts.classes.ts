/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED FROM CONTRACT INTERFACES          ##
 * ---------------------------------------------------------------
 */

import { IsInt, IsOptional, IsString } from 'class-validator';

export class Problem {
  @IsOptional()
  @IsString()
  instance?: string;
  @IsOptional()
  @IsString()
  type?: string;
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  detail?: string;
  @IsOptional()
  @IsInt()
  status?: number;
}
