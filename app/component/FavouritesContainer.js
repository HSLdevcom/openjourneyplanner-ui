import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { routerShape } from 'found';
import AutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import FavouriteBar from '@digitransit-component/digitransit-component-favourite-bar';
import FavouriteModal from '@digitransit-component/digitransit-component-favourite-modal';
import FavouriteEditModal from '@digitransit-component/digitransit-component-favourite-editing-modal';
import DialogModal from '@digitransit-component/digitransit-component-dialog-modal';
import { configShape } from '../util/shapes';
import withSearchContext from './WithSearchContext';

import {
  saveFavourite,
  updateFavourites,
  deleteFavourite,
} from '../action/FavouriteActions';
import FavouriteStore from '../store/FavouriteStore';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import { LightenDarkenColor } from '../util/colorUtils';
import { useCitybikes } from '../util/modeUtils';

const AutoSuggestWithSearchContext = withSearchContext(AutoSuggest);

const favouriteShape = PropTypes.shape({
  type: PropTypes.string,
  address: PropTypes.string,
  gtfsId: PropTypes.string,
  gid: PropTypes.string,
  lat: PropTypes.number,
  lon: PropTypes.number,
  name: PropTypes.string,
  selectedIconId: PropTypes.string,
  favouriteId: PropTypes.string,
  layer: PropTypes.string,
});

class FavouritesContainer extends React.Component {
  static contextTypes = {
    intl: intlShape.isRequired,
    executeAction: PropTypes.func.isRequired,
    router: routerShape.isRequired,
    config: configShape.isRequired,
  };

  static propTypes = {
    favourites: PropTypes.arrayOf(favouriteShape),
    onClickFavourite: PropTypes.func.isRequired,
    lang: PropTypes.string,
    isMobile: PropTypes.bool,
    favouriteStatus: PropTypes.string,
    favouriteModalAction: PropTypes.string,
    requireLoggedIn: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
    color: PropTypes.string,
    hoverColor: PropTypes.string,
  };

  static defaultProps = {
    favourites: [],
    isMobile: false,
    favouriteStatus: FavouriteStore.STATUS_FETCHING,
    requireLoggedIn: false,
    isLoggedIn: false,
    favouriteModalAction: undefined,
    color: undefined,
    hoverColor: undefined,
    lang: undefined,
  };

  constructor(props) {
    super(props);
    this.state = {
      loginModalOpen: false,
      modalAction: null,
      addModalOpen: false,
      editModalOpen: false,
      favourite: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.context.config.requireLoggedIn &&
      this.props.isLoggedIn &&
      !prevProps.isLoggedIn
    ) {
      if (this.props.favouriteModalAction) {
        switch (this.props.favouriteModalAction) {
          case 'AddHome':
            this.addHome();
            break;
          case 'AddWork':
            this.addWork();
            break;
          case 'AddPlace':
            this.addPlace();
            break;
          case 'Edit':
            this.editPlace();
            break;
          default:
            break;
        }
      }
    }
  }

  setLocationProperties = item => {
    this.setState(prevState => ({
      favourite: {
        ...item,
        name: (prevState.favourite && prevState.favourite.name) || '',
        defaultName: item.name || item.address,
      },
    }));
  };

  addHome = () => {
    addAnalyticsEvent({
      event: 'add_favorite_press',
      favorite_type: 'place',
    });
    this.setState({
      addModalOpen: true,
      favourite: {
        name: this.context.intl.formatMessage({
          id: 'location-home',
          defaultMessage: 'Home',
        }),
        selectedIconId: 'icon-icon_home',
      },
    });
  };

  addWork = () => {
    addAnalyticsEvent({
      event: 'add_favorite_press',
      favorite_type: 'place',
    });
    this.setState({
      addModalOpen: true,
      favourite: {
        name: this.context.intl.formatMessage({
          id: 'location-work',
          defaultMessage: 'Work',
        }),
        selectedIconId: 'icon-icon_work',
      },
    });
  };

