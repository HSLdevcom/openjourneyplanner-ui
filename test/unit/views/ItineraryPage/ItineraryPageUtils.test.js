import { isStoredItineraryRelevant } from '../../../../app/component/itinerary/ItineraryPageUtils';

describe('itineraryPageUtils', () => {
  describe('isStoredItineraryRelevant', () => {
    const TIME = 12345;
    const ARRIVE_BY = false;
    const INDEX = '0';
    const TEN_MINUTES_FROM_NOW = new Date(Date.now() + 600000).toISOString();

    let mockStoredItinerary;
    let mockMatch;

    beforeEach(() => {
      mockStoredItinerary = {
        itinerary: {
          end: TEN_MINUTES_FROM_NOW,
        },
        params: {
          from: 'foo',
          to: 'bar',
          arriveBy: ARRIVE_BY,
          time: TIME,
          hash: INDEX,
          secondHash: undefined,
        },
      };

      mockMatch = {
        params: { from: 'foo', to: 'bar', hash: INDEX, secondHash: undefined },
        location: { query: { time: TIME, arriveBy: ARRIVE_BY } },
      };
    });

    it('should return true for equal params', () => {
      expect(
        isStoredItineraryRelevant(mockStoredItinerary, mockMatch),
      ).to.equal(true);
    });

    it('should return true if stored index matches secondHash', () => {
      expect(
        isStoredItineraryRelevant(mockStoredItinerary, {
          ...mockMatch,
          hash: 'other',
          secondHash: INDEX,
        }),
      ).to.equal(true);
    });

    it('should return true if arriveBy is undefined for both', () => {
      const itineraryWithoutArriveBy = { ...mockStoredItinerary };
      const matchWithoutArriveBy = { ...mockMatch };
      itineraryWithoutArriveBy.params.arriveBy = undefined;
      matchWithoutArriveBy.location.query.arriveBy = undefined;

      expect(
        isStoredItineraryRelevant(
          itineraryWithoutArriveBy,
          matchWithoutArriveBy,
        ),
      ).to.equal(true);
    });

    it('should return false for past itinerary', () => {
      const TEN_MINUTES_IN_THE_PAST = new Date(
        Date.now() + 600000,
      ).toISOString();

      expect(
        isStoredItineraryRelevant(
          {
            ...mockStoredItinerary,
            itinerary: { end: TEN_MINUTES_IN_THE_PAST },
          },
          mockMatch,
        ),
      ).to.equal(true);
    });

    it('should return false on index and hash mismatch if secondHash is undefined', () => {
      const matchWithDifferentHash = { ...mockMatch };
      matchWithDifferentHash.params.hash = '999';
      matchWithDifferentHash.params.secondHash = undefined;

      expect(
        isStoredItineraryRelevant(mockStoredItinerary, matchWithDifferentHash),
      ).to.equal(false);
    });

    it('should return false on index and hash mismatch if hash and secondHash are undefined', () => {
      const matchWithDifferentHash = { ...mockMatch };
      matchWithDifferentHash.params.hash = undefined;
      matchWithDifferentHash.params.secondHash = undefined;

      expect(
        isStoredItineraryRelevant(mockStoredItinerary, matchWithDifferentHash),
      ).to.equal(false);
    });

    it('should throw error if match is undefined', () => {
      expect(() =>
        isStoredItineraryRelevant(mockStoredItinerary, undefined),
      ).to.throw(Error);
    });

    it('should not throw error if stored itinerary is empty object', () => {
      expect(() => isStoredItineraryRelevant({}, mockMatch)).to.not.throw(
        Error,
      );
      expect(isStoredItineraryRelevant({}, mockMatch)).to.equal(false);
    });

    it('should not throw error if stored itinerary is missing itinerary field', () => {
      expect(() =>
        isStoredItineraryRelevant(
          { ...mockStoredItinerary, itinerary: undefined },
          mockMatch,
        ),
      ).to.not.throw(Error);
      expect(
        isStoredItineraryRelevant(
          { ...mockStoredItinerary, itinerary: undefined },
          mockMatch,
        ),
      ).to.equal(false);
    });

    it('should not throw error if stored itinerary is missing itinerary field', () => {
      expect(() =>
        isStoredItineraryRelevant(
          { ...mockStoredItinerary, params: undefined },
          mockMatch,
        ),
      ).to.not.throw(Error);
      expect(
        isStoredItineraryRelevant(
          { ...mockStoredItinerary, params: undefined },
          mockMatch,
        ),
      ).to.equal(false);
    });
  });
});
