-- Normalize payment methods to Title Case
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE UPPER("paymentMethod") = 'CASH';
UPDATE transactions SET "paymentMethod" = 'Card' WHERE UPPER("paymentMethod") = 'CARD';
-- Convert 'Other' payment method to 'Cash' as 'Other' is being removed
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE "paymentMethod" = 'Other';
