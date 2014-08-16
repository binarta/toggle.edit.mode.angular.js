describe('toggle.edit.mode', function () {
    beforeEach(module('toggle.edit.mode'));

    describe('toggleEditMode directive', function () {
        var scope, directive, topics, registry, config;

        beforeEach(inject(function (topicMessageDispatcher, ngRegisterTopicHandler) {
            scope = {};
            config = {};
            directive = ToggleEditModeDirectiveFactory(topicMessageDispatcher, ngRegisterTopicHandler, config);
        }));

        it('restricted to', function () {
            expect(directive.restrict).toEqual('E');
        });

        it('default template url', function () {
            expect(directive.templateUrl).toEqual('bower_components/binarta.toggle.edit.mode.angular/template/toggle-edit-mode.html');
        });

        it('template url with specific components directory', function () {
            config.componentsDir = 'components';
            directive = ToggleEditModeDirectiveFactory(null, null, config);

            expect(directive.templateUrl).toEqual('components/binarta.toggle.edit.mode.angular/template/toggle-edit-mode.html');
        });

        describe('on link', function () {
            beforeEach(inject(function (topicRegistryMock, topicMessageDispatcherMock) {
                registry = topicRegistryMock;
                topics = topicMessageDispatcherMock;
                directive.link(scope);
            }));

            describe('enable edit mode', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                it('raise toggle edit mode enabled', function () {
                    expect(topics.persistent['edit.mode']).toEqual(true);
                });
            });

            describe('disable edit mode', function () {
                beforeEach(function () {
                    scope.editMode = true;
                });

                describe('when there are dirty items', function () {
                    beforeEach(function () {
                        scope.dirtyItems = ['item-1'];
                        scope.toggleEditMode();
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

                it('raise toggle edit mode disabled', function () {
                    scope.toggleEditMode();

                    expect(topics.persistent['edit.mode']).toEqual(false);
                });
            });

            describe('when edit mode enabled and checkpoint.signout received', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                it('edit mode should be enabled', function () {
                    expect(scope.editMode).toEqual(true);
                });

                it('disable edit mode', function () {
                    registry['checkpoint.signout']();

                    expect(scope.editMode).toEqual(false);
                    expect(topics.persistent['edit.mode']).toEqual(false);
                });
            });

            describe('when edit.mode.lock received', function () {
                beforeEach(function () {
                    registry['edit.mode.lock']('item-1');
                });

                it('add to dirty item list', function () {
                    expect(scope.dirtyItems[0]).toEqual('item-1');
                });

                it('do not add duplicates', function () {
                    registry['edit.mode.lock']('item-1');

                    expect(scope.dirtyItems.length).toEqual(1);
                });
            });

            describe('when edit.mode.unlock received', function () {
                beforeEach(function () {
                    scope.dirtyItems = ['item-1', 'item-2'];
                    registry['edit.mode.unlock']('item-2');
                });

                it('remove from dirty item list', function () {
                    expect(scope.dirtyItems.length).toEqual(1);
                });

                it('removing unknown item should do nothing', function () {
                    registry['edit.mode.unlock']('unknown');

                    expect(scope.dirtyItems.length).toEqual(1);
                });
            });
        });

    });

    describe('EditModeOn directive', function () {
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

    describe('EditModeOff directive', function () {
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