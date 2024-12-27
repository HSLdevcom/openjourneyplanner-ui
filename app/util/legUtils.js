import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { getRouteMode } from './modeUtils';
import { BIKEAVL_UNKNOWN } from './vehicleRentalUtils';

/**
 * Gets a (nested) property value from an object
 *
 * @param {Object.<string, any>} obj object with properties i.e. { foo: 'bar', baz: {qux: 'quux'} }
 * @param {string} propertyString string representation of object property i.e. foo, baz.qux
 * @returns {Object}
 */
function getNestedValue(obj, propertyString) {
  return propertyString.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Compares if given legs share any of the given properties.
 * Can be used to check if two separate leg objects are identical
 * Returns true if both legs are null|undefined
 *
 * @param {Object.<string, any>|undefined} leg1
 * @param {Object.<string, any>|undefined} leg2
 * @param {string[]} properties list of object fields to compare i.e. ['foo', 'bar.baz']
 * @returns {boolean}
 */
export function isAnyLegPropertyIdentical(leg1, leg2, properties) {
  if (leg1 === leg2) {
    return true;
  }

  if (!leg1 || !leg2) {
    return false;
  }

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const val1 = getNestedValue(leg1, property);
    const val2 = getNestedValue(leg2, property);
    if (val1 && val2 && val1 === val2) {
      return true;
    }
  }
  return false;
}

/**
 * Get time as  milliseconds since the Unix Epoch
 */
export function legTime(lt) {
  const t = lt.estimated?.time || lt.scheduledTime;
  return Date.parse(t);
}

/**
 * Get time as 'hh:mm'
 */
export function legTimeStr(lt) {
  const t = lt.estimated?.time || lt.scheduledTime;
  const parts = t.split('T');
  const time = parts[1].split(':');
  return `${time[0]}:${time[1]}`;
}

/**
 * Get time as 'hh:mm:ss'
 */
export function legTimeAcc(lt) {
  const t = lt.estimated?.time || lt.scheduledTime;
  const parts = t.split('T')[1].split('+');
  return parts[0];
}

function filterLegStops(leg, filter) {
  if (leg.from.stop && leg.to.stop && leg.trip) {
    const stops = [leg.from.stop.gtfsId, leg.to.stop.gtfsId];
    if (leg.trip.stoptimesForDate) {
      return leg.trip.stoptimesForDate
        .filter(stoptime => stops.indexOf(stoptime.stop.gtfsId) !== -1)
        .filter(filter);
    }
    return leg.trip.stoptimes
      .filter(stoptime => stops.indexOf(stoptime.stop.gtfsId) !== -1)
      .filter(filter);
  }
  return false;
}

function sameBicycleNetwork(leg1, leg2) {
  if (leg1.from.vehicleRentalStation && leg2.from.vehicleRentalStation) {
    return (
      leg1.from.vehicleRentalStation.rentalNetwork.networkId ===
      leg2.from.vehicleRentalStation.rentalNetwork.networkId
    );
  }
  return true;
}

/**
 * Checks if both of the legs exist and are taken with a rented bicycle (rentedBike === true).
 *
 * @param {*} leg1 the first leg
 * @param {*} leg2 the second leg
 */
function continueWithRentedBicycle(leg1, leg2) {
  return (
    leg1 != null &&
    leg1.rentedBike === true &&
    leg2 != null &&
    leg2.rentedBike === true &&
    sameBicycleNetwork(leg1, leg2)
  );
}

/**
 * The leg mode depicts different types of leg available.
 */
export const LegMode = {
  Bicycle: 'BICYCLE',
  BicycleWalk: 'BICYCLE_WALK',
  CityBike: 'CITYBIKE',
  Walk: 'WALK',
  Car: 'CAR',
  Rail: 'RAIL',
  Wait: 'WAIT',
};

/**
 * Extracts the mode for the given leg or mode.
 *
 * @param {*} legOrMode the leg or mode to extract the mode from
 * @returns LegMode, or undefined if the mode cannot be extracted
 */
