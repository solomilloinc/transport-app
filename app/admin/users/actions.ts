'use server';

import { createOperativeUser, updateOperativeUser } from '@/services/user-management';

export async function createOperativeUserAction(payload: { email: string; password: string }) {
  return createOperativeUser({
    email: payload.email,
    password: payload.password,
    role: 'Operator',
  });
}

export async function updateOperativeUserAction(payload: { userId: number; email: string; status: number }) {
  return updateOperativeUser(payload.userId, {
    email: payload.email,
    role: 'Operator',
    status: payload.status,
  });
}
