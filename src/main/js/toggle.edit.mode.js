/*
 * THIS COPYRIGHT INFORMATION/AGREEMENT/TERMS AND CONDITIONS
 * MUST REMAIN INTACT AND MAY NOT BE MODIFIED IN ANY WAY.
 *
 * COPYRIGHT © thinkerIT BVBA
 * ALL RIGHTS RESERVED
 * http://thinkerit.be/conditions
 */

angular.module('toggle.edit.mode', [])
    .directive('toggleEditMode', ToggleEditModeDirectiveFactory);

function ToggleEditModeDirectiveFactory(topicMessageDispatcher, topicRegistry) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/partials/toggle-edit-mode.html',
        link: function (scope) {
            scope.editMode = false;

            scope.toggleEditMode = function () {
                scope.editMode = !scope.editMode;
                topicMessageDispatcher.firePersistently('edit.mode', scope.editMode);
            };

            topicRegistry.subscribe('checkpoint.signout', function () {
                if (scope.editMode) {
                    scope.toggleEditMode();
                }
            });
        }
    };
}