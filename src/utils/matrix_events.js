"use strict";

// This are the Matrix Events
// rootType: The Server JSON root Key
// state: If the event should update the reducer state
// ephemeral: If we can discard the event
// idAttr: How we set the ID of the event, ephemral does not have Id
// reducers: What reducers should process this event
// reducers.reducerName: The name of the reducer
// reducers.reducerName.ownerId: How we set the Id of the resource
// reducers.reducerName.actions:
//  - new: Add a new resource to the reducer
//  - add.attr.attrName: add the value to this attr,
//  - remove.attr.attrName: the value to this attr,
//  - replace.attr.attrName: replace the value of this attr,
//  - set.attr.attrName: set the value. Inmutable
//  - calculate.reducerFunctionName: calls this reducer function to process the event
// reducers.attrs: Attrs to set when creating a new resource
// embedded: If this is an Object with embeddes events
// embeddedTypes: the name of the embeddeds events we must process
// 
const EVENTS = {
	"m.direct": {
		"rootType": "account_data",
		"idAttr": "calculate.generateId",
		"reducers": {
			"users": { "ownerId": "attr.currentUserId" }
		},
	},
	"m.presence": {
		"rootType": "presence",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"users": { 
				"ownerId": "attr.sender",
				"actions": ["replace.attr.presence"]
			}
		},
	},
	"m.push_rules": {
		"rootType": "account_data",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"users": { "ownerId": "attr.currentUserId" }
		}
	},
	"m.receipt": {
		"rootType": "rooms",
		"ephemeral": true,
		"embedded": true,
		"embeddedTypes": ["m.read"],
		"reducers": {
			"events": { 
				"ownerId": "calculate.objectKeys",
				"actions": ["add.attr.readedBy"]
			}
		}
	},
	"m.room.aliases": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.aliases"]
			}
		},
		"contentKeys": { "aliases": "aliases" }
	},
	"m.room.avatar": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.avatarUrl"]
			}
		},
		"contentKeys": { "url": "avatarUrl" }
	},
	"m.room.canonical_alias": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.canonical_alias"]
			}
		},
		"contentKeys": { "alias": "canonical_alias" }
	},
	"m.room.create": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": {
				"ownerId": "attr.roomId",
				"actions": ["new"],
				"attrs": ["creatorId"]
			}
		},
		"contentKeys": { "creator": "creatorId" }
	},
	"m.room.guest_access": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.guestAccess"]
			}
		},
		"contentKeys": { "guest_access": "guestAccess" }
	},
	"m.room.history_visibility": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.guestAccess"]
			}
		},
		"contentKeys": { "history_visibilty": "historyVisibility" }
	},
	"m.room.join_rules": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.joinRule"]
			}
		},
		"contentKeys": { "join_rule": "joinRule" }
	},
	"m.room.member": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["calculate.updateMembers"]
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": ["new", "calculate.updateMemberships", "update.attr.name", "update.attr.avatarUrl"]
			}
		},
		"contentKeys": { "url": "avatarUrl", "displayname": "name" }
	},
	"m.room.message": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [ 
					"add.attr.messages", "add.attr.events", 
					"calculate.updateEventsByType", "calculate.updateMessagesByType"
				]
			},
			"events": {
				"ownerId": "attr.id",
				"actions": ["new", "calculate.updateByType", "calculate.updateMessagesByType" ],
				"attrs": ["roomId", "userId"]
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": ["add.attr.messages"]
			}
		}
	},
	"m.room.name": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.name"]
			}
		},
		"contentKeys": { "name": "name" }
	},
	"m.room.power_levels": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["calculate.powerLevels"]
			}
		},
	},
	"m.room.redaction": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"events": {
				"ownerId": "attr.id",
				"actions": ["new", "calculate.updateRedactedEvent"],
				"attrs": ["targetEventId", "userId", "roomId"]
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": ["add.attr.messages"]
			},
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [ 
					"add.attr.messages", "add.attr.events", 
					"calculate.updateEventsByType"
				]
			},
		},
	},
	"m.room.third_party_invite": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [ "add.attr.events", "calculate.updateEventsByType" ]
			},
			"events": {
				"ownerId": "attr.id",
				"actions": ["new", "calculate.updateByType"],
				"attrs": ["roomId"]
			},
		}
	},
	"m.room.topic": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.topic"]
			}
		},
		"contentKeys": { "topic": "topic" }
	},
	"m.tag": {
		"rootType": "rooms",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"users": {
				"ownerId": "attr.sender",
				"actions": ["add.attr.tags"]
			},
			"events": { 
				"ownerId": "attr.id",
				"actions": ["new"],
				"attrs": ["userId"]
			},
		}
	},
	"m.typing": {
		"rootType": "rooms",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.membersTyping"]
			}
		},
		"contentKeys": { "user_ids": "membersTyping" }
	},
	"org.matrix.room.color_scheme": {
		"rootType": "rooms",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": {
				"ownerId": "attr.roomId",
				"actions": ["replace.attr.color"]
			}
		}
	}
};

export default EVENTS;