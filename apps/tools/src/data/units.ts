export interface Unit {
  key: string;
  labelEn: string;
  labelBn: string;
  categoryKey: string;
  factor?: number;
  convert?: (val: number) => number;
  revert?: (baseVal: number) => number;
}

export interface Category {
  key: string;
  labelEn: string;
  labelBn: string;
  baseUnitKey: string;
}

export const categories: Category[] = [
  {
    key: 'length',
    labelEn: 'Length',
    labelBn: 'দৈর্ঘ্য',
    baseUnitKey: 'm',
  },
  {
    key: 'area',
    labelEn: 'Area',
    labelBn: 'ক্ষেত্রফল',
    baseUnitKey: 'sqm',
  },
  {
    key: 'weight',
    labelEn: 'Weight',
    labelBn: 'ওজন',
    baseUnitKey: 'g',
  },
  {
    key: 'volume',
    labelEn: 'Volume',
    labelBn: 'আয়তন',
    baseUnitKey: 'litre',
  },
  {
    key: 'temperature',
    labelEn: 'Temperature',
    labelBn: 'তাপমাত্রা',
    baseUnitKey: 'celsius',
  },
  {
    key: 'speed',
    labelEn: 'Speed',
    labelBn: 'গতিবেগ',
    baseUnitKey: 'kmh',
  },
  {
    key: 'pressure',
    labelEn: 'Pressure',
    labelBn: 'চাপ',
    baseUnitKey: 'pa',
  },
  {
    key: 'time',
    labelEn: 'Time',
    labelBn: 'সময়',
    baseUnitKey: 'second',
  },
  {
    key: 'digital_storage',
    labelEn: 'Digital Storage',
    labelBn: 'ডিজিটাল স্টোরেজ',
    baseUnitKey: 'byte',
  },
  {
    key: 'energy',
    labelEn: 'Energy',
    labelBn: 'শক্তি',
    baseUnitKey: 'joule',
  },
  {
    key: 'fuel_efficiency',
    labelEn: 'Fuel Efficiency',
    labelBn: 'জ্বালানি দক্ষতা',
    baseUnitKey: 'km_l',
  },
];