  saveFavourite = favourite => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'SaveFavourite',
      name: null,
    });
    this.context.executeAction(saveFavourite, favourite);
  };

  deleteFavourite = favourite => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'DeleteFavourite',
      name: null,
    });
    this.context.executeAction(deleteFavourite, favourite);
  };

  updateFavourites = favourites => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'UpdateFavourite',
      name: null,
    });
    // Backend service requires all favourites for reordering to work
    const reordered = [
      ...favourites,
      ...this.props.favourites.filter(item => item.type !== 'place'),
    ];
    this.context.executeAction(updateFavourites, reordered);
  };

  editFavourite = currentFavourite => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'EditFavourite',
      name: null,
    });
    this.setState({
      favourite: currentFavourite,
      editModalOpen: false,
      addModalOpen: true,
    });
  };

  renderLoginModal = () => {
    const login = this.context.intl.formatMessage({
      id: 'login',
      defaultMessage: 'Log in',
    });
    const cancel = this.context.intl.formatMessage({
      id: 'cancel',
      defaultMessage: 'cancel',
    });
    const headerText = this.context.intl.formatMessage({
      id: 'login-header',
      defautlMessage: 'Log in first',
    });

    const dialogContent = this.context.intl.formatMessage({
      id: 'login-content',
      defautlMessage: 'Log in first',
    });
    const loginUrl = this.state.modalAction
      ? `/login?favouriteModalAction=${this.state.modalAction}`
      : '/login';
    return (
      <DialogModal
        appElement="#app"
        headerText={headerText}
        dialogContent={dialogContent}
        handleClose={() => this.setState({ loginModalOpen: false })}
        lang={this.props.lang}
        isModalOpen={this.state.loginModalOpen}
        primaryButtonText={login}
        href={loginUrl}
        primaryButtonOnClick={() => {
          addAnalyticsEvent({
            category: 'Favourite',
            action: 'login',
            name: null,
          });

          this.setState({
            loginModalOpen: false,
          });
        }}
        secondaryButtonText={cancel}
        secondaryButtonOnClick={() => {
          addAnalyticsEvent({
            category: 'Favourite',
            action: 'login cancelled',
            name: null,
          });
          this.setState({
            loginModalOpen: false,
          });
        }}
        color={this.props.color}
        hoverColor={this.props.hoverColor}
      />
    );
  };

  addPlace = () => {
    addAnalyticsEvent({
      event: 'add_favorite_press',
      favorite_type: 'place',
    });

    this.setState({
      addModalOpen: true,
    });
  };

  editPlace = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'EditPlace',
      name: null,
    });

    this.setState({
      editModalOpen: true,
    });
  };

  closeModal = isAddModal => {
    if (isAddModal) {
      addAnalyticsEvent({
        category: 'Favourite',
        action: 'CloseAddModal',
        name: null,
      });
      this.setState({
        addModalOpen: false,
      });
    } else {
      addAnalyticsEvent({
        category: 'Favourite',
        action: 'CloseEditModal',
        name: null,
      });
      this.setState({
        editModalOpen: false,
        favourite: null,
      });
    }
    // Modal close animation lasts 250ms
    setTimeout(() => {
      this.setState({ favourite: null });
    }, 250);
  };

  cancelSelected = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'CancelUpdate',
      name: null,
    });
    this.setState({
      addModalOpen: false,
      editModalOpen: true,
    });
    // Modal close animation lasts 250ms
    setTimeout(() => {
      this.setState({ favourite: null });
    }, 250);
  };

  render() {
    const isLoading =
      this.props.favouriteStatus === FavouriteStore.STATUS_FETCHING_OR_UPDATING;
    const { requireLoggedIn, isLoggedIn } = this.props;
    const targets = ['Locations', 'Stations', 'CurrentPosition', 'MapPosition'];
    const { fontWeights } = this.context.config;
    const favouritePlaces = this.props.favourites.filter(
      item => item.type === 'place',
    );
    if (
      useCitybikes(
        this.context.config.vehicleRental?.networks,
        this.context.config,
      )
    ) {
      targets.push('VehicleRentalStations');
    }
    if (this.context.config.includeParkAndRideSuggestions) {
      targets.push('ParkingAreas');
    }
    return (
      <React.Fragment>
        <FavouriteBar
          favourites={favouritePlaces}
          onClickFavourite={this.props.onClickFavourite}
          onAddPlace={() =>
            !requireLoggedIn || isLoggedIn
              ? this.setState({ addModalOpen: true })
              : this.setState({ loginModalOpen: true, modalAction: 'AddPlace' })
          }
          onEdit={() =>
            !requireLoggedIn || isLoggedIn
              ? this.setState({ editModalOpen: true })
              : this.setState({ loginModalOpen: true, modalAction: 'Edit' })
          }
          onAddHome={() =>
            !requireLoggedIn || isLoggedIn
              ? this.addHome()
              : this.setState({ loginModalOpen: true, modalAction: 'AddHome' })
          }
          onAddWork={() =>
            !requireLoggedIn || isLoggedIn
              ? this.addWork()
              : this.setState({ loginModalOpen: true, modalAction: 'AddWork' })
          }
          lang={this.props.lang}
          isLoading={isLoading}
          color={this.props.color}
          fontWeights={fontWeights}
        />
        <FavouriteModal
          appElement="#app"
          isModalOpen={this.state.addModalOpen}
          handleClose={() => this.closeModal(true)}
          saveFavourite={this.saveFavourite}
          cancelSelected={this.cancelSelected}
          favourite={this.state.favourite}
          lang={this.props.lang}
          isMobile={this.props.isMobile}
          fontWeights={fontWeights}
          autosuggestComponent={
            <AutoSuggestWithSearchContext
              appElement="#app"
              sources={['History', 'Datasource']}
              targets={targets}
              id="favourite"
              icon="search"
              placeholder="search-address-or-place"
              value={
                (this.state.favourite && this.state.favourite.address) || ''
              }
              selectHandler={this.setLocationProperties}
              getAutoSuggestIcons={this.context.config.getAutoSuggestIcons}
              lang={this.props.lang}
              isMobile={this.props.isMobile}
              color={this.props.color}
              hoverColor={this.props.hoverColor}
              fontWeights={fontWeights}
              required
              modeSet={this.context.config.iconModeSet}
              favouriteContext
            />
          }
          color={this.props.color}
          hoverColor={this.props.hoverColor}
        />
        <FavouriteEditModal
          appElement="#app"
          isModalOpen={this.state.editModalOpen}
          favourites={favouritePlaces}
          updateFavourites={this.updateFavourites}
          handleClose={() => this.closeModal(false)}
          saveFavourite={this.saveFavourite}
          deleteFavourite={this.deleteFavourite}
          onEditSelected={this.editFavourite}
          lang={this.props.lang}
          isMobile={this.props.isMobile}
          isLoading={isLoading}
          color={this.props.color}
          hoverColor={this.props.hoverColor}
          fontWeights={fontWeights}
        />
        {this.renderLoginModal()}
      </React.Fragment>
    );
  }
}

const connectedComponent = connectToStores(
  FavouritesContainer,
  ['FavouriteStore', 'UserStore'],
  context => ({
    favourites:
      !context.config.allowLogin ||
      context.config.allowFavouritesFromLocalstorage ||
      context.getStore('UserStore').getUser().sub !== undefined
        ? context.getStore('FavouriteStore').getFavourites()
        : [],
    favouriteStatus: context.getStore('FavouriteStore').getStatus(),
    requireLoggedIn: !context.config.allowFavouritesFromLocalstorage,
    isLoggedIn:
      context.config.allowLogin &&
      context.getStore('UserStore').getUser().sub !== undefined,
    color: context.config.colors.primary,
    hoverColor:
      context.config.colors.hover ||
      LightenDarkenColor(context.config.colors.primary, -20),
  }),
);

connectedComponent.contextTypes = {
  getStore: PropTypes.func.isRequired,
  config: configShape.isRequired,
};

export { connectedComponent as default, FavouritesContainer as Component };
