import aboutIcon from '~/img/beanstalk/interface/nav/about.svg';
import beanNFTIcon from '~/img/beanstalk/interface/nav/bean-nft.svg';
import discordIcon from '~/img/beanstalk/interface/nav/discord.svg';
import governanceIcon from '~/img/beanstalk/interface/nav/governance.svg';
import swapIcon from '~/img/beanstalk/interface/nav/trade.svg';
import twitterIcon from '~/img/beanstalk/interface/nav/twitter.svg';
import immunefiIcon from '~/img/beanstalk/interface/nav/immunefi.svg';
import docsIcon from '~/img/beanstalk/interface/nav/docs.svg';
import disclosuresIcon from '~/img/beanstalk/interface/nav/disclosures.svg';
import analyticsIcon from '~/img/beanstalk/interface/nav/stats.svg';
import basinIcon from '~/img/beanstalk/interface/nav/basin.svg';
import pipelineIcon from '~/img/beanstalk/interface/nav/pipeline.svg';

export type RouteData = {
  /** Nav item title */
  title: string;
  /** If set, link to this internal path. */
  path: string;
  /** Tag to show inside the nav item */
  tag?: string;
  /** If set, link out to this external URL. */
  href?: string;
  //
  icon?: string;
  disabled?: boolean;
  small?: boolean;
};

type RouteKeys = 'top' | 'market' | 'more' | 'additional'; // | 'analytics'

const ROUTES: { [key in RouteKeys]: RouteData[] } = {
  // Main Navigation
  top: [
    {
      path: '/',
      title: 'Prognosis',
    },
    {
      path: '/silo',
      title: 'Medicine Cabinet',
    },
    {
      path: '/field',
      title: 'Manufacturing Floor',
    },
    {
      path: '/barn',
      title: 'Stockpile',
    },
    {
      path: '/balances',
      title: 'Balances',
    },
    {
      path: '/market/buy',
      title: 'Counter',
    },
  ],
  // More Menu
  more: [
    {
      path: 'nft',
      title: 'BeaNFTs',
      icon: beanNFTIcon,
      small: true,
    },
    {
      path: 'swap',
      title: 'Swap',
      icon: swapIcon,
      small: true,
    },
    {
      path: '/analytics',
      title: 'Analytics',
      icon: analyticsIcon,
      small: true,
    },
    {
      path: '/governance',
      title: 'Governance',
      icon: governanceIcon,
      small: true,
    },
    {
      path: 'docs',
      href: 'https://docs.bean.money/almanac',
      title: 'Docs',
      icon: docsIcon,
      small: true,
    },
  ],
  // About Button
  additional: [
    {
      path: 'about',
      title: 'About',
      href: 'https://bean.money',
      icon: aboutIcon,
    },
    {
      path: 'disclosures',
      title: 'Disclosures',
      href: 'https://docs.bean.money/almanac/disclosures',
      icon: disclosuresIcon,
    },
    {
      path: 'bugbounty',
      title: 'Bug Bounty',
      href: 'https://immunefi.com/bounty/beanstalk',
      icon: immunefiIcon,
    },
    {
      path: 'discord',
      href: 'https://discord.gg/beanstalk',
      title: 'Discord',
      icon: discordIcon,
    },
    {
      path: 'twitter',
      href: 'https://twitter.com/beanstalkmoney',
      title: 'Twitter',
      icon: twitterIcon,
    },
    {
      path: 'basin',
      href: 'https://basin.exchange',
      title: 'Basin',
      icon: basinIcon,
    },
    {
      path: 'pipeline',
      href: 'https://evmpipeline.org',
      title: 'Pipeline',
      icon: pipelineIcon,
    },
  ],
  // Market Menu
  market: [
    {
      path: '/market',
      title: 'Capsule Counter',
    },
    {
      path: '/market/account',
      title: 'My Orders / Listings',
    },
    {
      path: '/market/activity',
      title: 'Counterplace Activity',
    },
  ],
  // Analytics Menu
  // analytics: [
  //   {
  //     path: 'analytics/barnraise',
  //     title: 'Barn Raise Analytics',
  //   },
  //   {
  //     path: 'analytics/bean',
  //     title: 'Bean Analytics',
  //   },
  //   {
  //     path: 'analytics/silo',
  //     title: 'Silo Analytics',
  //   },
  //   {
  //     path: 'analytics/field',
  //     title: 'Field Analytics',
  //   }
  // ],
};

export const getRouteByPath = (path: string) =>
  ROUTES.top.find((r) => r.path === path);

export default ROUTES;
