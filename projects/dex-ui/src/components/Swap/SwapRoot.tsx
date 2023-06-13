import { Token, TokenValue } from "@beanstalk/sdk";
import React, { useCallback, useEffect, useState } from "react";
import { useTokens } from "src/tokens/TokenProvider";
import styled from "styled-components";
import { ArrowButton } from "./ArrowButton";
import { TokenInput } from "./TokenInput";
import { useAllTokensBalance } from "src/tokens/useAllTokenBalance";
import { useSwapBuilder } from "./useSwapBuilder";
import { useAccount } from "wagmi";
import { Quote, QuoteResult } from "@beanstalk/sdk/Wells";
import { Button } from "./Button";
import { Log } from "src/utils/logger";
import { useParams, useSearchParams } from "react-router-dom";
import { TransactionToast } from "../TxnToast/TransactionToast";

export const SwapRoot = () => {
  const { address: account } = useAccount();

  const [tokenSwapParams, setTokenSwapParams] = useSearchParams();
  const fromToken = tokenSwapParams.get("fromToken")
  const toToken = tokenSwapParams.get("toToken")

  const tokens = useTokens();
  const [inAmount, setInAmount] = useState<TokenValue>();
  const [inToken, setInToken] = useState<Token>(fromToken ? tokens[fromToken] ? tokens[fromToken] : tokens["WETH"] : tokens["WETH"]);
  const [outToken, setOutToken] = useState<Token>(toToken ? tokens[toToken] ? tokens[toToken] : tokens["BEAN"] : tokens["BEAN"]);
  const [outAmount, setOutAmount] = useState<TokenValue>();
  const [slippage, setSlippage] = useState<number>(0.1);
  const [isLoadingAllBalances, setIsLoadingAllBalances] = useState(true);
  const { isLoading: isAllTokenLoading } = useAllTokensBalance();
  const [quoter, setQuoter] = useState<Quote | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [readyToSwap, setReadyToSwap] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  const [quote, setQuote] = useState<QuoteResult | undefined>();
  const builder = useSwapBuilder();

  // Fetch all tokens. Needed for populating the token selector dropdowns
  useEffect(() => {
    const fetching = isAllTokenLoading;
    fetching ? setIsLoadingAllBalances(true) : setTimeout(() => setIsLoadingAllBalances(false), 500);
  }, [isAllTokenLoading]);

  // Builds a Quoter object. Dependency array updates it when those change
  useEffect(() => {
    const quoter = builder?.buildQuote(inToken, outToken, account || "");
    setQuoter(quoter ?? null);
  }, [inToken, outToken, builder, account]);

  useEffect(() => {
    readyToSwap && !!account ? setButtonEnabled(true) : setButtonEnabled(false);
  }, [readyToSwap, account]);

  const arrowHandler = () => {
    const prevInToken = inToken;
    const prevInAmount = inAmount;

    setInToken(outToken);
    setInAmount(outAmount);
    setOutToken(prevInToken);
    setOutAmount(prevInAmount);
  };

  const handleInputChange = useCallback(
    async (a: TokenValue) => {
      setInAmount(a);
      if (a.eq(0)) {
        setOutAmount(outToken.amount(0));
        return;
      }

      try {
        const quote = await quoter?.quoteForward(a, account!, slippage);
        Log.module("swap").debug("Forward quote", quote);
        if (!quote) {
          setOutAmount(undefined);
          setNeedsApproval(true);
          setQuote(undefined);
          setReadyToSwap(false);
        }
        setReadyToSwap(true);
        setOutAmount(quote?.amount);
        if (quote?.doApproval) {
          setNeedsApproval(true);
        } else {
          setNeedsApproval(false);
        }
        setQuote(quote);
      } catch (err: unknown) {
        Log.module("swap").error("Error during quote: ", (err as Error).message);
        setOutAmount(undefined); // TODO: clear this better
        setReadyToSwap(false);
      }
    },
    [account, outToken, quoter, slippage]
  );

  const handleOutputChange = useCallback(
    async (a: TokenValue) => {
      setOutAmount(a);
      if (a.eq(0)) {
        setInAmount(inToken.amount(0));
        return;
      }
      try {
        const quote = await quoter?.quoteReverse(a, account!, slippage);
        Log.module("swap").debug("Reverse quote", quote);
        setInAmount(quote!.amount);
      } catch (err: unknown) {
        Log.module("swap").error("Error during quote: ", (err as Error).message);
        setInAmount(undefined); // TODO: clear this better
        setReadyToSwap(false);
      }
    },
    [account, inToken, quoter, slippage]
  );

  const handleInputTokenChange = useCallback((token: Token) => {
    setInToken(token);
  }, []);
  const handleOutputTokenChange = useCallback((token: Token) => {
    setOutToken(token);
  }, []);

  const approve = async () => {
    Log.module("swap").debug("Doing approval");
    if (!quote!.doApproval) throw new Error("quote.doApproval() is missing. Bad logic");

    setTxLoading(true);

    const toast = new TransactionToast({
      loading: "Waiting for approval",
      error: "Approval failed",
      success: "Approved"
    });

    try {
      const tx = await quote!.doApproval();
      toast.confirming(tx);

      const receipt = await tx.wait();
      toast.success(receipt);
      setNeedsApproval(false); // TODO:
    } catch (err) {
      Log.module("swap").error("Approval Failed", err);
      toast.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  const swap = async () => {
    Log.module("swap").debug("Doing swap");
    setTxLoading(true);

    const toast = new TransactionToast({
      loading: "Confirming swap",
      error: "Swap failed",
      success: "Swap confirmed"
    });

    try {
      const tx = await quote!.doSwap();
      toast.confirming(tx);

      const receipt = await tx.wait();
      toast.success(receipt);

      setInAmount(undefined);
      setOutAmount(undefined);
      setNeedsApproval(true);
      setReadyToSwap(false);
      setQuote(undefined);
    } catch (err) {
      Log.module("swap").error("Swap Failed", err);
      toast.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleButtonClick = async () => {
    if (!quote) throw new Error("Bad state, there is no quote. Button should've been disabled");
    try {
      if (needsApproval) {
        await approve();
      } else {
        await swap();
      }
    } catch (err) {
      Log.module("swap").error("Operation Failed", err);
    }
  };

  const getLabel = useCallback(() => {
    if (!account) return "Connect Wallet";
    if (!inAmount && !outAmount) return "Enter Amount";
    if (needsApproval) return "Approve";

    return "Swap";
  }, [account, inAmount, needsApproval, outAmount]);

  if (Object.keys(tokens).length === 0)
    return <Container>There are no tokens. Please check you are connected to the right network.</Container>;

  return (
    <Container>
      <Div>
        <SwapInputContainer>
          <TokenInput
            id="input-amount"
            label={`Input amount in ${inToken.symbol}`}
            token={inToken}
            amount={inAmount}
            onAmountChange={handleInputChange}
            onTokenChange={handleInputTokenChange}
            canChangeToken={true}
            loading={isLoadingAllBalances}
          />
        </SwapInputContainer>
        <ArrowContainer>
          <ArrowButton onClick={arrowHandler} />
        </ArrowContainer>

        <SwapInputContainer>
          <TokenInput
            id="output-amount"
            label={`Output amount in ${inToken.symbol}`}
            token={outToken}
            amount={outAmount}
            onAmountChange={handleOutputChange}
            onTokenChange={handleOutputTokenChange}
            canChangeToken={true}
            showBalance={true}
            showMax={false}
            loading={isLoadingAllBalances}
          />
        </SwapInputContainer>
      </Div>
      <SwapDetailsContainer>Details</SwapDetailsContainer>
      <SwapButtonContainer data-trace="true">
        <Button label={getLabel()} disabled={!buttonEnabled} onClick={handleButtonClick} loading={txLoading} />
      </SwapButtonContainer>
    </Container>
  );
};

const Container = styled.div`
  // border: 1px solid red;
  width: 384px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Div = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SwapInputContainer = styled.div`
  // outline: 1px dashed green;
  display: flex;
  flex-direction: row;
`;
const ArrowContainer = styled.div`
  // border: 1px dashed orange;
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

const SwapDetailsContainer = styled.div`
  // border: 1px dashed pink;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const SwapButtonContainer = styled.div`
  // border: 1px dashed pink;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
