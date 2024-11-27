import { createFragmentContainer, graphql } from 'react-relay';
import connectToStores from 'fluxible-addons-react/connectToStores';

import Timetable from './Timetable';

export default createFragmentContainer(
  connectToStores(Timetable, ['PreferencesStore'], context => ({
    language: context.getStore('PreferencesStore').getLanguage(),
  })),
  {
    stop: graphql`
      fragment TimetableContainer_stop on Stop
      @argumentDefinitions(date: { type: "String" }) {
        gtfsId
        name
        url
        locationType
        stoptimesForServiceDate(date: $date, omitCanceled: false) {
          pattern {
            headsign
            code
            route {
              id
              shortName
              longName
              type
              mode
              agency {
                id
                name
              }
            }
          }
          stoptimes {
            realtimeState
            scheduledDeparture
            serviceDay
            headsign
            pickupType
          }
        }
      }
    `,
  },
);
