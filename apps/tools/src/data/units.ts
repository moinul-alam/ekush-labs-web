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
  icon: string;
}

export interface SuggestionPair {
  fromKey: string;
  toKey: string;
  labelEn: string;
  labelBn: string;
}

export const categories: Category[] = [
  {
    key: 'property',
    labelEn: 'Property & Land',
    labelBn: 'জমি ও সম্পত্তি',
    baseUnitKey: 'sqft',
    icon: '🏡',
  },
  {
    key: 'length',
    labelEn: 'Length',
    labelBn: 'দৈর্ঘ্য',
    baseUnitKey: 'm',
    icon: '📏',
  },
  {
    key: 'weight',
    labelEn: 'Weight & Mass',
    labelBn: 'ওজন',
    baseUnitKey: 'kg',
    icon: '⚖️',
  },
  {
    key: 'temperature',
    labelEn: 'Temperature',
    labelBn: 'তাপমাত্রা',
    baseUnitKey: 'celsius',
    icon: '🌡️',
  },
  {
    key: 'liquid',
    labelEn: 'Liquid & Volume',
    labelBn: 'তরল ও আয়তন',
    baseUnitKey: 'litre',
    icon: '🧪',
  },
  {
    key: 'fuel',
    labelEn: 'Fuel & Mileage',
    labelBn: 'জ্বালানি',
    baseUnitKey: 'km_l',
    icon: '⛽',
  },
  {
    key: 'speed',
    labelEn: 'Speed',
    labelBn: 'গতিবেগ',
    baseUnitKey: 'kmh',
    icon: '🚀',
  },
  {
    key: 'time',
    labelEn: 'Time',
    labelBn: 'সময়',
    baseUnitKey: 'second',
    icon: '⏱️',
  },
  {
    key: 'digital_storage',
    labelEn: 'Digital Storage',
    labelBn: 'ডিজিটাল স্টোরেজ',
    baseUnitKey: 'byte',
    icon: '💾',
  },
  {
    key: 'energy',
    labelEn: 'Energy',
    labelBn: 'শক্তি',
    baseUnitKey: 'joule',
    icon: '⚡',
  },
  {
    key: 'pressure',
    labelEn: 'Pressure',
    labelBn: 'চাপ',
    baseUnitKey: 'pa',
    icon: '🎈',
  },
];

// ─── UNITS ────────────────────────────────────────────────────────────────────
//
// BD Land Area: anchor is SQFT (not sqm) because all BD land units are
// legally and practically defined in sqft. Clean integer relationships:
//   1 katha  = 720 sqft (exact)
//   1 bigha  = 20 katha = 14400 sqft (exact)
//   1 decimal/satak = 435.6 sqft (exact, 1/100 acre)
//   1 ana    = 1/16 katha = 45 sqft (exact)
//   1 ganda  = 4 ana = 180 sqft (exact)
//   1 acre   = 43560 sqft (exact)
//   1 sqm    = 10.7639... sqft (irrational — only SI conversion carries this drift)
//
// All other categories: SI base units as before.

