import React, {Component} from 'react';
import { ProgressBar, AppBar, Layout, Panel, Drawer, Tab, Tabs, List, ListItem} from 'react-toolbox';
import ListBuilt from './ListBuilder';
import Styles from '../sass/chat/chat';

export default class Chat extends Component {
    constructor(props) {
        super(props);

        this.state = {
            index: 0,
            showMenu: false
        };

        this.onChangeTab = this.onChangeTab.bind(this);
    }

    onChangeTab(index) {
        this.setState({
            index
        });
    }

    render() {
        const {index, show} = this.state;

        const lists = [
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/m.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'David'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Gustavo'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/m.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Patolin',
                lastMessage: 'star'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Andres'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/o.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Andres'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes de Miguel...',
                title: 'Miguel'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/m.jpg',
                legend: 'Tenes nuevos mensajes Lilian...',
                title: 'Lilian'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Andres'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/o.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Andres'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes de Miguel...',
                title: 'Miguel'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/m.jpg',
                legend: 'Tenes nuevos mensajes Lilian...',
                title: 'Lilian'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Andres'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/o.jpg',
                legend: 'Tenes nuevos mensajes...',
                title: 'Andres'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/r.jpg',
                legend: 'Tenes nuevos mensajes de Miguel...',
                title: 'Miguel'
            },
            {
                avatar: 'https://dl.dropboxusercontent.com/u/2247264/assets/m.jpg',
                legend: 'Tenes nuevos mensajes Lilian...',
                title: 'Lilian'
            }
        ];

        return (
            <Layout>
                <Panel>
                    <section className={Styles.containerChats}>
                        <Tabs index={index} onChange={this.onChangeTab} fixed>
                            <Tab label={'Chats'}>
                                <ListBuilt lists={lists}/>
                            </Tab>
                            <Tab label={'Contacts'}>
                                <h1>Contacts</h1>
                            </Tab>
                        </Tabs>
                    </section>
                </Panel>
            </Layout>
        );
    }
};