export function getLegMode(legOrMode) {
  const mode =
    typeof legOrMode === 'string' || legOrMode instanceof String
      ? legOrMode
      : legOrMode && legOrMode.mode;
  switch ((mode || '').toUpperCase()) {
    case LegMode.Bicycle:
      return LegMode.Bicycle;
    case LegMode.BicycleWalk:
      return LegMode.BicycleWalk;
    case LegMode.CityBike:
      return LegMode.CityBike;
    case LegMode.Walk:
      return LegMode.Walk;
    case LegMode.Car:
      return LegMode.Car;
    case LegMode.Rail:
      return LegMode.Rail;
    default:
      return undefined;
  }
}

/**
 * Check if legs start stop pickuptype or end stop pickupType is CALL_AGENCY
 *
 * leg must have:
 * from.stop.gtfsId
 * to.stop.gtfsId
 * trip.stoptimes (with props:)
 *   stop.gtfsId
 *   pickupType
 */
export function isCallAgencyLeg(leg) {
  return (
    leg.route?.type === 715 ||
    filterLegStops(leg, stoptime => stoptime.pickupType === 'CALL_AGENCY')
      .length > 0
  );
}

/**
 * Checks if both of the legs exist and are taken with mode 'BICYCLE'.
 *
 * @param {*} leg1 the first leg
 * @param {*} leg2 the second leg
 */
function continueWithBicycle(leg1, leg2) {
  const isBicycle1 =
    leg1.mode === LegMode.Bicycle || leg1.mode === LegMode.Walk;
  const isBicycle2 =
    leg2.mode === LegMode.Bicycle || leg2.mode === LegMode.Walk;
  return isBicycle1 && isBicycle2 && !leg1.to.vehicleParking;
}

export function getRouteText(route, config, interliningWithRoute) {
  const showAgency = get(config, 'agency.show', false);
  if (interliningWithRoute && interliningWithRoute !== route.shortName) {
    return `${route.shortName} / ${interliningWithRoute}`;
  }
  if (route.shortName) {
    return route.shortName;
  }
  if (showAgency && route.agency) {
    return route.agency.name;
  }
  return '';
}

/**
 * Returns all legs after a given index in which the user can wait in the vehilce for the next transit leg
 * to start.
 * @param {*} legs An array of itinerary legs
 * @param {*} index Current index on the array
 */
export function getInterliningLegs(legs, index) {
  const interliningLegs = [];
  const interliningLines = [];
  let i = index;
  while (legs[i + 1] && legs[i + 1].interlineWithPreviousLeg) {
    interliningLegs.push(legs[i + 1]);
    interliningLines.push(legs[i + 1].route.shortName);
    i += 1;
  }
  const uniqueLines = Array.from(new Set(interliningLines));

  return [uniqueLines, interliningLegs];
}

function bikingEnded(leg1) {
  return leg1.from.vehicleRentalStation && leg1.mode === 'WALK';
}

function syntheticEndpoint(originalEndpoint, place) {
  return {
    ...originalEndpoint,
    stop: place.stop,
    lat: place.stop.lat,
    lon: place.stop.lon,
    name: place.stop.name,
  };
}

/**
 * Adds intermediate: true to legs if their start point should have a via point
 * marker, possibly splitting legs in case the via point belongs in the middle.
 *
 * @param originalLegs Leg objects from graphql query
 * @param viaPlaces Location objects (otpToLocation) from query parameter
 * @returns {*[]}
 */
