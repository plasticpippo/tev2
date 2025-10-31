import type { User } from './types';

export const PAYMENT_METHODS = ['Cash', 'Card', 'Other'];

export const INITIAL_USERS: User[] = [
    { id: 1, name: 'Admin User', username: 'admin', password_HACK: 'admin123', role: 'Admin' },
    { id: 2, name: 'Cashier User', username: 'cashier', password_HACK: 'cashier123', role: 'Cashier' },
];