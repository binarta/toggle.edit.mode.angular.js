describe('toggle.edit.mode', function () {
    beforeEach(module('toggle.edit.mode'));

    describe('toggleEditMode directive', function() {
        var scope, directive, topics, registry;

        beforeEach(inject(function(topicMessageDispatcher, topicRegistry, $timeout) {
            scope = {};
            directive = ToggleEditModeDirectiveFactory(topicMessageDispatcher, topicRegistry, $timeout);
        }));

        it('restricted to', function () {
            expect(directive.restrict).toEqual('E');
        });

        it('template url', function () {
            expect(directive.templateUrl).toEqual('app/partials/toggle-edit-mode.html');
        });

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
                        scope.dirtyItems = 1;
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

            describe('when edit mode enabled and edit.mode.lock received', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                describe('and received add topic', function () {
                    beforeEach(function () {
                        registry['edit.mode.lock']('add');
                    });

                    it('increase dirty item count', function () {
                        expect(scope.dirtyItems).toEqual(1);
                    });
                });

                describe('and received remove topic', function () {
                    beforeEach(function () {
                        scope.dirtyItems = 2;
                        registry['edit.mode.lock']('remove');
                    });

                    it('decrease dirty item count', function () {
                        expect(scope.dirtyItems).toEqual(1);
                    });
                });
            });
        });

    });
});