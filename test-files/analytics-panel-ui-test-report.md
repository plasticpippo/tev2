# Analytics Panel UI Test Report

**Date:** 2026-02-19  
**Tester:** Automated Playwright Test  
**App URL:** http://192.168.1.241:80  
**Admin Credentials:** admin / admin123  

---

## Test Summary

| Component | Status | Notes |
|-----------|--------|-------|
| ProductPerformanceTable (Income by Item) | **VISIBLE** | Table shows product performance with columns: Product, Category, Quantity Sold, Average Price, Total Revenue, Transactions |
| Date Range Options | **VISIBLE** | 4 quick filter buttons + custom date range inputs |
| HourlySalesChart | **NOT VISIBLE** | Only daily sales trend chart is shown |

---

## Detailed Findings

### 1. ProductPerformanceTable (Income by Item)

**Status:** ✅ VISIBLE and FUNCTIONAL

The ProductPerformanceTable is visible and displays the following columns:
- **Prodotto** (Product)
- **Categoria** (Category)
- **Quantita Venduta** (Quantity Sold)
- **Prezzo Medio** (Average Price)
- **Ricavo Totale** (Total Revenue)
- **Transazioni** (Transactions)

**Sample Data (Last 30 Days):**

| Product | Category | Qty Sold | Avg Price | Total Revenue | Transactions |
|---------|----------|----------|-----------|---------------|--------------|
| Cabernet Sauvignon | Red Wine | 126 | €15,21 | €1917,00 | 43 |
| Scotch Whiskey | Whiskey | 98 | €10,00 | €980,00 | 47 |
| Mojito | Cocktails | 80 | €12,00 | €960,00 | 34 |
| IPA | Beer | 143 | €6,08 | €869,00 | 41 |
| Coca Cola | Soft Drinks | 100 | €3,73 | €373,50 | 26 |
| Free Sample | Soft Drinks | 12 | €0,00 | €0,00 | 4 |
| test 0 | Red Wine | 27 | €0,00 | €0,00 | 8 |
| Test Zero Price Product | Soft Drinks | 28 | €0,00 | €0,00 | 5 |

**Summary Statistics:**
- Total Revenue: €5099,50
- Total Units Sold: 614
- Top Product: Cabernet Sauvignon

---

### 2. Date Range Options

**Status:** ✅ VISIBLE AND FUNCTIONAL

**Quick Filter Buttons:**
| Option | Italian | English |
|--------|---------|---------|
| Oggi | Today | Today |
| Ultimi 7 Giorni | Last 7 Days | Last 7 Days |
| Ultimi 30 Giorni | Last 30 Days | Last 30 Days |
| Ultimi 12 Mesi | Last 12 Months | Last 12 Months |

**Custom Filter Options:**
| Filter | Type | Options |
|--------|------|---------|
| Data Inizio | Date Picker | Custom start date |
| Data Fine | Date Picker | Custom end date |
| Categoria | Dropdown | All Categories, Red Wine, Beer, Whiskey, Cocktails, Soft Drinks |
| Prodotto | Dropdown | All Products + individual products |
| Ordina Per (Sort By) | Radio | Revenue (Ricavi), Quantity (Quantita), Name (Nome) |
| Ordine (Order) | Radio | Ascending (CRESC), Descending (DECR) |

---

### 3. HourlySalesChart

**Status:** ❌ NOT VISIBLE

**Currently Visible Charts:**
- Sales Trend Chart (Trend Vendite Ultimi 30 Giorni) - Shows daily sales data

**Missing:**
- HourlySalesChart - No hourly breakdown of sales is displayed

The current analytics only shows:
- Daily sales trend (one data point per day)
- Product performance table

There is no visualization for:
- Sales by hour of day
- Peak hours analysis
- Hourly revenue breakdown

---

## UI Observations

1. **Initial Load State:** When selecting "Oggi" (Today), the page shows "Nessun dato di vendita disponibile per il periodo selezionato" (No sales data available for the selected period).

2. **Data Visibility:** The ProductPerformanceTable is visible but only appears when a date range with data is selected (e.g., "Ultimi 30 Giorni").

3. **Filtering:** The custom date range and category filters work correctly and update both the chart and the table.

4. **Language:** All UI elements are in Italian.

---

## Conclusion

The ProductPerformanceTable (income by item) IS VISIBLE in the current UI when a date range with sales data is selected. The table shows comprehensive product performance metrics including quantity sold, average price, total revenue, and transaction count.

The HourlySalesChart is NOT VISIBLE in the current analytics panel - only a daily sales trend chart is displayed.

---

## Screenshots

- `analytics-panel-screenshot.png` - Initial analytics view (no data)
- `analytics-full-dashboard.png` - Full analytics dashboard with 30-day data
