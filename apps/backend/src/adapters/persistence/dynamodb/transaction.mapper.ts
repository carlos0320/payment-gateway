import type { TransactionItem } from './transaction.item';
import { Transaction } from 'src/domain/transaction/transaction.entity';
import {
  Status,
  WompiTransactionStatus,
} from 'src/domain/transaction/transaction.types';

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function isString(x: unknown): x is string {
  return typeof x === 'string';
}
function isNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}
function isNullableString(x: unknown): x is string | null {
  return x === null || isString(x);
}

function isCurrencyCOP(x: unknown): x is 'COP' {
  return x === 'COP';
}
function isCountryCO(x: unknown): x is 'CO' {
  return x === 'CO';
}

export function isTransactionItem(x: unknown): x is TransactionItem {
  if (!isObj(x)) return false;

  const o = x;
  if (!isString(o.transactionId)) return false;
  if (!isString(o.productId)) return false;
  if (!isNumber(o.quantity)) return false;

  if (!isString(o.status)) return false;
  if (!isNullableString(o.wompiTransactionId)) return false;
  if (
    !(o.wompiTransactionStatus === null || isString(o.wompiTransactionStatus))
  )
    return false;

  if (!isObj(o.amounts)) return false;
  const a = o.amounts;
  if (
    !isNumber(a.productAmountInCents) ||
    !isNumber(a.baseFeeInCents) ||
    !isNumber(a.deliveryFeeInCents) ||
    !isNumber(a.totalInCents) ||
    !isCurrencyCOP(a.currency)
  )
    return false;

  if (!isObj(o.customer)) return false;
  const c = o.customer;
  if (!isString(c.email) || !isString(c.fullName) || !isString(c.phoneNumber))
    return false;

  if (!isObj(o.delivery)) return false;
  const d = o.delivery;
  if (
    !isString(d.address) ||
    !isString(d.city) ||
    !isString(d.region) ||
    !isCountryCO(d.country)
  )
    return false;

  if (!isObj(o.acceptance)) return false;

  if (!(o.failureReason === null || isString(o.failureReason))) return false;
  if (!isString(o.clientIp)) return false;
  if (!isString(o.createdAt) || !isString(o.updatedAt)) return false;

  return true;
}

export function toDomainTransaction(item: TransactionItem): Transaction {
  // Assumes your domain Transaction constructor matches these fields.
  // If your domain uses Date, convert ISO → Date.
  return new Transaction(
    item.transactionId,
    item.productId,
    item.quantity,
    item.status as Status,
    item.wompiTransactionId,
    item.wompiTransactionStatus as WompiTransactionStatus | null,
    item.amounts,
    item.customer,
    item.delivery,
    item.acceptance,
    item.failureReason,
    new Date(item.createdAt),
    new Date(item.updatedAt),
    item.clientIp,
  );
}

export function toItemTransaction(tx: Transaction): TransactionItem {
  return {
    transactionId: tx.transactionId,
    productId: tx.productId,
    quantity: tx.quantity,

    status: tx.status as any,
    wompiTransactionId: tx.wompiTransactionId ?? null,
    wompiTransactionStatus: (tx.wompiTransactionStatus as any) ?? null,

    amounts: tx.amounts,
    customer: tx.customer,
    delivery: tx.delivery,
    acceptance: tx.acceptance,

    failureReason: tx.failureReason ?? null,
    clientIp: tx.clientIp,

    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}
