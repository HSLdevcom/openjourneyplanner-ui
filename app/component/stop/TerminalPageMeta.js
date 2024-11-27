import { Helmet } from 'react-helmet';
import { intlShape } from 'react-intl';
import { createFragmentContainer, graphql } from 'react-relay';
import compose from 'recompose/compose';
import getContext from 'recompose/getContext';
import mapProps from 'recompose/mapProps';
import { configShape } from '../../util/shapes';

import { generateMetaData } from '../../util/metaUtils';

const TerminalPageMeta = compose(
  getContext({ config: configShape, intl: intlShape }),
  mapProps(({ config, intl, station }) => {
    if (!station) {
      return false;
    }

    const title = intl.formatMessage(
      {
        id: 'terminal-page.title',
        defaultMessage: 'Terminal - {name}',
      },
      station,
    );
    const description = intl.formatMessage(
      {
        id: 'terminal-page.description',
        defaultMessage: 'Terminal - {name} {code}, {desc}',
      },
      station,
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

export default createFragmentContainer(TerminalPageMeta, {
  station: graphql`
    fragment TerminalPageMeta_station on Stop {
      name
      code
      desc
    }
  `,
});
