import {connect} from 'react-redux'
import Chat from '../components/Chat';

const mapStateToProps = (state) => {
    return {
        error: state.error
    };
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Chat);