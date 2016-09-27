import {
	START_REQUEST_ROOM,
	FAILED_REQUEST_ROOM,
	ROOM_CREATED,
	SET_ROOM,
	REMOVE_ROOM,
	UPDATE_ROOM
} from '../actions/rooms';

const initialState = {
	rooms: {},
	isLoading: false
};

const Rooms = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case START_REQUEST_ROOM:
		case ROOM_CREATED:
		case FAILED_REQUEST_ROOM:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;
		case SET_ROOM:
			newState = {...state.rooms, [action.payload.id]: action.payload.id};
			return newState;
			break;

		case REMOVE_ROOM:
			newState = {...state};
			delete newState['rooms'][action.payload.id];
			return newState;
			break;

		case UPDATE_ROOM:
			newState = {...state.error, [action.payload.id]: action.payload.room};
			return newState;
			break;

		default:
			return state;
			break;
	};
};

export default Rooms;