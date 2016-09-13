describe('toggle.edit.mode', function () {
    beforeEach(module('binartajs-angular1-spec'));
    beforeEach(module('toggle.edit.mode'));

    describe('editMode service', function () {
        var binarta, editMode, $rootScope, registry, topics;

        beforeEach(inject(function (_binarta_, _editMode_, _$rootScope_, topicRegistryMock, topicMessageDispatcherMock) {
            binarta = _binarta_;
            editMode = _editMode_;
            $rootScope = _$rootScope_;
            registry = topicRegistryMock;
            topics = topicMessageDispatcherMock;

            binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p'});
        }));
        afterEach(function() {
            binarta.checkpoint.gateway.removePermission('edit.mode');
        });

        describe('on run', function () {
            beforeEach(function() {
                binarta.checkpoint.profile.refresh();
            });

            it('check for permission', function () {
                expect($rootScope.editing).toEqual(false);
            });

            describe('when user has edit.mode permission', function () {
                beforeEach(function () {
                    binarta.checkpoint.gateway.addPermission('edit.mode');
                    binarta.checkpoint.profile.refresh();
                });

                it('enable edit mode', function () {
                    expect($rootScope.editing).toEqual(true);
                    expect(topics.persistent['edit.mode']).toEqual(true);
                });
            });
        });

        describe('edit mode is not enabled', function () {
            it('service exists', function () {
                expect(editMode).toBeDefined();
            });

            it('editing is not enabled', function () {
                expect($rootScope.editing).toEqual(false);
            });

            describe('enable edit mode', function () {
                beforeEach(function () {
                    editMode.enable();
                });

                it('editing is on rootScope', function () {
                    expect($rootScope.editing).toEqual(true);
                });

                it('raise toggle edit mode enabled', function () {
                    expect(topics.persistent['edit.mode']).toEqual(true);
                });
            });

            describe('disable edit mode', function () {
                beforeEach(function () {
                    editMode.enable();
                });

                it('raise toggle edit mode disabled', function () {
                    editMode.disable();

                    expect(topics.persistent['edit.mode']).toEqual(false);
                });

                describe('when there are dirty items', function () {
                    beforeEach(function () {
                        registry['edit.mode.lock']('item-1');

                        editMode.disable();
                    });

                    it('raise a warning notification', function () {
                        expect(topics['system.warning']).toEqual({
                            code: 'edit.mode.locked',
                            default: 'Warning. There are unsaved changes.'
                        });
                    });


                    it('raise edit mode lock is locked', function () {
                        expect(topics['edit.mode.locked']).toEqual('ok');
                    });
                });
            });

            describe('when edit mode enabled and checkpoint.signout received', function () {
                beforeEach(function () {
                    editMode.enable();
                });

                it('disable edit mode', function () {
                    registry['checkpoint.signout']();

                    expect($rootScope.editing).toEqual(false);
                    expect(topics.persistent['edit.mode']).toEqual(false);
                });
            });

            describe('when edit.mode.unlock received', function () {
                beforeEach(function () {
                    editMode.enable();

                    registry['edit.mode.lock']('item-1');

                    registry['edit.mode.unlock']('item-1');
                });

                it('can disable', function () {
                    editMode.disable();

                    expect($rootScope.editing).toEqual(false);
                });

            });

            describe('bind click event on element', function () {
                var scope, element, onClick;

                beforeEach(function () {
                    scope = $rootScope.$new();
                    element = jasmine.createSpyObj('element', ['bind', 'unbind', 'addClass', 'removeClass']);
                    onClick = jasmine.createSpy('callback');

                    editMode.bindEvent({
                        scope: scope,
                        permission: 'permission',
                        element: element,
                        onClick: onClick
                    });
                });

                describe('when active user has no permission', function () {
                    beforeEach(function () {
                        registry['edit.mode'](true);
                        binarta.checkpoint.profile.refresh();
                    });

                    it('unbind click event', function () {
                        expect(element.unbind).toHaveBeenCalledWith('click');
                    });

                    it('remove editable class', function () {
                        expect(element.removeClass).toHaveBeenCalledWith('bin-editable');
                    });
                });

                describe('when active user has permission', function () {
                    describe('and edit.mode inactive received', function () {
                        beforeEach(function () {
                            binarta.checkpoint.gateway.addPermission('edit.mode');
                            binarta.checkpoint.profile.refresh();
                            registry['edit.mode'](false);
                        });

                        it('unbind click event', function () {
                            expect(element.unbind).toHaveBeenCalledWith('click');
                        });

                        it('remove editable class', function () {
                            expect(element.removeClass).toHaveBeenCalledWith('bin-editable');
                        });
                    });

                    describe('and edit.mode active received', function () {
                        beforeEach(function () {
                            binarta.checkpoint.gateway.addPermission('edit.mode');
                            binarta.checkpoint.profile.refresh();
                            registry['edit.mode'](true);
                        });

                        it('bind click event', function () {
                            expect(element.bind.calls.first().args[0]).toEqual('click');
                        });

                        it('add editable class', function () {
                            expect(element.addClass).toHaveBeenCalledWith('bin-editable');
                        });

                        describe('element is clicked', function () {
                            var propagate;

                            beforeEach(function () {
                                propagate = element.bind.calls.first().args[1]();
                            });

                            it('execute callback', function () {
                                expect(onClick).toHaveBeenCalled();
                            });

                            it('do not propagate click event', function () {
                                expect(propagate).toEqual(false);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('editModeRenderer service', function () {
        var editModeRenderer, registry, scope, rendererScope, argsSpy;

        beforeEach(inject(function (_editModeRenderer_, topicRegistryMock, $rootScope) {
            editModeRenderer = _editModeRenderer_;
            registry = topicRegistryMock;
            scope = $rootScope.$new();
            rendererScope = $rootScope.$new();
            argsSpy = {};
            scope.$on('edit.mode.renderer', function (event, args) {
                argsSpy = args;
            });
        }));

        it('service exists', function () {
            expect(editModeRenderer).toBeDefined();
        });

        describe('on open', function () {
            beforeEach(function () {
                editModeRenderer.open({
                    scope: rendererScope,
                    template: 'template'
                });
            });

            it('edit.mode.renderer is broadcast on rootScope with default id', function () {
                expect(argsSpy).toEqual({
                    id: 'main',
                    open: true,
                    scope: rendererScope,
                    template: 'template'
                });
            });

            describe('on close', function () {
                var destroyed;

                beforeEach(function () {
                    rendererScope.$on('$destroy', function () {
                        destroyed = true;
                    });

                    editModeRenderer.close();
                });

                it('edit.mode.renderer is broadcasted on rootScope with default id', function () {
                    expect(argsSpy).toEqual({
                        id: 'main',
                        open: false
                    });
                });

                it('renderer scope is destroyed', function () {
                    expect(destroyed).toBeTruthy();
                });
            });

            describe('on edit.mode event', function () {
                beforeEach(function () {
                    registry['edit.mode'](false);
                });

                it('close main renderer', function () {
                    expect(argsSpy).toEqual({
                        id: 'main',
                        open: false
                    });
                });
            });
        });

        describe('on open with templateUrl', function () {
            beforeEach(function () {
                editModeRenderer.open({
                    scope: rendererScope,
                    templateUrl: 'template.html'
                });
            });

            it('edit.mode.renderer is broadcast on rootScope with default id', function () {
                expect(argsSpy).toEqual({
                    id: 'main',
                    open: true,
                    scope: rendererScope,
                    templateUrl: 'template.html'
                });
            });
        });

        it('open specific panel', function () {
            editModeRenderer.open({
                id: 'C',
                scope: rendererScope,
                template: 'template'
            });
            expect(argsSpy).toEqual({
                id: 'C',
                open: true,
                scope: rendererScope,
                template: 'template'
            });
        });

        describe('on close without scope', function () {
            beforeEach(function () {
                editModeRenderer.close();
            });

            it('edit.mode.renderer is broadcast on rootScope with default id', function () {
                expect(argsSpy).toEqual({
                    id: 'main',
                    open: false
                });
            });
        });

        it('close specific panel', function () {
            editModeRenderer.close({id: 'C'});
            expect(argsSpy).toEqual({
                id: 'C',
                open: false
            });
        });
    });

    describe('editModeRenderer directive', function () {
        var scope, $rootScope, element, compileMock;

        beforeEach(inject(function (_$rootScope_, $compile, $templateCache) {
            $templateCache.put('test.html', 'from templateCache: {{key}}');

            element = angular.element('<div edit-mode-renderer></div>');
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            $compile(element)(scope);
        }));

        describe('when edit.mode.renderer is opened with scope', function () {
            var newScope;

            beforeEach(function () {
                newScope = $rootScope.$new();
                newScope.key = 'value to test';
            });

            describe('open', function () {
                beforeEach(function () {
                    $rootScope.$broadcast('edit.mode.renderer', {
                        id: 'main',
                        open: true,
                        scope: newScope,
                        template: '<p>{{key}}</p>'
                    });
                    newScope.$digest();
                });

                it('element is compiled', function () {
                    expect(element.html()).toContain('value to test');
                });

                describe('when edit.mode.renderer is closed', function () {
                    beforeEach(function () {
                        $rootScope.$broadcast('edit.mode.renderer', {
                            id: 'main',
                            open: false
                        });
                    });

                    it('element is removed', function () {
                        expect(element.html()).toEqual('');
                    });
                });
            });

            describe('prefer templateUrl', function () {
                beforeEach(function () {
                    $rootScope.$broadcast('edit.mode.renderer', {
                        id: 'main',
                        open: true,
                        scope: newScope,
                        template: '<p>{{key}}</p>',
                        templateUrl: 'test.html'
                    });
                    newScope.$digest();
                });

                it('element is compiled', function () {
                    expect(element.html()).toContain('from templateCache: value to test');
                });
            });
        });
    });

    describe('editModeRenderer directive with custom id', function () {
        var scope, $rootScope, element, compileMock;

        beforeEach(inject(function (_$rootScope_, $compile) {
            element = angular.element('<div edit-mode-renderer="C"></div>');
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            $compile(element)(scope);
        }));

        describe('when edit.mode.renderer is opened with scope', function () {
            var newScope;

            beforeEach(function () {
                newScope = $rootScope.$new();
                newScope.key = 'value to test';

                $rootScope.$broadcast('edit.mode.renderer', {
                    id: 'C',
                    open: true,
                    scope: newScope,
                    template: '<p>{{key}}</p>'
                });
                newScope.$digest();
            });

            it('element is compiled', function () {
                expect(element.html()).toContain('value to test');
            });

            describe('when edit.mode.renderer is closed', function () {
                beforeEach(function () {
                    $rootScope.$broadcast('edit.mode.renderer', {
                        id: 'C',
                        open: false
                    });
                });

                it('element is removed', function () {
                    expect(element.html()).toEqual('');
                });
            });
        });
    });

    describe('toggleEditMode directive', function () {
        var scope, directive, $rootScope, editMode;

        beforeEach(inject(function (_$rootScope_, _editMode_) {
            $rootScope = _$rootScope_;
            editMode = _editMode_;
            scope = {};
            directive = ToggleEditModeDirectiveFactory($rootScope, editMode);
        }));

        it('restricted to', function () {
            expect(directive.restrict).toEqual(['E', 'A']);
        });

        describe('on link', function () {
            beforeEach(function () {
                directive.link(scope);
            });

            it('editing is false', function () {
                expect($rootScope.editing).toEqual(false);
            });

            describe('toggle edit mode', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                it('editing is true', function () {
                    expect($rootScope.editing).toEqual(true);
                });

                describe('toggle again', function () {
                    beforeEach(function () {
                        scope.toggleEditMode();
                    });

                    it('editing is false', function () {
                        expect($rootScope.editing).toEqual(false);
                    });
                });
            });
        });
    });

    describe('editModeOn directive', function () {
        var directive, registry, scope, attrs, handler;

        beforeEach(inject(function (ngRegisterTopicHandler, topicRegistryMock, $rootScope) {
            scope = $rootScope.$new();
            registry = topicRegistryMock;
            directive = EditModeOnDirectiveFactory(ngRegisterTopicHandler);
        }));

        it('restrict to attribute', function () {
            expect(directive.restrict).toEqual('A');
        });

        describe('on link', function () {
            beforeEach(function () {
                scope.$on = function (event, callback) {
                    scope.on[event] = callback;
                };
                scope.on = [];
                handler = false;
                attrs = {
                    editModeOn: function () {
                        handler = true;
                    }
                };

                directive.link(scope, null, attrs);
            });

            it('when edit.mode is disabled handler is not executed', function () {
                registry['edit.mode'](false);

                expect(handler).toEqual(false);
            });

            it('when edit.mode is enabled handler is executed', function () {
                registry['edit.mode'](true);

                expect(handler).toEqual(true);
            });
        });
    });

    describe('editModeOff directive', function () {
        var directive, registry, scope, attrs, handler;

        beforeEach(inject(function (ngRegisterTopicHandler, topicRegistryMock, $rootScope) {
            scope = $rootScope.$new();
            registry = topicRegistryMock;
            directive = EditModeOffDirectiveFactory(ngRegisterTopicHandler);
        }));

        it('restrict to attribute', function () {
            expect(directive.restrict).toEqual('A');
        });

        describe('on link', function () {
            beforeEach(function () {
                scope.$on = function (event, callback) {
                    scope.on[event] = callback;
                };
                scope.on = [];
                handler = false;
                attrs = {
                    editModeOff: function () {
                        handler = true;
                    }
                };

                directive.link(scope, null, attrs);
            });

            it('when edit.mode is enabled handler is not executed', function () {
                registry['edit.mode'](true);

                expect(handler).toEqual(false);
            });

            it('when edit.mode is disabled handler is executed', function () {
                registry['edit.mode'](false);

                expect(handler).toEqual(true);
            });
        });
    });
});