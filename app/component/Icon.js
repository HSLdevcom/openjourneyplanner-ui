import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';

const isBadgeTextLong = badgeText => badgeText.length > 1 || badgeText > 9;

const IconBadge = ({ badgeFill, badgeText, textFill }) => {
  if (!badgeFill || (!badgeText && badgeText !== 0)) {
    return null;
  }
  return (
    <svg className="icon-badge" viewBox="0 0 40 40">
      <circle
        className="badge-circle"
        cx="20"
        cy="20"
        fill={badgeFill}
        r="18"
      />
      <text
        className={cx('badge-text', {
          long: isBadgeTextLong(badgeText),
        })}
        dy="0.35em"
        x="20"
        y="20"
        style={textFill ? { fill: textFill } : {}}
      >
        {badgeText}
      </text>
    </svg>
  );
};

IconBadge.propTypes = {
  badgeFill: PropTypes.string,
  badgeText: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  textFill: PropTypes.string,
};

IconBadge.defaultProps = {
  badgeFill: undefined,
  badgeText: undefined,
  textFill: '#fff',
};

IconBadge.asString = (badgeFill, badgeText, badgeTextFill) => {
  if (!badgeFill || (!badgeText && badgeText !== 0)) {
    return '';
  }
  return `
  <svg class="icon-badge" viewBox="0 0 40 40">
    <circle class="badge-circle" cx="20" cy="20" fill="${badgeFill}" r="20"/>
    <text class="${cx('badge-text', {
      long: isBadgeTextLong(badgeText),
    })}" dy="0.3em" x="20" y="20" fill=${badgeTextFill}>${badgeText}</text>
  </svg>`;
};

function Icon({
  backgroundShape,
  backgroundColor,
  badgeFill,
  badgeText,
  badgeTextFill,
  className,
  color,
  height,
  id,
  img,
  omitViewBox,
  viewBox,
  width,
  dataURI,
  ariaLabel,
}) {
  return (
    <span aria-hidden className="icon-container">
      <svg
        id={id}
        style={{
          fill: color || null,
          height: height ? `${height}em` : null,
          width: width ? `${width}em` : null,
          outline: 0,
        }}
        viewBox={!omitViewBox ? viewBox : null}
        className={cx('icon', className)}
        aria-label={ariaLabel}
      >
        {backgroundShape === 'circle' && (
          <circle
            className="icon-circle"
            cx="20"
            cy="20"
            fill={backgroundColor}
            r="20"
          />
        )}
        {!dataURI && <use xlinkHref={`#${img}`} />}
        {dataURI && (
          <image href={dataURI} x={0} y={0} width="100%" height="100%" />
        )}
      </svg>
      <IconBadge
        badgeFill={badgeFill}
        badgeText={badgeText}
        textFill={badgeTextFill}
      />
    </span>
  );
}

Icon.propTypes = {
  backgroundShape: PropTypes.oneOf(['circle']),
  backgroundColor: PropTypes.string,
  badgeFill: PropTypes.string,
  badgeText: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  badgeTextFill: PropTypes.string,
  className: PropTypes.string,
  color: PropTypes.string,
  height: PropTypes.number,
  id: PropTypes.string,
  img: PropTypes.string.isRequired,
  omitViewBox: PropTypes.bool,
  viewBox: PropTypes.string,
  width: PropTypes.number,
  dataURI: PropTypes.string,
  ariaLabel: PropTypes.string,
};

Icon.defaultProps = {
  backgroundShape: undefined,
  backgroundColor: 'white',
  badgeFill: undefined,
  badgeText: undefined,
  badgeTextFill: undefined,
  className: undefined,
  color: undefined,
  height: undefined,
  id: undefined,
  omitViewBox: false,
  viewBox: '0 0 40 40',
  width: undefined,
  ariaLabel: '',
  dataURI: undefined,
};

Icon.asString = ({
  img,
  className,
  id,
  badgeFill = undefined,
  badgeText = undefined,
  badgeTextFill = undefined,
  backgroundShape = undefined,
  color,
}) => `
  <span class="icon-container">
    <svg
      ${id ? ` id=${id}` : ''}
      viewBox="0 0 40 40"
      class="${cx('icon', className)}"
      style="fill: ${color || null}",
    >
      ${
        backgroundShape === 'circle'
          ? '<circle className="icon-circle" cx="20" cy="20" fill="white" r="20" />'
          : ''
      }
      <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${img}"/>
    </svg>
    ${IconBadge.asString(badgeFill, badgeText, badgeTextFill)}
  </span>
`;

Icon.displayName = 'Icon';
Icon.description = 'Shows an icon from the SVG sprite';
export default Icon;
