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
//  - calculate.new: Add a new resource to the reducer
//  - add.attrName: add the value to this attr,
//  - remove.attrName: the value to this attr,
//  - update.attrName: replace the value of this attr,
//  - set.attrName: set the value. Inmutable
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
		"state": true,
		"reducers": {
			"users": { "ownerId": "attr.currentUserId" }
		}
	},
	"m.receipt": {
		"rootType": "rooms",
		"ownerId": "calculate.ownerId",
		"ephemeral": true,
		"embedded": true,
		"embeddedTypes": ["m.read"],
		"reducers": {
			"events": { 
				"ownerId": "calculate.ownerId",
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
			"content": { "canonical_alias": "canonical_alias" }
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
				"actions": [ "calculate.new", "set.content.creatorId" ],
			}
		},
		"actionsValues": { 
			"content": { "creatorId": "creator" }
		}
	},
	"m.room.guest_access": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ephemeral": true,
		"state": true,
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
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["update.content.historyVisibility"]
			}
		},
		"actionsValues": { 
			"content": { "historyVisibility": "history_visibilty" }
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
		"ephemeral": true,
		"state": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": ["calculate.updateMembers"]
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": [
					"calculate.new",
					"update.content.name",
					"update.content.avatarUrl",
					"calculate.updateMemberships" 
				]
			}
		},
		"actionsValues": { 
			"content": { "avatarUrl": "url", "name": "displayname" }
		}
	},
	"m.room.message": {
		"rootType": "rooms",
		"idAttr": "attr.event_id",
		"ageSorted": true,
		"reducers": {
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [ 
					"add.messages", "add.events", 
					"calculate.updateEventsByType",
					"calculate.updateMessagesByType"
				]
			},
			"events": {
				"ownerId": "attr.id",
				"actions": [ 
					"new", 
					"set.attr.userId",
					"set.attr.roomId",
					"calculate.updateByType",
					"calculate.updateMessagesByType"
				]
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": ["add.messages"]
			}
		},
		"actionsValues": {
			"attr": { "userId": "sender", "roomId": "roomId" }
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
					"new", "set.attr.targetEventId",
					"set.attr.userId", "set.attr.roomId",
					"calculate.updateRedactedEvent"
					],
			},
			"users": {
				"ownerId": "attr.sender",
				"actions": ["add.messages"]
			},
			"rooms": { 
				"ownerId": "attr.roomId",
				"actions": [ 
					"add.messages", "add.events", 
					"calculate.updateEventsByType"
				]
			},
		},
		"actionsValues": { 
			"attr": { "userId": "sender", "targetEventId": "event_id" },
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
				"actions": [ "add.events", "calculate.updateEventsByType" ]
			},
			"events": {
				"ownerId": "attr.id",
				"actions": [
					"calculate.new",
					"set.attr.roomId",
					"calculate.updateByType"
				],
			},
		},
		"actionsValues": {
			"attr": { "roomId": "roomId" }
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
			"attr": { "topic": "topic" }
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
			"content": { "user_ids": "membersTyping" }
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