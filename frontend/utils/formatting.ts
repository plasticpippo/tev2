export const formatCurrency = (amount: number | string | null | undefined): string => {
    // Format as EUR currency with € symbol prefix and comma as decimal separator
    if (amount === null || amount === undefined) {
        return '€0,00';
    }
    // Convert string to number if needed (backend returns Decimal as string)
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    // Handle NaN cases
    if (isNaN(numAmount)) {
        return '€0,00';
    }
    return `€${numAmount.toFixed(2).replace('.', ',')}`;
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}