import React, {Component} from 'react';
import { List, ListItem, ListSubHeader, ListDivider, ListCheckbox } from 'react-toolbox';
import {browserHistory} from 'react-router';


export default class CustomListItem extends Component {
    constructor(props) {
        super(props);
    }

    onClickChat(room_id) {
        browserHistory.push(`/room/${room_id}`);
    }

    buildList(lists) {
        const _lists = lists.map((list, index) => {
            const avatar = list.avatar || 'url-to-default-avatar';
            const title = list.title || 'Untitle';
            const unreadMsg = list.lastMessage || '';
            const legend = list.legend || 'Mensaje nuevo...';

            return (
                <ListItem
                    key={`${index}-room-${new Date().getTime()}`}
                    avatar={avatar}
                    caption={title}
                    rightIcon={unreadMsg}
                    legend={legend}
                    onClick={this.onClickChat.bind(this, index)}
                />
            );
        });

        return _lists;
    }

    render() {
        const {lists} = this.props;
        const _lists = this.buildList(lists);

        return (
            <List ripple>
                {_lists}
            </List>
        );
    }
};