export function splitLegsAtViaPoints(originalLegs, viaPlaces) {
  const splitLegs = [];
  // Once a via place is matched, it is used and will not match again.
  function includesAndRemove(array, id) {
    const index = array.indexOf(id);
    if (index >= 0) {
      array.splice(index, 1);
      return true;
    }
    return false;
  }
  const viaPoints = viaPlaces.map(p => p.gtfsId);
  const isViaPointMatch = stop =>
    stop &&
    (includesAndRemove(viaPoints, stop.gtfsId) ||
      (stop.parentStation &&
        includesAndRemove(viaPoints, stop.parentStation.gtfsId)));
  let nextLegStartsWithIntermediate = false;
  originalLegs.forEach(originalLeg => {
    const leg = { ...originalLeg };
    const { intermediatePlaces } = leg;
    if (
      nextLegStartsWithIntermediate ||
      (leg.transitLeg && isViaPointMatch(leg.from.stop))
    ) {
      leg.intermediatePlace = true;
      nextLegStartsWithIntermediate = false;
    }
    if (intermediatePlaces) {
      let start = 0;
      let lastSplit = -1;
      intermediatePlaces.forEach((place, i) => {
        if (isViaPointMatch(place.stop)) {
          const leftLeg = {
            ...leg,
            to: syntheticEndpoint(leg.to, place),
            end: place.arrival,
            intermediatePlaces: intermediatePlaces.slice(start, i),
          };
          leg.intermediatePlace = true;
          leg.start = place.arrival;
          leg.from = syntheticEndpoint(leg.from, place);
          splitLegs.push(leftLeg);
          start = i + 1;
          lastSplit = i;
        }
      });
      if (lastSplit >= 0) {
        const lastPlace = intermediatePlaces[lastSplit];
        leg.from = syntheticEndpoint(leg.from, lastPlace);
        leg.start = lastPlace.arrival;
        leg.intermediatePlaces = intermediatePlaces.slice(lastSplit + 1);
      }
    }
    splitLegs.push(leg);
    if (leg.transitLeg && isViaPointMatch(leg.to.stop)) {
      nextLegStartsWithIntermediate = true;
    }
  });
  return splitLegs;
}
/**
 * Compresses the incoming legs (affects only legs with mode BICYCLE, WALK or CITYBIKE). These are combined
 * so that the person will be walking their bicycle and there won't be multiple similar legs
 * one after the other.
 *
 * @param {*} originalLegs an array of legs
 * @param {boolean} keepBicycleWalk whether to keep bicycle walk legs before and after a public transport leg
 */
export function compressLegs(originalLegs, keepBicycleWalk = false) {
  const usingOwnBicycle = originalLegs.some(
    leg => getLegMode(leg) === LegMode.Bicycle && leg.rentedBike === false,
  );
  const compressedLegs = [];
  let compressedLeg;
  let bikeParked = false;
  originalLegs.forEach((currentLeg, i) => {
    if (currentLeg.to?.vehicleParking && currentLeg.mode === LegMode.Bicycle) {
      bikeParked = true;
    }
    if (!compressedLeg) {
      compressedLeg = cloneDeep(currentLeg);
      return;
    }
    if (currentLeg.intermediatePlace) {
      compressedLegs.push(compressedLeg);
      compressedLeg = cloneDeep(currentLeg);
      return;
    }

    if (keepBicycleWalk && usingOwnBicycle) {
      if (originalLegs[i + 1]?.transitLeg && currentLeg.mode !== 'BICYCLE') {
        compressedLegs.push(compressedLeg);
        compressedLeg = cloneDeep(currentLeg);
        return;
      }
      if (
        compressedLegs[compressedLegs.length - 1]?.transitLeg &&
        compressedLeg.mode !== 'BICYCLE'
      ) {
        compressedLegs.push(compressedLeg);
        compressedLeg = cloneDeep(currentLeg);
        return;
      }
    }
    if (usingOwnBicycle && continueWithBicycle(compressedLeg, currentLeg)) {
      // eslint-disable-next-line no-nested-ternary
      const newBikePark = compressedLeg.to.vehicleParking
        ? compressedLeg.to.vehicleParking
        : currentLeg.to.vehicleParking
          ? currentLeg.to.vehicleParking
          : null;
      compressedLeg.duration += currentLeg.duration;
      compressedLeg.distance += currentLeg.distance;
      compressedLeg.to = {
        ...currentLeg.to,
        ...{ vehicleParking: newBikePark },
      };
      compressedLeg.end = currentLeg.end;
      compressedLeg.mode = LegMode.Bicycle;
      return;
    }

    if (
      currentLeg.rentedBike &&
      continueWithRentedBicycle(compressedLeg, currentLeg) &&
      !bikingEnded(currentLeg)
    ) {
      compressedLeg.duration += currentLeg.duration;
      compressedLeg.distance += currentLeg.distance;
      compressedLeg.to = currentLeg.to;
      compressedLeg.end = currentLeg.end;
      compressedLeg.mode = LegMode.CityBike;
      return;
    }

    if (
      usingOwnBicycle &&
      !bikeParked &&
      getLegMode(compressedLeg) === LegMode.Walk
    ) {
      compressedLeg.mode = LegMode.BicycleWalk;
    }

    compressedLegs.push(compressedLeg);
    compressedLeg = cloneDeep(currentLeg);

    if (
      usingOwnBicycle &&
      !bikeParked &&
      getLegMode(currentLeg) === LegMode.Walk
    ) {
      compressedLeg.mode = LegMode.BicycleWalk;
    }
  });

  if (compressedLeg) {
    compressedLegs.push(compressedLeg);
  }
  return compressedLegs;
}

