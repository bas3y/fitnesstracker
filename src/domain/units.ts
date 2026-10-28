import type { DistanceUnit, WeightUnit } from '../db/types';

export const KG_PER_LB = 0.45359237;
export const METERS_PER_MILE = 1609.344;

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

export function metersToDisplay(meters: number, unit: DistanceUnit): number {
  return unit === 'km' ? meters / 1000 : meters / METERS_PER_MILE;
}

export function displayToMeters(value: number, unit: DistanceUnit): number {
  return unit === 'km' ? value * 1000 : value * METERS_PER_MILE;
}
