import { TokenValue } from "@beanstalk/sdk";
import React, { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "src/components/Page";
import { Title } from "src/components/PageComponents/Title";
import { Row, TBody, THead, Table, Td, Th } from "src/components/Table";
import { TokenLogo } from "src/components/TokenLogo";
import { getPrice } from "src/utils/price/usePrice";
import useSdk from "src/utils/sdk/useSdk";
import { useWells } from "src/wells/useWells";
import styled from "styled-components";

export const Wells = () => {
  const { data: wells, isLoading, error } = useWells();
  const navigate = useNavigate();
  const sdk = useSdk();
  const [wellLiquidity, setWellLiquidity] = useState<any>([]);
  const [wellFunctionNames, setWellFunctionNames] = useState<string[]>([])

  useMemo(() => {
    const run = async() => {
      if (!wells || !wells.length) return;
      let _wellsLiquidityUSD = []
      for (let i = 0; i < wells.length; i++) {
        if (!wells[i].tokens) return;
        const _tokenPrices = await Promise.all(wells[i].tokens!.map((token) => getPrice(token, sdk)));
        const _reserveValues = wells[i].reserves?.map((tokenReserve, index) => tokenReserve.mul(_tokenPrices[index] as TokenValue || TokenValue.ZERO));
        let initialValue = TokenValue.ZERO;
        const _totalWellLiquidity = _reserveValues?.reduce((accumulator, currentValue) => currentValue.add(accumulator), initialValue)

        _wellsLiquidityUSD[i] = _totalWellLiquidity
      }
      setWellLiquidity(_wellsLiquidityUSD)

      let _wellsFunctionNames = []
      for (let i = 0; i < wells.length; i++) {
        const _wellName = await wells[i].wellFunction!.contract.name()
        _wellsFunctionNames[i] = _wellName
      }
      setWellFunctionNames(_wellsFunctionNames)

    }

    run();
  }, [sdk, wells])



  if (isLoading) return <div>loading...</div>;
  if (error) return <div>{error.message}</div>;



  const rows = wells?.map((well, index) => {
    const tokens = well.tokens || [];
    const logos: ReactNode[] = [];
    const symbols: string[] = [];
    const gotoWell = () => navigate(`/wells/${well.address}`);

    tokens.map((token) => {
      logos.push(<TokenLogo token={token} size={25} key={token.symbol} />);
      symbols.push(token.symbol);
    });

    return (
      <Row key={well.address} onClick={gotoWell}>
        <Td>
          <WellDetail>
            <TokenLogos>{logos}</TokenLogos>
            <TokenSymbols>{symbols.join("/")}</TokenSymbols>
            {/* <Deployer>{deployer}</Deployer> */}
          </WellDetail>
        </Td>
        <Td>
          <WellPricing>{wellFunctionNames[index] ? wellFunctionNames[index] : "Price Function"}</WellPricing>
        </Td>
        <Td align="right">
          <TradingFee>0.00%</TradingFee>
        </Td>
        <Td align="right">
          <Amount>${wellLiquidity[index] ? wellLiquidity[index].toHuman("0,0.00") : "-.--"}</Amount>
        </Td>
        <Td align="right">
          <Reserves>{logos[0]}{well.reserves![0] ? well.reserves![0].toHuman("0,0.00") : "-.--"}</Reserves>
          <Reserves>{logos[1]}{well.reserves![1] ? well.reserves![1].toHuman("0,0.00") : "-.--"}</Reserves>
          {well.reserves && well.reserves.length > 2 ? 
          <MoreReserves>{`+ ${well.reserves.length - 2} MORE`}</MoreReserves>
          : null }
        </Td>
      </Row>
    );
  });

  return (
    <Page>
      <Title title="WELLS" />
      <Table>
        <THead>
          <Row>
            <Th>Well</Th>
            <Th>Well Pricing Function</Th>
            <Th align="right">Trading Fees</Th>
            <Th align="right">Total Liquidity</Th>
            <Th align="right">Reserves</Th>
          </Row>
        </THead>
        <TBody>{rows}</TBody>
      </Table>
    </Page>
  );
};

const WellDetail = styled.div``;
const TokenLogos = styled.div`
  display: flex;
  div:not(:first-child) {
    margin-left: -8px;
  }
`;
const TokenSymbols = styled.div`
  font-size: 20px;
  line-height: 24px;
  color: #1c1917;
`;

const Amount = styled.div`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  color: #1c1917;
`;

const Reserves = styled.div`
  display: flex;
  flex-direction: row;
  justify-content flex-end;
  gap: 8px;
  flex: 1;
`

const MoreReserves = styled.div`
  color: #9CA3AF;
`

const TradingFee = styled.div`
  font-size: 16px;
  line-height: 24px;
  color: #4B5563;
  text-transform: uppercase;
`;

const WellPricing = styled.div`
  font-size: 16px;
  line-height: 24px;
  text-transform: capitalize;
`;

//#4B5563