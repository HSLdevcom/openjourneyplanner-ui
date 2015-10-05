React                           = require 'react'
Relay                           = require 'react-relay'
NoFavouritesPanel               = require './no-favourites-panel'
FavouriteStopCardListContainer  = require './favourite-stop-card-list-container'
FavouriteRouteListContainer     = require './favourite-route-list-container'
queries                         = require '../../queries'

class FavouritesPanel extends React.Component

  @contextTypes:
    getStore: React.PropTypes.func.isRequired
    executeAction: React.PropTypes.func.isRequired

  getFavouriteStopContainer: (ids) =>
    <Relay.RootContainer
      Component={FavouriteStopCardListContainer}
      route={new queries.FavouriteStopListContainerRoute({
        ids: ids
        })}
      renderLoading={-> <div className="spinner-loader"/>}
      }
    />

  getFavouriteRouteContainer: (ids) =>
    <Relay.RootContainer
      Component={FavouriteRouteListContainer}
      route={new queries.FavouriteRouteRowRoute({
        ids: ids
        })}
      renderLoading={-> <div className="spinner-loader"/>}
      }
    />

  componentDidMount: ->
    @context.getStore('FavouriteRoutesStore').addChangeListener @onChange

  componentWillUnmount: ->
    @context.getStore('FavouriteRoutesStore').removeChangeListener @onChange

  onChange: (id) =>
    @forceUpdate()

  getFavourites: (stops, routes) =>
    c=[]
    c.push @getFavouriteStopContainer(stops)
    c.push @getFavouriteRouteContainer(routes)
    c

  render: ->
    FavouriteStopsStore = @context.getStore 'FavouriteStopsStore'
    stops = FavouriteStopsStore.getStops()

    FavouriteRoutesStore = @context.getStore 'FavouriteRoutesStore'
    routes = FavouriteRoutesStore.getRoutes()

    if stops.concat(routes).length==0
      <NoFavouritesPanel/>
    else
      <div>
      {@getFavourites(stops, routes)}
      </div>

module.exports = FavouritesPanel
