import {connect} from 'react-redux'
import {makeLogin} from '../actions/login';
import Login from '../components/Login';

const mapStateToProps = (state) => {
    return {
        error: state.error
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        login: (username, password) => {
            return dispatch(makeLogin(username, password));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);