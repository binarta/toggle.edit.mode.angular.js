angular.module('toggle.edit.mode', ['notifications'])
    .directive('toggleEditMode', ['topicMessageDispatcher', 'topicRegistry', '$timeout', ToggleEditModeDirectiveFactory]);

function ToggleEditModeDirectiveFactory(topicMessageDispatcher, topicRegistry) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/partials/toggle-edit-mode.html',
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