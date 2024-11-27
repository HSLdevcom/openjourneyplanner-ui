import { createFragmentContainer, graphql } from 'react-relay';
import connectToStores from 'fluxible-addons-react/connectToStores';

import StopPageHeader from './StopPageHeader';

export default createFragmentContainer(
  connectToStores(
    StopPageHeader,
    ['FavouriteStore'],
    ({ getStore }, { match }) => ({
      favourite: getStore('FavouriteStore').isFavourite(
        match.params.stopId,
        'stop',
      ),
    }),
  ),
  {
    stop: graphql`
      fragment StopPageHeaderContainer_stop on Stop {
        ...StopCardHeaderContainer_stop
      }
    `,
  },
);
