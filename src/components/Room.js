import React, {Component} from 'react';
import {Layout, Panel, Input, FontIcon, IconButton, Button} from 'react-toolbox';
import Bubble from '../components/Bubble';
import FilePicker from '../components/FilePicker';
import ImageViewer from '../components/ImageViewer';
import Styles from '../sass/global/index.scss';

export default class Room extends Component {
    constructor(props) {
        super(props);

        this.onpick = this.onpick.bind(this);

        this.messages = [
            {
                id: 1,
                message: 'Estoy Cansado.',
                align: 'right'
            },
            {
                id: 1,
                message: 'React Native me tiene chato po.',
                align: 'right'
            },
            {
                id: 1,
                message: "I’ve been intrigued by CSS Modules lately. If you haven't heard of them, this post is for you. We'll be looking at the project and it's goals and aims. If you're intrigued, stay tuned, as the next post will be about how to get started using the idea. If you're looking to implement or level up your usage, part 3 will be about using them in a React environment",
                align: 'right'
            },
            {
                id: 1,
                message: 'React Native me tiene chato po.',
                align: 'right'
            },
            {
                id: 1,
                message: 'React Native me tiene chato po.',
                align: 'right'
            },
            {
                id: 2,
                message: 'Por que po weom ?',
                align: 'left'
            },
            {
                id: 1,
                message: 'Xuxa po ese react ctm me tiene la vida pa la cresta.',
                align: 'right'
            },
            {
                id: 2,
                message: 'Entonces aprendo Swift por wom.',
                align: 'left'
            },
            {
                id: 1,
                message: 'Ya me webio.',
                align: 'right'
            },
            {
                id: 2,
                message: 'Dale no mas.',
                align: 'left'
            }
        ];

        this.state = {
            messages: this.messages
        };
    }

    onpick (e) {
        const {messages} = this.state;

        messages.push({
                id: 1,
                message: 'imagen uploding',
                align: 'right',
                file: e.target.files[0]
            });

        this.setState({
            messages: messages
        });
    }

    render() {
        const {id} = this.props.params;
        const {onPickFile} = this.props;
        const {messages} = this.state;
        
        let last = null;
        const msg = messages.map((message, i) => {
            const id = message.id;
            const forwardId = messages[i + 1];
            const hasPointer = id && forwardId && id === forwardId.id ? false : true;
            last = message.id;
            let img = false;
            let image = null;
            if (message.file) {
                img = true;
                image = (<ImageViewer file={message.file} />);
            }
            return(
                <Bubble key={i} stickPointer={hasPointer} align={message.align}>
                    {image || message.message}
                </Bubble>
            );
        });

        return (
            <Layout>
                <Panel>
                    <section className={Styles.containerScrollable}>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                        {msg}
                    </section>

                    <section className={Styles.messageBox}>
                        <div contentEditable={true} data-placeholder={'Type your message...'} className={'writeBox'}></div>
                        <div className={'controls-box'}>
                            <div className={'flex'}>
                                <div>
                                    <FilePicker onPickFile={this.onpick}/>
                                </div>

                                <div>
                                    <Button icon={'send'} mini raised accent flat ripple>Enviar</Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </Panel>
            </Layout>
        );
    }
}