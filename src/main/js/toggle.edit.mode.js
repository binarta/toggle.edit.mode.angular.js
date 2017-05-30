angular.module('toggle.edit.mode', ['notifications', 'binarta-checkpointjs-angular1'])
    .service('editMode', ['$rootScope', 'ngRegisterTopicHandler', 'topicMessageDispatcher', 'binarta', EditModeService])
    .service('editModeRenderer', ['$rootScope', 'ngRegisterTopicHandler', EditModeRendererService])
    .directive('editModeRenderer', ['$compile', '$templateCache', EditModeRendererDirective])
    .directive('toggleEditMode', ['$rootScope', 'editMode', ToggleEditModeDirectiveFactory])
    .directive('editModeOn', ['ngRegisterTopicHandler', EditModeOnDirectiveFactory])
    .directive('editModeOff', ['ngRegisterTopicHandler', EditModeOffDirectiveFactory])
    .run(['$rootScope', 'editMode', 'binarta', function ($rootScope, editMode, binarta) {
        binarta.checkpoint.profile.eventRegistry.add({
            signedin: function () {
                if (binarta.checkpoint.profile.hasPermission('edit.mode'))
                    editMode.enable();
            },
            signedout: function () {
                editMode.disable();
            }
        });
    }]);

function EditModeService($rootScope, ngRegisterTopicHandler, topicMessageDispatcher, binarta) {
    $rootScope.editing = false;
    var dirtyItems = [];

    this.enable = function () {
        if (!$rootScope.editing) {
            $rootScope.editing = true;
            topicMessageDispatcher.firePersistently('edit.mode', true);
        }
    };

    this.disable = function () {
        dirtyItems.length > 0 ? raiseLockedWarning() : disableEditMode();
    };

    this.bindEvent = function (ctx) {
        ngRegisterTopicHandler(ctx.scope, 'edit.mode', function (editModeActive) {
            if (binarta.checkpoint.profile.hasPermission(ctx.permission || 'edit.mode'))
                bind(editModeActive);
            else
                unbind();
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
        args.id = args.id || 'main';
        destroyScope(args.id);
        scopes[args.id] = args.scope;
        args.open = true;
        $rootScope.$broadcast('edit.mode.renderer', args);
    };
    this.close = function (args) {
        var id = args && args.id ? args.id : 'main';
        destroyScope(id);
        $rootScope.$broadcast('edit.mode.renderer', {
            id: id,
            open: false
        });
    };

    function destroyScope(id) {
        if (scopes[id]) {
            scopes[id].$destroy();
            delete scopes[id];
        }
    }

    ngRegisterTopicHandler($rootScope, 'edit.mode', function (enabled) {
        if (!enabled) self.close();
    });
}

function EditModeRendererDirective($compile, $templateCache) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs) {
            scope.$on('edit.mode.renderer', function (event, args) {
                if ((args.id || 'main') == (attrs.editModeRenderer || 'main')) {
                    if (args.open) {
                        el.html(args.templateUrl ? $templateCache.get(args.templateUrl) : args.template);
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
        restrict: 'EA',
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