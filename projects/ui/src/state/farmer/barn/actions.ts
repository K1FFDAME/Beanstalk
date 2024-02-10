import { createAction } from '@reduxjs/toolkit';
import { FarmerBarn } from '.';

export const updateFarmerBarn = createAction<FarmerBarn>(
  'farmer/barn/updateStockpile'
);

export const resetFarmerBarn = createAction('farmer/barn/reset');
