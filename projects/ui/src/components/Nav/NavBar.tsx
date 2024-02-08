import React from 'react';
import { AppBar, Box } from '@mui/material';
// import WalletButton from '~/components/Common/Connection/WalletButton';
import NetworkButton from '~/components/Common/Connection/NetworkButton';
import AboutButton from './Buttons/AboutButton';
import {
  NAV_BORDER_HEIGHT,
  NAV_ELEM_HEIGHT,
  NAV_HEIGHT,
} from '~/hooks/app/usePageDimensions';
import Row from '~/components/Common/Row';

import { FC } from '~/types';
import { PAGE_BORDER_COLOR } from '../App/muiTheme';
import Logo from './Logo.svg?react';
import WalletButton from '~/components/Common/Connection/WalletButton';
import LinkButton from '~/components/Nav/Buttons/LinkButton';
import HoverMenu from '~/components/Nav/HoverMenu';
import ROUTES from '~/components/Nav/routes';

const NavBar: FC<{}> = ({ children }) => {
  const bgWallet =
    'radial-gradient(100.00% 100.00% at 50% 0%,rgba(255, 255, 255, 0.3),rgba(255, 255, 255, 0) 100%),rgb(9, 9, 11)';
  const content = (
    <AppBar
      // Using position: sticky means that
      // the main content region will always start
      // below the header, regardless of height!
      className="navbar"
      sx={{
        position: 'sticky',
        bgcolor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        borderBottom: `${NAV_BORDER_HEIGHT}px solid ${PAGE_BORDER_COLOR}`,
        zIndex: 80,
      }}
    >
      {children}
      <Row
        justifyContent="space-between"
        height={`${NAV_HEIGHT}px`}
        px={1}
        gap={1}
      >
        {/* Desktop: Left Side */}
        <Row sx={{ flex: 1 }} height="100%" gap={1}>
          <Logo />
          {/* <PriceButton sx={{ height: NAV_ELEM_HEIGHT }} />
          <SunButton sx={{ height: NAV_ELEM_HEIGHT }} /> */}
          <Row
            sx={{ display: { lg: 'flex', xs: 'none' } }}
            height="100%"
            data-cy="Navbar-links"
          >
            {ROUTES.top.map((item) => (
              <LinkButton
                key={item.path}
                to={item.path}
                title={item.title}
                tag={item.tag}
              />
            ))}
            <HoverMenu items={ROUTES.more}>More</HoverMenu>
          </Row>
        </Row>
        {/* Desktop: Right Side */}
        <Row justifyContent="flex-end" gap={1}>
          <Box sx={{ display: { sm: 'block', xs: 'none' } }}>
            <NetworkButton sx={{ height: NAV_ELEM_HEIGHT }} />
          </Box>
          <WalletButton
            showFullText
            sx={{
              height: NAV_ELEM_HEIGHT,
              borderRadius: '8px',
              boxShadow: '0px 0px 0px 1px rgb(18, 18, 18)',
              background: bgWallet,
              padding: '6px 12px 6px 12px',
              color: 'white',
              ':hover': {
                background: bgWallet,
              },
            }}
          />
          <AboutButton
            sx={{ height: NAV_ELEM_HEIGHT, width: NAV_ELEM_HEIGHT }}
          />
        </Row>
      </Row>
    </AppBar>
  );

  return content;
};

const DesktopLink = () => (
  <Box
    sx={{
      height: '100%',
      fontSize: '14px',
      padding: '12px 0',
      marginRight: '24px',
      borderBottom: '1.5px solid black',
    }}
  >
    Desktop
  </Box>
);

// const WalletButton = ({ sx }) => {
//   const account = useAccount();

//   return (
//     <Box

//     >
//       Connect Wallet
//     </Box>
//   );
// };

export default NavBar;
