/**
 * 8th scale house rent — Services (Pay and Allowances) Order, 2015, Rule 17(7).
 * Bundled so the calculator stays correct when hub CDN or localStorage has legacy flat rates.
 */
import payScale8thBundled from "../../../hub/payscales/pay_scale_8th.json";

export const HOUSE_RENT_8TH_BUNDLED =
  payScale8thBundled.allowances?.house_rent ?? null;

export function houseRent8thHasSlabs(allowances8th) {
  return Boolean(allowances8th?.house_rent?.slabs?.length);
}

/** Patch legacy hub/cache payloads that still use flat 55/45/40 percentages. */
export function ensure8thHouseRentAllowances(combinedPayscaleData) {
  if (!combinedPayscaleData?.allowances_8th || !HOUSE_RENT_8TH_BUNDLED?.slabs) {
    return combinedPayscaleData;
  }
  if (houseRent8thHasSlabs(combinedPayscaleData.allowances_8th)) {
    return combinedPayscaleData;
  }
  combinedPayscaleData.allowances_8th = {
    ...combinedPayscaleData.allowances_8th,
    house_rent: HOUSE_RENT_8TH_BUNDLED,
  };
  return combinedPayscaleData;
}

export function compute8thHouseRentAmount(
  basicVal,
  allowances8th,
  locationKey = "dhaka_city_corp",
) {
  const houseRentConfig = houseRent8thHasSlabs(allowances8th)
    ? allowances8th.house_rent
    : HOUSE_RENT_8TH_BUNDLED;

  if (houseRentConfig?.slabs?.length) {
    const slab =
      houseRentConfig.slabs.find(
        (s) => s.max_basic === null || basicVal <= s.max_basic,
      ) || houseRentConfig.slabs[houseRentConfig.slabs.length - 1];
    const rate = slab.rates?.[locationKey] ?? slab.rates?.dhaka_city_corp ?? 0.5;
    const minimum = slab.minimum?.[locationKey] ?? 0;
    const calculated = Math.round(basicVal * rate);
    return Math.max(calculated, minimum);
  }

  const legacyRate = houseRentConfig?.[locationKey] || 0.55;
  return Math.round(basicVal * legacyRate);
}
