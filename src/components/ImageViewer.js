import React, {Component} from 'react';
import {ProgressBar, Button} from 'react-toolbox';
import Style from '../sass/imageViewer/imageViewer.scss';

export default class ImageViewer extends Component {
    constructor(props) {
        super(props);

        this.id = `viewer-${new Date().getTime()}`;

        this.onLoadViewer = this.onLoadViewer.bind(this);

        this.state = {
            isLoading: false,
            isLoaded: false,
            isFailed: false,
            base64: null
        }
    }

    componentDidMount() {
        this.onLoadViewer();
    }

    onLoadViewer() {
        const {file, onError, onStart, onEnd, onProgress, onLoad} = this.props;
        const that = this;

        if (!file) {
            return null;
        }

        var currentFile = file;

        const reader = new FileReader();

        reader.onloadstart = (e) => {
            that.setState({
                isLoading: true
            });

            if (onStart && typeof onStart === 'function') {
                onStart(e);
            }
        };

        reader.onloadend = (e) => {
            that.setState({
                isLoading: false,
                isLoaded: true
            });

            if (onEnd && typeof onEnd === 'function') {
                onEnd(e);
            }
        };

        reader.onerror = (e) => {

            that.setState({
                isLoading: false,
                isFailed: true
            });

            if (onError && typeof onError === 'function') {
                onError(e);
            }
        };

        reader.onprogress = (e) => {
            if (onProgress && typeof onProgress === 'function') {
                onProgress(e);
            }
        };

        reader.onload = ((f) => {
            return (e) => {
                const base64 = e.target.result;

                that.setState({
                    base64
                });

                if(onLoad && typeof onLoad === 'function') {
                    onLoad(e);
                }
            };
        })(currentFile);

        // exec default func

        reader.readAsDataURL(currentFile);
    }

    render () {
        const {file, canDownload, posCaption, caption} = this.props;
        const {isLoading, base64, isLoaded, isFailed} = this.state;

        if (!file && !Object.keys(file).length) {
            return <span/>;
        }

        const downloadPos = posCaption === 'top' ? 'bottom' : 'top';

        return(
            <span>
                {isLoading && !isLoaded && (
                    <ProgressBar type={'circular'} mode={'indeterminate'} />
                )}

                {!isLoading && isLoaded && (
                    <div className={'viewerBox'}>
                        <img src={base64} alt="" ref={this.id} className={'imageViewer'} download="download"/>

                        {(file.name || caption) && (
                            <span className={`caption-viewer ${posCaption}`}>
                                {caption || file.name}
                            </span>
                        )}

                        {canDownload && (
                            <span className={`caption-viewer ${downloadPos}`}>
                                <Button icon={'file_download'} label={'Descargar'} href={base64} download={file.name} inverse />
                            </span>
                        )}
                    </div>
                )}
            </span>
        );
    }
}

ImageViewer.propTypes = {
    file: React.PropTypes.object,
    canDownload: React.PropTypes.bool,
    onError: React.PropTypes.func,
    onStart: React.PropTypes.func,
    onEnd: React.PropTypes.func,
    onProgress: React.PropTypes.func,
    onLoad: React.PropTypes.func,
    onRetry: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    onDelete: React.PropTypes.func,
    caption: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.node
    ]),
    posCaption: React.PropTypes.oneOf([
        'top',
        'bottom'
    ])
};

ImageViewer.defaultProps = {
    file: {},
    isUploaded: false,
    isFailed: false,
    canDownload: true,
    caption: '',
    posCaption: 'top'
};