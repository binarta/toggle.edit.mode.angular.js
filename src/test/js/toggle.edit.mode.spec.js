describe('toggle.edit.mode', function () {
    beforeEach(module('toggle.edit.mode'));

    describe('toggleEditMode directive', function() {
        var scope, directive, topics, registry;

        beforeEach(inject(function(topicMessageDispatcher, topicRegistry, $rootScope) {
            scope = {};
            directive = ToggleEditModeDirectiveFactory(topicMessageDispatcher, topicRegistry, $rootScope);
        }));

        it('restricted to', function () {
            expect(directive.restrict).toEqual('E');
        });

        it('template url', function () {
            expect(directive.templateUrl()).toEqual('app/partials/toggle-edit-mode.html');
        });

        it('template url can be overridden by rootScope', inject(function ($rootScope) {
            $rootScope.toggleEditModeTemplateUrl = 'overridden-template.html';

            expect(directive.templateUrl()).toEqual('overridden-template.html');
        }));

        describe('on link', function () {
            beforeEach(inject(function(topicRegistryMock, topicMessageDispatcherMock) {
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

        beforeEach(inject(function(topicRegistry, topicRegistryMock, $rootScope) {
            scope = $rootScope.$new();
            registry = topicRegistryMock;
            directive = EditModeOnDirectiveFactory(topicRegistry);
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

            it('and scope listens to destroy event', function () {
                expect(scope.on['$destroy']).toBeDefined();
            });

            it('when scope is destroyed unsubscribes edit.mode', function () {
                scope.on['$destroy']();

                expect(registry['edit.mode']).toBeUndefined();
            });

        });
    });

    describe('EditModeOff directive', function () {
        var directive, registry, scope, attrs, handler;

        beforeEach(inject(function(topicRegistry, topicRegistryMock, $rootScope) {
            scope = $rootScope.$new();
            registry = topicRegistryMock;
            directive = EditModeOffDirectiveFactory(topicRegistry);
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

            it('and scope listens to destroy event', function () {
                expect(scope.on['$destroy']).toBeDefined();
            });

            it('when scope is destroyed unsubscribes edit.mode', function () {
                scope.on['$destroy']();

                expect(registry['edit.mode']).toBeUndefined();
            });

        });
    });
});