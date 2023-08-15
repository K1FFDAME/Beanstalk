import React from "react";
import { FC } from "src/types";
import { Row, TBody, THead, Table, Th, Td } from "./Table";
import { Well } from "@beanstalk/sdk/Wells";
import styled from "styled-components";
import { size } from "src/breakpoints";

type Props = {
  well: Well;
};

export const OtherSection: FC<Props> = ({ well }) => {

  const tableItems = [
    {name: "Multi Flow Pump", address: "0xBA510f10E3095B83a0F33aa9ad2544E22570a87C"},
    {name: "Constant Product 2", address: "0xBA510C20FD2c52E4cb0d23CFC3cCD092F9165a6E"},
    {name: "Well Implementation", address: "0xBA510e11eEb387fad877812108a3406CA3f43a4B"},
    {name: "Aquifer", address: "0xBA51AAAA95aeEFc1292515b36D86C51dC7877773"}
  ];

  return (
    <div>
      <Table width="100%">
        <THead>
          <Row>
            <Th>Name</Th>
            <DesktopTh>Address</DesktopTh>
            <MobileTh align={"right"}>Address</MobileTh>
          </Row>
        </THead>
        <TBody>
          <Row>
            <Td>
              <Detail>BEAN:WETH Well</Detail>
            </Td>
            <DesktopTd>
              <Link href={`https://etherscan.io/address/${well.address}`}>{well.address}</Link>
            </DesktopTd>
            <MobileTd align={"right"}>
              <Link href={`https://etherscan.io/address/${well.address}`}>
                {well.address.substr(0, 5) + "..." + well.address.substr(well.address.length - 5)}
              </Link>
            </MobileTd>
          </Row>
          <Row>
            <Td>
              <Detail>Well LP Token - {well.lpToken?.symbol}</Detail>
            </Td>
            <DesktopTd>
              <Link href={`https://etherscan.io/address/${well.address}`}>{well.address}</Link>
            </DesktopTd>
            <MobileTd align={"right"}>
              <Link href={`https://etherscan.io/address/${well.address}`}>
                {well.address.substr(0, 5) + "..." + well.address.substr(well.address.length - 5)}
              </Link>
            </MobileTd>
          </Row>
          {well.tokens!.map(function (token, index) {
            return (
              <Row key={token.address}>
                <Td>
                  <Detail>{`Token ${index + 1} - ${token.symbol}`}</Detail>
                </Td>
                <DesktopTd>
                  <Link href={token ? `https://etherscan.io/address/${token.address}` : `https://etherscan.io/`} target="_blank" rel="noopener noreferrer">
                    {token.address || `-`}
                  </Link>
                </DesktopTd>
                <MobileTd align={"right"}>
                  <Link href={token ? `https://etherscan.io/address/${token.address}` : `https://etherscan.io/`} target="_blank" rel="noopener noreferrer">
                    {token.address.substr(0, 5) + "..." + token.address.substr(token.address.length - 5) || `-`}
                  </Link>
                </MobileTd>
              </Row>
            );
          })}
          {tableItems.map(function (tableItem, index) {
            return (
              <Row key={`${tableItem.address}-${index}}`}>
                <Td>
                  <Detail>{tableItem.name}</Detail>
                </Td>
                <DesktopTd>
                  <Link href={`https://etherscan.io/address/${tableItem.address}`}>{tableItem.address}</Link>
                </DesktopTd>
                <MobileTd align={"right"}>
                  <Link href={`https://etherscan.io/address/${tableItem.address}`}>
                    {tableItem.address.substr(0, 5) + "..." + tableItem.address.substr(tableItem.address.length - 5)}
                  </Link>
                </MobileTd>
              </Row>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
};

const Detail = styled.span`
  color: #4b5563;
  font-weight: 600;
`;

const Link = styled.a`
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 0.5px;

  :link {
    color: black;
  }
`;

const DesktopTd = styled(Td)`
  @media (max-width: ${size.mobile}) {
    display: none;
  }
`;

const MobileTd = styled(Td)`
  @media (min-width: ${size.mobile}) {
    display: none;
  }
`;

const DesktopTh = styled(Th)`
  @media (max-width: ${size.mobile}) {
    display: none;
  }
`;

const MobileTh = styled(Th)`
  @media (min-width: ${size.mobile}) {
    display: none;
  }
`;
