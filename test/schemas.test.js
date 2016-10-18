/* jshint -W024 */
/* jshint expr:true */

"use strict";

import _ from "lodash";
import {expect, randomElement, validateSchema} from "./helper";
import {matrixJsonParser, fixTimelineJson} from "../src/utils/matrixJsonParser";
const jsonFixture = require('./model_schemas/initialSync.original.json');

const machosRoomId = "!YbkEIQjnehrBrvscpm:zboxapp.dev";

let apiFixture;

describe('Utils functions', function () {

    it('1. should return a empty object if timeline has no events', function () {
        apiFixture = JSON.parse(JSON.stringify(jsonFixture));
        const roomId = "!ydOOsnIkcazJZFkhPh:zboxapp.dev";
        const timelineFixture = apiFixture.rooms.invite[roomId].timeline;
        const resultTimeline = fixTimelineJson(timelineFixture, roomId);
        expect(typeof resultTimeline).to.equal('object');
        expect(Object.keys(resultTimeline.events).length).to.be.below(1);
    });

});

describe('Schema Tests', function () {

    beforeEach(function () {
        apiFixture = JSON.parse(JSON.stringify(jsonFixture));
    });

    it('1. should return nextBatch with correct token', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(matrixJson.nextBatch).to.not.be.undefined;
        expect(matrixJson.nextBatch).to.match(/^s[0-9]+/);
    });

    it('2. should reformat rooms object with rooms ids as firsts keys', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(typeof matrixJson.rooms).to.equal("object");
        expect(Array.isArray(matrixJson.rooms)).to.be.false;
        const ids = Object.keys(matrixJson.rooms);
        expect(_.sample(ids)).to.match(/^![a-zA-Z].*:zboxapp.dev$/);
    });


    it('3. should return events object with eventId as first key', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(typeof matrixJson.events).to.equal("object");

        const ids = Object.keys(matrixJson.events);
        expect(_.sample(ids)).to.match(/^\$[0-9].*[a-zA-Z]{5}:.*/);
    });

    it('4. should return the accountData object', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(typeof matrixJson.accountData).to.equal("object");
    });

    it('5. should return the toDevice object', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(typeof matrixJson.toDevice).to.equal("object");
    });

    it('6. should return the presence object with events as an object with keys of userIds', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(typeof matrixJson.presence.events).to.equal("object");
        const ids = Object.keys(matrixJson.presence.events);
        const randomId = randomElement(ids);
        expect(randomId).to.equal(matrixJson.presence.events[randomId].sender);
    });

    it('7. should return user object with users ids as firsts keys', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        expect(typeof matrixJson.users).to.equal("object");
        expect(Array.isArray(matrixJson.users)).to.be.false;
        const randomUserId = randomElement(Object.keys(matrixJson.users));
        const randomUser = matrixJson.users[randomUserId];
        expect(randomUser.id).to.match(/^@[_a-zA-Z].*:.*/);
    });

});

describe('Room Tests', function () {

    beforeEach(function () {
        apiFixture = JSON.parse(JSON.stringify(jsonFixture));
    });

    it('1. Room should have the expected attributes', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = randomElement(matrixJson.rooms);
        expect(randomRoom.id).to.not.be.undefined;
        expect(randomRoom.membershipState).to.match(/(join|leave|invite)/);
    });

    it('2. Room should have info attributes added', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = matrixJson.rooms[machosRoomId];
        expect(randomRoom.name).to.equal('Machos');
        expect(randomRoom.topic).to.equal('Temas para solo Hombres');
        expect(randomRoom.avatarUrl).to.equal('mxc://zboxapp.com/INgKbqNGUGDxhJwIYxXUfnhZ');
        expect(randomRoom.unreadNotifications.highlightCount).to.be.above(-1);
        expect(randomRoom.unreadNotifications.notificationCount).to.be.above(-1);
    });

    it('3. Room.members should be an Object with membershipState as keys', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = matrixJson.rooms[machosRoomId];
        const randomMembership = randomElement(Object.keys(randomRoom.members));
        expect(randomMembership).to.match(/(join|leave|invite|ban)/);
    });

    it('4. Room.members join be an array with user ids', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = matrixJson.rooms[machosRoomId];
        const randomMember = randomElement(randomRoom.members.join);
        expect(randomMember).to.match(/^@[a-zA-Z].*:zboxapp.dev$/);
    });

    it('5. Room.timeline.events should be an array with Events Ids', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = randomElement(matrixJson.rooms);
        expect(Array.isArray(randomRoom.timeline.events)).to.be.true;
        const randomEvent = randomElement(randomRoom.timeline.events);
        if (!matrixJson.events[randomEvent].roomId) {
            console.error(randomRoom);
        }
        expect(matrixJson.events[randomEvent].roomId).to.equal(randomRoom.id);
    });

    it('6. Room.timeline.events should sorted by age', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = randomElement(matrixJson.rooms);
        const events = randomRoom.timeline.events;
        if (randomRoom.membershipState !== 'invite')
            expect(matrixJson.events[events[0]].age).to.be.above(matrixJson.events[events[4]].age);
    });

    it('7. room should validate against the schema', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomRoom = matrixJson.rooms[machosRoomId];
        const validationResult = validateSchema(randomRoom, "room");
        expect(validationResult.errors).to.be.empty;
    });

});

describe('Event Tests', function () {

    beforeEach(function () {
        apiFixture = JSON.parse(JSON.stringify(jsonFixture));
    });

    it('1. Event should have the expected attributes', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomEvent = randomElement(matrixJson.events);
        expect(randomEvent.id).to.match(/^\$[0-9].*[a-zA-Z]{5}:.*/);
        expect(randomEvent.userId).to.match(/^@[_a-zA-Z].*:.*/);
    });

    it('2. event should validate against the schema', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomEvent = randomElement(matrixJson.events);
        const validationResult = validateSchema(randomEvent, "event");
        expect(validationResult.errors).to.be.empty;
    });
});

describe('Users Tests', function () {

    beforeEach(function () {
        apiFixture = JSON.parse(JSON.stringify(jsonFixture));
    });

    it('1. User should have the expected attributes', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomUser = matrixJson.users["@pbruna:zboxapp.dev"];
        expect(randomUser.id).to.match(/^@[a-zA-Z].*:.*/);
        expect(randomUser.avatarUrl).to.match(/^mxc:\/\/.*/);
        expect(randomUser.name).to.exists;
        expect(randomUser.displayName).to.exists;
    });

    it('2. User should have presence information', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomUser = matrixJson.users["@pbruna:zboxapp.dev"];
        expect(randomUser.presence).to.match(/(online|offline|unavailable)/);
        expect(randomUser.lastActiveAgo).to.be.above(1);
        expect(randomUser.currentlyActive).to.be.true;
    });

    it('3. User should validate against the schema', function () {
        const matrixJson = matrixJsonParser(apiFixture);
        const randomUser = randomElement(matrixJson.users);
        const validationResult = validateSchema(randomUser, "user");
        if (validationResult.errors.length > 0) {
            console.error(randomUser);
            console.error(validationResult.errors);
        }
        expect(validationResult.errors).to.be.empty;
    });
});

