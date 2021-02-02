import {
  boundsAreValid,
  calculateLocationsInBounds,
  deriveFullObservatoryZoomLevel,
  getDynamicAspectRatio,
  getHref,
  hydrateNeonContextData,
  mapIsAtFocusLocation,
  DEFAULT_STATE,
  FEATURES,
  SITE_MAP_PROP_TYPES
} from '../SiteMapUtils';

describe('SiteMap - SiteMapUtils', () => {
  /**
     Functions
  */
  describe('boundsAreValid', () => {
    test('correctly identifies valid bounds', () => {
      [
        { lat: [10, 20], lng: [10, 20] },
        { lat: [-10, 20], lng: [-80, -30] },
      ].forEach((bounds) => {
        expect(boundsAreValid(bounds)).toBe(true);
      });
    });
    test('correctly identifies invalid bounds', () => {
      [
        null,
        '',
        [[10, 20], [10, 20]],
        { lat: [10, 20], lon: [10, 20] },
        { lat: [20, 10], lng: [10, 20] },
      ].forEach((bounds) => {
        expect(boundsAreValid(bounds)).toBe(false);
      });
    });
  });

  describe('calculateLocationsInBounds', () => {
    const locations = {
      A: { latitude: 15, longitude: 0 },
      B: { latitude: 12, longitude: 0 },
      C: { latitude: 19, longitude: 0 },
      D: { latitude: 8, longitude: 0 },
      E: { latitude: 27, longitude: 0 },
      F: { latitude: -2, longitude: 0 },
      G: { latitude: 38, longitude: 0 },
      H: { latitude: 15, longitude: 0 },
      I: { latitude: 15, longitude: -15 },
      J: { latitude: 15, longitude: 23 },
      K: { latitude: 15, longitude: -37 },
      L: { latitude: 15, longitude: 42 },
      M: { latitude: 15, longitude: -62 },
      N: { latitude: 15, longitude: 71 },
      X: { latitude: 15 },
      Y: { longitude: 0 },
      Z: [12, 0],
    };
    const coordLocations = {
      X: {
        geometry: {
          coordinates: [[13, 20]],
        },
      },
      Y: {
        geometry: {
          coordinates: [[0, 67], [24, -80], [17, -5]],
        },
      },
      Z: {
        geometry: {
          coordinates: [
            [[12, 0], [-30, -41], [-35, 8]],
            [[-32, -87], [-37, -82], [-41, -65]],
          ],
        },
      },
      W: {
        geometry: {
          coordinates: [
            [[56, 0], [-30, -41], [-35, 8]],
            [[-32, -87], [-37, -82], [-41, -65]],
          ],
        },
      },
    };
    const bounds = { lat: [10, 20], lng: [-30, 30] };
    test('correctly identifies locations in bounds with neither map nor point extension', () => {
      expect(calculateLocationsInBounds(locations, bounds)).toStrictEqual([
        'A', 'B', 'C', 'H', 'I', 'J',
      ]);
    });
    test('correctly identifies locations in bounds with only map extension', () => {
      expect(calculateLocationsInBounds(locations, bounds, true)).toStrictEqual([
        'A', 'B', 'C', 'D', 'H', 'I', 'J', 'K', 'L',
      ]);
    });
    test('correctly identifies locations in bounds with only point extension', () => {
      expect(calculateLocationsInBounds(locations, bounds, false, 10)).toStrictEqual([
        'A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K',
      ]);
    });
    test('correctly identifies locations in bounds with both map and point extension', () => {
      expect(calculateLocationsInBounds(locations, bounds, true, 10)).toStrictEqual([
        'A', 'B', 'C', 'D', 'E', 'F', 'H', 'I', 'J',  'K', 'L', 'M',
      ]);
    });
    test('correctly handles deeply nested single coord geometries', () => {
      expect(calculateLocationsInBounds(coordLocations, bounds)).toStrictEqual([
        'X', 'Y', 'Z',
      ]);
    });
    test('correctly returns empty set for invalid inputs', () => {
      expect(calculateLocationsInBounds({})).toStrictEqual([]);
      expect(calculateLocationsInBounds('bad locations')).toStrictEqual([]);
      expect(calculateLocationsInBounds(locations, 'bad bounds')).toStrictEqual([]);
    });
    test('correctly reflects back all locations for null/missing bounds', () => {
      expect(calculateLocationsInBounds(locations)).toStrictEqual(Object.keys(locations));
      expect(calculateLocationsInBounds(locations, null)).toStrictEqual(Object.keys(locations));
    });
  });

  describe('deriveFullObservatoryZoomLevel', () => {
    test('returns FALLBACK_ZOOM if provided mapRef is not valid', () => {
      expect(deriveFullObservatoryZoomLevel()).toBe(2);
      expect(deriveFullObservatoryZoomLevel({ current: null })).toBe(2);
    });
    test('returns appropriate zoom levels for various container sizes', () => {
      const mapRef = { current: { container: { parentElement: {} } } };
      [
        [10, 0, 2],
        [0, 10, 2],
        [10, 10, 1],
        [300, 200, 1],
        [600, 400, 2],
        [800, 600, 2],
        [1000, 800, 3],
        [1400, 1200, 4],
        [1200, 200, 1],
        [1200, 600, 2],
      ].forEach((test) => {
        mapRef.current.container.parentElement.clientWidth = test[0];
        mapRef.current.container.parentElement.clientHeight = test[1];
        expect(deriveFullObservatoryZoomLevel(mapRef)).toBe(test[2]);
      });
    });
  });

  describe('getDynamicAspectRatio', () => {
    let windowSpy;
    beforeEach(() => {
      windowSpy = jest.spyOn(global, "window", "get");
    });
    afterEach(() => {
      windowSpy.mockRestore();
    });
    test('gets appropriate aspect ratios for various window sizes without a buffer', () => {
      [
        [800, 1, (1/3)],
        [800, 100, (1/3)],
        [800, 300, (1/2.5)],
        [800, 400, (9/16)],
        [800, 450, (2/3)],
        [800, 520, (5/7)],
        [800, 600, (4/5)],
        [800, 800, (1/1)],
        [800, 1000, (5/4)],
        [750, 1000, (7/5)],
        [700, 1000, (3/2)],
        [600, 1000, (16/9)],
        [500, 1000, (2/1)],
        [100, 1000, (2/1)],
        [1, 1000, (2/1)],
      ].forEach((test) => {
        windowSpy.mockImplementation(() => (
          {innerWidth: test[0], innerHeight: test[1] }
        ));
        expect(getDynamicAspectRatio()).toBe(test[2]);
      });
    });
    test('gets appropriate aspect ratios for various window sizes with a buffer', () => {
      [
        [800, 1, (1/3)],
        [800, 400, (1/3)],
        [800, 600, (1/2.5)],
        [800, 700, (9/16)],
        [800, 750, (2/3)],
        [800, 820, (5/7)],
        [800, 900, (4/5)],
        [800, 1100, (1/1)],
        [800, 1300, (5/4)],
        [750, 1300, (7/5)],
        [700, 1300, (3/2)],
        [600, 1300, (16/9)],
        [500, 1300, (2/1)],
        [100, 1300, (2/1)],
        [1, 1300, (2/1)],
      ].forEach((test) => {
        windowSpy.mockImplementation(() => (
          {innerWidth: test[0], innerHeight: test[1] }
        ));
        expect(getDynamicAspectRatio(300)).toBe(test[2]);
      });
    });
  });

  describe('getHref', () => {
    test('generates proper fallback href for missing or invalid key', () => {
      expect(getHref()).toEqual('#');
      expect(getHref('INVALID_KEY', 'foo')).toEqual('#');
    });
    test('generates proper href for EXPLORE_DATA_PRODUCTS_BY_SITE', () => {
      expect(getHref('EXPLORE_DATA_PRODUCTS_BY_SITE', 'ARIK'))
        .toEqual('https://data.neonscience.org/data-products/explore?site=ARIK');
      expect(getHref('EXPLORE_DATA_PRODUCTS_BY_SITE')).toEqual('#');
    });
    test('generates proper href for EXPLORE_DATA_PRODUCTS_BY_STATE', () => {
      expect(getHref('EXPLORE_DATA_PRODUCTS_BY_STATE', 'CO'))
        .toEqual('https://data.neonscience.org/data-products/explore?state=CO');
      expect(getHref('EXPLORE_DATA_PRODUCTS_BY_STATE')).toEqual('#');
    });
    test('generates proper href for EXPLORE_DATA_PRODUCTS_BY_DOMAIN', () => {
      expect(getHref('EXPLORE_DATA_PRODUCTS_BY_DOMAIN', 'D13'))
        .toEqual('https://data.neonscience.org/data-products/explore?domain=D13');
      expect(getHref('EXPLORE_DATA_PRODUCTS_BY_DOMAIN')).toEqual('#');
    });
    test('generates proper href for SITE_DETAILS', () => {
      expect(getHref('SITE_DETAILS', 'BARC'))
        .toEqual('https://www.neonscience.org/field-sites/BARC');
      expect(getHref('SITE_DETAILS')).toEqual('#');
    });
    test('generates proper href for DOMAIN_DETAILS', () => {
      expect(getHref('DOMAIN_DETAILS', 'D08'))
        .toEqual('https://www.neonscience.org/domains/D08');
      expect(getHref('DOMAIN_DETAILS')).toEqual('#');
    });
  });

  describe('hydrateNeonContextData', () => {
    test('applies NeonContext data correctly', () => {
      const initialState = {
        neonContextHydrated: false,
        sites: {},
        featureData: {
          SITES: {
            TERRESTRIAL_CORE_SITES: {},
            AQUATIC_CORE_SITES: {},
            TERRESTRIAL_RELOCATABLE_SITES: {},
            AQUATIC_RELOCATABLE_SITES: {},
          },
          STATES: { STATES: {} },
          DOMAINS: { DOMAINS: {} },
        },
      };
      const neonContextData = {
        sites: {
          ABBY: { type: 'RELOCATABLE', terrain: 'TERRESTRIAL', stateCode: 'WA', domainCode: 'D16' },
          CLBJ: { type: 'CORE', terrain: 'TERRESTRIAL', stateCode: 'TX', domainCode: 'D11' },
          SUGG: { type: 'CORE', terrain: 'AQUATIC', stateCode: 'FL', domainCode: 'D03' },
          WLOU: { type: 'RELOCATABLE', terrain: 'AQUATIC', stateCode: 'CO', domainCode: 'D13' },
        },
        states: {
          CO: { name: 'Colorado' },
          FL: { name: 'Florida' },
          TX: { name: 'Texas' },
          WA: { name: 'Washington' },
        },
        domains: {
          D03: { name: 'Southeast' },
          D11: { name: 'Southern Plains' },
          D13: { name: 'Southern Rockies and Colorado Plateau' },
          D16: { name: 'Pacific Northwest' },
        },
        stateSites: { CO: ['WLOU'], FL: ['SUGG'], TX: ['CLBJ'], WA: ['ABBY'] },
        domainSites: { D03: ['SUGG'], D11: ['CLBJ'], D13: ['WLOU'], D16: ['ABBY'] },
      };
      expect(hydrateNeonContextData(initialState, neonContextData)).toStrictEqual({
        neonContextHydrated: true,
        sites: { ...neonContextData.sites },
        featureData: {
          SITES: {
            TERRESTRIAL_CORE_SITES: {
              CLBJ: { ...neonContextData.sites.CLBJ },
            },
            AQUATIC_CORE_SITES: {
              SUGG: { ...neonContextData.sites.SUGG },
            },
            TERRESTRIAL_RELOCATABLE_SITES: {
              ABBY: { ...neonContextData.sites.ABBY },
            },
            AQUATIC_RELOCATABLE_SITES: {
              WLOU: { ...neonContextData.sites.WLOU },
            },
          },
          STATES: {
            STATES: {
              CO: { name: 'Colorado', sites: ['WLOU'] },
              FL: { name: 'Florida', sites: ['SUGG'] },
              TX: { name: 'Texas', sites: ['CLBJ'] },
              WA: { name: 'Washington', sites: ['ABBY'] },
            },
          },
          DOMAINS: {
            DOMAINS: {
              D03: { name: 'Southeast', sites: ['SUGG'] },
              D11: { name: 'Southern Plains', sites: ['CLBJ'] },
              D13: { name: 'Southern Rockies and Colorado Plateau', sites: ['WLOU'] },
              D16: { name: 'Pacific Northwest', sites: ['ABBY'] },
            },
          },
        },
      });
    });
  });

  describe('mapIsAtFocusLocation', () => {
    test('correctly identifies when map center is at focus location', () => {
      expect(mapIsAtFocusLocation({
        map: { zoom: 4, center: [-68.3, 15] },
        focusLocation: {
          current: 'foo',
          map: { zoom: 4, center: [-68.3, 15] },
        }
      })).toBe(true);
    });
    test('correctly identifies when map center is not at focus location', () => {
      expect(mapIsAtFocusLocation({
        map: { zoom: 5, center: [-68.3, 15] },
        focusLocation: {
          current: 'foo',
          map: { zoom: 4, center: [-68.3, 15] },
        }
      })).toBe(false);
      expect(mapIsAtFocusLocation({
        map: { zoom: 4, center: [-69.3, 15] },
        focusLocation: {
          current: 'foo',
          map: { zoom: 4, center: [-68.3, 15] },
        }
      })).toBe(false);
    });
    test('gracefully returns false for any missing focus location or malformed state', () => {
      expect(mapIsAtFocusLocation()).toBe(false);
      expect(mapIsAtFocusLocation({
        map: { zoom: 4, center: [-69.3, 15] },
        focusLocation: { current: null },
      })).toBe(false);
      expect(mapIsAtFocusLocation({
        map: { zoom: 4, center: [-68.3, 15] },
        focusLocation: {
          current: null,
          map: { zoom: 4, center: [-68.3, 15] },
        }
      })).toBe(false);
      expect(mapIsAtFocusLocation({
        map: { zoom: 4, center: [-68.3, 15] },
        focusLocation: {
          current: 'foo',
          map: { center: [-68.3, 15] },
        }
      })).toBe(false);      
    });
  });

  describe('SelectionLimitPropType', () => {
    const { selectionLimit: SelectionLimitPropType } = SITE_MAP_PROP_TYPES;
    test('valid for null', () => {
      expect(SelectionLimitPropType({ p: null }, 'p')).toBe(null);
    });
    test('invalid for unsupported types', () => {
      expect(SelectionLimitPropType({ p: 'foo' }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: () => {} }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: { foo: 'bar' } }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: NaN }, 'p')).toBeInstanceOf(Error);
    });
    test('valid for null / undefined', () => {
      expect(SelectionLimitPropType({}, 'p')).toBe(null);
      expect(SelectionLimitPropType({ p: null }, 'p')).toBe(null);
    });
    test('valid for integers greater than or equal to 1', () => {
      expect(SelectionLimitPropType({ p: 1 }, 'p')).toBe(null);
      expect(SelectionLimitPropType({ p: 10 }, 'p')).toBe(null);
      expect(SelectionLimitPropType({ p: 10000000 }, 'p')).toBe(null);
    });
    test('invalid for integers less than 1', () => {
      expect(SelectionLimitPropType({ p: 0 }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: -7 }, 'p')).toBeInstanceOf(Error);
    });
    test('invalid for non-integer numbers', () => {
      expect(SelectionLimitPropType({ p: 1.7 }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: Math.PI }, 'p')).toBeInstanceOf(Error);
    });
    test('valid for 2-length arrays of increasing non-equal integers', () => {
      expect(SelectionLimitPropType({ p: [2, 5] }, 'p')).toBe(null);
      expect(SelectionLimitPropType({ p: [1, 4000] }, 'p')).toBe(null);
      expect(SelectionLimitPropType({ p: [466, 467] }, 'p')).toBe(null);
    });
    test('invalid for arrays of integers with length other than 2', () => {
      expect(SelectionLimitPropType({ p: [3] }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: [2, 5, 7] }, 'p')).toBeInstanceOf(Error);
    });
    test('invalid for arrays where any values are non-integer or less than 1', () => {
      expect(SelectionLimitPropType({ p: [3, Math.PI] }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: [5.8, 7] }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: [0, 10] }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: [-15, 10] }, 'p')).toBeInstanceOf(Error);
    });
    test('invalid for 2-length integer arrays where values are equal or not ascending', () => {
      expect(SelectionLimitPropType({ p: [3, 3] }, 'p')).toBeInstanceOf(Error);
      expect(SelectionLimitPropType({ p: [7, 5] }, 'p')).toBeInstanceOf(Error);
    });
  });

  /**
     CONSTANTS
  */
  describe('FEATURES construction', () => {
    test('all features have an explicit KEY', () => {
      Object.keys(FEATURES).forEach((key) => {
        expect(FEATURES[key].KEY).toBe(key);
      });
    });
  });

  describe('DEFAULT_STATE construction', () => {
    test('view - all VIEWS present and uninitialized', () => {
      expect(DEFAULT_STATE.view).toStrictEqual({
        current: null,
        initialized: {
          MAP: false,
          TABLE: false,
        },
      });
    });
    describe('featureDataFetches - initialized for all fetchable in FEATURE_DATA_SOURCES', () => {
      expect(DEFAULT_STATE.featureDataFetches).toStrictEqual({
        REST_LOCATIONS_API: {
          SITE_LOCATION_HIERARCHIES: {},
          TOWERS: {},
        },
        ARCGIS_ASSETS_API: {
          FLIGHT_BOX_BOUNDARIES: {},
          WATERSHED_BOUNDARIES: {},
          DRAINAGE_LINES: {},
          POUR_POINTS: {},
          SAMPLING_BOUNDARIES: {},
          AQUATIC_REACHES: {},
          TOWER_AIRSHEDS: {},
        },
        GRAPHQL_LOCATIONS_API: {
          10: {},
          11: {},
          13: {},
          14: {},
          15: {},
          16: {},
          17: {},
        },
      });        
    });      
  });
});
