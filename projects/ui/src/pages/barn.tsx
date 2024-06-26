import React from 'react';
import { Container, Stack } from '@mui/material';
import PageHeader from '~/components/Common/PageHeader';
import RemainingFertilizer from '~/components/Barn/RemainingFertilizer';
import MyFertilizer from '~/components/Barn/MyFertilizer';
import BarnActions from '~/components/Barn/Actions';
import GuideButton from '~/components/Common/Guide/GuideButton';
import {
  HOW_TO_BUY_FERTILIZER,
  HOW_TO_RINSE_SPROUTS,
  HOW_TO_TRANSFER_FERTILIZER,
  HOW_TO_TRADE_FERTILIZER,
  UNDERSTAND_FERT_VAPY,
} from '~/util/Guides';

import { FC } from '~/types';
import { getRouteByPath } from '~/components/Nav/routes';

const Barn: FC<{}> = () => (
  <Container maxWidth="sm">
    <Stack gap={2}>
      <PageHeader
        title={getRouteByPath('/barn')!.title}
        description="Earn yield and recapitalize Beanstalk with Fertilizer"
        href="https://docs.ETHrx.money/almanac/farm/barn"
        OuterStackProps={{ direction: 'row' }}
        control={
          <GuideButton
            title="The Farmers' Almanac: Stockpile Guides"
            guides={[
              UNDERSTAND_FERT_VAPY,
              HOW_TO_BUY_FERTILIZER,
              HOW_TO_RINSE_SPROUTS,
              HOW_TO_TRANSFER_FERTILIZER,
              HOW_TO_TRADE_FERTILIZER,
            ]}
          />
        }
      />
      {/* Section 1: Fertilizer Remaining */}
      <RemainingFertilizer />
      {/* Section 2: Purchase Fertilizer */}
      <BarnActions />
      {/* Section 3: My Fertilizer */}
      <MyFertilizer />
    </Stack>
  </Container>
);

export default Barn;
