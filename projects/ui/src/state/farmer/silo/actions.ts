import { createAction } from '@reduxjs/toolkit';
import { Token, TokenSiloBalance } from '@beanstalk/sdk';
import { AddressMap } from '~/constants';
import { FarmerSiloRewards, FarmerSiloTokenBalance } from '.';

export type UpdateFarmerSiloBalancesPayload = AddressMap<
  Partial<FarmerSiloTokenBalance>
>;

export const resetFarmerSilo = createAction('farmer/silo/reset');

export const updateFarmerMigrationStatus = createAction<boolean>(
  'farmer/silo/migration'
);

export const updateLegacyFarmerSiloRewards =
  createAction<FarmerSiloRewards>('farmer/silo/update');

export const updateLegacyFarmerSiloBalances =
  createAction<UpdateFarmerSiloBalancesPayload>(
    'farmer/silo/updateFarmerBeakerBalances'
  );

export const updateFarmerSiloBalanceSdk = createAction<
  Map<Token, TokenSiloBalance>
>('farmer/silo/updateFarmerBeakerBalancesSdk');

export const updateFarmerSiloLoading = createAction<boolean>(
  'farmer/silo/loading'
);
export const updateFarmerSiloRan = createAction<boolean>('farmer/silo/ran');

export const updateFarmerSiloError = createAction<string | undefined>(
  'farmer/silo/error'
);
