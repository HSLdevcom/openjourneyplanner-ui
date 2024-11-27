import connectToStores from 'fluxible-addons-react/connectToStores';
import { createFragmentContainer, graphql } from 'react-relay';

import StopCardHeader from './StopCardHeader';

export default createFragmentContainer(
  connectToStores(StopCardHeader, ['TimeStore'], context => ({
    currentTime: context.getStore('TimeStore').getCurrentTime(),
  })),
  {
    stop: graphql`
      fragment StopCardHeaderContainer_stop on Stop {
        gtfsId
        name
        code
        desc
        zoneId
        alerts {
          alertSeverityLevel
          effectiveEndDate
          effectiveStartDate
        }
        lat
        lon
        stops {
          name
          desc
        }
      }
    `,
  },
);
