"use strict";

export const CONSTANTS = {
    defaultStatus: ['success', 'started', 'failed', 'updated', 'finished'],
    events: {
    	'ROOM_NAME': 'm.room.name',
    	'ROOM_MEMBER': 'm.room.member',
    	'ROOM_MEMBER_JOIN': 'join',
    	'ROOM_MEMBER_LEAVE': 'leave',
    	'ROOM_MEMBER_INVITE': 'invite',
        'ROOM_MEMBER_BAN': 'ban',
    	'ROOM_TOPIC': 'm.room.topic',
    	'ROOM_AVATAR': 'm.room.avatar',
    }
};
