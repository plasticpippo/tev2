export const formatCurrency = (amount: number | null | undefined): string => {
    // Format as EUR currency with € symbol prefix and comma as decimal separator
    if (amount === null || amount === undefined) {
        return '€0,00';
    }
    return `€${amount.toFixed(2).replace('.', ',')}`;
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