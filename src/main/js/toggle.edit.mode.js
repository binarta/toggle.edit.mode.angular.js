angular.module('toggle.edit.mode', ['notifications'])
    .service('editMode', ['$rootScope', 'ngRegisterTopicHandler', 'topicMessageDispatcher', EditModeService])
    .service('editModeRenderer', ['$rootScope', 'ngRegisterTopicHandler', EditModeRendererService])
    .directive('editModeRenderer', ['$compile', EditModeRendererFactory])
    .directive('toggleEditMode', ['$rootScope', 'editMode', ToggleEditModeDirectiveFactory])
    .directive('editModeOn', ['ngRegisterTopicHandler', EditModeOnDirectiveFactory])
    .directive('editModeOff', ['ngRegisterTopicHandler', EditModeOffDirectiveFactory]);

function EditModeService ($rootScope, ngRegisterTopicHandler, topicMessageDispatcher) {
    $rootScope.editing = false;
    var dirtyItems = [];

    this.enable = function () {
        $rootScope.editing = true;
        topicMessageDispatcher.firePersistently('edit.mode', true);
    };

    this.disable = function () {
        dirtyItems.length > 0 ? raiseLockedWarning() : disableEditMode();
    };

    function disableEditMode() {
        $rootScope.editing = false;
        topicMessageDispatcher.firePersistently('edit.mode', false);
    }

    function raiseLockedWarning() {
        topicMessageDispatcher.fire('edit.mode.locked', 'ok');
        topicMessageDispatcher.fire('system.warning', {
            code: 'edit.mode.locked',
            default: 'Warning. There are unsaved changes.'
        });
    }

    ngRegisterTopicHandler($rootScope, 'edit.mode.lock', function (topic) {
        if (dirtyItems.indexOf(topic) == -1) dirtyItems.push(topic);
    });

    ngRegisterTopicHandler($rootScope, 'edit.mode.unlock', function (topic) {
        var index = dirtyItems.indexOf(topic);
        if (index != -1) dirtyItems.splice(index, 1);
    });

    ngRegisterTopicHandler($rootScope, 'checkpoint.signout', function () {
        disableEditMode();
    });
}

function EditModeRendererService($rootScope, ngRegisterTopicHandler) {
    var self = this;

    this.open = function (args) {
        $rootScope.$broadcast('edit.mode.renderer', {
            open: true,
            ctx: args.ctx,
            template: args.template
        });
    };
    this.close = function () {
        $rootScope.$broadcast('edit.mode.renderer', {open: false});
    };

    ngRegisterTopicHandler($rootScope, 'edit.mode', function (enabled) {
        if (!enabled) self.close();
    });
}

function EditModeRendererFactory($compile) {
    return {
        restrict:'A',
        link: function (scope, el) {
            scope.$on('edit.mode.renderer', function (event, args) {
                if (args.open) {
                    scope.ctx = args.ctx;

                    el.html(args.template);
                    $compile(el.contents())(scope);
                }
            });
        }
    }
}

function ToggleEditModeDirectiveFactory($rootScope, editMode) {
    return {
        restrict: ['E', 'A'],
        scope: true,
        link: function (scope) {
            scope.toggleEditMode = function () {
                $rootScope.editing ? editMode.disable() : editMode.enable();
            };
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