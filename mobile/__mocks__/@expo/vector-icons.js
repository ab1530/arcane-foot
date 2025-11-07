const React = require('react');
const { Text } = require('react-native');

const createIcon = (defaultName) => ({ name, testID, ...rest }) =>
  React.createElement(Text, { testID, ...rest }, name || defaultName);

module.exports = {
  Ionicons: createIcon('Ionicons'),
  MaterialIcons: createIcon('MaterialIcons'),
  Entypo: createIcon('Entypo'),
};
