import React, {Component} from 'react';
import {IconButton} from 'react-toolbox';

export default class FilePicker extends Component {
    constructor(props) {
        super(props);

        this.id = `file-${new Date().getTime()}`;

        this.pickFile = this.pickFile.bind(this);
        this.onFilePick = this.onFilePick.bind(this);
    }

    onFilePick(e) {
        const {onPickFile} = this.props;

        if (onPickFile && typeof onPickFile === 'function') {
            onPickFile(e);
        }
    }

    pickFile() {
        const picker = this.refs[this.id];
        picker.click();
    }

    render () {
        const {icon, accent, pickMultipleFiles} = this.props;
        const attrs = {};

        if (pickMultipleFiles) {
            attrs.multiple = 'miltiple'
        }

        return (
            <label htmlFor={this.id}>
                <IconButton icon={icon} accent={accent} ripple onMouseUp={this.pickFile} />
                <input type="file" style={{display: 'none'}} id={this.id} ref={this.id} onChange={this.onFilePick} {...attrs} />
            </label>
        );
    };
};

FilePicker.propTypes = {
    icon: React.PropTypes.string,
    accent: React.PropTypes.bool,
    onPickFile: React.PropTypes.func,
    pickMultipleFiles: React.PropTypes.bool
};

FilePicker.defaultProps = {
    icon: 'attach_file',
    accent: true,
    pickMultipleFiles: false
};