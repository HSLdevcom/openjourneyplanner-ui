import { useMemo } from 'react';
import toPairs from 'lodash/toPairs';
import { getClientBreakpoint } from '../../../util/withBreakpoint';
import useWindowSize from '../../../hooks/useWindowSize';

const useUTMCampaignParams = (props = {}) => {
  const {
    mode = 'all',
    hasOrigin = false,
    hasDest = false,
    utmSource = 'reittiopas-elementti',
    utmCampaign = 'reittiopas-elementti',
    utmMedium = 'web',
  } = props;
  const size = useWindowSize();

  return useMemo(() => {
    const analyticsContent = {
      width: size.width,
      mode,
      'screen-width': getClientBreakpoint(size.outer.width),
      'has-origin': hasOrigin ? 1 : 0,
      'has-dest': hasDest ? 1 : 0,
    };

    const content = toPairs(analyticsContent)
      .map(keyVal => keyVal.join(':'))
      .join('|');

    return {
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      utm_medium: utmMedium,
      utm_content: content,
    };
  }, [size, mode]);
};

export default useUTMCampaignParams;
