import React from 'react';
import { Box, Card, Container, Stack } from '@mui/material';
import { FC } from '~/types';
import TokenBalanceCards from '~/components/Balances/TokenBalanceCards';
import BalancesActions from '~/components/Balances/Actions';
import SiloBalancesHistory from '~/components/Balances/SiloBalancesHistory';
import SiloBalances from '~/components/Balances/SiloBalances';
import { getRouteByPath } from '~/components/Nav/routes';
import PageHeader from '~/components/Common/PageHeader';
import GuideButton from '~/components/Common/Guide/GuideButton';
import { XXLWidth } from '~/components/App/muiTheme';

const BalancesPage: FC<{}> = () => (
  <Container sx={{ maxWidth: `${XXLWidth}px !important`, width: '100%' }}>
    <Stack gap={2} width="100%">
      {/* <Stack width={{ xs: '100%', lg: 'calc(100% - 380px)' }} gap={0.5}>
        <Typography variant="h1">Balances</Typography>
        <BalancesHeader />
      </Stack> */}
      <PageHeader
        title={getRouteByPath('/balances')!.title}
        description="Earn yield and recapitalize Beanstalk with Fertilizer"
        href="https://docs.bean.money/almanac/farm/barn"
        OuterStackProps={{ direction: 'row' }}
        control={<GuideButton title="" guides={[]} />}
      />
      <Stack sx={{ minWidth: 0 }} width="100%" gap={2}>
        <Card sx={{ pt: 2, pb: 0 }}>
          <SiloBalancesHistory />
        </Card>
        <Card
          sx={{
            p: 2,
            pr: 3,
            pl: 3,
            display: 'flex',
            gap: 3,
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <div
              style={{
                color: 'rgb(61, 78, 108)',
              }}
            >
              Stalk
            </div>
            <div
              style={{
                color: 'black',
              }}
            >
              0.00
            </div>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <div
              style={{
                color: 'rgb(61, 78, 108)',
              }}
            >
              Seeds
            </div>
            <div
              style={{
                color: 'black',
              }}
            >
              0.00
            </div>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <div
              style={{
                color: 'rgb(61, 78, 108)',
              }}
            >
              Precursors
            </div>
            <div
              style={{
                color: 'black',
              }}
            >
              0.00
            </div>
          </Box>
        </Card>
        {/* Deposit Balances */}
        <Card>
          <SiloBalances />
        </Card>

        {/* Actions: Quick Harvest, Quick Rinse, & Silo Rewards */}
        <Box display={{ xs: 'block', lg: 'none' }}>
          <BalancesActions />
        </Box>
        {/* Farm & Circulating Balances */}
        <TokenBalanceCards />
      </Stack>

      {/* Actions: Quick Harvest, Quick Rinse, & Silo Rewards */}
      <Box display={{ xs: 'none', lg: 'block' }} sx={{ position: 'relative' }}>
        <BalancesActions />
      </Box>
    </Stack>
  </Container>
);

export default BalancesPage;
