angular.module('toggle.edit.mode', ['notifications'])
    .directive('toggleEditMode', ['topicMessageDispatcher', 'topicRegistry', '$rootScope', ToggleEditModeDirectiveFactory])
    .directive('editModeOn', ['topicRegistry', EditModeOnDirectiveFactory])
    .directive('editModeOff', ['topicRegistry', EditModeOffDirectiveFactory]);

function ToggleEditModeDirectiveFactory(topicMessageDispatcher, topicRegistry, $rootScope) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: function() {
            return $rootScope.toggleEditModeTemplateUrl ? $rootScope.toggleEditModeTemplateUrl : 'app/partials/toggle-edit-mode.html';
        },
        link: function (scope) {
            scope.editMode = false;
            scope.dirtyItems = [];

            scope.toggleEditMode = function () {
                scope.dirtyItems.length > 0 ? raiseLockedWarning() : toggleEditMode();
            };

            function raiseLockedWarning() {
                topicMessageDispatcher.fire('edit.mode.locked', 'ok');
                topicMessageDispatcher.fire('system.warning', {
                    code: 'edit.mode.locked',
                    default: 'Warning. There are unsaved changes.'
                });
            }

            function toggleEditMode() {
                scope.editMode = !scope.editMode;
                topicMessageDispatcher.firePersistently('edit.mode', scope.editMode);
            }

            topicRegistry.subscribe('checkpoint.signout', function () {
                if (scope.editMode) {
                    scope.toggleEditMode();
                }
            });

            topicRegistry.subscribe('edit.mode.lock', function (topic) {
                if (scope.dirtyItems.indexOf(topic) == -1) scope.dirtyItems.push(topic);
            });

            topicRegistry.subscribe('edit.mode.unlock', function (topic) {
                var index = scope.dirtyItems.indexOf(topic);
                if (index != -1) scope.dirtyItems.splice(index, 1);
            });
        }
    };
}

function EditModeOnDirectiveFactory(topicRegistry) {
    return {
        restrict:'A',
        link: function(scope, el, attrs) {
            var handler = function (editMode) {
                if (editMode) scope.$eval(attrs.editModeOn);
            };
            topicRegistry.subscribe('edit.mode', handler);
            scope.$on('$destroy', function() {
                topicRegistry.unsubscribe('edit.mode', handler);
            });
        }
    }
}

function EditModeOffDirectiveFactory(topicRegistry) {
    return {
        restrict:'A',
        link: function(scope, el, attrs) {
            var handler = function (editMode) {
                if (!editMode) scope.$eval(attrs.editModeOff);
            };
            topicRegistry.subscribe('edit.mode', handler);
            scope.$on('$destroy', function() {
                topicRegistry.unsubscribe('edit.mode', handler);
            });
        }
    }
}