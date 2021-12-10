import { NotImplementedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
export const hashPassword = async (password: string): Promise<string> => {
  throw new NotImplementedException();
};

export const hashPasswordSync = (password: string): string => {
  throw new NotImplementedException();
};

export const matchHashedPassword = async (password: string, hash: string): Promise<boolean> => {
  throw new NotImplementedException();
};
