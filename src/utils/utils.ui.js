import _ from 'lodash';

export const getTranslation = (key) => {
    let translations = window.translations;
    return _.get(translations[translations.current], key, key)
};