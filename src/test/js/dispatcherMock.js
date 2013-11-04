angular.module('dispatcher', [])
    .factory('topicMessageDispatcher', function(topicMessageDispatcherHelper) {
        return {firePersistently: function(topic, message){
            topicMessageDispatcherHelper[topic] = message;
        }};
    })
    .factory('topicMessageDispatcherHelper', function() {
        return {};
    });