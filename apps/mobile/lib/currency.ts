export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: "before" | "after";
}

export const currencies: CurrencyInfo[] = [
  { code: "ISK", symbol: "kr", name: "Icelandic Króna", decimals: 0, symbolPosition: "after" },
  { code: "USD", symbol: "$", name: "US Dollar", decimals: 2, symbolPosition: "before" },
  { code: "EUR", symbol: "€", name: "Euro", decimals: 2, symbolPosition: "before" },
  { code: "GBP", symbol: "£", name: "British Pound", decimals: 2, symbolPosition: "before" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", decimals: 2, symbolPosition: "after" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", decimals: 2, symbolPosition: "after" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", decimals: 2, symbolPosition: "after" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", decimals: 2, symbolPosition: "before" },
  { code: "AUD", symbol: "$", name: "Australian Dollar", decimals: 2, symbolPosition: "before" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2, symbolPosition: "before" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0, symbolPosition: "before" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty", decimals: 2, symbolPosition: "after" },
];

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencies.find((c) => c.code === code) ?? currencies[1]; // fallback USD
}

export function formatAmount(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const value = info.decimals > 0 ? amount / Math.pow(10, info.decimals) : amount;

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });

  if (info.symbolPosition === "before") {
    return `${info.symbol}${formatted}`;
  }
  return `${formatted} ${info.symbol}`;
}
