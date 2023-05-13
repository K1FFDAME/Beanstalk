import BigNumber from 'bignumber.js';
import { DateTime, Duration } from 'luxon';
import { Beanstalk } from '~/generated';
import { bigNumberResult } from '~/util';
import { APPROX_SECS_PER_BLOCK } from './morning';
import { BlockInfo } from '~/hooks/chain/useFetchLatestBlock';

export type Sun = {
  // season: BigNumber;
  seasonTime: BigNumber;
  sunrise: {
    /** Whether we're waiting for the sunrise() function to be called. */
    awaiting: boolean;
    /** The DateTime of the next expected Sunrise */
    next: DateTime;
    /** The Duration remaining until the next Sunrise. Updated once per second. */
    remaining: Duration;
  };
  season: {
    current: BigNumber;
    lastSop: BigNumber;
    withdrawSeasons: BigNumber;
    lastSopSeason: BigNumber;
    rainStart: BigNumber;
    raining: boolean;
    fertilizing: boolean;
    sunriseBlock: BigNumber;
    abovePeg: boolean;
    start: BigNumber;
    period: BigNumber;
    timestamp: DateTime;
  };
  morning: {
    /** The current Block Number on chain */
    blockNumber: BigNumber;
    /** */
    isMorning: boolean;
    /** */
    index: BigNumber;
  };
  morningTime: {
    /** Whether we are awaiting morning field updates / confirmed block updates */
    awaiting: boolean;
    /** the Duration remaining until the next block update  */
    remaining: Duration;
    /** The DateTime of the next expected block update */
    next: DateTime;
    /** */
    endTime: DateTime;
  };
};

export type MorningBlockMap = {
  [_blockNumber: string]: {
    blockNumber: BigNumber;
    timestamp: DateTime;
    rTimestamp: DateTime;
    next: DateTime;
    rNext: DateTime;
  };
};

export const getNextExpectedSunrise = () => {
  const now = DateTime.now();
  return now.set({ minute: 0, second: 0, millisecond: 0 }).plus({ hour: 1 });
};

export const getNextExpectedBlockUpdate = (
  from: DateTime = getNextExpectedSunrise()
) => from.plus({ seconds: 12 });

export const parseSeasonResult = (
  // eslint-disable-next-line no-undef
  result: Awaited<ReturnType<Beanstalk['time']>>
): Sun['season'] => ({
  current: bigNumberResult(result.current), /// The current Season in Beanstalk.
  lastSop: bigNumberResult(result.lastSop), /// The Season in which the most recent consecutive series of Seasons of Plenty started.
  withdrawSeasons: bigNumberResult(result.withdrawSeasons), /// The number of Seasons required to Withdraw a Deposit.
  lastSopSeason: bigNumberResult(result.lastSopSeason), /// The Season in which the most recent consecutive series of Seasons of Plenty ended.
  rainStart: bigNumberResult(result.rainStart), /// The most recent Season in which Rain started.
  raining: result.raining, /// True if it is Raining (P > 1, Pod Rate Excessively Low).
  fertilizing: result.fertilizing, /// True if Beanstalk has Fertilizer left to be paid off.
  sunriseBlock: bigNumberResult(result.sunriseBlock), /// The block of the start of the current Season.
  abovePeg: result.abovePeg, /// Boolean indicating whether the previous Season was above or below peg.
  start: bigNumberResult(result.start), /// The timestamp of the Beanstalk deployment rounded down to the nearest hour.
  period: bigNumberResult(result.period), /// The length of each season in Beanstalk in seconds.
  timestamp: DateTime.fromSeconds(bigNumberResult(result.timestamp).toNumber()), /// The timestamp of the start of the current Season.
});

export const getDiffNow = (dt: DateTime, _now?: DateTime) => {
  const now = (_now || DateTime.now()).toSeconds();
  const nowRounded = Math.floor(now);
  return dt.diff(DateTime.fromSeconds(nowRounded));
};

export const getNowRounded = () => {
  const now = Math.floor(DateTime.now().toSeconds());
  return DateTime.fromSeconds(now);
};

export const getMorningTimeResult = (
  sunriseTime: DateTime,
  index: BigNumber
) => {
  const endTime = sunriseTime.plus({ minutes: 5 });
  const seconds = index.times(12).toNumber();
  const curr = sunriseTime.plus({ seconds });
  const next = getNextExpectedBlockUpdate(curr);
  const remaining = getDiffNow(next);

  // console.log('remainng as secs: ', remaining.as('seconds'));

  return {
    next,
    remaining,
    awaiting: remaining.as('seconds') === APPROX_SECS_PER_BLOCK,
    endTime,
  };
};

export const getMorningResult = ({
  timestamp: sunriseTime,
  blockNumber: sunriseBlock,
}: BlockInfo): Pick<Sun, 'morning' | 'morningTime'> => {
  const sunriseSecs = sunriseTime.toSeconds();
  const nowSecs = getNowRounded().toSeconds();

  const secondsDiff = nowSecs - sunriseSecs;
  const index = new BigNumber(Math.floor(secondsDiff / APPROX_SECS_PER_BLOCK));
  console.log(`<------${index.toNumber()}------>`);
  const isMorning = index.lt(25) && index.gte(0) && sunriseBlock.gt(0);

  const blockNumber = sunriseBlock.plus(index);

  const endTime = sunriseTime.plus({ minutes: 5 });
  const seconds = index.times(12).toNumber();
  const curr = sunriseTime.plus({ seconds });

  const next = getNextExpectedBlockUpdate(curr);
  const remaining = getDiffNow(next);
  const awaiting = remaining.as('seconds') === APPROX_SECS_PER_BLOCK;

  console.log('===== blockNumber: ', blockNumber.toNumber());
  console.log('===== blockts: ', next.minus({ seconds: 12 }).toSeconds());
  console.log('===== nextts: ', next.toSeconds());

  return {
    morning: {
      isMorning,
      blockNumber,
      index: new BigNumber(index),
    },
    morningTime: {
      next,
      remaining,
      awaiting,
      endTime,
    },
  };
};

export * from './reducer';
