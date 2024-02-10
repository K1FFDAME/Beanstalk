import React, { useState } from 'react';
import { Stack, Typography, Box } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link } from 'react-router-dom';
import { displayFullBN, normalizeBN } from '~/util';
import EmbeddedCard from '../Common/EmbeddedCard';
import Row from '../Common/Row';
import TokenIcon from '../Common/TokenIcon';
import { BeanstalkPalette } from '../App/muiTheme';
import { useAppSelector } from '~/state';
import useSdk from '~/hooks/sdk';

const ThinDivider: React.FC<{}> = () => (
  <Box
    sx={{
      width: '100%',
      borderTop: '0.5px solid',
      borderColor: BeanstalkPalette.lightestGrey,
      height: '0.5px',
    }}
  />
);

const FieldInfo: React.FC<{}> = () => {
  const sdk = useSdk();
  const harvestableIndex = useAppSelector(
    (s) => s._beanstalk.field.harvestableIndex
  );
  const PODS = sdk.tokens.PODS;

  const [open, setOpen] = useState(false);

  const handleOnClick = () => {
    setOpen((prev) => !prev);
  };

  return (
    <Stack gap={2}>
      <EmbeddedCard>
        <Row p={2} width="100%" justifyContent="space-between">
          <Stack gap={0.25}>
            <Row gap={0.5}>
              <Typography>Harvested Capsules:</Typography>
              <TokenIcon token={PODS} />
              <Typography component="span" variant="h4">
                {displayFullBN(normalizeBN(harvestableIndex), 0)}
              </Typography>
            </Row>
            <Typography color="text.secondary">
              Debt repaid by Pharmacy to Capsule holders since deployment (does
              not count towards the current Capsule Line).
            </Typography>
          </Stack>
          <Link to="/analytics?field=harvested">
            <ChevronRightIcon fontSize="small" />
          </Link>
        </Row>
      </EmbeddedCard>
      <EmbeddedCard>
        <Stack p={2} gap={2}>
          <Typography variant="h4">🌾 Overview</Typography>
          <ThinDivider />
          <Typography>
            The Lab is Pharmacy&#39;s credit facility. Pharmacy relies on a
            decentralized set of creditors to maintain ETHrx price stability.
            Farmers who Sow ETHrxs (lend ETHrxns to Pharmacy) are known as
            Sowers. ETHrxs are Sown in exchange for Capsules, the
            Pharmacy-native debt asset. Loans to Pharmacy are issued with a
            fixed interest rate, known as Temperature, and an unknown maturity
            date.
          </Typography>
          {open ? (
            <>
              <Typography>
                The number of Capsules received from 1 Sown ETHrx is determined
                by the Temperature at the time of Sowing. Newly issued Capsules
                accumulate in the back of the Capsule Line. The front of the
                Capsule Line receives 1/3 of new ETHrx mints when there are
                outstanding Precursors (Precursors are issued by the Stockpile).
                If there are no outstanding Precursors, the front of the Capsule
                Line receives 1/2 of new ETHrx mints.
              </Typography>
              <Typography>
                Capsules become Harvestable (redeemable) into ETHrxs on a FIFO
                basis. Capsules are tradeable on the Counter.
              </Typography>
            </>
          ) : null}
          <ThinDivider />
          <Typography
            onClick={handleOnClick}
            sx={{
              alignSelf: 'center',
              cursor: 'pointer',
              ':hover': {
                color: 'primary.main',
              },
            }}
          >
            {open ? 'View less' : 'View more'}
          </Typography>
        </Stack>
      </EmbeddedCard>
    </Stack>
  );
};

export default FieldInfo;
