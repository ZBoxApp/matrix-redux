/**
* ACTIONS FOR ERRORS
**/

export const SET_ERROR = 'SET_ERROR';
export const REMOVE_ERROR = 'REMOVE_ERROR';

export const setError = (error) => {
	const payload = error;
	return {
		type: SET_ERROR,
		payload: payload
	};
};

export const removeError = (id) => {
	return {
		type: REMOVE_ERROR,
		payload: {
			id
		}
	};
};