function sumDistances(legs) {
  return legs.map(l => l.distance).reduce((x, y) => (x || 0) + (y || 0), 0);
}
function isWalkingLeg(leg) {
  return [LegMode.BicycleWalk, LegMode.Walk].includes(getLegMode(leg));
}
function isBikingLeg(leg) {
  return [LegMode.Bicycle, LegMode.CityBike].includes(getLegMode(leg));
}
function isDrivingLeg(leg) {
  return [LegMode.Car].includes(getLegMode(leg));
}

/**
 * Checks if the itinerary consists of a single biking leg.
 *
 * @param {*} itinerary the itinerary to check the legs for
 */
export function onlyBiking(itinerary) {
  return itinerary.legs.length === 1 && isBikingLeg(itinerary.legs[0]);
}

/**
 * Checks if any of the legs in the given itinerary contains biking.
 *
 * @param {*} itinerary the itinerary to check the legs for
 */
export function containsBiking(itinerary) {
  return itinerary.legs.some(isBikingLeg);
}

/**
 * Checks if leg is just walking.
 *
 * @param {*} leg a leg which has a mode
 */
export function isLegOnFoot(leg) {
  return leg.mode === 'WALK';
}

/**
 * Checks if any of the legs in the given itinerary contains biking with rental bike.
 *
 * @param {*} leg
 */
export function legContainsRentalBike(leg) {
  return (
    (getLegMode(leg) === LegMode.CityBike ||
      getLegMode(leg) === LegMode.Bicycle) &&
    leg.rentedBike
  );
}

/**
 * Checks if a leg contains a bike park.
 *
 * @param {*} leg - The leg object to check.
 * @returns {boolean} - True if the leg contains a bike park, false otherwise.
 */
export function legContainsBikePark(leg) {
  return leg.mode === LegMode.Bicycle && leg.to.vehicleParking;
}

/**
 * Calculates and returns the total walking distance undertaken in an itinerary.
 * This could be used as a fallback if the backend returns an invalid value.
 *
 * @param {*} itinerary the itinerary to extract the total walking distance from
 */
export function getTotalWalkingDistance(itinerary) {
  // TODO: could be itinerary.walkDistance, but that is invalid for CITYBIKE legs
  return sumDistances(itinerary.legs.filter(isWalkingLeg));
}

/**
 * Calculates and returns the total biking distance undertaken in an itinerary.
 *
 * @param {*} itinerary the itinerary to extract the total biking distance from
 */

export function getTotalBikingDistance(itinerary) {
  return sumDistances(itinerary.legs.filter(isBikingLeg));
}

export function getTotalDrivingDistance(itinerary) {
  return sumDistances(itinerary.legs.filter(isDrivingLeg));
}

/**
 * Calculates and returns the total distance undertaken in an itinerary.
 *
 * @param {*} itinerary the itinerary to extract the total distance from
 */
export function getTotalDistance(itinerary) {
  return sumDistances(itinerary.legs);
}

/**
 * Gets the indicator color for the current amount of citybikes available.
 *
 * @param {number} available the number of bikes currently available
 * @param {*} config the configuration for the software installation
 */
export function getVehicleAvailabilityIndicatorColor(available, config) {
  return (
    // eslint-disable-next-line no-nested-ternary
    available === 0
      ? '#DC0451'
      : available > config.vehicleRental.fewAvailableCount
        ? '#3B7F00'
        : '#FCBC19'
  );
}

/* Gets the indicator text color if  few bikes are available
 *
 * @param {number} available the number of bikes currently available
 * @param {*} config the configuration for the software installation/
 */
export function getVehicleAvailabilityTextColor(available, config) {
  return available <= config.vehicleRental.fewAvailableCount && available > 0
    ? '#333'
    : '#fff';
}

/**
 * Attempts to retrieve any relevant information from the leg that could be shown
 * as the related icon's badge.
 *
 * @param {*} leg the leg to extract the props from
 * @param {*} config the configuration for the software installation
 */
