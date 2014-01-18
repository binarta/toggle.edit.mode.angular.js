angular.module('toggle.edit.mode', ['notifications'])
    .directive('toggleEditMode', ['topicMessageDispatcher', 'topicRegistry', '$timeout', ToggleEditModeDirectiveFactory]);

function ToggleEditModeDirectiveFactory(topicMessageDispatcher, topicRegistry) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/partials/toggle-edit-mode.html',
        link: function (scope) {
            scope.editMode = false;
            scope.dirtyItems = 0;

            scope.toggleEditMode = function () {
                scope.dirtyItems > 0 ? raiseLockedWarning() : toggleEditMode();
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
                if (scope.editMode) {
                    if (topic == 'add') scope.dirtyItems++;
                    if (topic == 'remove') scope.dirtyItems--;
                }
            });
        }
    };
}