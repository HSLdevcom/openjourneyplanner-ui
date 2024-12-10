import React from 'react';
import { matchShape } from 'found';
import LazilyLoad, { importLazy } from '../LazilyLoad';

const modules = {
  EmbeddedSearch: () => importLazy(import('./EmbeddedSearch')),
};

const EmbeddedSearchContainer = props => {
  return (
    <LazilyLoad modules={modules}>
      {({ EmbeddedSearch }) => <EmbeddedSearch match={props.match} />}
    </LazilyLoad>
  );
};

EmbeddedSearchContainer.propTypes = {
  match: matchShape.isRequired,
};

export default EmbeddedSearchContainer;
