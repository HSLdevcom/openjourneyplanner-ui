import { Helmet } from 'react-helmet';
import { intlShape } from 'react-intl';
import { createFragmentContainer, graphql } from 'react-relay';
import compose from 'recompose/compose';
import getContext from 'recompose/getContext';
import mapProps from 'recompose/mapProps';
import { configShape } from '../../util/shapes';

import { generateMetaData } from '../../util/metaUtils';

const StopPageMeta = compose(
  getContext({ config: configShape, intl: intlShape }),
  mapProps(({ config, intl, stop }) => {
    if (!stop) {
      return false;
    }

    const title = intl.formatMessage(
      {
        id: 'stop-page.title',
        defaultMessage: 'Stop - {name} {code}',
      },
      stop,
    );
    const description = intl.formatMessage(
      {
        id: 'stop-page.description',
        defaultMessage: 'Stop - {name} {code}, {desc}',
      },
      stop,
    );
    return generateMetaData(
      {
        description,
        title,
      },
      config,
    );
  }),
)(Helmet);

export default createFragmentContainer(StopPageMeta, {
  stop: graphql`
    fragment StopPageMeta_stop on Stop {
      name
      code
      desc
    }
  `,
});
