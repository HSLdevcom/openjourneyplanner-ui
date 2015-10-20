isBrowser = window?
React  = require 'react'
L      = if isBrowser then require 'leaflet' else null
Marker = if isBrowser then require 'react-leaflet/lib/Marker' else null
Icon   = require '../icon/icon'

class LocationMarker extends React.Component
  render: ->
    <Marker map={@props.map}
      position={@props.position}
      icon={L.divIcon(
        html: Icon.asString 'icon-icon_mapMarker-point'
        className: @props.class
        iconAnchor: [12, 24])}/>

module.exports = LocationMarker
