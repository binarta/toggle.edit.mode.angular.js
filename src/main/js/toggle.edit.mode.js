angular.module('toggle.edit.mode', ['notifications'])
    .directive('toggleEditMode', ['topicMessageDispatcher', 'ngRegisterTopicHandler', 'config', '$rootScope', ToggleEditModeDirectiveFactory])
    .directive('editModeOn', ['ngRegisterTopicHandler', EditModeOnDirectiveFactory])
    .directive('editModeOff', ['ngRegisterTopicHandler', EditModeOffDirectiveFactory]);

function ToggleEditModeDirectiveFactory(topicMessageDispatcher, ngRegisterTopicHandler, config, $rootScope) {
    var componentsDir = config.componentsDir || 'bower_components';

    return {
        restrict: 'E',
        scope: {},
        templateUrl: componentsDir + '/binarta.toggle.edit.mode.angular/template/toggle-edit-mode.html',
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
                $rootScope.editing = scope.editMode;
            }

            ngRegisterTopicHandler(scope, 'checkpoint.signout', function () {
                if (scope.editMode) {
                    scope.toggleEditMode();
                }
            });

            ngRegisterTopicHandler(scope, 'edit.mode.lock', function (topic) {
                if (scope.dirtyItems.indexOf(topic) == -1) scope.dirtyItems.push(topic);
            });

            ngRegisterTopicHandler(scope, 'edit.mode.unlock', function (topic) {
                var index = scope.dirtyItems.indexOf(topic);
                if (index != -1) scope.dirtyItems.splice(index, 1);
            });
        }
    };
}

function EditModeOnDirectiveFactory(ngRegisterTopicHandler) {
    return {
        restrict:'A',
        link: function(scope, el, attrs) {
            ngRegisterTopicHandler(scope, 'edit.mode', function (editMode) {
                if (editMode) scope.$eval(attrs.editModeOn);
            });
        }
    }
}

function EditModeOffDirectiveFactory(ngRegisterTopicHandler) {
    return {
        restrict:'A',
        link: function(scope, el, attrs) {
            ngRegisterTopicHandler(scope, 'edit.mode', function (editMode) {
                if (!editMode) scope.$eval(attrs.editModeOff);
            });
        }
    }
}