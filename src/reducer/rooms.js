import {
	START_REQUEST_ROOM,
	FAILED_REQUEST_ROOM,
	CREATE_ROOM_SUCCESS,
	SET_ROOM,
	REMOVE_ROOM,
	UPDATE_ROOM,
	SET_MULTIPLE_ROOM,
	REMOVE_ROOM_SUCCESS
} from '../actions/rooms';

const initialState = {
	rooms: {},
	isLoading: false
};

const Rooms = function(state = initialState, action){
	let newState = null;
	switch(action.type){
		case START_REQUEST_ROOM:
		case CREATE_ROOM_SUCCESS:
		case FAILED_REQUEST_ROOM:
		case REMOVE_ROOM_SUCCESS:
			newState = {...state, ['isLoading']: action.payload.isLoading};
			return newState;
			break;
		case SET_ROOM:
			const currentRooms = {...state.rooms, [action.payload.id]: {...action.payload.room}};
			newState = {...state, ['rooms']: currentRooms};
			return newState;
			break;

		case SET_MULTIPLE_ROOM:
			newState = setRoomInLoop(state, action);
			return newState;
			break;

		case REMOVE_ROOM:
			newState = {...state};
			delete newState['rooms'][action.payload.room_id];
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

const setRoomInLoop = (state, action) => {
	let newState = {...state.rooms};

	action.payload.rooms.chunk.forEach((room) => {
		newState[room.room_id] = room;
	});

	newState = {...state, ['rooms']: {...newState}};

	return newState;
};

export default Rooms;