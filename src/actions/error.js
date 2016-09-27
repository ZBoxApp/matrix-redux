/**
* ACTIONS FOR ERRORS
**/

export const SET_ERROR = 'SET_ERROR';
export const REMOVE_ERROR = 'REMOVE_ERROR';

const setError = (error) => {
	return {
		type: SET_ERROR,
		payload: {
			error
		}
	};
};

const removeError = (id) => {
	return {
		type: REMOVE_ERROR,
		payload: {
			id
		}
	};
};