import React, { useCallback, useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import BigNumber from 'bignumber.js';
import { ERC20Token, StepGenerator, Token } from '@beanstalk/sdk';
import { FarmerSiloBalance } from '~/state/farmer/silo';
import { ActionType } from '~/util/Actions';
import {
  TxnPreview,
  TxnSeparator,
  TxnSettings,
  SettingInput,
  SmartSubmitButton,
  FormTokenStateNew,
  FormTxnsFormState,
} from '~/components/Common/Form';
import { FarmFromMode, FarmToMode } from '~/lib/Beanstalk/Farm';
import { ZERO_BN } from '~/constants';
import { displayTokenAmount, tokenValueToBN } from '~/util';
import FarmModeField from '~/components/Common/Form/FarmModeField';
import TokenIcon from '~/components/Common/TokenIcon';
import useToggle from '~/hooks/display/useToggle';
import { TokenSelectMode } from '~/components/Common/Form/TokenSelectDialog';
import PillRow from '~/components/Common/Form/PillRow';
import TransactionToast from '~/components/Common/TxnToast';
import copy from '~/constants/copy';
import { FC } from '~/types';
import useFormMiddleware from '~/hooks/ledger/useFormMiddleware';
import TokenQuoteProviderWithParams from '~/components/Common/Form/TokenQuoteProviderWithParams';
import { QuoteHandlerWithParams } from '~/hooks/ledger/useQuoteWithParams';
import TokenSelectDialogNew from '~/components/Common/Form/TokenSelectDialogNew';
import useSdk, { getNewToOldToken } from '~/hooks/sdk';
import TokenOutput from '~/components/Common/Form/TokenOutput';
import TxnAccordion from '~/components/Common/TxnAccordion';
import useFarmerFormTxnsActions from '~/hooks/farmer/form-txn/useFarmerFormTxnActions';
import FormTxnsPrimaryOptions from '~/components/Common/Form/FormTxnsPrimaryOptions';
import FormTxnsSecondaryOptions from '~/components/Common/Form/FormTxnsSecondaryOptions';
import { FormTxn, FormTxnBuilder } from '~/util/FormTxns';
import useFarmerFormTxns from '~/hooks/farmer/form-txn/useFarmerFormTxns';

// -----------------------------------------------------------------------

type ClaimFormValues = {
  /**
   * When claiming, there is only one input token
   * (the claimable LP token). the amount of this
   * token is always the full claimable balance.
   *
   * In this case, token.amountOut is the amount received
   * for converting LP into `tokenOut`.
   */
  token: FormTokenStateNew;
  destination: FarmToMode | undefined;
  tokenOut: ERC20Token | undefined;
} & {
  settings: {
    slippage: number;
  };
} & FormTxnsFormState;

type ClaimQuoteHandlerParams = {
  toMode?: FarmToMode;
};

const ClaimForm: FC<
  FormikProps<ClaimFormValues> & {
    token: ERC20Token;
    claimableBalance: BigNumber;
  }
> = ({
  // Custom
  token,
  claimableBalance,
  // Formik
  values,
  isSubmitting,
  setFieldValue,
}) => {
  const sdk = useSdk();

  //
  const pool = useMemo(
    () => sdk.pools.getPoolByLPToken(token),
    [sdk.pools, token]
  );
  const claimableTokens = useMemo(
    () => [token, ...((token.isLP && pool?.tokens) || [])],
    [pool, token]
  );

  //
  const amount = claimableBalance;
  const isSubmittable =
    amount &&
    amount.gt(0) &&
    values.destination !== undefined &&
    (token.isLP ? values.tokenOut !== undefined : true);
  const tokenOut = values.tokenOut || (token as ERC20Token);

  //
  const handleQuote = useCallback<
    QuoteHandlerWithParams<ClaimQuoteHandlerParams>
  >(
    async (_tokenIn, _amountIn, _tokenOut, { toMode }) => {
      if (_tokenIn === _tokenOut) return { amountOut: _amountIn };
      const amountIn = _tokenIn.amount(_amountIn.toString());

      const { curve } = sdk.contracts;

      // Require pooldata to be loaded first.
      if (!pool || !_tokenIn.isLP) return null;

      const work = sdk.farm
        .create()
        .add(
          new sdk.farm.actions.RemoveLiquidityOneToken(
            pool.address,
            curve.registries.metaFactory.address,
            _tokenOut.address,
            FarmFromMode.INTERNAL,
            toMode
          )
        );
      const estimate = await work.estimate(amountIn);

      return {
        amountOut: tokenValueToBN(_tokenOut.fromBlockchain(estimate)),
        steps: work.generators as StepGenerator[],
      };
    },
    [sdk.contracts, sdk.farm, pool]
  );

  // Selected FormTxn Actions
  const formTxnActions = useFarmerFormTxnsActions();

  //
  const [isTokenSelectVisible, showTokenSelect, hideTokenSelect] = useToggle();

  //
  const handleSelectTokens = useCallback(
    (_tokens: Set<Token>) => {
      const _token = Array.from(_tokens)[0];
      setFieldValue('tokenOut', _token);
    },
    [setFieldValue]
  );

  // This should be memoized to prevent an infinite reset loop
  const quoteHandlerParams = useMemo(
    () => ({
      quoteSettings: {
        ignoreSameToken: false,
        onReset: () => ({ amountOut: claimableBalance }),
      },
    }),
    [claimableBalance]
  );

  return (
    <Form autoComplete="off" noValidate>
      <Stack gap={1}>
        <TokenQuoteProviderWithParams<ClaimQuoteHandlerParams>
          name="token"
          tokenOut={tokenOut}
          state={values.token}
          // This input is always disabled but we use
          // the underlying handleQuote functionality
          // for consistency with other forms.
          disabled
          //
          balance={amount || ZERO_BN}
          balanceLabel="Claimable Balance"
          // -----
          // FIXME:
          // "disableTokenSelect" applies the disabled prop to
          // the TokenSelect button. However if we don't pass
          // a handler to the button then it's effectively disabled
          // but shows with stronger-colored text. param names are
          // a bit confusing.
          // disableTokenSelect={true}
          handleQuote={handleQuote}
          displayQuote={false}
          {...quoteHandlerParams}
          params={{
            toMode: values.destination || FarmToMode.INTERNAL,
          }}
          belowComponent={<FormTxnsPrimaryOptions />}
        />
        <Stack gap={0}>
          {/* Setting: Destination */}
          <FarmModeField name="destination" />
          {/* Setting: Claim LP */}
          <>
            {token.isLP ? (
              <PillRow
                isOpen={isTokenSelectVisible}
                label="Claim LP as"
                onClick={showTokenSelect}
              >
                {values.tokenOut && <TokenIcon token={values.tokenOut} />}
                <Typography variant="body1">
                  {values.tokenOut ? (
                    values.tokenOut.symbol
                  ) : (
                    <>Select Output</>
                  )}
                </Typography>
              </PillRow>
            ) : null}
            <TokenSelectDialogNew
              open={isTokenSelectVisible}
              handleClose={hideTokenSelect}
              handleSubmit={handleSelectTokens}
              selected={values.tokenOut ? [values.tokenOut] : []}
              balances={undefined} // hide balances from right side of selector
              tokenList={claimableTokens as Token[]}
              mode={TokenSelectMode.SINGLE}
            />
          </>
        </Stack>
        {isSubmittable ? (
          <>
            <TxnSeparator />
            <TokenOutput>
              <TokenOutput.Row
                token={token}
                amount={values.token.amountOut || ZERO_BN}
              />
            </TokenOutput>
            <FormTxnsSecondaryOptions />
            <Box>
              <TxnAccordion>
                <TxnPreview
                  actions={[
                    {
                      type: ActionType.CLAIM_WITHDRAWAL,
                      amount: amount,
                      token: getNewToOldToken(token),
                      // message: `Claim ${displayTokenAmount(amount, token)}.`
                    },
                    token.equals(sdk.tokens.BEAN_CRV3_LP) &&
                    values.tokenOut !== token
                      ? {
                          type: ActionType.BASE,
                          message: `Unpack ${displayTokenAmount(
                            amount,
                            token
                          )} into ${displayTokenAmount(
                            values.token.amountOut || ZERO_BN,
                            tokenOut
                          )}.`,
                        }
                      : undefined,
                    {
                      type: ActionType.RECEIVE_TOKEN,
                      token: getNewToOldToken(tokenOut),
                      amount: values.token.amountOut || ZERO_BN,
                      destination: values.destination,
                    },
                  ]}
                  {...formTxnActions}
                />
              </TxnAccordion>
            </Box>
          </>
        ) : null}
        <SmartSubmitButton
          loading={isSubmitting}
          disabled={!isSubmittable || isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          tokens={[]}
          mode="auto"
        >
          Claim
        </SmartSubmitButton>
      </Stack>
    </Form>
  );
};

// -----------------------------------------------------------------------

const Claim: FC<{
  token: ERC20Token;
  siloBalance: FarmerSiloBalance;
}> = ({ token, siloBalance }) => {
  const sdk = useSdk();

  /// Form Txns Actions
  const formTxns = useFarmerFormTxns();

  /// Middleware
  const middleware = useFormMiddleware();

  /// Data
  const claimableBalance = siloBalance?.claimable.amount;
  const isBean = sdk.tokens.BEAN.equals(token);

  // Form
  const initialValues: ClaimFormValues = useMemo(
    () => ({
      // Input token values
      token: {
        token: token,
        amount: claimableBalance,
        amountOut: claimableBalance,
      },
      destination: undefined,
      tokenOut: undefined,
      settings: {
        slippage: 0.1,
      },
      farmActions: {
        preset: 'noPrimary',
        primary: undefined,
        secondary: undefined,
        exclude: isBean ? [FormTxn.CLAIM] : undefined,
      },
    }),
    [token, claimableBalance, isBean]
  );

  const onSubmit = useCallback(
    async (
      values: ClaimFormValues,
      formActions: FormikHelpers<ClaimFormValues>
    ) => {
      let txToast;
      try {
        middleware.before();
        const crates = siloBalance?.claimable?.crates;
        const amountIn = values.token.token.fromHuman(
          values.token.amount?.toString() || '0'
        );

        if (!crates || crates.length === 0 || amountIn.lte(0)) {
          throw new Error('Nothing to claim');
        }
        if (!values.destination) {
          throw new Error('Select a balance to claim to');
        }

        const tokenIn = values.token.token as ERC20Token;
        const tokenOut = (values.tokenOut || tokenIn) as ERC20Token; // FIXME: `token` will always be set

        if (!tokenOut) throw new Error('Select an output token');

        // If the user wants to swap their LP token for something else,
        // we send their Claimable `token` to their internal balance for
        // ease of interaction and gas efficiency.
        const removeLiquidity = token.isLP && !tokenIn.equals(tokenOut);
        const claimDestination = removeLiquidity
          ? FarmToMode.INTERNAL
          : values.destination;

        console.debug(
          `[Claim] claimDestination = ${claimDestination}, crates = `,
          crates
        );

        txToast = new TransactionToast({
          loading: `Claiming ${displayTokenAmount(
            claimableBalance,
            token
          )} from the Silo...`,
          success: `Claim successful. Added ${displayTokenAmount(
            values.token.amountOut || ZERO_BN,
            tokenOut
          )} to your ${copy.MODES[values.destination]}.`,
        });

        const claim = sdk.farm.create();

        // Claim multiple withdrawals of `token` in one call
        if (crates.length > 1) {
          console.debug(`[Claim] claiming ${crates.length} withdrawals`);
          claim.add(
            new sdk.farm.actions.ClaimWithdrawals(
              token.address,
              crates.map((crate) => crate.season.toString()),
              claimDestination
            )
          );
        } else {
          // Claim a single withdrawal of `token` in one call. Gas efficient.
          console.debug('[Claim] claiming a single withdrawal');
          claim.add(
            new sdk.farm.actions.ClaimWithdrawal(
              token.address,
              crates[0].season.toString(),
              claimDestination
            )
          );
        }

        if (removeLiquidity) {
          if (!values.token.steps) throw new Error('No quote found.');
          claim.add([...values.token.steps]);
        }

        const { execute, performed } = await FormTxnBuilder.compile(
          sdk,
          values.farmActions,
          formTxns.getGenerators,
          claim,
          amountIn,
          values.settings.slippage
        );

        const txn = await execute();
        txToast.confirming(txn);
        const receipt = await txn.wait();

        await formTxns.refetch(performed, {
          farmerSilo: true,
          farmerBalances: true,
        });

        txToast.success(receipt);
        formActions.resetForm();
      } catch (err) {
        if (txToast) {
          txToast.error(err);
        } else {
          const errorToast = new TransactionToast({});
          errorToast.error(err);
        }
      } finally {
        formActions.setSubmitting(false);
      }
    },
    [
      middleware,
      siloBalance?.claimable?.crates,
      token,
      claimableBalance,
      sdk,
      formTxns,
    ]
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {(formikProps) => (
        <>
          <TxnSettings placement="form-top-right">
            <SettingInput
              name="settings.slippage"
              label="Slippage Tolerance"
              endAdornment="%"
            />
          </TxnSettings>
          <Stack spacing={1}>
            <ClaimForm
              token={token}
              claimableBalance={claimableBalance}
              {...formikProps}
            />
          </Stack>
        </>
      )}
    </Formik>
  );
};

export default Claim;
