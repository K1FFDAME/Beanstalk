import React, { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { Token, TokenValue } from "@beanstalk/sdk";
import { FC } from "src/types";
import styled, { keyframes } from "styled-components";
import { BasicInput } from "./BasicInput";
import { TokenPicker } from "./TokenPicker";
import { useTokenBalance } from "src/tokens/useTokenBalance";
import { Spinner } from "../Spinner";

type ContainerProps = {
  width: string;
  focused: boolean;
};

type TokenInput = {
  id?: string;
  label: string;
  token: Token;
  amount?: TokenValue;
  width?: string;
  canChangeToken?: boolean;
  showBalance?: boolean;
  showMax?: boolean;
  allowNegative?: boolean;
  loading: boolean;
  onAmountChange?: (a: TokenValue) => void;
  onTokenChange?: (t: Token) => void;
  canChangeValue?: boolean;
};

export const TokenInput: FC<TokenInput> = ({
  id,
  label,
  token,
  amount,
  onAmountChange,
  onTokenChange,
  width,
  canChangeToken = false,
  showBalance = true,
  showMax = true,
  loading = false,
  allowNegative = false,
  canChangeValue = true
}) => {
  const [focused, setFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: balance, isLoading: isBalanceLoading, error: balanceError } = useTokenBalance(token);
  width = width ?? "100%";

  const updateAmount = useCallback(
    (value: string) => {
      if (!token) return;
      const newAmount = token.amount(value);
      onAmountChange && onAmountChange(newAmount);
    },
    [token, onAmountChange]
  );

  // TODO: Per designs, what if amount exceeds balance, render error message
  const handleAmountChange = useCallback(
    (cleanValue: string) => {
      updateAmount(cleanValue);
    },
    [updateAmount]
  );

  const handleTokenChange = useCallback(
    (token: Token) => {
      if (amount) {
        const newAmount = token.amount(amount.toHuman());
        onAmountChange && onAmountChange(newAmount);
      }
      onTokenChange && onTokenChange(token);
    },
    [amount, onAmountChange, onTokenChange]
  );

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);
  const handleClick = useCallback(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  const handleClickMax = useCallback(() => {
    const val = balance?.[token.symbol].toHuman() ?? "";
    handleAmountChange(val);
  }, [balance, handleAmountChange, token.symbol]);

  const handleDoubleClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef]);

  /**
   * We have a fake focus outline around TokenInput which 
   * imitates the focus of a normal input. This focus is lost when
   * use clicks on other things inside TokenInput, but not on the input
   * so we use this method to stop other elements from stealing focus.
   *
   * We also need to add an exception for the input element itself, otherwise
   * events like double-clicking to select won't work
   */
  const dontStealFocus = useCallback((e: MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== "INPUT") {
      e.preventDefault();
    }
  }, []);

  if (loading) return <LoadingContainer width={width} focused={focused} />;

  return (
    <Container
      width={width}
      focused={focused}
      id="token-input"
      onClick={handleClick}
      onMouseDown={dontStealFocus}
      onDoubleClick={handleDoubleClick}
    >
      <TopRow>
        <BasicInput
          id={id}
          label={label}
          value={amount?.toHuman() || ""}
          onChange={handleAmountChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          inputRef={inputRef}
          allowNegative={allowNegative}
          canChangeValue={!!canChangeValue}
        />
        <TokenPicker token={token} editable={canChangeToken} onChange={handleTokenChange} />
      </TopRow>

      {showBalance && (
        <BalanceRow>
          <Balance>Balance {isBalanceLoading ? <Spinner size={12} /> : balance?.[token.symbol].toHuman()}</Balance>
          {showMax && !isBalanceLoading && <MaxButton onClick={handleClickMax}>Max</MaxButton>}
        </BalanceRow>
      )}
    </Container>
  );
};

const shimmer = keyframes`
  0% {
      background-position: -1600px 0;
  }
  100% {
      background-position: 1200px 0;
  }
`;

const LoadingContainer = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  width: ${(props) => props.width};
  height: 72px;

  padding: 0px 16px;
  background: #272a37;

  border: 2px solid rgb("0 0 0 / 0%");
  box-sizing: border-box;
  

  overflow: hidden;
  justify-content: center;
  cursor: text;

  animation-duration: 2s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: ${shimmer};
  animation-timing-function: linear;
  background: #ddd;
  background: linear-gradient(65deg, rgba(39, 42, 55, 1) 10%, rgba(48, 52, 68, 1) 20%, rgba(39, 42, 55, 1) 30%);
  background-size: 1200px 100%;
`;
const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  width: ${(props) => props.width};
  height: 72px;

  padding: 0px 16px;
  background: #ffffff;

  // 70 185 85 is the rbg version of the green
  outline: 1px solid rgb(${(props) => (props.focused ? "70 185 85" : "0 0 0")});
  box-sizing: border-box;

  overflow: hidden;
  justify-content: center;

  cursor: text;
`;

const TopRow = styled.div`
  display: flex;
`;
const BalanceRow = styled.div`
  // border: 1px solid red;
  display: flex;
  justify-content: flex-end;
`;

const Balance = styled.div`
  display: flex;
  align-items: center;
  font-family: "Inter";
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #b0b1b5;
`;

const MaxButton = styled.button`
  background: none;
  border: none;
  font-family: "Inter";
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: #f6e27f;
  cursor: pointer;
`;
