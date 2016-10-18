"use strict";

export const CONSTANTS = {
    defaultStatus: ['success', 'started', 'failed', 'updated', 'finished'],
    rootEventTypes: {
        "rooms": "rooms",
        "account_data": "account_data",
        "to_device": "to_device",
        "presence": "presence"
    },
    roomEventTypes: ["timeline", "account_data", "state", "ephemeral", "invite_state"],
    roomEventTypesByRoomType: {
        "join": ["timeline", "account_data", "state", "ephemeral"],
        "invite": ["invite_state"]
    },
    roomTypes: ["join", "ban", "leave", "invite"],
    eventCodes: {
        "m.direct": "m.direct",
        "m.presence": "m.presence",
        "m.push_rules": "m.push_rules",
        "m.receipt": "m.receipt",
        "m.room.aliases": "m.room.aliases",
        "m.room.avatar": "m.room.avatar",
        "m.room.canonical_alias": "m.room.canonical_alias",
        "m.room.create": "m.room.create",
        "m.room.guest_access": "m.room.guest_access",
        "m.room.history_visibility": "m.room.history_visibility",
        "m.room.join_rules": "m.room.join_rules",
        "m.room.member": "m.room.member",
        "m.room.message": "m.room.message",
        "m.room.name": "m.room.name",
        "m.room.power_levels": "m.room.power_levels",
        "m.room.redaction": "m.room.redaction",
        "m.room.third_party_invite": "m.room.third_party_invite",
        "m.room.topic": "m.room.topic",
        "m.tag": "m.tag",
        "m.typing": "m.typing",
        "z.nomatrix": "z.nomatrix"
    },
    eventTypes: {
        "message": "m.room.message"
    },
    events: {
    	'ROOM_NAME': 'm.room.name',
    	'ROOM_MEMBER': 'm.room.member',
    	'ROOM_MEMBER_JOIN': 'join',
    	'ROOM_MEMBER_LEAVE': 'leave',
    	'ROOM_MEMBER_INVITE': 'invite',
        'ROOM_MEMBER_BAN': 'ban',
    	'ROOM_TOPIC': 'm.room.topic',
    	'ROOM_AVATAR': 'm.room.avatar',
    },
    eventOwnerTypes: {
        "account_data": "user",
        "room_account_data": "room",
        "presence": "user",
        "timeline": "room",
        "state": "room",
        "ephemeral": "room",
        "rooms": "room",
        "invite_state": "room"
    },
    eventOwnerAttribute: {
        "user": "sender",
        "room": "room_id"
    },
    messageTypes: {
        "m.audio": "m.audio",
        "m.emote": "m.emote",
        "m.file": "m.file",
        "m.image": "m.image",
        "m.location": "m.location",
        "m.notice": "m.notice",
        "m.video": "m.video",
        "m.text": "m.text"
    },
    ownerTypes: {
        "user": "user",
        "room": "room"
    }
};
