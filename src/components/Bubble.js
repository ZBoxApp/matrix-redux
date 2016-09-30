import React, {Component} from 'react';
import Styles from '../sass/bubble/bubble';

export default class Bubble extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {align, children, stickPointer} = this.props;
        const hasPointer = stickPointer ? 'last-active' : '';

        return (
            <div className={Styles.bubbleWrap}>
                <div className={`bubble bubble-${align} ${hasPointer}`}>
                    {children}
                </div>
            </div>
        );
    }
};

Bubble.propTypes = {
    align: React.PropTypes.oneOf(['left', 'right']),
    bgColor: React.PropTypes.string,
    children: React.PropTypes.any,
    stickPointer: React.PropTypes.bool
};

Bubble.defaultProps = {
    align: 'right',
    stickPointer: false
};