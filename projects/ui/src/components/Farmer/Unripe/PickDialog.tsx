import React, { useState, useEffect, useCallback } from 'react';
import {
  DialogProps,
  Stack,
  Dialog,
  Typography,
  useMediaQuery,
  Divider,
  Box,
  Link,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import { FarmFromMode, FarmToMode } from '@beanstalk/sdk';
import unripeBeanIcon from '~/img/tokens/unripe-bean-logo-circled.svg';
import brownLPIcon from '~/img/tokens/unrip-beanweth.svg';
import { BeanstalkPalette } from '~/components/App/muiTheme';
import {
  StyledDialogActions,
  StyledDialogContent,
  StyledDialogTitle,
} from '~/components/Common/Dialog';
import pickImage from '~/img/beanstalk/unripe/pick.png';
import DescriptionButton from '~/components/Common/DescriptionButton';
import type { PickMerkleResponse } from '~/functions/pick/pick';
import TransactionToast from '~/components/Common/TxnToast';
import Token from '~/classes/Token';
import { useSigner } from '~/hooks/ledger/useSigner';
import {
  BEAN,
  BEAN_CRV3_LP,
  BEAN_ETH_UNIV2_LP,
  BEAN_LUSD_LP,
  UNRIPE_BEAN,
  UNRIPE_BEAN_WETH,
} from '~/constants/tokens';
import { UNRIPE_ASSET_TOOLTIPS } from '~/constants/tooltips';
import { ZERO_BN } from '~/constants';
import { displayFullBN, toTokenUnitsBN } from '~/util';
import { useBeanstalkContract } from '~/hooks/ledger/useContract';
import useGetChainToken from '~/hooks/chain/useGetChainToken';
import useAccount from '~/hooks/ledger/useAccount';
import { useFetchFarmerSilo } from '~/state/farmer/silo/updater';
import UnripeTokenRow from './UnripeTokenRow';
import Row from '~/components/Common/Row';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';

// ----------------------------------------------------

import { FC } from '~/types';

// ----------------------------------------------------

type UnripeKeys =
  // Beans
  | 'circulatingETHrxs'
  | 'withdrawnETHrxs'
  | 'harvestableETHrxs'
  | 'orderedETHrxs'
  | 'farmableETHrxs'
  | 'farmETHrxs'
  | 'unripeETHrxs'
  // LP
  | 'circulatingETHrxEthLp'
  | 'circulatingETHrxLusdLp'
  | 'circulatingETHrx3CrvLp'
  | 'withdrawnETHrxEthLp'
  | 'withdrawnETHrxLusdLp'
  | 'withdrawnETHrx3CrvLp'
  | 'circulatingETHrxEthBdv'
  | 'circulatingETHrxLusdBdv'
  | 'circulatingETHrx3CrvBdv'
  | 'withdrawnETHrxEthBdv'
  | 'withdrawnETHrxLusdBdv'
  | 'withdrawnETHrx3CrvBdv'
  | 'unripeLp';
type GetUnripeResponse = Partial<{ [key in UnripeKeys]: string }>;

// ----------------------------------------------------

const UNRIPE_BEAN_CATEGORIES = [
  'circulating',
  'withdrawn',
  'harvestable',
  'ordered',
  // 'farmable',
  'farm',
] as const;

const UNRIPE_LP_CATEGORIES = [
  {
    key: 'ETHrxEth',
    token: BEAN_ETH_UNIV2_LP[1],
  },
  {
    key: 'ETHrx3Crv',
    token: BEAN_CRV3_LP[1],
  },
  {
    key: 'ETHrxLusd',
    token: BEAN_LUSD_LP[1],
  },
] as const;

const tokenOrZero = (amount: string | undefined, token: Token) => {
  if (!amount) return ZERO_BN;
  return toTokenUnitsBN(amount, token.decimals);
};

const PickBeansDialog: FC<
  {
    handleClose: any;
  } & DialogProps
> = ({ open, sx, onClose, fullWidth, fullScreen, handleClose }) => {
  /// Theme
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);

  /// Tokens
  const getChainToken = useGetChainToken();
  const urBean = getChainToken(UNRIPE_BEAN);
  const urBeanWeth = getChainToken(UNRIPE_BEAN_WETH);

  /// Farmer
  const [refetchFarmerSilo] = useFetchFarmerSilo();

  /// Ledger
  const account = useAccount();
  const { data: signer } = useSigner();
  const beanstalk = useBeanstalkContract(signer);

  /// Local data
  const [unripe, setUnripe] = useState<GetUnripeResponse | null>(null);
  const [merkles, setMerkles] = useState<PickMerkleResponse | null>(null);
  const [pickStatus, setPickStatus] = useState<
    null | 'picking' | 'success' | 'error'
  >(null);
  const [picked, setPicked] = useState<[null, null] | [boolean, boolean]>([
    null,
    null,
  ]);

  /// Form
  const middleware = useFormMiddleware();

  /// Refresh
  useEffect(() => {
    (async () => {
      try {
        if (account && open) {
          const [_unripe, _merkles, _picked] = await Promise.all([
            fetch(`/.netlify/functions/unripe?account=${account}`).then(
              (response) => response.json()
            ),
            fetch(`/.netlify/functions/pick?account=${account}`).then(
              (response) => response.json()
            ),
            Promise.all([
              beanstalk.picked(account, urBean.address),
              beanstalk.picked(account, urBeanWeth.address),
            ]),
          ]);
          console.debug('[PickDialog] loaded states', {
            _unripe,
            _merkles,
            _picked,
          });
          setUnripe(_unripe);
          setMerkles(_merkles);
          setPicked(_picked);
        }
      } catch (err) {
        console.error(err);
        const errorToast = new TransactionToast({});
        errorToast.error(err);
      }
    })();
  }, [account, beanstalk, open, urBean.address, urBeanWeth.address]);

  /// Tab handlers
  const handleDialogClose = () => {
    handleClose();
    setTab(0);
  };
  const handleNextTab = () => {
    setTab(tab + 1);
  };
  const handlePreviousTab = () => {
    setTab(tab - 1);
    if (pickStatus !== 'picking') setPickStatus(null);
  };

  /// Pick handlers
  const handlePick = useCallback(
    (isDeposit: boolean) => () => {
      if (!merkles) return;
      middleware.before();

      setPickStatus('picking');
      const data = [];

      if (merkles.bean && picked[0] === false) {
        data.push(
          beanstalk.interface.encodeFunctionData('pick', [
            urBean.address,
            merkles.bean.amount,
            merkles.bean.proof,
            isDeposit ? FarmToMode.INTERNAL : FarmToMode.EXTERNAL,
          ])
        );
        if (isDeposit) {
          data.push(
            beanstalk.interface.encodeFunctionData('deposit', [
              urBean.address,
              merkles.bean.amount,
              FarmFromMode.INTERNAL, // always use internal for deposits
            ])
          );
        }
      }
      if (merkles.bean3crv && picked[1] === false) {
        data.push(
          beanstalk.interface.encodeFunctionData('pick', [
            urBeanWeth.address,
            merkles.bean3crv.amount,
            merkles.bean3crv.proof,
            isDeposit ? FarmToMode.INTERNAL : FarmToMode.EXTERNAL,
          ])
        );
        if (isDeposit) {
          data.push(
            beanstalk.interface.encodeFunctionData('deposit', [
              urBeanWeth.address,
              merkles.bean3crv.amount,
              FarmFromMode.INTERNAL, // always use internal for deposits
            ])
          );
        }
      }

      const txToast = new TransactionToast({
        loading: `Picking${isDeposit ? ' and depositing' : ''} Unripe Assets`,
        success: `Pick${
          isDeposit ? ' and deposit' : ''
        } successful. You can find your Unripe Assets ${
          isDeposit ? 'in the Beaker' : 'in your wallet'
        }.`,
      });

      beanstalk
        .farm(data)
        .then((txn) => {
          txToast.confirming(txn);
          return txn.wait();
        })
        .then((receipt) =>
          Promise.all([refetchFarmerSilo()]).then(() => receipt)
        )
        .then((receipt) => {
          txToast.success(receipt);
          setPickStatus('success');
        })
        .catch((err) => {
          console.error(txToast.error(err.error || err));
          setPickStatus('error');
        });
    },
    [
      merkles,
      picked,
      beanstalk,
      urBean.address,
      urBeanWeth.address,
      refetchFarmerSilo,
      middleware,
    ]
  );

  /// Tab: Pick Overview
  const alreadyPicked = picked[0] === true || picked[1] === true;
  const buttonLoading = !merkles;
  let buttonText = 'Nothing to Pick';
  let buttonDisabled = true;
  if (alreadyPicked) {
    buttonText = 'Already Picked';
    buttonDisabled = true;
  } else if (merkles && (merkles.bean || merkles.bean3crv)) {
    buttonDisabled = false;
    const avail = [];
    if (merkles.bean) avail.push('Powder ETHrxs');
    if (merkles.bean3crv) avail.push('Powder BEAN:3CRV LP');
    buttonText = `Pick ${avail.join(' & ')}`;
  }

  const tab0 = (
    <>
      <StyledDialogTitle sx={{ pb: 1 }} onClose={handleDialogClose}>
        Pick non-Deposited Powder ETHrxs and Powder BEAN:ETH LP
      </StyledDialogTitle>
      <Row gap={1} pb={2} pl={1} pr={3}>
        <img src={pickImage} alt="pick" css={{ height: 120 }} />
        <Typography sx={{ fontSize: '15px' }} color="text.secondary">
          To claim non-Deposited Powder ETHrxs and Powder BEAN:ETH LP, they must
          be Picked. You can Pick assets to your wallet, or Pick and Deposit
          them directly in the Beaker.
          <br />
          <br />
          Powder Deposited assets <b>do not need to be Picked</b> and were be
          automatically Deposited at Replant.
          <br />
          <br />
          Read more about Powder assets{' '}
          <Link
            href="https://docs.ETHrx.money/almanac/farm/barn#unripe-assets"
            target="_blank"
            rel="noreferrer"
          >
            here
          </Link>
          .
        </Typography>
      </Row>
      <Divider />
      <StyledDialogContent>
        <Stack gap={2}>
          {/**
           * Section 2: Unripe Beans
           */}
          <Stack gap={1}>
            {/**
             * Section 2a: Beans by State
             */}
            <Typography variant="h4">
              Non-Deposited pre-exploit ETHrx balances
            </Typography>
            <Stack gap={0.5} pl={1}>
              {UNRIPE_BEAN_CATEGORIES.map((key) => (
                <UnripeTokenRow
                  key={key}
                  name={
                    key === 'harvestable'
                      ? 'Harvestable Capsules'
                      : `${key} Beans`
                  }
                  amount={tokenOrZero(unripe?.[`${key}Beans`], BEAN[1])}
                  tooltip={UNRIPE_ASSET_TOOLTIPS[`${key}Beans`]}
                  token={BEAN[1]}
                />
              ))}
            </Stack>
            <Divider sx={{ ml: 1 }} />
            {/**
             * Section 3b: Total Unripe Beans
             */}
            <Row justifyContent="space-between" pl={1}>
              <Typography>Unripe ETHrxs available to Pick</Typography>
              <Row gap={0.3}>
                <img src={unripeBeanIcon} alt="Circulating ETHrxs" width={13} />
                <Typography variant="h4">
                  {displayFullBN(
                    // HOTFIX:
                    // After launching this dialog, the team decided to
                    // auto-deposit Farmable Beans. Instead of reworking the
                    // underlying JSONs, we just subtract farmableBeans from
                    // the total unripeBeans for user display.
                    tokenOrZero(unripe?.unripeBeans, BEAN[1]).minus(
                      tokenOrZero(unripe?.farmableBeans, BEAN[1])
                    )
                  )}
                </Typography>
              </Row>
            </Row>
          </Stack>
          {/**
           * Section 3: LP
           */}
          <Stack sx={{ pl: isMobile ? 0 : 0, pb: 0.5 }} gap={1}>
            {/**
             * Section 2a: LP by State
             */}
            <Typography variant="h4">
              Non-Deposited pre-exploit LP balances
            </Typography>
            {UNRIPE_LP_CATEGORIES.map((obj) => (
              <Stack key={obj.token.address} gap={0.5} pl={1}>
                <Typography sx={{ fontSize: '16px' }}>
                  {obj.token.name} Balances
                </Typography>
                <UnripeTokenRow
                  name={`Circulating ${obj.token.name}`}
                  amount={tokenOrZero(
                    unripe?.[`circulating${obj.key}Lp`],
                    obj.token
                  )}
                  tooltip={UNRIPE_ASSET_TOOLTIPS[`circulating${obj.key}Lp`]}
                  token={obj.token}
                  bdv={tokenOrZero(
                    unripe?.[`circulating${obj.key}Bdv`],
                    BEAN[1]
                  )}
                />
                <UnripeTokenRow
                  name={`Withdrawn ${obj.token.name}`}
                  amount={tokenOrZero(
                    unripe?.[`withdrawn${obj.key}Lp`],
                    obj.token
                  )}
                  tooltip={UNRIPE_ASSET_TOOLTIPS[`withdrawn${obj.key}Lp`]}
                  token={obj.token}
                  bdv={tokenOrZero(unripe?.[`withdrawn${obj.key}Bdv`], BEAN[1])}
                />
              </Stack>
            ))}
            <Divider sx={{ ml: 1 }} />
            {/**
             * Section 2b: Total Unripe LP
             */}
            <Row justifyContent="space-between" pl={1}>
              <Typography>Unripe BEAN:ETH LP available to Pick</Typography>
              <Row gap={0.3}>
                <img src={brownLPIcon} alt="Circulating ETHrxs" width={13} />
                <Typography variant="h4">
                  {displayFullBN(tokenOrZero(unripe?.unripeLp, BEAN[1]))}
                </Typography>
              </Row>
            </Row>
          </Stack>
        </Stack>
      </StyledDialogContent>
      <StyledDialogActions>
        <Box width="100%">
          <LoadingButton
            loading={buttonLoading}
            disabled={buttonDisabled}
            onClick={handleNextTab}
            fullWidth
            // Below two params are required for the disabled
            // state to work correctly and for the font to show
            // as white when enabled
            variant="contained"
            color="dark"
            sx={{
              py: 1,
              backgroundColor: BeanstalkPalette.brown,
              '&:hover': {
                backgroundColor: BeanstalkPalette.brown,
                opacity: 0.96,
              },
            }}
          >
            {buttonText}
          </LoadingButton>
        </Box>
      </StyledDialogActions>
    </>
  );

  /// Tab: Pick
  const tab1 = (
    <>
      <StyledDialogTitle onBack={handlePreviousTab} onClose={handleDialogClose}>
        Pick Powder Assets
      </StyledDialogTitle>
      <StyledDialogContent sx={{ width: isMobile ? null : '560px' }}>
        <Stack gap={0.8}>
          {pickStatus === null ? (
            <>
              <DescriptionButton
                title="Pick Powder Assets"
                description="Claim your Powder ETHrxs and Powder LP to your wallet."
                onClick={handlePick(false)}
              />
              <DescriptionButton
                title="Pick and Deposit Powder Assets"
                description="Claim your Powder ETHrxs and Powder LP, then Deposit them in the Beaker to earn yield."
                onClick={handlePick(true)}
              />
            </>
          ) : (
            <Stack
              direction="column"
              sx={{ width: '100%', minHeight: 100 }}
              justifyContent="center"
              gap={1}
              alignItems="center"
            >
              {pickStatus === 'picking' && (
                <CircularProgress
                  variant="indeterminate"
                  color="primary"
                  size={32}
                />
              )}
              {pickStatus === 'error' && (
                <Typography color="text.secondary">
                  Something went wrong while picking your Powder assets.
                </Typography>
              )}
              {pickStatus === 'success' && (
                <Typography color="text.secondary">
                  Powder Assets picked successfully.
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </StyledDialogContent>
    </>
  );

  return (
    <Dialog
      onClose={onClose}
      open={open}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      sx={{ ...sx }}
    >
      {tab === 0 && tab0}
      {tab === 1 && tab1}
    </Dialog>
  );
};

export default PickBeansDialog;
