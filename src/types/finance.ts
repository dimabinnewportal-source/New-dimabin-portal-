/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Financial & Fee Management Models
 */

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type FeeCategory =
  | 'application_fee'
  | 'tuition_fee'
  | 'matriculation_fee'
  | 'examination_fee'
  | 'graduation_fee';

export interface FeeItem {
  id: string;
  programmeId: string;
  category: FeeCategory;
  title: string;
  amount: number;
  currency: 'NGN' | 'USD';
  academicSession: string;
}

export interface StudentInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  items: Array<{
    title: string;
    amount: number;
  }>;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  dueDate: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  transactionReference: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  currency: 'NGN' | 'USD';
  paymentMethod: 'bank_transfer' | 'card' | 'online_gateway';
  status: PaymentStatus;
  paidAt: string;
  receiptNumber?: string;
}