export const units: Unit[] = [

  // ── Property & Land (Base: sqft) ──────────────────────────────────────────
  // BD-first ordering
  { key: 'katha',    labelEn: 'Katha',                    labelBn: 'কাঠা',                   categoryKey: 'property', factor: 720 },
  { key: 'bigha',    labelEn: 'Bigha',                    labelBn: 'বিঘা',                   categoryKey: 'property', factor: 14400 },
  { key: 'decimal',  labelEn: 'Decimal (Satak)',           labelBn: 'শতাংশ (ডেসিমেল)',         categoryKey: 'property', factor: 435.6 },
  { key: 'ana',      labelEn: 'Ana',                      labelBn: 'আনা',                    categoryKey: 'property', factor: 45 },
  { key: 'ganda',    labelEn: 'Ganda',                    labelBn: 'গণ্ডা',                  categoryKey: 'property', factor: 180 },
  { key: 'sqft',     labelEn: 'Square Foot (sq ft)',      labelBn: 'বর্গফুট',                categoryKey: 'property', factor: 1 },
  { key: 'sqm',      labelEn: 'Square Meter (sq m)',      labelBn: 'বর্গমিটার',              categoryKey: 'property', factor: 10.7639104 },
  { key: 'acre',     labelEn: 'Acre',                     labelBn: 'একর',                    categoryKey: 'property', factor: 43560 },
  { key: 'hectare',  labelEn: 'Hectare',                  labelBn: 'হেক্টর',                 categoryKey: 'property', factor: 107639.104 },
  { key: 'sqkm',     labelEn: 'Square Kilometer (sq km)', labelBn: 'বর্গকিলোমিটার',          categoryKey: 'property', factor: 10763910.4 },

  // ── Length (Base: m) ──────────────────────────────────────────────────────
  { key: 'mm',       labelEn: 'Millimeter (mm)',           labelBn: 'মিলিমিটার (মিমি)',       categoryKey: 'length', factor: 0.001 },
  { key: 'cm',       labelEn: 'Centimeter (cm)',           labelBn: 'সেন্টিমিটার (সেমি)',     categoryKey: 'length', factor: 0.01 },
  { key: 'm',        labelEn: 'Meter (m)',                 labelBn: 'মিটার (মি)',             categoryKey: 'length', factor: 1 },
  { key: 'km',       labelEn: 'Kilometer (km)',            labelBn: 'কিলোমিটার (কিমি)',       categoryKey: 'length', factor: 1000 },
  { key: 'inch',     labelEn: 'Inch (in)',                 labelBn: 'ইঞ্চি',                 categoryKey: 'length', factor: 0.0254 },
  { key: 'foot',     labelEn: 'Foot (ft)',                 labelBn: 'ফুট',                   categoryKey: 'length', factor: 0.3048 },
  { key: 'yard',     labelEn: 'Yard (yd)',                 labelBn: 'গজ',                    categoryKey: 'length', factor: 0.9144 },
  { key: 'mile',     labelEn: 'Mile (mi)',                 labelBn: 'মাইল',                  categoryKey: 'length', factor: 1609.344 },
  { key: 'hath',     labelEn: 'Hath (Cubit)',             labelBn: 'হাত',                   categoryKey: 'length', factor: 0.4572 },
  { key: 'nautical_mile', labelEn: 'Nautical Mile (nmi)', labelBn: 'নটিক্যাল মাইল',        categoryKey: 'length', factor: 1852 },

  // ── Weight & Mass (Base: kg) ──────────────────────────────────────────────
  { key: 'kg',       labelEn: 'Kilogram (kg)',             labelBn: 'কেজি',                  categoryKey: 'weight', factor: 1 },
  { key: 'g',        labelEn: 'Gram (g)',                  labelBn: 'গ্রাম',                 categoryKey: 'weight', factor: 0.001 },
  { key: 'mg',       labelEn: 'Milligram (mg)',            labelBn: 'মিলিগ্রাম',             categoryKey: 'weight', factor: 0.000001 },
  { key: 'tola',     labelEn: 'Tola',                     labelBn: 'তোলা',                  categoryKey: 'weight', factor: 0.011664 },
  { key: 'sher',     labelEn: 'Sher',                     labelBn: 'সের',                   categoryKey: 'weight', factor: 0.9331 },
  { key: 'chittak',  labelEn: 'Chittak',                  labelBn: 'ছটাক',                  categoryKey: 'weight', factor: 0.058319 },
  { key: 'powa',     labelEn: 'Powa',                     labelBn: 'পোয়া',                  categoryKey: 'weight', factor: 0.23328 },
  { key: 'pound',    labelEn: 'Pound (lb)',                labelBn: 'পাউন্ড',               categoryKey: 'weight', factor: 0.45359237 },
  { key: 'ounce',    labelEn: 'Ounce (oz)',                labelBn: 'আউন্স',                categoryKey: 'weight', factor: 0.028349523125 },
  { key: 'tonne',    labelEn: 'Metric Tonne (t)',          labelBn: 'টন',                   categoryKey: 'weight', factor: 1000 },

  // ── Temperature (Base: celsius, formula-based) ────────────────────────────
  {
    key: 'celsius',
    labelEn: 'Celsius (°C)', labelBn: 'সেলসিয়াস',
    categoryKey: 'temperature',
    convert: (val) => val,
    revert: (b) => b,
  },
  {
    key: 'fahrenheit',
    labelEn: 'Fahrenheit (°F)', labelBn: 'ফারেনহাইট',
    categoryKey: 'temperature',
    convert: (val) => (val - 32) * 5 / 9,
    revert: (b) => (b * 9 / 5) + 32,
  },
  {
    key: 'kelvin',
    labelEn: 'Kelvin (K)', labelBn: 'কেলভিন',
    categoryKey: 'temperature',
    convert: (val) => val - 273.15,
    revert: (b) => b + 273.15,
  },

  // ── Liquid & Volume (Base: litre) ─────────────────────────────────────────
  { key: 'ml',          labelEn: 'Milliliter (ml)',       labelBn: 'মিলিলিটার',             categoryKey: 'liquid', factor: 0.001 },
  { key: 'litre',       labelEn: 'Liter (L)',             labelBn: 'লিটার',                 categoryKey: 'liquid', factor: 1 },
  { key: 'cubic_meter', labelEn: 'Cubic Meter (m³)',      labelBn: 'ঘনমিটার',               categoryKey: 'liquid', factor: 1000 },
  { key: 'cubic_foot',  labelEn: 'Cubic Foot (cft)',      labelBn: 'ঘনফুট (সিএফটি)',        categoryKey: 'liquid', factor: 28.316846592 },
  { key: 'cubic_inch',  labelEn: 'Cubic Inch (in³)',      labelBn: 'ঘনইঞ্চি',              categoryKey: 'liquid', factor: 0.016387064 },
  { key: 'gallon_us',   labelEn: 'Gallon (US)',           labelBn: 'গ্যালন (ইউএস)',         categoryKey: 'liquid', factor: 3.785411784 },
  { key: 'gallon_uk',   labelEn: 'Gallon (UK)',           labelBn: 'গ্যালন (ইউকে)',         categoryKey: 'liquid', factor: 4.54609 },
  { key: 'fl_oz_us',    labelEn: 'Fl. Ounce (US)',        labelBn: 'ফ্লুয়িড আউন্স (ইউএস)', categoryKey: 'liquid', factor: 0.029573529563 },
  { key: 'cup',         labelEn: 'Cup (US)',               labelBn: 'কাপ (ইউএস)',            categoryKey: 'liquid', factor: 0.2365882365 },
  { key: 'tablespoon',  labelEn: 'Tablespoon (US)',        labelBn: 'টেবিলচামচ',             categoryKey: 'liquid', factor: 0.01478676478 },
  { key: 'teaspoon',    labelEn: 'Teaspoon (US)',          labelBn: 'চা-চামচ',              categoryKey: 'liquid', factor: 0.00492892159 },

  // ── Fuel & Mileage (Base: km_l, formula-based) ────────────────────────────
  {
    key: 'km_l',
    labelEn: 'Kilometer/Liter (km/L)', labelBn: 'কিলোমিটার/লিটার',
    categoryKey: 'fuel',
    convert: (val) => val,
    revert: (b) => b,
  },
  {
    key: 'l_100km',
    labelEn: 'Liters/100km (L/100km)', labelBn: 'লিটার/১০০কিমি',
    categoryKey: 'fuel',
    convert: (val) => val === 0 ? 0 : 100 / val,
    revert: (b) => b === 0 ? 0 : 100 / b,
  },
  {
    key: 'mpg_us',
    labelEn: 'Miles/Gallon US (MPG)', labelBn: 'মাইল/গ্যালন (ইউএস)',
    categoryKey: 'fuel',
    convert: (val) => val * 0.425143707,
    revert: (b) => b / 0.425143707,
  },
  {
    key: 'mpg_uk',
    labelEn: 'Miles/Gallon UK (MPG)', labelBn: 'মাইল/গ্যালন (ইউকে)',
    categoryKey: 'fuel',
    convert: (val) => val * 0.354006181,
    revert: (b) => b / 0.354006181,
  },

  // ── Speed (Base: kmh) ─────────────────────────────────────────────────────
  { key: 'kmh',  labelEn: 'Kilometer/Hour (km/h)', labelBn: 'কিলোমিটার/ঘণ্টা', categoryKey: 'speed', factor: 1 },
  { key: 'mph',  labelEn: 'Miles/Hour (mph)',       labelBn: 'মাইল/ঘণ্টা',      categoryKey: 'speed', factor: 1.609344 },
  { key: 'ms',   labelEn: 'Meter/Second (m/s)',     labelBn: 'মিটার/সেকেন্ড',   categoryKey: 'speed', factor: 3.6 },
  { key: 'knot', labelEn: 'Knot (kn)',              labelBn: 'নট',              categoryKey: 'speed', factor: 1.852 },
  { key: 'mach', labelEn: 'Mach',                   labelBn: 'ম্যাক',           categoryKey: 'speed', factor: 1234.8 },

  // ── Time (Base: second) ───────────────────────────────────────────────────
  { key: 'second',      labelEn: 'Second (s)',   labelBn: 'সেকেন্ড', categoryKey: 'time', factor: 1 },
  { key: 'minute',      labelEn: 'Minute (min)', labelBn: 'মিনিট',  categoryKey: 'time', factor: 60 },
  { key: 'hour',        labelEn: 'Hour (h)',      labelBn: 'ঘণ্টা',  categoryKey: 'time', factor: 3600 },
  { key: 'day',         labelEn: 'Day (d)',       labelBn: 'দিন',    categoryKey: 'time', factor: 86400 },
  { key: 'week',        labelEn: 'Week (wk)',     labelBn: 'সপ্তাহ', categoryKey: 'time', factor: 604800 },
  { key: 'month',       labelEn: 'Month (mo)',    labelBn: 'মাস',    categoryKey: 'time', factor: 2629800 },
  { key: 'year',        labelEn: 'Year (yr)',     labelBn: 'বছর',    categoryKey: 'time', factor: 31557600 },
  { key: 'millisecond', labelEn: 'Millisecond (ms)', labelBn: 'মিলিসেকেন্ড', categoryKey: 'time', factor: 0.001 },

  // ── Digital Storage (Base: byte) ──────────────────────────────────────────
  { key: 'bit',  labelEn: 'Bit (b)',       labelBn: 'বিট',      categoryKey: 'digital_storage', factor: 0.125 },
  { key: 'byte', labelEn: 'Byte (B)',      labelBn: 'বাইট',     categoryKey: 'digital_storage', factor: 1 },
  { key: 'kb',   labelEn: 'Kilobyte (KB)', labelBn: 'কিলোবাইট', categoryKey: 'digital_storage', factor: 1024 },
  { key: 'mb',   labelEn: 'Megabyte (MB)', labelBn: 'মেগাবাইট', categoryKey: 'digital_storage', factor: 1048576 },
  { key: 'gb',   labelEn: 'Gigabyte (GB)', labelBn: 'গিগাবাইট', categoryKey: 'digital_storage', factor: 1073741824 },
  { key: 'tb',   labelEn: 'Terabyte (TB)', labelBn: 'টেরাবাইট', categoryKey: 'digital_storage', factor: 1099511627776 },
  { key: 'pb',   labelEn: 'Petabyte (PB)', labelBn: 'পেটাবাইট', categoryKey: 'digital_storage', factor: 1125899906842624 },

  // ── Energy (Base: joule) ──────────────────────────────────────────────────
  { key: 'joule',  labelEn: 'Joule (J)',                   labelBn: 'জুল',             categoryKey: 'energy', factor: 1 },
  { key: 'kjoule', labelEn: 'Kilojoule (kJ)',              labelBn: 'কিলোজুল',        categoryKey: 'energy', factor: 1000 },
  { key: 'calorie',labelEn: 'Calorie (cal)',               labelBn: 'ক্যালরি',        categoryKey: 'energy', factor: 4.184 },
  { key: 'kcal',   labelEn: 'Kilocalorie (kcal)',          labelBn: 'কিলোক্যালরি',    categoryKey: 'energy', factor: 4184 },
  { key: 'kwh',    labelEn: 'Kilowatt-hour (kWh)',         labelBn: 'কিলোওয়াট-ঘণ্টা', categoryKey: 'energy', factor: 3600000 },
  { key: 'wh',     labelEn: 'Watt-hour (Wh)',              labelBn: 'ওয়াট-ঘণ্টা',    categoryKey: 'energy', factor: 3600 },
  { key: 'btu',    labelEn: 'British Thermal Unit (BTU)',  labelBn: 'বিটিইউ',         categoryKey: 'energy', factor: 1055.05585 },
  { key: 'ev',     labelEn: 'Electronvolt (eV)',           labelBn: 'ইলেকট্রনভোল্ট', categoryKey: 'energy', factor: 1.602176634e-19 },

  // ── Pressure (Base: pa) ───────────────────────────────────────────────────
  { key: 'pa',   labelEn: 'Pascal (Pa)',               labelBn: 'প্যাসকেল',         categoryKey: 'pressure', factor: 1 },
  { key: 'kpa',  labelEn: 'Kilopascal (kPa)',          labelBn: 'কিলোপ্যাসকেল',    categoryKey: 'pressure', factor: 1000 },
  { key: 'mpa',  labelEn: 'Megapascal (MPa)',          labelBn: 'মেগাপ্যাসকেল',    categoryKey: 'pressure', factor: 1000000 },
  { key: 'bar',  labelEn: 'Bar',                       labelBn: 'বার',              categoryKey: 'pressure', factor: 100000 },
  { key: 'mbar', labelEn: 'Millibar (mbar)',            labelBn: 'মিলিবার',         categoryKey: 'pressure', factor: 100 },
  { key: 'psi',  labelEn: 'Pounds/Sq Inch (psi)',      labelBn: 'পিএসআই',          categoryKey: 'pressure', factor: 6894.75729 },
  { key: 'atm',  labelEn: 'Atmosphere (atm)',           labelBn: 'বায়ুমণ্ডলীয় চাপ', categoryKey: 'pressure', factor: 101325 },
  { key: 'torr', labelEn: 'Torr (mmHg)',               labelBn: 'টর (mmHg)',       categoryKey: 'pressure', factor: 133.322387415 },
  { key: 'inhg', labelEn: 'Inch of Mercury (inHg)',    labelBn: 'ইঞ্চি পারদ',      categoryKey: 'pressure', factor: 3386.389 },
];

