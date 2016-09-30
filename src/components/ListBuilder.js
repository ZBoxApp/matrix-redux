import React, {Component} from 'react';
import { List, ListItem, ListDivider } from 'react-toolbox';
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
            const setSeparator = lists[index + 1] ? true : false;

            return (
                <div>
                    <ListItem
                        key={`${index}-room-${new Date().getTime()}`}
                        avatar={avatar}
                        caption={title}
                        rightIcon={unreadMsg}
                        legend={legend}
                        onClick={this.onClickChat.bind(this, index)}
                    />
                    {setSeparator && (
                        <ListDivider inset={true} />
                    )}
                </div>
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