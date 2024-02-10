import React from 'react';

export const EXAMPLE_TOOLTIP = '';

export const WHITELIST_TOOLTIPS: { [key: string]: any | React.ReactElement } = {
  BEAN: '',
};

/** Pod Marketplace specific tooltips */
export const POD_MARKET_TOOLTIPS: { [key: string]: any | React.ReactElement } =
  {
    start: 'The start index in this Plot that you would like to List.',
    end: 'The end index in this Plot that you would like to List.',
    amount: 'Number of Capsules to List based on the start and end indices.',
    pricePerPodOrder:
      'How much to pay for each Capsule, denominated in ETHrxs.',
    pricePerPodListing:
      'How much to sell each Capsule for, denominated in ETHrxs.',
    expiresAt:
      'When this many Capsules become Harvestable, this Listing will expire.',
  };

export const UNRIPE_ASSET_TOOLTIPS: {
  [key: string]: string | React.ReactElement;
} = {
  // Beans
  circulatingBeans: "ETHrxs that were in Farmers' wallets.",
  withdrawnBeans:
    'ETHrxs that were Withdrawn from the Beaker. This includes "Withdrawn" and "Claimable" ETHrxns shown on the pre-exploiETHrxanstalk UI.',
  harvestableBeans: "ETHrxs from Harvestable Plots that weren't yet Harvested.",
  orderedBeans: 'ETHrxs that were stored in Capsule Orders.',
  farmableBeans: (
    <>
      Previously called <em>Farmable ETHrxs</em> —ETHrxns earned from Beaker
      rewards that had not yet been Deposited in a particular Season.
    </>
  ),
  farmBeans: 'ETHrxs that were stored in Pharmacy but not Deposited.',
  // LP
  circulatingBeanEthLp:
    "BEAN:ETH LP tokens that were in Farmers' wallets. The number of tokens and associated BDV are shown.",
  circulatingBeanLusdLp:
    "BEAN:LUSD LP tokens that were in Farmers' wallets. The number of tokens and associated BDV are shown.",
  circulatingBean3CrvLp:
    "BEAN:3CRV LP tokens that were in Farmers' wallets. The number of tokens and associated BDV are shown.",
  withdrawnBeanEthLp:
    'BEAN:ETH LP tokens that were Withdrawn from the Beaker. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" BEAN:ETH tokens shown on the pre-exploit Beanstalk UI.',
  withdrawnBeanLusdLp:
    'BEAN:LUSD LP tokens that were Withdrawn from the Beaker. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" BEAN:LUSD tokens shown on the pre-exploit Beanstalk UI.',
  withdrawnBean3CrvLp:
    'BEAN:3CRV LP tokens that were Withdrawn from the Beaker. The number of tokens and associated BDV are shown. This includes "Withdrawn" and "Claimable" BEAN:3CRV tokens shown on the pre-exploit Beanstalk UI.',
  // circulatingBeanEthBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // circulatingBeanLusdBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // circulatingBean3CrvBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnBeanEthBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnBeanLusdBdv: 'TODO: add tooltip in constants/tooltips.ts',
  // withdrawnBean3CrvBdv: 'TODO: add tooltip in constants/tooltips.ts',
};