export const units: Unit[] = [
  // Length (Base: m)
  { key: 'mm', labelEn: 'Millimeter (mm)', labelBn: 'মিলিমিটার (মিমি)', categoryKey: 'length', factor: 0.001 },
  { key: 'cm', labelEn: 'Centimeter (cm)', labelBn: 'সেন্টিমিটার (সেমি)', categoryKey: 'length', factor: 0.01 },
  { key: 'm', labelEn: 'Meter (m)', labelBn: 'মিটার (মি)', categoryKey: 'length', factor: 1 },
  { key: 'km', labelEn: 'Kilometer (km)', labelBn: 'কিলোমিটার (কিমি)', categoryKey: 'length', factor: 1000 },
  { key: 'inch', labelEn: 'Inch (in)', labelBn: 'ইঞ্চি', categoryKey: 'length', factor: 0.0254 },
  { key: 'foot', labelEn: 'Foot (ft)', labelBn: 'ফুট', categoryKey: 'length', factor: 0.3048 },
  { key: 'yard', labelEn: 'Yard (yd)', labelBn: 'গজ', categoryKey: 'length', factor: 0.9144 },
  { key: 'mile', labelEn: 'Mile (mi)', labelBn: 'মাইল', categoryKey: 'length', factor: 1609.344 },
  { key: 'hath', labelEn: 'Hath (Cubits)', labelBn: 'হাত', categoryKey: 'length', factor: 0.4572 },
  { key: 'gaj', labelEn: 'Gaj', labelBn: 'গজ (ঐতিহ্যবাহী)', categoryKey: 'length', factor: 0.9144 },

  // Area (Base: sqm)
  { key: 'sqft', labelEn: 'Square Foot (sq ft)', labelBn: 'বর্গফুট', categoryKey: 'area', factor: 0.09290304 },
  { key: 'sqm', labelEn: 'Square Meter (sq m)', labelBn: 'বর্গমিটার', categoryKey: 'area', factor: 1 },
  { key: 'acre', labelEn: 'Acre', labelBn: 'একর', categoryKey: 'area', factor: 4046.8564224 },
  { key: 'hectare', labelEn: 'Hectare', labelBn: 'হেক্টর', categoryKey: 'area', factor: 10000 },
  { key: 'bigha', labelEn: 'Bigha', labelBn: 'বিঘা', categoryKey: 'area', factor: 1337.8 },
  { key: 'katha', labelEn: 'Katha', labelBn: 'কাঠা', categoryKey: 'area', factor: 66.89 },
  { key: 'decimal', labelEn: 'Decimal (Satak)', labelBn: 'শতাংশ (ডেসিমেল)', categoryKey: 'area', factor: 40.47 },
  { key: 'ana', labelEn: 'Ana', labelBn: 'আনা', categoryKey: 'area', factor: 6.689 },
  { key: 'ganda', labelEn: 'Ganda', labelBn: 'গণ্ডা', categoryKey: 'area', factor: 33.44 },

  // Weight (Base: g)
  { key: 'mg', labelEn: 'Milligram (mg)', labelBn: 'মিলিগ্রাম (মিগ্রা)', categoryKey: 'weight', factor: 0.001 },
  { key: 'g', labelEn: 'Gram (g)', labelBn: 'গ্রাম (গ্রা)', categoryKey: 'weight', factor: 1 },
  { key: 'kg', labelEn: 'Kilogram (kg)', labelBn: 'কেজি', categoryKey: 'weight', factor: 1000 },
  { key: 'tonne', labelEn: 'Metric Tonne (t)', labelBn: 'টন', categoryKey: 'weight', factor: 1000000 },
  { key: 'ounce', labelEn: 'Ounce (oz)', labelBn: 'আউন্স', categoryKey: 'weight', factor: 28.349523125 },
  { key: 'pound', labelEn: 'Pound (lb)', labelBn: 'পাউন্ড', categoryKey: 'weight', factor: 453.59237 },
  { key: 'tola', labelEn: 'Tola', labelBn: 'তোলা', categoryKey: 'weight', factor: 11.664 },
  { key: 'sher', labelEn: 'Sher', labelBn: 'সের', categoryKey: 'weight', factor: 933.1 },
  { key: 'chittak', labelEn: 'Chittak', labelBn: 'ছটাক', categoryKey: 'weight', factor: 58.319 },
  { key: 'powa', labelEn: 'Powa', labelBn: 'পোয়া', categoryKey: 'weight', factor: 233.28 },

  // Volume (Base: litre)
  { key: 'ml', labelEn: 'Milliliter (ml)', labelBn: 'মিলিলিটার (মিলি)', categoryKey: 'volume', factor: 0.001 },
  { key: 'litre', labelEn: 'Liter (L)', labelBn: 'লিটার', categoryKey: 'volume', factor: 1 },
  { key: 'cubic_foot', labelEn: 'Cubic Foot (cft)', labelBn: 'সেফটি (ঘনফুট)', categoryKey: 'volume', factor: 28.316846592 },
  { key: 'cubic_meter', labelEn: 'Cubic Meter (m³)', labelBn: 'ঘনমিটার', categoryKey: 'volume', factor: 1000 },
  { key: 'gallon_us', labelEn: 'Gallon (US)', labelBn: 'গ্যালন (ইউএস)', categoryKey: 'volume', factor: 3.785411784 },
  { key: 'gallon_uk', labelEn: 'Gallon (UK)', labelBn: 'গ্যালন (ইউকে)', categoryKey: 'volume', factor: 4.54609 },

  // Temperature (Base: celsius, Special formula-based)
  {
    key: 'celsius',
    labelEn: 'Celsius (°C)',
    labelBn: 'সেলসিয়াস',
    categoryKey: 'temperature',
    convert: (val) => val,
    revert: (baseVal) => baseVal,
  },
  {
    key: 'fahrenheit',
    labelEn: 'Fahrenheit (°F)',
    labelBn: 'ফারেনহাইট',
    categoryKey: 'temperature',
    convert: (val) => (val - 32) * 5 / 9,
    revert: (baseVal) => (baseVal * 9 / 5) + 32,
  },
  {
    key: 'kelvin',
    labelEn: 'Kelvin (K)',
    labelBn: 'কেলভিন',
    categoryKey: 'temperature',
    convert: (val) => val - 273.15,
    revert: (baseVal) => baseVal + 273.15,
  },

  // Speed (Base: kmh)
  { key: 'ms', labelEn: 'Meter/Second (m/s)', labelBn: 'মিটার/সেকেন্ড', categoryKey: 'speed', factor: 3.6 },
  { key: 'kmh', labelEn: 'Kilometer/Hour (km/h)', labelBn: 'কিলোমিটার/ঘণ্টা', categoryKey: 'speed', factor: 1 },
  { key: 'mph', labelEn: 'Miles/Hour (mph)', labelBn: 'মাইল/ঘণ্টা', categoryKey: 'speed', factor: 1.609344 },
  { key: 'knot', labelEn: 'Knot (kn)', labelBn: 'নট', categoryKey: 'speed', factor: 1.852 },

  // Pressure (Base: pa)
  { key: 'pa', labelEn: 'Pascal (Pa)', labelBn: 'প্যাসকেল', categoryKey: 'pressure', factor: 1 },
  { key: 'kpa', labelEn: 'Kilopascal (kPa)', labelBn: 'কিলোপ্যাসকেল', categoryKey: 'pressure', factor: 1000 },
  { key: 'bar', labelEn: 'Bar', labelBn: 'বার', categoryKey: 'pressure', factor: 100000 },
  { key: 'psi', labelEn: 'Pounds/Sq Inch (psi)', labelBn: 'পিএসআই', categoryKey: 'pressure', factor: 6894.75729 },
  { key: 'atm', labelEn: 'Atmosphere (atm)', labelBn: 'বায়ুমণ্ডলীয় চাপ', categoryKey: 'pressure', factor: 101325 },

  // Time (Base: second)
  { key: 'second', labelEn: 'Second (s)', labelBn: 'সেকেন্ড', categoryKey: 'time', factor: 1 },
  { key: 'minute', labelEn: 'Minute (min)', labelBn: 'মিনিট', categoryKey: 'time', factor: 60 },
  { key: 'hour', labelEn: 'Hour (h)', labelBn: 'ঘণ্টা', categoryKey: 'time', factor: 3600 },
  { key: 'day', labelEn: 'Day (d)', labelBn: 'দিন', categoryKey: 'time', factor: 86400 },
  { key: 'week', labelEn: 'Week (wk)', labelBn: 'সপ্তাহ', categoryKey: 'time', factor: 604800 },
  { key: 'month', labelEn: 'Month (mo)', labelBn: 'মাস', categoryKey: 'time', factor: 30.4375 * 86400 },
  { key: 'year', labelEn: 'Year (yr)', labelBn: 'বছর', categoryKey: 'time', factor: 365.25 * 86400 },

  // Digital Storage (Base: byte)
  { key: 'bit', labelEn: 'Bit (b)', labelBn: 'বিট', categoryKey: 'digital_storage', factor: 0.125 },
  { key: 'byte', labelEn: 'Byte (B)', labelBn: 'বাইট', categoryKey: 'digital_storage', factor: 1 },
  { key: 'kb', labelEn: 'Kilobyte (KB)', labelBn: 'কিলোবাইট', categoryKey: 'digital_storage', factor: 1024 },
  { key: 'mb', labelEn: 'Megabyte (MB)', labelBn: 'মেগাবাইট', categoryKey: 'digital_storage', factor: 1024 * 1024 },
  { key: 'gb', labelEn: 'Gigabyte (GB)', labelBn: 'গিগাবাইট', categoryKey: 'digital_storage', factor: 1024 * 1024 * 1024 },
  { key: 'tb', labelEn: 'Terabyte (TB)', labelBn: 'টেরাবাইট', categoryKey: 'digital_storage', factor: 1024 * 1024 * 1024 * 1024 },

  // Energy (Base: joule)
  { key: 'joule', labelEn: 'Joule (J)', labelBn: 'জুল', categoryKey: 'energy', factor: 1 },
  { key: 'calorie', labelEn: 'Calorie (cal)', labelBn: 'ক্যালরি', categoryKey: 'energy', factor: 4.184 },
  { key: 'kcal', labelEn: 'Kilocalorie (kcal)', labelBn: 'কিলোক্যালরি', categoryKey: 'energy', factor: 4184 },
  { key: 'kwh', labelEn: 'Kilowatt-hour (kWh)', labelBn: 'কিলোওয়াট-ঘণ্টা', categoryKey: 'energy', factor: 3600000 },
  { key: 'btu', labelEn: 'British Thermal Unit (BTU)', labelBn: 'বিটিইউ', categoryKey: 'energy', factor: 1055.05585 },

  // Fuel Efficiency (Base: km_l, Special reciprocal/custom)
  {
    key: 'km_l',
    labelEn: 'Kilometer/Liter (km/L)',
    labelBn: 'কিলোমিটার/লিটার',
    categoryKey: 'fuel_efficiency',
    convert: (val) => val,
    revert: (baseVal) => baseVal,
  },
  {
    key: 'l_100km',
    labelEn: 'Liters/100km (L/100km)',
    labelBn: 'লিটার/১০০কিমি',
    categoryKey: 'fuel_efficiency',
    convert: (val) => (val === 0 ? 0 : 100 / val),
    revert: (baseVal) => (baseVal === 0 ? 0 : 100 / baseVal),
  },
  {
    key: 'mpg_us',
    labelEn: 'Miles/Gallon (US MPG)',
    labelBn: 'মাইল/গ্যালন (ইউএস)',
    categoryKey: 'fuel_efficiency',
    convert: (val) => val * 0.425143707,
    revert: (baseVal) => baseVal / 0.425143707,
  },
];
