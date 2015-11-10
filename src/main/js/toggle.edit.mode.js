angular.module('toggle.edit.mode', ['notifications', 'checkpoint'])
    .service('editMode', ['$rootScope', 'ngRegisterTopicHandler', 'topicMessageDispatcher', 'activeUserHasPermission', EditModeService])
    .service('editModeRenderer', ['$rootScope', 'ngRegisterTopicHandler', EditModeRendererService])
    .directive('editModeRenderer', ['$compile', EditModeRendererDirective])
    .directive('toggleEditMode', ['$rootScope', 'editMode', ToggleEditModeDirectiveFactory])
    .directive('editModeOn', ['ngRegisterTopicHandler', EditModeOnDirectiveFactory])
    .directive('editModeOff', ['ngRegisterTopicHandler', EditModeOffDirectiveFactory])
    .run(['$rootScope', 'activeUserHasPermission', 'editMode', function ($rootScope, activeUserHasPermission, editMode) {
        activeUserHasPermission({
            yes: function () {
                editMode.enable();
            },
            scope: $rootScope
        }, 'edit.mode');
    }]);

function EditModeService($rootScope, ngRegisterTopicHandler, topicMessageDispatcher, activeUserHasPermission) {
    $rootScope.editing = false;
    var dirtyItems = [];

    this.enable = function () {
        $rootScope.editing = true;
        topicMessageDispatcher.firePersistently('edit.mode', true);
    };

    this.disable = function () {
        dirtyItems.length > 0 ? raiseLockedWarning() : disableEditMode();
    };

    this.bindEvent = function (ctx) {
        ngRegisterTopicHandler(ctx.scope, 'edit.mode', function (editModeActive) {
            activeUserHasPermission({
                no: function () {
                    unbind();
                },
                yes: function () {
                    bind(editModeActive);
                },
                scope: ctx.scope
            }, ctx.permission);
        });

        function bind(editModeActive) {
            ctx.element.addClass('bin-editable');

            if (editModeActive) {
                ctx.element.bind("click", function () {
                    $rootScope.$apply(ctx.onClick());
                    return false;
                });
            } else {
                unbind();
            }
        }

        function unbind() {
            ctx.element.removeClass('bin-editable');
            ctx.element.unbind("click");
        }
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
    var scopes = {};

    this.open = function (args) {
        var id = args.id || 'main';
        scopes[id] = args.scope;
        $rootScope.$broadcast('edit.mode.renderer', {
            id: id,
            open: true,
            scope: args.scope,
            template: args.template
        });
    };
    this.close = function (args) {
        var id = args && args.id ? args.id : 'main';
        if (scopes[id]) scopes[id].$destroy();
        $rootScope.$broadcast('edit.mode.renderer', {
            id: id,
            open: false
        });
    };

    ngRegisterTopicHandler($rootScope, 'edit.mode', function (enabled) {
        if (!enabled) self.close();
    });
}

function EditModeRendererDirective($compile) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            scope.$on('edit.mode.renderer', function (event, args) {
                if((args.id || 'main') == (attrs.editModeRenderer || 'main')) {
                    if (args.open) {
                        el.html(args.template);
                        $compile(el.contents())(args.scope);
                    } else {
                        el.html('');
                    }
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
        restrict: 'A',
        link: function (scope, el, attrs) {
            ngRegisterTopicHandler(scope, 'edit.mode', function (editMode) {
                if (editMode) scope.$eval(attrs.editModeOn);
            });
        }
    }
}

function EditModeOffDirectiveFactory(ngRegisterTopicHandler) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            ngRegisterTopicHandler(scope, 'edit.mode', function (editMode) {
                if (!editMode) scope.$eval(attrs.editModeOff);
            });
        }
    }
}