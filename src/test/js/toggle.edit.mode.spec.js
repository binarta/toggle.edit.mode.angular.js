describe('toggle.edit.mode', function () {
    beforeEach(module('toggle.edit.mode'));

    describe('editMode service', function () {
        var editMode, $rootScope, registry, topics;

        beforeEach(inject(function (_editMode_, _$rootScope_, topicRegistryMock, topicMessageDispatcherMock) {
            editMode = _editMode_;
            $rootScope = _$rootScope_;
            registry = topicRegistryMock;
            topics = topicMessageDispatcherMock;
        }));

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
    });

    describe('editModeRenderer service', function () {
        var editModeRenderer, registry, scope, argsSpy;

        beforeEach(inject(function (_editModeRenderer_, topicRegistryMock, $rootScope) {
            editModeRenderer = _editModeRenderer_;
            registry = topicRegistryMock;
            scope = $rootScope.$new();
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
                    ctx: 'ctx',
                    template: 'template'
                });
            });

            it('edit.mode.renderer is broadcasted on rootScope', function () {
                expect(argsSpy).toEqual({
                    open: true,
                    ctx: 'ctx',
                    template: 'template'
                });
            });
        });

        describe('on close', function () {
            beforeEach(function () {
                editModeRenderer.close();
            });

            it('edit.mode.renderer is broadcasted on rootScope', function () {
                expect(argsSpy).toEqual({
                    open: false
                });
            });
        });

        describe('on edit.mode event', function () {
            beforeEach(function () {
                registry['edit.mode'](false);
            });

            it('close renderer', function () {
                expect(argsSpy).toEqual({
                    open: false
                });
            });
        });
    });

    describe('editModeRenderer directive', function () {
        var scope, $rootScope, element, compileMock;

        beforeEach(inject(function (_$rootScope_, $compile) {
            element = angular.element('<div edit-mode-renderer></div>');
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            $compile(element)(scope);
        }));

        describe('when edit.mode.renderer is opened', function () {
            beforeEach(function () {
                $rootScope.$broadcast('edit.mode.renderer', {
                    open: true,
                    ctx: {key: 'value to test'},
                    template: '<p>{{key}}</p>'
                });
                scope.$digest();
            });

            it('element is compiled', function () {
                expect(element.html()).toContain('value to test');
            });

            describe('when edit.mode.renderer is closed', function () {
                beforeEach(function () {
                    $rootScope.$broadcast('edit.mode.renderer', {
                        open: false
                    });
                    scope.$digest();
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

            it ('editing is false', function () {
                expect($rootScope.editing).toEqual(false);
            });

            describe('toggle edit mode', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                it ('editing is true', function () {
                    expect($rootScope.editing).toEqual(true);
                });

                describe('toggle again', function () {
                    beforeEach(function () {
                        scope.toggleEditMode();
                    });

                    it ('editing is false', function () {
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