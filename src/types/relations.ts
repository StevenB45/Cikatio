import { Loan, Reservation, User, Item } from '@prisma/client';

export type LoanWithRelations = Loan & {
  borrower: User;
  item: Item;
  performedBy: User | null;
};

export type ReservationWithRelations = Reservation & {
  user: User;
  item: Item;
  performedBy: User | null;
}; 