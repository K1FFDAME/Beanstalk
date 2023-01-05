import { Stack, Typography } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';
import Rinse from '~/components/Barn/Actions/Rinse';
import Dot from '~/components/Common/Dot';
import {
  Module,
  ModuleContent,
} from '~/components/Common/Module';
import Row from '~/components/Common/Row';
import { AppState } from '~/state';

const QuickRinse: React.FC<{}> = () => {
  const farmerBarn = useSelector<AppState, AppState['_farmer']['barn']>(
    (state) => state._farmer.barn
  );
  const rinsable = farmerBarn.fertilizedSprouts;

  return rinsable?.gt(0) ? (
    <Module sx={{ width: '100%' }}>
      <ModuleContent pt={1.5} px={1} pb={1}>
        <Stack spacing={1.5}>
          <Row spacing={0.5} px={0.5}>
            <Dot color="primary.main" />
            <Typography variant="h4">Quick Rinse</Typography>
          </Row>
          <Rinse quick />
        </Stack>
      </ModuleContent>
    </Module>
  ) : null;
};

export default QuickRinse;
