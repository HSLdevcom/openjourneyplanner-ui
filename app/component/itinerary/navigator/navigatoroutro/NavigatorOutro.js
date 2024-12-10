import Button from '@hsl-fi/button';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';

const NavigatorOutro = ({ onClose, destination, logo } /* ,context */) => {
  // const { intl } = context;
  const [place, address] = destination?.split(/, (.+)/) || [];
  return (
    <>
      <div className="outro-logo-container">
        {logo && <img src={logo} alt="thumbs up" />}
      </div>
      <div className="outro-body">
        <FormattedMessage
          tagName="h2"
          id="navigation-outro-header"
          defaultMessage="You have arrived!"
        />
        <div className="destination">
          <p className="place">{place}</p>
          <p className="address">{address}</p>
        </div>
      </div>
      <div className="outro-buttons">
        <Button
          className="close-button"
          size="large"
          fullWidth
          value="Poistu opastuksesta"
          onClick={onClose}
          variant="black"
        />
      </div>
    </>
  );
};

NavigatorOutro.propTypes = {
  onClose: PropTypes.func.isRequired,
  destination: PropTypes.string.isRequired,
  logo: PropTypes.string,
};

NavigatorOutro.defaultProps = {
  logo: undefined,
};

NavigatorOutro.contextTypes = {
  intl: intlShape.isRequired,
};

export default NavigatorOutro;
