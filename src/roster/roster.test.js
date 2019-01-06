import _ from 'lodash';

import BaseAPIObject from '../base-api-object/base-api-object.js';
import SlottedPlayer from '../slotted-player/slotted-player.js';
import Team from '../team/team.js';

import Roster from './roster.js';

import { localObject, serverResponse } from './roster.stubs.js';

describe('Roster', () => {
  let roster;

  beforeEach(() => {
    roster = new Roster();
  });

  afterEach(() => {
    roster = null;
  });

  test('extends BaseAPIObject', () => {
    expect(roster).toBeInstanceOf(BaseAPIObject);
  });

  describe('attribute population from server response', () => {
    beforeEach(() => {
      roster = Roster.buildFromServer(serverResponse, { teamId: 9 });
    });

    test('parses data correctly', () => {
      expect(roster).toMatchSnapshot();
    });
  });

  describe('attribute population from local object', () => {
    beforeEach(() => {
      roster = new Roster(localObject);
    });

    test('parses data correctly', () => {
      expect(roster).toMatchSnapshot();
    });
  });

  describe('constructor', () => {
    describe('when options are not passed', () => {
      const testPropIsUndefined = (prop) => {
        test(`${prop} is undefined`, () => {
          const newRoster = new Roster();
          expect(_.get(newRoster, prop)).toBeUndefined();
        });
      };

      testPropIsUndefined('leagueId');
      testPropIsUndefined('seasonId');
      testPropIsUndefined('teamId');
      testPropIsUndefined('scoringPeriodId');
    });

    describe('when options are passed', () => {
      const testPropIsSetFromOptions = (prop) => {
        test(`${prop} is set from options`, () => {
          const value = 25;
          const newRoster = new Roster({ [prop]: value });
          expect(_.get(newRoster, prop)).toBe(value);
        });
      };

      testPropIsSetFromOptions('leagueId');
      testPropIsSetFromOptions('seasonId');
      testPropIsSetFromOptions('teamId');
      testPropIsSetFromOptions('scoringPeriodId');
    });
  });

  describe('responseMap', () => {
    describe('team', () => {
      describe('manualParse', () => {
        let model;

        beforeEach(() => {
          model = new Roster({
            leagueId: 123,
            seasonId: 2018
          });
        });

        afterEach(() => {
          model = null;
        });

        const testReturnsEmptyModel = ({ value, valueString }) => {
          describe(`when the passed data is ${valueString}`, () => {
            test('returns an empty Team', () => {
              const expectedTeam = new Team({ leagueId: model.leagueId, seasonId: model.seasonId });

              const returnedTeam = Roster.responseMap.team.manualParse(value, undefined, model);
              expect(returnedTeam).toEqual(expectedTeam);
            });
          });
        };

        describe('when the populating model does not have a teamId', () => {
          beforeEach(() => {
            model.teamId = undefined;
          });

          testReturnsEmptyModel({ value: undefined, valueString: 'undefined' });
          testReturnsEmptyModel({ value: null, valueString: 'null' });
          testReturnsEmptyModel({ value: [], valueString: 'empty array' });
          testReturnsEmptyModel({
            value: [{ teamId: 4 }, { teamId: 5 }, { teamId: 6 }],
            valueString: 'populated array'
          });
        });

        describe('when the populating model has a teamId', () => {
          beforeEach(() => {
            model.teamId = 10;
          });

          testReturnsEmptyModel({ value: undefined, valueString: 'undefined' });
          testReturnsEmptyModel({ value: null, valueString: 'null' });
          testReturnsEmptyModel({ value: [], valueString: 'empty array' });

          describe('when the passed data is a populated array', () => {
            let responseData;

            beforeEach(() => {
              responseData = [{
                teamId: model.teamId,
                team: {
                  teamId: model.teamId
                }
              }];
            });

            afterEach(() => {
              responseData = null;
            });

            describe('when there is a cached team', () => {
              test('returns the cached team', () => {
                const cachedTeam = Team.buildFromServer(
                  { teamId: model.teamId },
                  { leagueId: model.leagueId, seasonId: model.seasonId }
                );

                const returnedTeam = Roster.responseMap.team.manualParse(
                  responseData, undefined, model
                );
                expect(returnedTeam).toBe(cachedTeam);

                Team.clearCache();
              });
            });

            describe('when there is not a cached team', () => {
              test('creates a new team', () => {
                Team.clearCache();

                const cachingId = Team.getCacheId({
                  leagueId: model.leagueId,
                  seasonId: model.seasonId,
                  teamId: model.teamId
                });

                const returnedTeam = Roster.responseMap.team.manualParse(
                  responseData, undefined, model
                );
                expect(returnedTeam).toBe(Team.get(cachingId));

                Team.clearCache();
              });
            });
          });
        });
      });
    });

    describe('player', () => {
      describe('manualParse', () => {
        let model;

        beforeEach(() => {
          model = new Roster({
            leagueId: 123,
            seasonId: 2018
          });
        });

        afterEach(() => {
          model = null;
        });

        const testReturnsEmptyArray = ({ value, valueString }) => {
          describe(`when the passed data is ${valueString}`, () => {
            test('returns an empty array', () => {
              const returnedPlayers = Roster.responseMap.players.manualParse(
                value, undefined, model
              );
              expect(returnedPlayers).toEqual([]);
            });
          });
        };

        describe('when the populating model does not have a teamId', () => {
          beforeEach(() => {
            model.teamId = undefined;
          });

          testReturnsEmptyArray({ value: undefined, valueString: 'undefined' });
          testReturnsEmptyArray({ value: null, valueString: 'null' });
          testReturnsEmptyArray({ value: [], valueString: 'empty array' });
          testReturnsEmptyArray({
            value: [{ teamId: 4 }, { teamId: 5 }, { teamId: 6 }],
            valueString: 'populated array'
          });
        });

        describe('when the populating model has a teamId', () => {
          beforeEach(() => {
            model.teamId = 10;
          });

          testReturnsEmptyArray({ value: undefined, valueString: 'undefined' });
          testReturnsEmptyArray({ value: null, valueString: 'null' });
          testReturnsEmptyArray({ value: [], valueString: 'empty array' });

          describe('when the passed data is a populated array', () => {
            test('returns an array of SlottedPlayers', () => {
              const responseData = [{
                teamId: model.teamId,
                slots: [{
                  player: {},
                  isKeeper: true
                }, {
                  player: {},
                  isKeeper: false
                }]
              }];

              const returnedPlayers = Roster.responseMap.players.manualParse(
                responseData, undefined, model
              );

              expect.hasAssertions();
              _.forEach(returnedPlayers, (slottedPlayer) => {
                expect(slottedPlayer).toBeInstanceOf(SlottedPlayer);
              });
            });
          });
        });
      });
    });
  });

  describe('class methods', () => {
    describe('getCacheId', () => {
      let leagueId, seasonId, teamId, scoringPeriodId;

      afterEach(() => {
        leagueId = seasonId = teamId = scoringPeriodId = null;
      });

      const testReturnsUndefined = () => {
        test('returns undefined', () => {
          const params = { leagueId, seasonId, teamId, scoringPeriodId };
          expect(Roster.getCacheId(params)).toBeUndefined();
        });
      };

      describe('when called with no params', () => {
        test('returns undefined', () => {
          expect(Roster.getCacheId()).toBeUndefined();
        });
      });

      describe('when leagueId is defined', () => {
        beforeEach(() => {
          leagueId = 132123;
        });

        describe('when seasonId is defined', () => {
          beforeEach(() => {
            seasonId = 2017;
          });

          describe('when teamId is defined', () => {
            beforeEach(() => {
              teamId = 4;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              test('returns a valid caching id', () => {
                const params = { leagueId, seasonId, teamId, scoringPeriodId };

                const returnedCachingId = Roster.getCacheId(params);
                expect(returnedCachingId).toBe(
                  `${teamId}-${leagueId}-${seasonId}-${scoringPeriodId}`
                );
              });
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });

          describe('when teamId is undefined', () => {
            beforeEach(() => {
              teamId = undefined;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });
        });

        describe('when seasonId is undefined', () => {
          beforeEach(() => {
            seasonId = undefined;
          });

          describe('when teamId is defined', () => {
            beforeEach(() => {
              teamId = 4;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });

          describe('when teamId is undefined', () => {
            beforeEach(() => {
              teamId = undefined;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });
        });
      });

      describe('when leagueId is undefined', () => {
        beforeEach(() => {
          leagueId = undefined;
        });

        describe('when seasonId is defined', () => {
          beforeEach(() => {
            seasonId = 2017;
          });

          describe('when teamId is defined', () => {
            beforeEach(() => {
              teamId = 4;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });

          describe('when teamId is undefined', () => {
            beforeEach(() => {
              teamId = undefined;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });
        });

        describe('when seasonId is undefined', () => {
          beforeEach(() => {
            seasonId = undefined;
          });

          describe('when teamId is defined', () => {
            beforeEach(() => {
              teamId = 4;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });

          describe('when teamId is undefined', () => {
            beforeEach(() => {
              teamId = undefined;
            });

            describe('when scoringPeriodId is defined', () => {
              beforeEach(() => {
                scoringPeriodId = 11;
              });

              testReturnsUndefined();
            });

            describe('when scoringPeriodId is undefined', () => {
              beforeEach(() => {
                scoringPeriodId = undefined;
              });

              testReturnsUndefined();
            });
          });
        });
      });
    });

    describe('read', () => {
      describe('when nothing is passed to read', () => {
        test('throws error', () => {
          expect(() => Roster.read()).toThrowError(
            `${Roster.displayName}: static read: cannot read without leagueId`
          );
        });
      });

      describe('when params are passed to read', () => {
        const testThrowsError = ({ params, errorMessage }) => {
          test('throws error', () => {
            expect(() => Roster.read({ params })).toThrowError(errorMessage);
          });
        };

        describe('when leagueId is passed on params', () => {
          describe('when seasonId is passed on params', () => {
            describe('when teamId is passed on params', () => {
              test('defers to super.read', () => {
                jest.spyOn(BaseAPIObject, 'read').mockImplementation();

                const model = new Roster();
                const route = 'some route';
                const params = { leagueId: 1231232, seasonId: 2017, teamId: 4 };
                const reload = false;

                Roster.read({ model, route, params, reload });
                expect(BaseAPIObject.read).toBeCalledWith({ model, route, params, reload });

                BaseAPIObject.read.mockRestore();
              });
            });

            describe('when teamId is not passed on params', () => {
              testThrowsError({
                params: { leagueId: 1231232, seasonId: 2017 },
                errorMessage: `${Roster.displayName}: static read: cannot read without teamId`
              });
            });
          });

          describe('when seasonId is not passed on params', () => {
            describe('when teamId is passed on params', () => {
              testThrowsError({
                params: { leagueId: 1231232, teamId: 2 },
                errorMessage: `${Roster.displayName}: static read: cannot read without seasonId`
              });
            });

            describe('when teamId is not passed on params', () => {
              testThrowsError({
                params: { leagueId: 1231232 },
                errorMessage: `${Roster.displayName}: static read: cannot read without seasonId`
              });
            });
          });
        });

        describe('when leagueId is not passed on params', () => {
          describe('when seasonId is passed on params', () => {
            describe('when teamId is passed on params', () => {
              testThrowsError({
                params: { seasonId: 2017, teamId: 2 },
                errorMessage: `${Roster.displayName}: static read: cannot read without leagueId`
              });
            });

            describe('when teamId is not passed on params', () => {
              testThrowsError({
                params: { seasonId: 2017 },
                errorMessage: `${Roster.displayName}: static read: cannot read without leagueId`
              });
            });
          });

          describe('when seasonId is not passed on params', () => {
            describe('when teamId is passed on params', () => {
              testThrowsError({
                params: { teamId: 2 },
                errorMessage: `${Roster.displayName}: static read: cannot read without leagueId`
              });
            });

            describe('when teamId is not passed on params', () => {
              testThrowsError({
                params: {},
                errorMessage: `${Roster.displayName}: static read: cannot read without leagueId`
              });
            });
          });
        });
      });
    });
  });

  describe('instance methods', () => {
    describe('read', () => {
      beforeEach(() => {
        jest.spyOn(BaseAPIObject.prototype, 'read').mockImplementation();
      });

      afterEach(() => {
        BaseAPIObject.prototype.read.mockRestore();
      });

      describe('when params are passed to the method', () => {
        describe('when id params are defined on the instance', () => {
          test('calls super.read with only defined id params', () => {
            const instance = new Roster({
              leagueId: 4213,
              seasonId: 2018,
              teamId: 4,
              scoringPeriodId: 12
            });
            const params = { some: 'params' };
            const reload = false;

            instance.read({ params, reload });
            expect(BaseAPIObject.prototype.read).toBeCalledWith({
              params: _.assign({}, params, {
                leagueId: instance.leagueId,
                seasonId: instance.seasonId,
                teamIds: instance.teamId,
                scoringPeriodId: instance.scoringPeriodId
              }),
              model: instance,
              route: Roster.route,
              reload
            });
          });
        });

        describe('when id params are undefined on the instance', () => {
          test('calls super.read with only defined id params', () => {
            const instance = new Roster();
            const params = { some: 'params' };
            const route = 'some route';

            instance.read({ params, route });
            expect(BaseAPIObject.prototype.read).toBeCalledWith({
              params,
              model: instance,
              route,
              reload: true
            });
          });
        });
      });

      describe('when no params are passed to the method', () => {
        describe('when id params are defined on the instance', () => {
          test('calls super.read with only defined id params', () => {
            const instance = new Roster({
              leagueId: 4213,
              seasonId: 2018,
              teamId: 4,
              scoringPeriodId: 12
            });

            instance.read();
            expect(BaseAPIObject.prototype.read).toBeCalledWith({
              params: {
                leagueId: instance.leagueId,
                seasonId: instance.seasonId,
                teamIds: instance.teamId,
                scoringPeriodId: instance.scoringPeriodId
              },
              model: instance,
              route: Roster.route,
              reload: true
            });
          });
        });

        describe('when id params are undefined on the instance', () => {
          test('calls super.read with only defined id params', () => {
            const instance = new Roster();

            instance.read();
            expect(BaseAPIObject.prototype.read).toBeCalledWith({
              params: {},
              model: instance,
              route: Roster.route,
              reload: true
            });
          });
        });
      });
    });
  });
});