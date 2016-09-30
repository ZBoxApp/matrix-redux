import {connect} from 'react-redux'
import Room from '../components/Room';

const mapStateToProps = () => {
    return {};
};

const mapDispatchToProps = () => {
    return {
        onPickFile: (e) => {
            console.log('FROM OUTSIDE', e.target.files);
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);