// ─── SUGGESTION PAIRS ────────────────────────────────────────────────────────

export const globalSuggestions: SuggestionPair[] = [
  { fromKey: 'celsius',   toKey: 'fahrenheit', labelEn: '°C → °F',        labelBn: '°সে → °ফা' },
  { fromKey: 'km',        toKey: 'mile',       labelEn: 'km → Mile',      labelBn: 'কিমি → মাইল' },
  { fromKey: 'kg',        toKey: 'pound',      labelEn: 'kg → lb',        labelBn: 'কেজি → পাউন্ড' },
  { fromKey: 'katha',     toKey: 'sqft',       labelEn: 'Katha → sq ft',  labelBn: 'কাঠা → বর্গফুট' },
  { fromKey: 'bigha',     toKey: 'katha',      labelEn: 'Bigha → Katha',  labelBn: 'বিঘা → কাঠা' },
  { fromKey: 'tola',      toKey: 'g',          labelEn: 'Tola → Gram',    labelBn: 'তোলা → গ্রাম' },
  { fromKey: 'km_l',      toKey: 'l_100km',    labelEn: 'km/L → L/100km', labelBn: 'কিমি/লি → লি/১০০কিমি' },
];

export const categorySuggestions: Record<string, SuggestionPair[]> = {
  property: [
    { fromKey: 'katha',   toKey: 'sqft',    labelEn: 'Katha → sq ft',   labelBn: 'কাঠা → বর্গফুট' },
    { fromKey: 'bigha',   toKey: 'katha',   labelEn: 'Bigha → Katha',   labelBn: 'বিঘা → কাঠা' },
    { fromKey: 'decimal', toKey: 'sqft',    labelEn: 'Decimal → sq ft', labelBn: 'শতাংশ → বর্গফুট' },
    { fromKey: 'bigha',   toKey: 'sqft',    labelEn: 'Bigha → sq ft',   labelBn: 'বিঘা → বর্গফুট' },
    { fromKey: 'sqm',     toKey: 'sqft',    labelEn: 'sq m → sq ft',    labelBn: 'বর্গমিটার → বর্গফুট' },
  ],
  length: [
    { fromKey: 'km',   toKey: 'mile',  labelEn: 'km → Mile',   labelBn: 'কিমি → মাইল' },
    { fromKey: 'cm',   toKey: 'inch',  labelEn: 'cm → Inch',   labelBn: 'সেমি → ইঞ্চি' },
    { fromKey: 'm',    toKey: 'foot',  labelEn: 'm → Foot',    labelBn: 'মিটার → ফুট' },
    { fromKey: 'foot', toKey: 'm',     labelEn: 'Foot → m',    labelBn: 'ফুট → মিটার' },
    { fromKey: 'km',   toKey: 'm',     labelEn: 'km → m',      labelBn: 'কিমি → মিটার' },
  ],
  weight: [
    { fromKey: 'kg',      toKey: 'pound',   labelEn: 'kg → lb',       labelBn: 'কেজি → পাউন্ড' },
    { fromKey: 'tola',    toKey: 'g',       labelEn: 'Tola → Gram',   labelBn: 'তোলা → গ্রাম' },
    { fromKey: 'kg',      toKey: 'tola',    labelEn: 'kg → Tola',     labelBn: 'কেজি → তোলা' },
    { fromKey: 'pound',   toKey: 'kg',      labelEn: 'lb → kg',       labelBn: 'পাউন্ড → কেজি' },
    { fromKey: 'sher',    toKey: 'kg',      labelEn: 'Sher → kg',     labelBn: 'সের → কেজি' },
  ],
  temperature: [
    { fromKey: 'celsius',    toKey: 'fahrenheit', labelEn: '°C → °F', labelBn: '°সে → °ফা' },
    { fromKey: 'fahrenheit', toKey: 'celsius',    labelEn: '°F → °C', labelBn: '°ফা → °সে' },
    { fromKey: 'celsius',    toKey: 'kelvin',     labelEn: '°C → K',  labelBn: '°সে → কেলভিন' },
  ],
  liquid: [
    { fromKey: 'litre',    toKey: 'ml',        labelEn: 'L → ml',          labelBn: 'লিটার → মিলি' },
    { fromKey: 'litre',    toKey: 'gallon_us', labelEn: 'L → Gallon (US)', labelBn: 'লিটার → গ্যালন' },
    { fromKey: 'ml',       toKey: 'teaspoon',  labelEn: 'ml → Teaspoon',   labelBn: 'মিলি → চা-চামচ' },
    { fromKey: 'cup',      toKey: 'ml',        labelEn: 'Cup → ml',        labelBn: 'কাপ → মিলি' },
    { fromKey: 'cubic_foot', toKey: 'litre',   labelEn: 'cft → Liter',     labelBn: 'ঘনফুট → লিটার' },
  ],
  fuel: [
    { fromKey: 'km_l',  toKey: 'l_100km', labelEn: 'km/L → L/100km', labelBn: 'কিমি/লি → লি/১০০কিমি' },
    { fromKey: 'km_l',  toKey: 'mpg_us',  labelEn: 'km/L → MPG',     labelBn: 'কিমি/লি → এমপিজি' },
    { fromKey: 'mpg_us',toKey: 'km_l',    labelEn: 'MPG → km/L',     labelBn: 'এমপিজি → কিমি/লি' },
  ],
  speed: [
    { fromKey: 'kmh', toKey: 'mph',  labelEn: 'km/h → mph',   labelBn: 'কিমি/ঘণ্টা → মাইল/ঘণ্টা' },
    { fromKey: 'ms',  toKey: 'kmh',  labelEn: 'm/s → km/h',   labelBn: 'মি/সে → কিমি/ঘণ্টা' },
    { fromKey: 'kmh', toKey: 'knot', labelEn: 'km/h → Knot',  labelBn: 'কিমি/ঘণ্টা → নট' },
  ],
  time: [
    { fromKey: 'hour',   toKey: 'minute', labelEn: 'Hour → Min',  labelBn: 'ঘণ্টা → মিনিট' },
    { fromKey: 'day',    toKey: 'hour',   labelEn: 'Day → Hour',  labelBn: 'দিন → ঘণ্টা' },
    { fromKey: 'year',   toKey: 'day',    labelEn: 'Year → Day',  labelBn: 'বছর → দিন' },
    { fromKey: 'minute', toKey: 'second', labelEn: 'Min → Sec',   labelBn: 'মিনিট → সেকেন্ড' },
  ],
  digital_storage: [
    { fromKey: 'gb', toKey: 'mb', labelEn: 'GB → MB', labelBn: 'গিগাবাইট → মেগাবাইট' },
    { fromKey: 'tb', toKey: 'gb', labelEn: 'TB → GB', labelBn: 'টেরাবাইট → গিগাবাইট' },
    { fromKey: 'mb', toKey: 'kb', labelEn: 'MB → KB', labelBn: 'মেগাবাইট → কিলোবাইট' },
    { fromKey: 'gb', toKey: 'tb', labelEn: 'GB → TB', labelBn: 'গিগাবাইট → টেরাবাইট' },
  ],
  energy: [
    { fromKey: 'kcal',  toKey: 'kjoule', labelEn: 'kcal → kJ',  labelBn: 'কিলোক্যালরি → কিলোজুল' },
    { fromKey: 'kwh',   toKey: 'joule',  labelEn: 'kWh → J',    labelBn: 'কিলোওয়াট-ঘণ্টা → জুল' },
    { fromKey: 'calorie', toKey: 'joule',labelEn: 'cal → J',    labelBn: 'ক্যালরি → জুল' },
  ],
  pressure: [
    { fromKey: 'psi',  toKey: 'bar',  labelEn: 'psi → bar',  labelBn: 'পিএসআই → বার' },
    { fromKey: 'atm',  toKey: 'kpa',  labelEn: 'atm → kPa',  labelBn: 'এটিএম → কিলোপ্যাসকেল' },
    { fromKey: 'bar',  toKey: 'psi',  labelEn: 'bar → psi',  labelBn: 'বার → পিএসআই' },
    { fromKey: 'torr', toKey: 'pa',   labelEn: 'Torr → Pa',  labelBn: 'টর → প্যাসকেল' },
  ],
};