export function getLegBadgeProps(leg, config) {
  if (
    !leg.rentedBike ||
    !leg.from ||
    !leg.from.vehicleRentalStation ||
    config.vehicleRental.capacity === BIKEAVL_UNKNOWN ||
    leg.mode === 'WALK' ||
    leg.mode === 'SCOOTER'
  ) {
    return undefined;
  }
  const { total } = leg.from.vehicleRentalStation?.availableVehicles || 0;
  return {
    badgeFill: getVehicleAvailabilityIndicatorColor(total, config),
    badgeText: `${total}`,
    badgeTextFill: getVehicleAvailabilityTextColor(total, config),
  };
}

export function getZoneLabel(zoneId, config) {
  if (config.zoneIdMapping) {
    return config.zoneIdMapping[zoneId];
  }
  return zoneId;
}

export function getNewMinMaxCharCodes(newCharCode, minCharCode, maxCharCode) {
  let newMin = minCharCode;
  let newMax = maxCharCode;
  if (newMin === undefined || newMin > newCharCode) {
    newMin = newCharCode;
  }
  if (newMax === undefined || newMax < newCharCode) {
    newMax = newCharCode;
  }
  return [newMin, newMax];
}

/**
 * Retrieves all zones from the legs (from & to points) and the legs' stops.
 * This only works if zones have alphabetically continuous one letter zone names
 * and skipping a zone is not possible.
 *
 * @param {*} legs The legs to retrieve the zones from.
 */
export function getZones(legs) {
  if (!Array.isArray(legs)) {
    return [];
  }

  let minCharCode;
  let maxCharCode;
  legs.forEach(leg => {
    if (leg.from && leg.from.stop && leg.from.stop.zoneId) {
      const zoneCharCode = leg.from.stop.zoneId.charCodeAt(0);
      [minCharCode, maxCharCode] = getNewMinMaxCharCodes(
        zoneCharCode,
        minCharCode,
        maxCharCode,
      );
    }
    if (leg.to && leg.to.stop && leg.to.stop.zoneId) {
      const zoneCharCode = leg.to.stop.zoneId.charCodeAt(0);
      [minCharCode, maxCharCode] = getNewMinMaxCharCodes(
        zoneCharCode,
        minCharCode,
        maxCharCode,
      );
    }
    if (Array.isArray(leg.intermediatePlaces)) {
      leg.intermediatePlaces
        .filter(place => place.stop && place.stop.zoneId)
        .forEach(place => {
          const zoneCharCode = place.stop.zoneId.charCodeAt(0);
          [minCharCode, maxCharCode] = getNewMinMaxCharCodes(
            zoneCharCode,
            minCharCode,
            maxCharCode,
          );
        });
    }
  });

  // Add zones starting from the alphabetically first zone and ending in the alphabetically last.
  // This way zones, that are between other zones but never stopped at, will be also added.
  const zones = {};
  if (minCharCode !== undefined) {
    for (let charCode = minCharCode; charCode <= maxCharCode; charCode++) {
      zones[String.fromCharCode(charCode)] = true;
    }
  }
  return Object.keys(zones).sort();
}

export function getRoutes(legs) {
  if (!Array.isArray(legs)) {
    return [];
  }

  const routes = {};
  legs.forEach(leg => {
    if (leg.route && leg.route.agency && leg.transitLeg) {
      const { route } = leg;
      const { agency } = route;
      routes[route.gtfsId] = {
        agency: {
          fareUrl: agency.fareUrl,
          gtfsId: agency.gtfsId,
          name: agency.name,
        },
        gtfsId: route.gtfsId,
        longName: route.longName,
      };
    }
  });
  return Object.keys(routes).map(key => ({ ...routes[key] }));
}

export function getHeadsignFromRouteLongName(route) {
  const { longName, shortName } = route;
  let headsign = longName;
  if (
    longName &&
    shortName &&
    longName.substring(0, shortName.length) === shortName &&
    longName.length > shortName.length
  ) {
    headsign = longName.substring(shortName.length);
  }
  return headsign;
}

export function getStopHeadsignFromStoptimes(stop, stoptimes) {
  const { gtfsId } = stop;
  let headsign;
  if (Array.isArray(stoptimes)) {
    stoptimes.forEach(stoptime => {
      if (stoptime.stop.gtfsId === gtfsId) {
        headsign = stoptime.headsign;
      }
    });
  }
  return headsign;
}

/**
 * Calculates and returns the total duration undertaken in legs.
 *
 * @param {*} legs the legs to extract the total duration from
 */
