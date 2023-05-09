import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TokenInput } from "../../components/Swap/TokenInput";
import { Token, TokenValue } from "@beanstalk/sdk";
import styled from "styled-components";
import { useAccount } from "wagmi";
import { ContractReceipt } from "ethers";
import { Well } from "@beanstalk/sdk/Wells";
import { useQuery } from "@tanstack/react-query";
import { LIQUIDITY_OPERATION_TYPE, LiquidityAmounts } from "./types";
import { Button } from "../Swap/Button";
import { ensureAllowance, hasMinimumAllowance } from "./allowance";
import { Log } from "../../utils/logger";
import QuoteDetails from "./QuoteDetails";

type AddLiquidityProps = {
  well: Well;
  txnCompleteCallback: () => void;
  slippage: number;
  slippageSettingsClickHandler: () => void;
};

export type AddLiquidityQuote = {
  quote: {
    quote: TokenValue[];
  };
  estimate: TokenValue;
};

export const AddLiquidity = ({ well, txnCompleteCallback, slippage, slippageSettingsClickHandler }: AddLiquidityProps) => {
  const { address } = useAccount();
  const [amounts, setAmounts] = useState<LiquidityAmounts>({});
  const [receipt, setReceipt] = useState<ContractReceipt | null>(null);

  // Indexed in the same order as well.tokens
  const [tokenAllowance, setTokenAllowance] = useState<boolean[]>([]);

  const bothAmountsNonZero = useMemo(() => {
    if (!well.tokens) {
      return false;
    }

    if (well.tokens.length === 0) {
      return false;
    }

    const nonZeroValues = Object.values(amounts).filter((amount) => amount.value.gt("0")).length;

    return nonZeroValues === well.tokens?.length;
  }, [amounts, well.tokens]);

  const checkMinAllowanceForAllTokens = useCallback(async () => {
    if (!address) {
      return;
    }

    const _tokenAllowance = [];
    for (let [index, token] of well.tokens!.entries()) {
      // only check approval if this token has an amount gt zero
      if (amounts[index] && amounts[index].gt(0)) {
        const tokenHasMinAllowance = await hasMinimumAllowance(address, well.address, token, amounts[index]);
        Log.module("AddLiquidity").debug(
          `Token ${token.symbol} with amount ${amounts[index].toHuman()} has approval ${tokenHasMinAllowance}`
        );
        _tokenAllowance.push(tokenHasMinAllowance);
      } else {
        _tokenAllowance.push(false);
      }
    }
    setTokenAllowance(_tokenAllowance);
  }, [address, amounts, well.address, well.tokens]);

  // Once we have our first quote, we show the details.
  // Subsequent quote invocations shows a spinner in the Expected Output row
  const [showQuoteDetails, setShowQuoteDetails] = useState<boolean>(false);

  const resetAmounts = useCallback(() => {
    if (well.tokens) {
      const initialAmounts: LiquidityAmounts = {};
      for (let i = 0; i < well.tokens.length; i++) {
        initialAmounts[i] = TokenValue.ZERO;
      }

      setAmounts(initialAmounts);
    }
  }, [well.tokens, setAmounts]);

  useEffect(() => {
    if (well.tokens) {
      const initialAmounts: LiquidityAmounts = {};
      for (let i = 0; i < well.tokens.length; i++) {
        initialAmounts[i] = TokenValue.ZERO;
      }

      setAmounts(initialAmounts);
    }
  }, [well.tokens]);

  const allTokensHaveMinAllowance = useMemo(() => tokenAllowance.filter((a) => a === false).length === 0, [tokenAllowance]);

  const { data: quote } = useQuery(["wells", "quote", "addliquidity", address, amounts, allTokensHaveMinAllowance], async () => {
    Log.module("AddLiquidity").debug("Getting quote");
    Log.module("AddLiquidity").debug("amounts", amounts);
    Log.module("AddLiquidity").debug("bothAmountsNonZero", bothAmountsNonZero);
    Log.module("AddLiquidity").debug("address", address);
    Log.module("AddLiquidity").debug("allTokensHaveMinAllowance", allTokensHaveMinAllowance);
    
    if (!bothAmountsNonZero) {
      return null;
    }

    if (!allTokensHaveMinAllowance) {
      return null;
    }

    // so we show the quote details page on first quote
    setShowQuoteDetails(true);

    try {
      const quote = await well.addLiquidityQuote(Object.values(amounts));
      const estimate = await well.addLiquidityGasEstimate(Object.values(amounts), quote, address);
      return {
        quote,
        estimate
      };
    } catch (error: any) {
      Log.module("AddLiquidity").error("Error during quote: ", (error as Error).message);
      return null;
    }
  });

  const addLiquidityButtonClickHandler = useCallback(async () => {
    if (quote && address) {
      const quoteAmountLessSlippage = quote.quote.subSlippage(slippage);
      const addLiquidityTxn = await well.addLiquidity(Object.values(amounts), quoteAmountLessSlippage, address);
      const receipt = await addLiquidityTxn.wait();
      setReceipt(receipt);
      resetAmounts();
      checkMinAllowanceForAllTokens();
      txnCompleteCallback();
    }
  }, [quote, address, slippage, well, amounts, resetAmounts, checkMinAllowanceForAllTokens, txnCompleteCallback]);

  const handleInputChange = useCallback(
    (index: number) => (a: TokenValue) => {
      setAmounts({ ...amounts, [index]: a });
    },
    [amounts]
  );

  useEffect(() => {
    if (!address) {
      return;
    }
    if (!well.tokens) {
      return;
    }

    if (!bothAmountsNonZero) {
      return;
    }

    checkMinAllowanceForAllTokens();
  }, [well.tokens, address, bothAmountsNonZero, amounts, checkMinAllowanceForAllTokens]);

  const addLiquidityButtonEnabled = useMemo(
    () => address && bothAmountsNonZero && allTokensHaveMinAllowance,
    [address, bothAmountsNonZero, allTokensHaveMinAllowance]
  );

  const approveTokenButtonClickHandler = useCallback(
    (tokenIndex: number) => async () => {
      if (!address) {
        return;
      }

      if (!well.tokens) {
        return;
      }

      if (!amounts) {
        return;
      }
      await ensureAllowance(address, well.address, well.tokens[tokenIndex], amounts[tokenIndex]);
      checkMinAllowanceForAllTokens();
    },
    [address, well.tokens, well.address, amounts, checkMinAllowanceForAllTokens]
  );

  const buttonLabel = useMemo(() => (!bothAmountsNonZero ? "Input Token Amount" : "Add Liquidity"), [bothAmountsNonZero]);

  return (
    <div>
      {well.tokens!.length > 0 && (
        <div>
          <div>
            <TokenListContainer>
              {well.tokens?.map((token: Token, index: number) => (
                <TokenInput
                  key={`input${index}`}
                  id={`input${index}`}
                  label={`Input amount in ${token.symbol}`}
                  token={well.tokens![index]}
                  amount={amounts[index]}
                  onAmountChange={handleInputChange(index)}
                  canChangeToken={false}
                  loading={false}
                />
              ))}
              <Divider />
            </TokenListContainer>
            {showQuoteDetails && (
              <QuoteDetails
                type={LIQUIDITY_OPERATION_TYPE.ADD}
                quote={quote}
                wellLpToken={well.lpToken}
                slippageSettingsClickHandler={slippageSettingsClickHandler}
                slippage={slippage}
              />
            )}
            {/* // TODO: Should be a notification */}
            {receipt && <h2>{`txn hash: ${receipt.transactionHash.substring(0, 6)}...`}</h2>}
            {well.tokens!.length > 0 &&
              well.tokens!.map((token: Token, index: number) => {
                if (!tokenAllowance[index] && amounts[index]) {
                  return (
                    <ButtonWrapper key={`approvebuttonwrapper${index}`}>
                      <ApproveTokenButton
                        key={`approvebutton${index}`}
                        disabled={amounts && amounts[index].lte(0)}
                        loading={false}
                        label={`Approve ${token.symbol}`}
                        onClick={approveTokenButtonClickHandler(index)}
                      />
                    </ButtonWrapper>
                  );
                }

                return null;
              })}
            <ButtonWrapper>
              <AddLiquidityButton
                disabled={!addLiquidityButtonEnabled}
                loading={false}
                label={buttonLabel}
                onClick={addLiquidityButtonClickHandler}
              />
            </ButtonWrapper>
          </div>
        </div>
      )}
    </div>
  );
};

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 10px;
  :last-of-type {
    margin-bottom: 0;
  }
`;

const ApproveTokenButton = styled(Button)`
  margin-bottom: 10px;
`;

const AddLiquidityButton = styled(Button)``;

const Divider = styled.hr`
  width: 100%;
  background-color: #000;
  border: none;
  height: 2px;
`;

const TokenListContainer = styled.div`
  width: 465px;
  display: flex;
  flex-direction: column;
  background: #1b1e2b;
  border-radius: 16px;
  padding: 12px;
  gap: 12px;
`;
