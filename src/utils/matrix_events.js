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
//  - add.attrName: add the value to this attr,
//  - update.attrName: replace the value of this attr,
//  - calculate.reducerFunctionName: calls this reducer function to process the event
// reducers.attrs: Attrs to set when creating a new resource
// embedded: If this is an Object with embeddes events
// embeddedTypes: the name of the embeddeds events we must process
// 
const EVENTS = {
	"m.direct": {
		"rootType": "account_data",
		"idAttr": "calculate.generateId",
		"ephemeral": true,
		"reducers": {
			"users": { "ownerId": "attr.currentUserId" }
		},
	},
	"m.presence": {
		"rootType": "presence",
		"ephemeral": true,
		"reducers": {
			"users": { 
				"ownerId": "attr.sender",
				"actions": ["update.content.presence"]
			}
		},
		"actionsValues": { 
			"content": { "presence": "presence" }
		}
	},
	"m.push_rules": {
		"rootType": "account_data",
		"ephemeral": true,
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
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["calculate.eventRead"]
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
				"actions": ["update.content.aliases"]
			}
		},
		"actionsValues": { 
			"content": { "aliases": "aliases" }
		}
	},
	"m.room.avatar": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.avatarUrl"]
			}
		},
		"actionsValues": { 
			"content": { "avatarUrl": "url" }
		}
	},
	"m.room.canonical_alias": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.canonical_alias"]
			}
		},
		"actionsValues": { 
			"content": { "canonical_alias": "alias" }
		}
	},
	"m.room.create": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": {
				"ownerId": "attr.roomId",
				"actions": [ "calculate.new", "update.content.creatorId", "update.attr.id" ],
			}
		},
		"actionsValues": { 
			"content": { "creatorId": "creator" },
			"attr": { "id": "roomId" }
		}
	},
	"m.room.guest_access": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"timeline": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.guestAccess"]
			}
		},
		"actionsValues": { 
			"content": { "guestAccess": "guest_access" }
		}
	},
	"m.room.history_visibility": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"timeline": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.historyVisibility"]
			}
		},
		"actionsValues": { 
			"content": { "historyVisibility": "history_visibility" }
		}
	},
	"m.room.join_rules": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.joinRule"]
			}
		},
		"actionsValues": {
			"content": { "joinRule": "join_rule" }
		}
	},
	"m.room.member": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"state": true,
		"timeline": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [
					"calculate.updateMembers",
					"update.attr.membership",
					"add.attr.timeline"
				]
			},
			"users": {
				"ownerId": "attr.state_key",
				"actions": [
					"calculate.new",
					"update.content.name",
					"update.attr.id",
					"update.content.avatarUrl",
					"calculate.updateMemberships" 
				]
			},
			"events": {
				"ownerId": "attr.event_id"
			}
		},
		"actionsValues": { 
			"content": { "avatarUrl": "avatar_url", "name": "displayname" },
			"attr": { 
				"id": "state_key", 
				"membership": "roomType",
				"timeline": "event_id"
			}
		}
	},
	"m.room.message": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ageSorted": true,
		"timeline": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [ 
					"add.attr.messages", "add.attr.timeline", 
					"calculate.updateEventsByType",
					"calculate.updateMessagesByType",
					"calculate.synced"
				]
			},
			"events": {
				"ownerId": "attr.id",
				"actions": [ 
					"calculate.new", 
					"update.attr.userId",
					"update.attr.roomId",
					"update.attr.id",
					"calculate.updateByType",
					"calculate.updateMessagesByType",
				]
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": ["add.attr.messages"]
			}
		},
		"actionsValues": {
			"attr": { 
				"userId": "sender", "roomId": "roomId", 
				"messages": "event_id", "timeline": "event_id",
				"id": "event_id"
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
				"actions": ["update.content.name"]
			}
		},
		"actionsValues": { 
			"content": { "name": "name" }
		}
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
				"actions": [ 
					"new", "update.attr.targetEventId",
					"update.attr.userId", "update.attr.roomId",
					"update.attr.id",
					"calculate.updateRedactedEvent"
					],
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
		"actionsValues": { 
			"attr": { 
				"userId": "sender", "targetEventId": "event_id", 
				"messages": "event_id", "events": "event_id",
				"id": "event_id"
			},
		}
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
				"actions": [
					"calculate.new",
					"update.attr.roomId",
					"update.attr.id",
					"calculate.updateByType"
				],
			},
		},
		"actionsValues": {
			"attr": { "roomId": "roomId", "events": "event_id", "id": "event_id" }
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
				"actions": ["update.content.topic"]
			}
		},
		"actionsValues": { 
			"content": { "topic": "topic" }
		}
	},
	"m.tag": {
		"rootType": "rooms",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"users": {
				"ownerId": "attr.sender",
				"actions": ["calculate.tags"]
			}
		}
	},
	"m.typing": {
		"rootType": "rooms",
		"ephemeral": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.membersTyping"]
			}
		},
		"actionsValues": { 
			"content": { "membersTyping": "user_ids" }
		}
	},
	"org.matrix.room.color_scheme": {
		"rootType": "rooms",
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": {
				"ownerId": "attr.roomId",
				"actions": [ 
					"update.content.primaryColor",
					"update.content.secondaryColor"
				]
			}
		},
		"actionsValues": {
			"content": { 
				"primaryColor": "primary_color",
				"secondaryColor": "secondary_color" }
		}
	}
};

export default EVENTS;