function sumDurations(legs) {
  return legs.map(l => l.duration).reduce((x, y) => (x || 0) + (y || 0), 0);
}

/**
 * Calculates and returns the total walking duration undertaken in an itinerary.
 * This could be used as a fallback if the backend returns an invalid value.
 *
 * @param {*} itinerary the itinerary to extract the total walking duration from
 */
export function getTotalWalkingDuration(itinerary) {
  // TODO: could be itinerary.walkDuration, but that is invalid for CITYBIKE legs
  return sumDurations(itinerary.legs.filter(isWalkingLeg));
}

/**
 * Calculates and returns the total biking duration undertaken in an itinerary.
 *
 * @param {*} itinerary the itinerary to extract the total biking duration from
 */
export function getTotalBikingDuration(itinerary) {
  return sumDurations(itinerary.legs.filter(isBikingLeg));
}

export function getTotalDrivingDuration(itinerary) {
  return sumDurations(itinerary.legs.filter(isDrivingLeg));
}

export function getExtendedMode(leg, config) {
  return config.useExtendedRouteTypes
    ? (leg.route && getRouteMode(leg.route)) || leg.mode?.toLowerCase()
    : leg.mode?.toLowerCase();
}

/**
 * Creates a boarding leg when a car or bike boards/alights a vehicle if certain criteria are met.
 */
export function getBoardingLeg(
  nextLeg,
  previousLeg,
  waitLeg,
  leg,
  boardingMode,
) {
  if ((nextLeg?.transitLeg && !waitLeg) || previousLeg?.transitLeg) {
    let { from, to } = leg;
    // don't render instructions to walk bike out / drive car from vehicle
    // if biking / driving starts from stop (no transit first)
    if (!previousLeg?.transitLeg && leg.from.stop) {
      from = {
        ...from,
        stop: null,
      };
    }
    if ((!nextLeg?.transitLeg && leg.to.stop) || waitLeg) {
      to = {
        ...to,
        stop: null,
      };
    }
    return {
      duration: 0,
      start: leg.start,
      end: leg.start,
      distance: -1,
      rentedBike: leg.rentedBike,
      to,
      from,
      mode: boardingMode,
    };
  }
  return undefined;
}

/**
 * Determines whether to show a notification for a bike with public transit
 *
 * @param {object} leg - The leg object.
 * @param {object} config - Config data.
 * @returns {boolean} - Returns true if a notifier should be shown
 */
export const showBikeBoardingNote = (leg, config) => {
  const { bikeBoardingModes } = config;
  return bikeBoardingModes?.[leg.mode]?.showNotification;
};

/**
 * Determines whether to show a notification for a car with public transit
 *
 * @param {object} leg - The leg object.
 * @param {object} config - Config data.
 * @returns {boolean} - Returns true if a notifier should be shown
 */
export const showCarBoardingNote = (leg, config) => {
  const { carBoardingModes } = config;
  return carBoardingModes?.[leg.mode]?.showNotification;
};

/**
 * Determines whether a leg after walk leg contains rental vehicles
 * @param {object} leg - The leg object
 * @param {object} nextLeg - The Leg after the current leg
 * @returns {boolean}
 */
export const isRental = (leg, nextLeg) =>
  leg.mode === 'WALK' &&
  (leg.to.vehicleRentalStation ||
    leg.to.vehicleRental ||
    nextLeg?.mode === 'SCOOTER');

/**
 * Return translated string that describes leg destination
 *
 * @param {object} intl - react-intl context
 * @param {object} leg - leg object
 * @param {object} secondary - optional second destination
 * @param {object} nextLeg - optional leg after the current leg
 * @returns {string}
 */
export const legDestination = (intl, leg, secondary, nextLeg = null) => {
  const { to } = leg;
  let id = 'modes.to-place';
  if (leg.mode === 'BICYCLE' && to.vehicleParking) {
    id = 'modes.to-bike-park';
  } else if (leg.mode === 'CAR' && to.vehicleParking) {
    id = 'modes.to-car-park';
  }
  const mode = to.stop?.vehicleMode || secondary?.stop?.vehicleMode;
  if (mode) {
    id = `modes.to-${mode.toLowerCase()}`;
  }
  if (isRental(leg, nextLeg)) {
    id = 'modes.from-place';
  }
  return intl.formatMessage({ id, defaultMessage: 'place' });
};
